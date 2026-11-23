const mongoose = require('mongoose');
const crypto = require('crypto');
const razorpayService = require('../services/razorpayService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const PaymentTransaction = require('../models/PaymentTransaction');
const { evaluateCouponDiscount } = require('./couponController');
const notificationService = require('../services/notificationService');
const shippingService = require('../services/shippingService');
const emailService = require('../services/emailService');

// @desc    Create Razorpay Order (Backend calculates exact amount)
// @route   POST /api/payment/create-order
// @access  Private
const createPaymentOrder = async (req, res, next) => {
  try {
    const { items, promoCode, shippingAddress = {}, shippingMethod = 'standard' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // 1. Fetch real Product prices from MongoDB and validate stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const productId = item.product || item._id || item.id;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${productId}`
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${productId}`
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
        });
      }

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        size: item.size
      });
    }

    // 2. Evaluate Coupon if provided
    let discountAmount = 0;
    let validCouponCode = undefined;

    if (promoCode && typeof promoCode === 'string' && promoCode.trim().length > 0) {
      const couponResult = await evaluateCouponDiscount({
        code: promoCode,
        cartItems: items,
        userId: req.user._id
      });

      if (!couponResult.valid) {
        return res.status(400).json({
          success: false,
          message: couponResult.message || 'Invalid or inapplicable coupon code'
        });
      }

      discountAmount = couponResult.discountAmount;
      validCouponCode = couponResult.code;
    }

    // 3. Shipping calculation via central shipping service
    const shippingCalc = shippingService.calculateShipping({
      subtotal,
      method: shippingMethod,
      address: shippingAddress
    });

    if (!shippingCalc.valid) {
      return res.status(400).json({
        success: false,
        message: shippingCalc.message || 'Invalid delivery address or pincode restricted'
      });
    }

    const shipping = shippingCalc.charge;

    // 4. Calculate final payable amount in INR
    const finalTotal = Math.max(0, subtotal - discountAmount) + shipping;
    const totalInPaise = Math.round(finalTotal * 100);

    // 5. Create Razorpay order via Razorpay SDK
    let rzpOrder;
    const isProduction = process.env.NODE_ENV === 'production';
    const isPlaceholderKey = !process.env.RAZORPAY_KEY_ID || 
                             process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder_key_id' || 
                             process.env.RAZORPAY_KEY_ID.includes('placeholder');

    // Production security guard: fail closed if live credentials are not provisioned
    if (isProduction && isPlaceholderKey) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway configuration error. Production transactions require valid credentials.'
      });
    }

    if (isPlaceholderKey) {
      const mockRzpId = `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      rzpOrder = {
        id: mockRzpId,
        amount: totalInPaise,
        currency: 'INR'
      };
    } else {
      try {
        rzpOrder = await razorpayService.createRazorpayOrder({
          amount: totalInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${req.user._id.toString().slice(-4)}`
        });
      } catch (rzpErr) {
        console.warn('Razorpay API SDK notice:', rzpErr.message);
        if (isProduction) {
          return res.status(502).json({
            success: false,
            message: 'Payment service temporarily unavailable. Please try again later.'
          });
        }
        const mockRzpId = `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        rzpOrder = {
          id: mockRzpId,
          amount: totalInPaise,
          currency: 'INR'
        };
      }
    }

    // 6. Audit in PaymentTransaction
    try {
      await PaymentTransaction.create({
        user: req.user._id,
        razorpayOrderId: rzpOrder.id,
        amount: finalTotal,
        currency: 'INR',
        status: 'INITIATED',
        metadata: {
          itemsCount: validatedItems.length,
          discountAmount,
          shippingCharge: shipping,
          promoCode: validCouponCode
        }
      });
    } catch (txnErr) {
      console.warn('PaymentTransaction init audit log notice:', txnErr.message);
    }

    res.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: totalInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
      summary: {
        subtotal,
        discount: discountAmount,
        shipping,
        total: finalTotal,
        promoCode: validCouponCode
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature, atomic stock decrement, coupon increment & create paid order
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      promoCode,
      shippingAddress,
      shippingMethod = 'standard',
      notes
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification parameters missing (razorpay_order_id, razorpay_payment_id, razorpay_signature required)'
      });
    }

    // Mandatory Check 1: Signature Verification
    const isSignatureValid = razorpayService.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isSignatureValid) {
      // Record failure audit
      try {
        await PaymentTransaction.create({
          user: req.user._id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: 0,
          status: 'FAILED',
          failureReason: 'Invalid payment signature mismatch'
        });
      } catch (_) {}

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // Mandatory Check 2: Idempotency Check
    const existingOrder = await Order.findOne({
      $or: [
        { 'payment.razorpayPaymentId': razorpay_payment_id },
        { 'payment.razorpayOrderId': razorpay_order_id }
      ]
    })
      .populate('user', 'name email')
      .populate('items.product', 'name category');

    if (existingOrder) {
      return res.json({
        success: true,
        message: 'Payment verified (already processed)',
        data: existingOrder
      });
    }

    // Optional Check 3: Razorpay API Fetch check
    const paymentDetails = await razorpayService.fetchPayment(razorpay_payment_id);
    if (paymentDetails) {
      if (paymentDetails.order_id && paymentDetails.order_id !== razorpay_order_id) {
        return res.status(400).json({
          success: false,
          message: 'Payment order ID mismatch'
        });
      }
      if (paymentDetails.currency && paymentDetails.currency !== 'INR') {
        return res.status(400).json({
          success: false,
          message: 'Payment currency mismatch'
        });
      }
    }

    // 4. Server-Side Price Recalculation & Stock Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    let subtotal = 0;
    const validatedItems = [];

    // Pre-check stock for all products
    for (const item of items) {
      const productId = item.product || item._id || item.id;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${productId}`
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock no longer available for ${product.name}`
        });
      }

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        size: item.size
      });
    }

    // 5. Evaluate Coupon if provided
    let discountAmount = 0;
    let validCouponCode = undefined;
    let couponSnapshot = undefined;

    if (promoCode && typeof promoCode === 'string' && promoCode.trim().length > 0) {
      const couponResult = await evaluateCouponDiscount({
        code: promoCode,
        cartItems: items,
        userId: req.user._id
      });

      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        validCouponCode = couponResult.code;
        couponSnapshot = {
          code: couponResult.code,
          discountType: couponResult.discountType,
          discountValue: couponResult.discountValue,
          discountAmount: couponResult.discountAmount
        };
      }
    }

    const shippingCalc = shippingService.calculateShipping({
      subtotal,
      method: shippingMethod,
      address: shippingAddress
    });

    const shipping = shippingCalc.valid ? shippingCalc.charge : (subtotal >= 2000 ? 0 : 150);
    const finalTotal = Math.max(0, subtotal - discountAmount) + shipping;

    // 6. Atomic Stock Decrements
    for (const item of validatedItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: 'after' }
      );

      if (!updatedProduct) {
        return res.status(400).json({
          success: false,
          message: `Stock collision: Insufficient stock remaining for ${item.name}`
        });
      }

      try {
        const InventoryTransaction = require('../models/InventoryTransaction');
        await InventoryTransaction.create({
          product: updatedProduct._id,
          sku: updatedProduct.sku,
          type: 'ORDER',
          quantity: -item.quantity,
          previousStock: updatedProduct.stock + item.quantity,
          newStock: updatedProduct.stock,
          reason: 'Customer Order (Razorpay Verified)',
          referenceType: 'ORDER',
          changedBy: req.user._id || req.user.id
        });
      } catch (invErr) {
        console.warn('Inventory log notice:', invErr.message);
      }
    }

    // 7. Atomic Coupon Usage Update
    if (validCouponCode) {
      await Coupon.findOneAndUpdate(
        {
          code: validCouponCode,
          isActive: true
        },
        { $inc: { usageCount: 1 } }
      );
    }

    // 8. Create Paid Order
    const userId = req.user._id || req.user.id;
    const order = await Order.create({
      user: userId,
      items: validatedItems,
      subtotal,
      discount: discountAmount,
      shipping,
      shippingMethod: shippingCalc.method || 'standard',
      shippingMethodName: shippingCalc.methodName || 'Standard Delivery',
      shippingZone: shippingCalc.zone || 'NATIONAL',
      estimatedDeliveryRange: shippingCalc.deliveryRange || '3-5 business days',
      estimatedDeliveryDate: shippingCalc.estimatedDeliveryDate,
      shippingAddress,
      promoCode: validCouponCode,
      coupon: couponSnapshot,
      notes,
      status: 'confirmed',
      statusHistory: [{
        status: 'confirmed',
        note: 'Order confirmed after successful payment verification',
        changedBy: userId,
        changedAt: new Date()
      }],
      payment: {
        provider: 'RAZORPAY',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: 'PAID',
        amount: finalTotal,
        currency: 'INR',
        paidAt: new Date()
      }
    });

    // 9. Record Success in PaymentTransaction
    try {
      await PaymentTransaction.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          order: order._id,
          user: userId,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          amount: finalTotal,
          currency: 'INR',
          status: 'SUCCESS',
          paymentMethod: 'razorpay'
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (txnErr) {
      console.warn('PaymentTransaction success log error:', txnErr.message);
    }

    // 10. Clear user's Cart in MongoDB
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } }
    );

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name category');

    // 11. Transactional Email Dispatches
    const orderShortId = order._id.toString().slice(-8).toUpperCase();
    if (req.user.email) {
      emailService.sendPaymentSuccessEmail(req.user.email, orderShortId, razorpay_payment_id, finalTotal);
      emailService.sendOrderConfirmationEmail(req.user.email, orderShortId, finalTotal, validatedItems);
    }
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@zuxofit.com';
    emailService.sendAdminOrderNotificationEmail(adminEmail, orderShortId, req.user.name || 'Customer', finalTotal);

    // 12. Notification Center Integration
    try {
      await notificationService.createCustomerNotification({
        recipient: userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: `Payment of ₹${finalTotal} for order #${orderShortId} was verified successfully.`,
        relatedResourceType: 'PAYMENT',
        relatedResourceId: String(razorpay_payment_id),
        metadata: { razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, amount: finalTotal },
        referenceId: `PAYMENT_SUCCESS_${razorpay_payment_id}`
      });

      await notificationService.createCustomerNotification({
        recipient: userId,
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        message: `Your order #${orderShortId} has been confirmed.`,
        relatedResourceType: 'ORDER',
        relatedResourceId: String(order._id),
        metadata: { orderId: order._id, total: finalTotal },
        referenceId: `ORDER_CONFIRMED_${order._id}`
      });

      await notificationService.createAdminNotification({
        type: 'NEW_ORDER',
        title: 'New Paid Order',
        message: `New paid order #${orderShortId} placed by ${req.user.name || 'Customer'}.`,
        relatedResourceType: 'ORDER',
        relatedResourceId: String(order._id),
        metadata: { orderId: order._id, total: finalTotal },
        referenceId: `NEW_ORDER_${order._id}`
      });
    } catch (notifErr) {
      console.warn('Payment notification error notice:', notifErr.message);
    }

    res.json({
      success: true,
      message: 'Payment verified and order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    if (error.code === 11000) {
      const existingOrder = await Order.findOne({
        'payment.razorpayPaymentId': req.body.razorpay_payment_id
      })
        .populate('user', 'name email')
        .populate('items.product', 'name category');

      if (existingOrder) {
        return res.json({
          success: true,
          message: 'Payment verified (already processed)',
          data: existingOrder
        });
      }
    }
    next(error);
  }
};

// @desc    Handle Razorpay Webhook Events (Idempotent signature validation)
// @route   POST /api/payment/webhook
// @access  Public (Signature-verified)
const handleRazorpayWebhook = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (isProduction && (!webhookSecret || webhookSecret === 'solevibe_webhook_secret_dev_key')) {
      console.error('[Security] Production webhook rejected: missing or placeholder RAZORPAY_WEBHOOK_SECRET');
      return res.status(500).json({ status: 'error', message: 'Webhook configuration error' });
    }

    const activeWebhookSecret = webhookSecret || 'solevibe_webhook_secret_dev_key';
    const receivedSignature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];

    if (!receivedSignature) {
      return res.status(400).json({ status: 'error', message: 'Missing webhook signature header' });
    }

    // Verify webhook HMAC SHA256 signature
    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', activeWebhookSecret)
      .update(bodyStr)
      .digest('hex');

    if (receivedSignature !== expectedSignature) {
      console.warn('⚠️ Webhook signature mismatch rejected');
      return res.status(400).json({ status: 'error', message: 'Invalid webhook signature' });
    }

    // Idempotency check: prevent duplicate event processing
    if (eventId) {
      const existingTxn = await PaymentTransaction.findOne({ webhookEventId: eventId });
      if (existingTxn) {
        return res.status(200).json({ status: 'ok', message: 'Duplicate webhook event already processed' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`⚡ [RAZORPAY WEBHOOK] Event: ${event} | ID: ${eventId || 'N/A'}`);

    if (event === 'payment.captured' && payload.payment) {
      const paymentEntity = payload.payment.entity;
      await PaymentTransaction.findOneAndUpdate(
        { razorpayOrderId: paymentEntity.order_id },
        {
          razorpayPaymentId: paymentEntity.id,
          amount: paymentEntity.amount / 100,
          currency: paymentEntity.currency,
          status: 'CAPTURED',
          paymentMethod: paymentEntity.method,
          webhookEvent: event,
          webhookEventId: eventId
        },
        { upsert: true }
      );
    } else if (event === 'payment.failed' && payload.payment) {
      const paymentEntity = payload.payment.entity;
      await PaymentTransaction.findOneAndUpdate(
        { razorpayOrderId: paymentEntity.order_id },
        {
          razorpayPaymentId: paymentEntity.id,
          amount: paymentEntity.amount / 100,
          status: 'FAILED',
          failureReason: paymentEntity.error_description || 'Payment failed',
          errorCode: paymentEntity.error_code,
          webhookEvent: event,
          webhookEventId: eventId
        },
        { upsert: true }
      );
    }

    res.status(200).json({ status: 'ok', event });
  } catch (error) {
    console.error('Webhook handler error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook
};

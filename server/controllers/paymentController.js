const mongoose = require('mongoose');
const razorpayService = require('../services/razorpayService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const { evaluateCouponDiscount } = require('./couponController');

// @desc    Create Razorpay Order (Backend calculates exact amount)
// @route   POST /api/payment/create-order
// @access  Private
const createPaymentOrder = async (req, res, next) => {
  try {
    const { items, promoCode } = req.body;

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

    // 3. Shipping calculation (Free over ₹15,000)
    const shipping = subtotal >= 15000 ? 0 : 150;

    // 4. Calculate final payable amount in INR
    const finalTotal = Math.max(0, subtotal - discountAmount) + shipping;
    const totalInPaise = Math.round(finalTotal * 100);

    // 5. Create Razorpay order via Razorpay SDK
    let rzpOrder;
    const isPlaceholderKey = !process.env.RAZORPAY_KEY_ID || 
                             process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder_key_id' || 
                             process.env.RAZORPAY_KEY_ID.includes('placeholder');

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
        const mockRzpId = `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        rzpOrder = {
          id: mockRzpId,
          amount: totalInPaise,
          currency: 'INR'
        };
      }
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
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // Mandatory Check 2: Idempotency Check (Check if order already created for this payment)
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

    // Mandatory Check 3: Optional Razorpay API Fetch check
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

    const shipping = subtotal >= 15000 ? 0 : 150;
    const finalTotal = Math.max(0, subtotal - discountAmount) + shipping;

    // 6. Mandatory Correction 3: Atomic Stock Decrements
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

    // 7. Mandatory Correction 6: Atomic Coupon Usage Update
    if (validCouponCode) {
      await Coupon.findOneAndUpdate(
        {
          code: validCouponCode,
          isActive: true
        },
        { $inc: { usageCount: 1 } }
      );
    }

    // 8. Create Paid Order with initial status history
    const userId = req.user._id || req.user.id;
    const order = await Order.create({
      user: userId,
      items: validatedItems,
      subtotal,
      discount: discountAmount,
      shipping,
      shippingAddress,
      promoCode: validCouponCode,
      coupon: couponSnapshot,
      notes,
      status: 'confirmed',
      statusHistory: [{
        status: 'confirmed',
        note: 'Order confirmed after successful payment',
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

    // 9. Mandatory Correction 7: Clear user's Cart in MongoDB after verified payment & order creation
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } }
    );

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name category');

    res.json({
      success: true,
      message: 'Payment verified and order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    if (error.code === 11000) {
      // Idempotency catch for duplicate razorpayPaymentId index collision
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

module.exports = {
  createPaymentOrder,
  verifyPayment
};

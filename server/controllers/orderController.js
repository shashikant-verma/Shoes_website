const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { evaluateCouponDiscount } = require('./couponController');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      promoCode,
      notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate and calculate order totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      let product = null;
      const productId = item.product || item._id || item.id;
      
      if (mongoose.Types.ObjectId.isValid(productId)) {
        product = await Product.findById(productId);
      }

      if (!product) {
        product = await Product.findOne({ 
          $or: [
            { slug: productId }, 
            { _id: productId }
          ] 
        });
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${productId}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        size: item.size
      });

      // Update product stock
      const prevStock = product.stock;
      product.stock -= item.quantity;
      await product.save();

      try {
        const InventoryTransaction = require('../models/InventoryTransaction');
        await InventoryTransaction.create({
          product: product._id,
          sku: product.sku,
          type: 'ORDER',
          quantity: -item.quantity,
          previousStock: prevStock,
          newStock: product.stock,
          reason: 'Customer Order',
          referenceType: 'ORDER',
          changedBy: req.user._id || req.user.id
        });
      } catch (invErr) {
        console.warn('Inventory log notice:', invErr.message);
      }
    }

    // Calculate discount via server-side Coupon validation engine
    let discount = 0;
    let couponSnapshot = undefined;
    let validCouponCode = undefined;

    if (promoCode && typeof promoCode === 'string' && promoCode.trim().length > 0) {
      const couponResult = await evaluateCouponDiscount({
        code: promoCode,
        cartItems: items,
        userId: req.user.id || req.user._id
      });

      if (!couponResult.valid) {
        return res.status(400).json({
          success: false,
          message: couponResult.message || 'Invalid or inapplicable coupon code'
        });
      }

      discount = couponResult.discountAmount;
      validCouponCode = couponResult.code;
      couponSnapshot = {
        code: couponResult.code,
        discountType: couponResult.discountType,
        discountValue: couponResult.discountValue,
        discountAmount: couponResult.discountAmount
      };
    }

    // Calculate shipping (free over ₹15,000)
    const shipping = subtotal >= 15000 ? 0 : 150;

    // Create order with coupon snapshot and initial status history
    const userId = req.user._id || req.user.id;
    const order = await Order.create({
      user: userId,
      items: validatedItems,
      subtotal,
      discount,
      shipping,
      shippingAddress,
      promoCode: validCouponCode,
      coupon: couponSnapshot,
      notes,
      status: 'confirmed',
      statusHistory: [{
        status: 'confirmed',
        note: 'Order created',
        changedBy: userId,
        changedAt: new Date()
      }]
    });

    // Increment coupon usage count upon successful order creation
    if (validCouponCode) {
      await Coupon.findOneAndUpdate(
        { code: validCouponCode },
        { $inc: { usageCount: 1 } }
      );
    }

    // Populate product details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name category')
      .populate('statusHistory.changedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    // Build query
    const userId = req.user._id || req.user.id;
    const query = { user: userId };

    if (status) {
      query.status = status;
    }

    // Execute query
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name category')
      .populate('statusHistory.changedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Get total count
    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total: totalOrders,
      page: Number(page),
      totalPages: Math.ceil(totalOrders / Number(limit)),
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      userId
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.user = userId;
    }

    // Execute query
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name category')
      .populate('statusHistory.changedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Get total count
    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total: totalOrders,
      page: Number(page),
      totalPages: Math.ceil(totalOrders / Number(limit)),
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name category')
      .populate('statusHistory.changedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    const userIdStr = (req.user._id || req.user.id).toString();
    const orderUserIdStr = (order.user._id || order.user).toString();

    if (req.user.role !== 'ADMIN' && orderUserIdStr !== userIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Valid statuses & allowed transitions
const VALID_STATUSES = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const ALLOWED_TRANSITIONS = {
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingNumber, carrier, estimatedDeliveryDate } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Order status is required'
      });
    }

    const targetStatus = status.toLowerCase();

    if (!VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status: ${status}`
      });
    }

    // Check transition validity if status is changing
    if (order.status !== targetStatus) {
      const currentStatus = order.status || 'confirmed';
      const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(targetStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition status from ${currentStatus} to ${targetStatus}`
        });
      }
      order.status = targetStatus;
    }

    // Update optional tracking metadata
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }
    if (carrier !== undefined) {
      order.carrier = carrier;
    }
    if (estimatedDeliveryDate !== undefined) {
      order.estimatedDeliveryDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined;
    }
    if (targetStatus === 'shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
    }

    // Append status history entry with authenticated admin identity
    const adminId = req.user._id || req.user.id;
    order.statusHistory.push({
      status: targetStatus,
      note: note || `Status updated to ${targetStatus}`,
      changedBy: adminId,
      changedAt: new Date()
    });

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('user', 'name email')
      .populate('items.product', 'name category')
      .populate('statusHistory.changedBy', 'name email');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder
};
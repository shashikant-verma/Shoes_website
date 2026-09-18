const Order = require('../models/Order');
const Product = require('../models/Product');

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
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
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
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate discount (if promo code is provided)
    let discount = 0;
    if (promoCode) {
      const validPromoCodes = {
        'KINETIC10': 0.1,    // 10% off
        'RUNNER15': 0.15,    // 15% off
        'SPEED20': 0.20      // 20% off
      };

      if (validPromoCodes[promoCode]) {
        discount = subtotal * validPromoCodes[promoCode];
      }
    }

    // Calculate shipping (free over ₹15,000)
    const shipping = subtotal >= 15000 ? 0 : 150;

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: validatedItems,
      subtotal,
      discount,
      shipping,
      shippingAddress,
      promoCode,
      notes
    });

    // Populate product details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name category');

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
    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    // Execute query
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name category')
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
// @route   GET /api/orders/admin
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
      .populate('items.product', 'name category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'ADMIN' && order.user._id.toString() !== req.user.id) {
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

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
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
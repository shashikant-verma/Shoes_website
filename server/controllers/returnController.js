const mongoose = require('mongoose');
const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const Product = require('../models/Product');
const razorpayService = require('../services/razorpayService');

// Allowed Return Status Transitions (Admin flexible transitions)
const ALLOWED_RETURN_TRANSITIONS = {
  REQUESTED: ['APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED'],
  APPROVED: ['RECEIVED', 'REFUND_PENDING', 'REFUNDED', 'REJECTED', 'CANCELLED'],
  RECEIVED: ['REFUND_PENDING', 'REFUNDED', 'APPROVED', 'REJECTED'],
  REFUND_PENDING: ['REFUNDED', 'RECEIVED', 'APPROVED'],
  REJECTED: ['REQUESTED', 'APPROVED', 'RECEIVED'],
  REFUNDED: ['RECEIVED', 'REFUND_PENDING'],
  CANCELLED: ['REQUESTED', 'APPROVED']
};

// @desc    Submit new return request
// @route   POST /api/returns
// @access  Private
const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, items, description, images, reason } = req.body;
    const userId = req.user._id || req.user.id;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Return request must specify at least one product item'
      });
    }

    // 1. Fetch Order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 2. Ownership verification
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create a return for this order'
      });
    }

    // 3. Order status check (Must be delivered)
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Return can only be requested for delivered orders'
      });
    }

    // 4. 7-day Return Window Check using real delivery timestamp from statusHistory
    let deliveredTimestamp = order.updatedAt;
    if (order.statusHistory && order.statusHistory.length > 0) {
      const deliveredEntry = [...order.statusHistory].reverse().find(h => h.status === 'delivered');
      if (deliveredEntry && deliveredEntry.changedAt) {
        deliveredTimestamp = deliveredEntry.changedAt;
      }
    }

    const daysSinceDelivery = (Date.now() - new Date(deliveredTimestamp).getTime()) / (1000 * 60 * 60 * 24);
    const RETURN_WINDOW_DAYS = 7;
    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      return res.status(400).json({
        success: false,
        message: `Return window of ${RETURN_WINDOW_DAYS} days has expired for this order`
      });
    }

    // Fetch existing ReturnRequests for this order to calculate remaining returnable quantity
    const existingReturns = await ReturnRequest.find({
      order: order._id,
      status: { $nin: ['CANCELLED', 'REJECTED'] }
    });

    const processedItems = [];
    let totalRefundAmount = 0;

    // 5. Item Validation & Deterministic Refund Calculation
    for (const itemReq of items) {
      const productId = itemReq.productId || itemReq.product || itemReq._id;
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is missing in return item request'
        });
      }

      // Match product in order historical snapshot
      const orderItem = order.items.find(i => (i.product || i._id).toString() === productId.toString());
      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Product is not part of this order: ${productId}`
        });
      }

      const reqQty = Math.floor(Number(itemReq.quantity));
      if (isNaN(reqQty) || reqQty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid return quantity for ${orderItem.name}`
        });
      }

      // Calculate previously returned + currently pending quantity for this item
      let previouslyReturnedQty = 0;
      for (const ret of existingReturns) {
        for (const retItem of ret.items) {
          if (retItem.product.toString() === productId.toString()) {
            previouslyReturnedQty += retItem.quantity;
          }
        }
      }

      const returnableQty = orderItem.quantity - previouslyReturnedQty;
      if (reqQty > returnableQty) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity (${reqQty}) exceeds remaining returnable quantity (${returnableQty}) for ${orderItem.name}`
        });
      }

      const itemReason = itemReq.reason || reason || 'OTHER';
      const VALID_REASONS = ['WRONG_SIZE', 'WRONG_PRODUCT', 'DAMAGED', 'DEFECTIVE', 'NOT_AS_DESCRIBED', 'QUALITY_ISSUE', 'CHANGED_MIND', 'OTHER'];
      if (!VALID_REASONS.includes(itemReason)) {
        return res.status(400).json({
          success: false,
          message: `Invalid return reason: ${itemReason}`
        });
      }

      // Deterministic Server-Side Refund Calculation Formula
      // itemSubtotal = itemPrice * reqQty
      // itemDiscount = (itemSubtotal / order.subtotal) * order.discount
      // itemNetRefund = itemSubtotal - itemDiscount
      const itemSubtotal = orderItem.price * reqQty;
      const itemDiscount = order.subtotal > 0 ? (itemSubtotal / order.subtotal) * (order.discount || 0) : 0;
      const itemNetRefund = Math.max(0, itemSubtotal - itemDiscount);

      totalRefundAmount += itemNetRefund;

      processedItems.push({
        product: orderItem.product,
        name: orderItem.name,
        quantity: reqQty,
        price: orderItem.price,
        reason: itemReason,
        itemAmount: Math.round(itemNetRefund * 100) / 100
      });
    }

    const primaryReason = reason || processedItems[0].reason;

    // 6. Create ReturnRequest document
    const returnRequest = await ReturnRequest.create({
      user: userId,
      order: order._id,
      items: processedItems,
      reason: primaryReason,
      description: description || '',
      images: images || [],
      status: 'REQUESTED',
      refund: {
        amount: Math.round(totalRefundAmount * 100) / 100,
        status: 'PENDING'
      },
      statusHistory: [{
        status: 'REQUESTED',
        note: 'Return request submitted by customer',
        changedBy: userId,
        changedAt: new Date()
      }]
    });

    const populatedReturn = await ReturnRequest.findById(returnRequest._id)
      .populate('user', 'name email')
      .populate('order')
      .populate('statusHistory.changedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Return request created successfully',
      data: populatedReturn
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated customer's return requests
// @route   GET /api/returns/my
// @access  Private
const getMyReturns = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const returns = await ReturnRequest.find({ user: userId })
      .populate('user', 'name email')
      .populate('order')
      .populate('statusHistory.changedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: returns.length,
      data: returns
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single return request by ID
// @route   GET /api/returns/:id
// @access  Private
const getReturnById = async (req, res, next) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id)
      .populate('user', 'name email')
      .populate('order')
      .populate('statusHistory.changedBy', 'name email');

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    const userIdStr = (req.user._id || req.user.id).toString();
    const returnUserStr = (returnRequest.user._id || returnRequest.user).toString();

    if (req.user.role !== 'ADMIN' && returnUserStr !== userIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this return request'
      });
    }

    res.json({
      success: true,
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel return request (Customer)
// @route   PUT /api/returns/:id/cancel
// @access  Private
const cancelReturnRequest = async (req, res, next) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    const userIdStr = (req.user._id || req.user.id).toString();
    const returnUserStr = returnRequest.user.toString();

    if (returnUserStr !== userIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this return request'
      });
    }

    if (returnRequest.status !== 'REQUESTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel return request in ${returnRequest.status} status`
      });
    }

    returnRequest.status = 'CANCELLED';
    returnRequest.statusHistory.push({
      status: 'CANCELLED',
      note: 'Cancelled by customer',
      changedBy: req.user._id || req.user.id,
      changedAt: new Date()
    });

    const updatedReturn = await returnRequest.save();
    const populatedReturn = await ReturnRequest.findById(updatedReturn._id)
      .populate('user', 'name email')
      .populate('order')
      .populate('statusHistory.changedBy', 'name email');

    res.json({
      success: true,
      message: 'Return request cancelled successfully',
      data: populatedReturn
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all return requests (Admin)
// @route   GET /api/returns/admin/all
// @access  Private/Admin
const getAllReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, orderId } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (orderId) {
      query.order = orderId;
    }

    const returns = await ReturnRequest.find(query)
      .populate('user', 'name email')
      .populate('order')
      .populate('statusHistory.changedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ReturnRequest.countDocuments(query);

    res.json({
      success: true,
      count: returns.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: returns
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update return request status (Admin)
// @route   PUT /api/returns/admin/:id/status
// @access  Private/Admin
const updateReturnStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const returnRequest = await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    const targetStatus = (status || '').toUpperCase();
    const VALID_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED'];
    if (!VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid return status: ${status}`
      });
    }

    // Check transition rules
    if (returnRequest.status !== targetStatus) {
      const allowed = ALLOWED_RETURN_TRANSITIONS[returnRequest.status] || [];
      if (!allowed.includes(targetStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition return status from ${returnRequest.status} to ${targetStatus}`
        });
      }

      // Mandatory Correction: Idempotent Stock Restoration on RECEIVED or REFUNDED
      if (['RECEIVED', 'REFUNDED'].includes(targetStatus)) {
        const hasAlreadyRestored = returnRequest.statusHistory.some(h => ['RECEIVED', 'REFUNDED'].includes(h.status));
        if (!hasAlreadyRestored) {
          for (const item of returnRequest.items) {
            const updatedProduct = await Product.findOneAndUpdate(
              { _id: item.product },
              { $inc: { stock: item.quantity } },
              { returnDocument: 'after' }
            );

            if (updatedProduct) {
              try {
                const InventoryTransaction = require('../models/InventoryTransaction');
                await InventoryTransaction.create({
                  product: updatedProduct._id,
                  sku: updatedProduct.sku,
                  type: 'RETURN',
                  quantity: item.quantity,
                  previousStock: updatedProduct.stock - item.quantity,
                  newStock: updatedProduct.stock,
                  reason: 'Customer Return Restored',
                  referenceType: 'RETURN',
                  referenceId: returnRequest._id.toString(),
                  changedBy: req.user._id || req.user.id
                });
              } catch (invErr) {
                console.warn('Inventory log notice:', invErr.message);
              }
            }
          }
        }
      }

      returnRequest.status = targetStatus;
    }

    if (adminNote !== undefined) {
      returnRequest.adminNote = adminNote;
    }

    const adminId = req.user._id || req.user.id;
    returnRequest.statusHistory.push({
      status: targetStatus,
      note: adminNote || `Status updated to ${targetStatus}`,
      changedBy: adminId,
      changedAt: new Date()
    });

    const updatedReturn = await returnRequest.save();
    const populatedReturn = await ReturnRequest.findById(updatedReturn._id)
      .populate('user', 'name email')
      .populate('order')
      .populate('statusHistory.changedBy', 'name email');

    res.json({
      success: true,
      message: 'Return request status updated successfully',
      data: populatedReturn
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process Razorpay refund for return request (Admin)
// @route   POST /api/returns/admin/:id/refund
// @access  Private/Admin
const processRefund = async (req, res, next) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    // Mandatory Correction: Razorpay Idempotency Protection
    if (returnRequest.refund.status === 'COMPLETED' || returnRequest.refund.razorpayRefundId) {
      const populatedReturn = await ReturnRequest.findById(returnRequest._id)
        .populate('user', 'name email')
        .populate('order')
        .populate('statusHistory.changedBy', 'name email');

      return res.json({
        success: true,
        message: 'Refund already processed (Idempotent call)',
        data: populatedReturn
      });
    }

    // Status check (must be APPROVED, RECEIVED, or REFUND_PENDING)
    if (!['APPROVED', 'RECEIVED', 'REFUND_PENDING'].includes(returnRequest.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot process refund for return request in ${returnRequest.status} status`
      });
    }

    // Fetch Order to get Razorpay Payment ID
    const order = await Order.findById(returnRequest.order);
    const razorpayPaymentId = order?.payment?.razorpayPaymentId || `pay_mock_${Date.now()}`;

    const adminId = req.user._id || req.user.id;
    const refundPaise = Math.round(returnRequest.refund.amount * 100);

    let rzpRefund;
    try {
      rzpRefund = await razorpayService.createRefund({
        paymentId: razorpayPaymentId,
        amount: refundPaise,
        notes: {
          returnRequestId: returnRequest._id.toString(),
          orderId: order._id.toString()
        }
      });
    } catch (rzpErr) {
      // Mandatory Correction: Razorpay Failure Protection
      returnRequest.refund.status = 'FAILED';
      returnRequest.statusHistory.push({
        status: returnRequest.status,
        note: `Razorpay refund attempt failed: ${rzpErr.message}`,
        changedBy: adminId,
        changedAt: new Date()
      });
      await returnRequest.save();

      return res.status(400).json({
        success: false,
        message: `Razorpay refund execution failed: ${rzpErr.message}`
      });
    }

    if (!rzpRefund || !rzpRefund.id) {
      returnRequest.refund.status = 'FAILED';
      await returnRequest.save();

      return res.status(400).json({
        success: false,
        message: 'Razorpay refund execution failed to return a valid refund ID'
      });
    }

    // Refund Succeeded -> Update Return document
    returnRequest.refund.status = 'COMPLETED';
    returnRequest.refund.razorpayRefundId = rzpRefund.id;
    returnRequest.refund.completedAt = new Date();
    returnRequest.status = 'REFUNDED';

    returnRequest.statusHistory.push({
      status: 'REFUNDED',
      note: `Refund of ₹${returnRequest.refund.amount} processed successfully via Razorpay (${rzpRefund.id})`,
      changedBy: adminId,
      changedAt: new Date()
    });

    const updatedReturn = await returnRequest.save();
    const populatedReturn = await ReturnRequest.findById(updatedReturn._id)
      .populate('user', 'name email')
      .populate('order')
      .populate('statusHistory.changedBy', 'name email');

    res.json({
      success: true,
      message: 'Razorpay refund processed and status set to REFUNDED successfully',
      data: populatedReturn
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  cancelReturnRequest,
  getAllReturns,
  updateReturnStatus,
  processRefund
};

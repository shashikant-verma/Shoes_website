const shippingService = require('../services/shippingService');
const Order = require('../models/Order');
const notificationService = require('../services/notificationService');
const crypto = require('crypto');

// @desc    Get available shipping methods & zone validation
// @route   GET /api/shipping/methods
// @access  Public / Private
const getShippingMethods = async (req, res, next) => {
  try {
    const { subtotal = 0, address } = req.query;
    let parsedAddress = {};

    if (address) {
      try {
        parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (e) {
        parsedAddress = {};
      }
    }

    const result = shippingService.getAvailableShippingMethods(Number(subtotal), parsedAddress);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate exact server shipping fee & delivery estimate
// @route   POST /api/shipping/calculate
// @access  Public / Private
const calculateShippingFee = async (req, res, next) => {
  try {
    const { subtotal = 0, method = 'standard', address = {} } = req.body;

    const result = shippingService.calculateShipping({
      subtotal: Number(subtotal),
      method,
      address
    });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Courier Webhook status synchronization
// @route   POST /api/shipping/webhook
// @access  Public (Signature authenticated)
const handleShippingWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-courier-signature'] || req.headers['x-shipping-signature'];
    const webhookSecret = process.env.COURIER_WEBHOOK_SECRET || 'courier_webhook_secret_key';

    // 1. Signature Verification
    if (signature) {
      const payloadString = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadString)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
    }

    const { orderId, trackingNumber, status, carrier } = req.body;

    if (!orderId && !trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order ID or tracking number is required'
      });
    }

    // 2. Find Order
    const query = orderId ? { _id: orderId } : { trackingNumber };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 3. Map external courier status to internal order status
    const COURIER_STATUS_MAP = {
      IN_TRANSIT: 'shipped',
      SHIPPED: 'shipped',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      DELIVERED: 'delivered'
    };

    const targetStatus = COURIER_STATUS_MAP[String(status).toUpperCase()];

    if (!targetStatus) {
      return res.json({
        success: true,
        message: 'Webhook received (status ignored or unknown)'
      });
    }

    // 4. Idempotent Status Transition
    if (order.status !== targetStatus) {
      order.status = targetStatus;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (carrier) order.carrier = carrier;
      if (targetStatus === 'shipped' && !order.shippedAt) {
        order.shippedAt = new Date();
      }

      order.statusHistory.push({
        status: targetStatus,
        note: `Status updated via courier webhook (${status})`,
        changedAt: new Date()
      });

      await order.save();

      // Emit customer notification
      try {
        const orderShortId = order._id.toString().slice(-8).toUpperCase();
        await notificationService.createCustomerNotification({
          recipient: order.user,
          type: `ORDER_${targetStatus.toUpperCase()}`,
          title: 'Shipment Update',
          message: `Your order #${orderShortId} status updated to ${targetStatus}`,
          relatedResourceType: 'ORDER',
          relatedResourceId: String(order._id),
          referenceId: `WEBHOOK_${targetStatus}_${order._id}_${Date.now()}`
        });
      } catch (e) {}
    }

    res.json({
      success: true,
      message: 'Order shipment status synchronized successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShippingMethods,
  calculateShippingFee,
  handleShippingWebhook
};

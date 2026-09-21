const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  // CUSTOMER - Order
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_PROCESSING: 'ORDER_PROCESSING',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  ORDER_OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',

  // CUSTOMER - Payment
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // CUSTOMER - Returns / Refunds
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURN_APPROVED: 'RETURN_APPROVED',
  RETURN_REJECTED: 'RETURN_REJECTED',
  RETURN_RECEIVED: 'RETURN_RECEIVED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUND_COMPLETED: 'REFUND_COMPLETED',
  REFUND_FAILED: 'REFUND_FAILED',

  // CUSTOMER - Cart
  ABANDONED_CART: 'ABANDONED_CART',

  // ADMIN
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  NEW_ORDER: 'NEW_ORDER',
  ADMIN_PAYMENT_FAILED: 'PAYMENT_FAILED',
  ADMIN_RETURN_REQUESTED: 'RETURN_REQUESTED',
  ADMIN_REFUND_FAILED: 'REFUND_FAILED'
};

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedResourceType: {
    type: String,
    enum: ['ORDER', 'PAYMENT', 'RETURN', 'CART', 'PRODUCT', 'SYSTEM'],
    default: 'ORDER'
  },
  relatedResourceId: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  referenceId: { type: String, sparse: true }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ referenceId: 1 }, { unique: true, sparse: true });

// Optional TTL index for notification retention (e.g., auto-expire after 90 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

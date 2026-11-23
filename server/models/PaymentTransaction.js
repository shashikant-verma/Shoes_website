const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true,
      trim: true
    },
    razorpaySignature: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true
    },
    status: {
      type: String,
      enum: ['INITIATED', 'AUTHORIZED', 'CAPTURED', 'SUCCESS', 'FAILED', 'REFUNDED', 'PENDING'],
      default: 'INITIATED',
      index: true
    },
    paymentMethod: {
      type: String,
      default: 'razorpay',
      trim: true
    },
    webhookEvent: {
      type: String,
      trim: true
    },
    webhookEventId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true
    },
    failureReason: {
      type: String,
      default: null,
      trim: true
    },
    errorCode: {
      type: String,
      default: null,
      trim: true
    },
    errorDescription: {
      type: String,
      default: null,
      trim: true
    },
    refund: {
      refundId: String,
      amount: Number,
      status: String,
      initiatedAt: Date,
      completedAt: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

paymentTransactionSchema.index({ razorpayOrderId: 1, status: 1 });
paymentTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);

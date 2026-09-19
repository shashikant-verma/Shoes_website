const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  reason: {
    type: String,
    enum: ['WRONG_SIZE', 'WRONG_PRODUCT', 'DAMAGED', 'DEFECTIVE', 'NOT_AS_DESCRIBED', 'QUALITY_ISSUE', 'CHANGED_MIND', 'OTHER'],
    required: true
  },
  itemAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const returnRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  items: { type: [returnItemSchema], required: true },
  reason: {
    type: String,
    enum: ['WRONG_SIZE', 'WRONG_PRODUCT', 'DAMAGED', 'DEFECTIVE', 'NOT_AS_DESCRIBED', 'QUALITY_ISSUE', 'CHANGED_MIND', 'OTHER'],
    required: true
  },
  description: { type: String, default: '' },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED'],
    default: 'REQUESTED'
  },
  refund: {
    amount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'INITIATED', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    razorpayRefundId: String,
    initiatedAt: Date,
    completedAt: Date
  },
  adminNote: { type: String, default: '' },
  statusHistory: [{
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

returnRequestSchema.index({ user: 1, createdAt: -1 });
returnRequestSchema.index({ order: 1 });
returnRequestSchema.index({ status: 1 });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  size: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  shippingAddress: { type: mongoose.Schema.Types.Mixed },
  promoCode: String,
  coupon: {
    code: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number
  },
  notes: String,
  payment: {
    provider: { type: String, default: 'RAZORPAY' },
    razorpayOrderId: { type: String, sparse: true },
    razorpayPaymentId: { type: String, sparse: true },
    status: { type: String, enum: ['PENDING', 'CREATED', 'PAID', 'FAILED', 'CANCELLED'], default: 'PENDING' },
    amount: { type: Number },
    currency: { type: String, default: 'INR' },
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  statusHistory: [{
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],
  trackingNumber: { type: String, default: '' },
  carrier: { type: String, default: '' },
  shippedAt: Date,
  estimatedDeliveryDate: Date
}, { timestamps: true });

orderSchema.index({ 'payment.razorpayPaymentId': 1 }, { unique: true, sparse: true });

orderSchema.virtual('total').get(function() {
  return this.subtotal - this.discount + this.shipping;
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);

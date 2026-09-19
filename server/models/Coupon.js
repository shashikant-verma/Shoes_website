const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    required: [true, 'Discount type is required']
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0.01, 'Discount value must be greater than 0']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Max discount cannot be negative']
  },
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order value cannot be negative']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  usageLimit: {
    type: Number,
    min: [1, 'Usage limit must be at least 1']
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  perUserLimit: {
    type: Number,
    default: 1,
    min: [1, 'Per user limit must be at least 1']
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Pre-save middleware to ensure code is stored uppercase and trimmed
couponSchema.pre('save', function() {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
});

module.exports = mongoose.model('Coupon', couponSchema);

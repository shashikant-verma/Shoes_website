const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'SoleVibe Footwear',
      trim: true
    },
    tagline: {
      type: String,
      default: 'Engineered For Peak Biomechanical Motion',
      trim: true
    },
    supportEmail: {
      type: String,
      default: 'support@solevibe.com',
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      default: '+91 1800-765-3842',
      trim: true
    },
    storeAddress: {
      street: { type: String, default: 'SoleVibe Footwear Tower, Bandra Kurla Complex', trim: true },
      city: { type: String, default: 'Mumbai', trim: true },
      state: { type: String, default: 'Maharashtra', trim: true },
      postalCode: { type: String, default: '400051', trim: true },
      country: { type: String, default: 'India', trim: true }
    },
    currencyCode: {
      type: String,
      default: 'INR',
      trim: true
    },
    currencySymbol: {
      type: String,
      default: '₹',
      trim: true
    },
    taxPercentage: {
      type: Number,
      default: 18,
      min: 0,
      max: 100
    },
    isTaxInclusive: {
      type: Boolean,
      default: true
    },
    gstNumber: {
      type: String,
      default: '27AABCU9603R1ZM',
      trim: true
    },
    enableGst: {
      type: Boolean,
      default: true
    },
    freeShippingThreshold: {
      type: Number,
      default: 15000,
      min: 0
    },
    standardShippingFee: {
      type: Number,
      default: 150,
      min: 0
    },
    estimatedDeliveryDays: {
      type: String,
      default: '3-5 business days',
      trim: true
    },
    returnWindowDays: {
      type: Number,
      default: 7,
      min: 0
    },
    returnPolicy: {
      type: String,
      default: 'We accept returns within 7 days of delivery provided products are in pristine unworn condition with all tags and original packaging intact.'
    },
    refundPolicy: {
      type: String,
      default: 'Refunds are automatically disbursed to the original payment source within 3-5 business days upon warehouse verification.'
    },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com/solevibe' },
      facebook: { type: String, default: 'https://facebook.com/solevibe' },
      twitter: { type: String, default: 'https://twitter.com/solevibe' },
      youtube: { type: String, default: 'https://youtube.com/solevibe' }
    },
    enableCod: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'SoleVibe is undergoing scheduled performance upgrades. We will be back shortly.'
    }
  },
  {
    timestamps: true
  }
);

// Singleton helper to fetch or initialize settings
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

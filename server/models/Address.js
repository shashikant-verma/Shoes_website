const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['HOME', 'OFFICE', 'OTHER'], default: 'HOME', required: true },
  fullName: { type: String, required: true, trim: true },
  phone: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: function(v) {
        const cleaned = String(v).replace(/[\s\-()]/g, '');
        return /^(?:\+91|91|0)?[6-9]\d{9}$/.test(cleaned);
      },
      message: 'Please enter a valid 10-digit Indian phone number'
    }
  },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  landmark: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: function(v) {
        const cleaned = String(v).replace(/\s+/g, '');
        return /^\d{6}$/.test(cleaned);
      },
      message: 'Please enter a valid 6-digit Indian PIN code'
    }
  },
  country: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure a user can only have one default address (managed via controllers but index can assist, though full unique sparse index on multiple keys is complex. We'll handle uniqueness via controller).

module.exports = mongoose.model('Address', addressSchema);

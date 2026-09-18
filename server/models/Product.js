const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  category: { type: String, enum: ['men', 'women', 'unisex'], required: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  image: { type: String, required: true },
  specifications: {
    weight: String,
    drop: String,
    energy: String
  },
  features: { type: [String], default: [] },
  badge: String,
  badgeColor: String,
  stock: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

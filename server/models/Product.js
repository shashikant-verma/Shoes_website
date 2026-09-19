const mongoose = require('mongoose');

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, trim: true },
  sku: { type: String, unique: true, sparse: true, trim: true },
  brand: { type: String, default: 'SoleVibe', trim: true },
  category: { type: String, enum: ['men', 'women', 'unisex'], required: true },
  gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  productType: { type: String, trim: true },
  collectionName: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  discount: { type: Number, min: 0, max: 100 },
  description: { type: String, required: true },
  image: { type: String, required: true },
  images: { type: [String], default: [] },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  specifications: new mongoose.Schema({
    weight: String,
    drop: String,
    energy: String,
    material: String,
    sole: String,
    closure: String,
    type: String,
    use: String
  }, { _id: false }),
  features: { type: [String], default: [] },
  badge: String,
  badgeColor: String,
  stock: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  onSale: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' }
}, { timestamps: true });

// Auto-generate slug before saving
productSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and generate unique one
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Auto-generate SKU if not provided
productSchema.pre('save', async function(next) {
  if (!this.sku && this.isNew) {
    const prefix = this.category === 'men' ? 'SV-M' : this.category === 'women' ? 'SV-W' : 'SV-U';
    const count = await this.constructor.countDocuments();
    this.sku = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

// Helper to generate a clean URL-friendly slug
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    icon: {
      type: String,
      trim: true,
      default: '👟'
    },
    color: {
      type: String,
      trim: true,
      default: '#c9232d'
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    subcategories: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    seoTitle: {
      type: String,
      trim: true,
      default: ''
    },
    seoDescription: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate slug before saving if not explicitly set
categorySchema.pre('save', async function () {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = generateSlug(this.slug || this.name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
});

categorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);

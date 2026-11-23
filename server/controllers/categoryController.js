const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const { all, featured } = req.query;
    const query = {};

    // For public storefront, only return active categories unless all=true (admin)
    if (all !== 'true') {
      query.isActive = true;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    const categories = await Category.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // Attach product count to each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({
          $or: [
            { category: cat.slug },
            { category: cat.name.toLowerCase() },
            { collectionName: new RegExp(`^${cat.name}$`, 'i') }
          ],
          status: 'active'
        });
        return {
          ...cat,
          id: cat._id,
          productCount: count
        };
      })
    );

    if (all !== 'true') {
      res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
    }

    res.json({
      success: true,
      count: categoriesWithCounts.length,
      data: categoriesWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by slug or id
// @route   GET /api/categories/:identifier
// @access  Public
const getCategory = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let category = null;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(identifier).lean();
    }
    if (!category) {
      category = await Category.findOne({ slug: identifier.toLowerCase() }).lean();
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found: ${identifier}`
      });
    }

    const count = await Product.countDocuments({
      $or: [
        { category: category.slug },
        { category: category.name.toLowerCase() },
        { collectionName: new RegExp(`^${category.name}$`, 'i') }
      ],
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        ...category,
        id: category._id,
        productCount: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, icon, color, subcategories, isActive, featured, displayOrder, seoTitle, seoDescription } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const categorySlug = (slug || name).toLowerCase().trim().replace(/\s+/g, '-');
    const existing = await Category.findOne({ slug: categorySlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A category with slug '${categorySlug}' already exists.`
      });
    }

    const subcatsArray = Array.isArray(subcategories)
      ? subcategories
      : typeof subcategories === 'string'
      ? subcategories.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const category = await Category.create({
      name: name.trim(),
      slug: categorySlug,
      description: description || '',
      image: image || '',
      icon: icon || '👟',
      color: color || '#c9232d',
      subcategories: subcatsArray,
      isActive: isActive !== undefined ? isActive : true,
      featured: featured || false,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || ''
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, slug, description, image, icon, color, subcategories, isActive, featured, displayOrder, seoTitle, seoDescription } = req.body;

    if (name) category.name = name.trim();
    if (slug) {
      const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
      const conflict = await Category.findOne({ slug: cleanSlug, _id: { $ne: id } });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Category slug '${cleanSlug}' is already in use by another category.`
        });
      }
      category.slug = cleanSlug;
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (subcategories !== undefined) {
      category.subcategories = Array.isArray(subcategories)
        ? subcategories
        : subcategories.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (isActive !== undefined) category.isActive = isActive;
    if (featured !== undefined) category.featured = featured;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (seoTitle !== undefined) category.seoTitle = seoTitle;
    if (seoDescription !== undefined) category.seoDescription = seoDescription;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle category status
// @route   PUT /api/categories/:id/status
// @access  Admin
const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isActive = isActive !== undefined ? isActive : !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (with orphan protection)
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Safety check: Count products associated with this category
    const associatedProductsCount = await Product.countDocuments({
      $or: [
        { category: category.slug },
        { category: category.name.toLowerCase() },
        { collectionName: new RegExp(`^${category.name}$`, 'i') }
      ]
    });

    if (associatedProductsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}". It currently has ${associatedProductsCount} product(s) assigned. Please reassign or delete these products first.`
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Category "${category.name}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
};

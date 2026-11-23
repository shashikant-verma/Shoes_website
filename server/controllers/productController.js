const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get all products with filters & pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      gender,
      brand,
      status,
      featured,
      collectionName,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 50,
      minPrice,
      maxPrice
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    // Build query
    const query = {};

    // Filter by status (default to active for public queries, but allow 'all' or explicit status)
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'active';
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    // Filter by gender
    if (gender && gender !== 'all') {
      query.gender = gender.toLowerCase();
    }

    // Filter by brand
    if (brand && brand !== 'all') {
      query.brand = { $regex: new RegExp(`^${brand.trim()}$`, 'i') };
    }

    if (collectionName) {
      query.collectionName = collectionName;
    }

    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(Number(minPrice))) query.price.$gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) query.price.$lte = Number(maxPrice);
    }

    // Search functionality with safe regex escaping
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { brand: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } },
        { productType: { $regex: escapedSearch, $options: 'i' } },
        { sku: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    if (sort === 'price') {
      sortOptions.price = order === 'desc' ? -1 : 1;
    } else if (sort === 'rating') {
      sortOptions.rating = -1;
    } else if (sort === 'name') {
      sortOptions.name = order === 'desc' ? -1 : 1;
    } else if (sort === 'stock') {
      sortOptions.stock = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = order === 'asc' ? 1 : -1;
    }

    // Execute query with .lean() for fast document hydration
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    res.json({
      success: true,
      count: products.length,
      total: totalProducts,
      page: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum) || 1,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or Slug
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).lean();
    }

    if (!product) {
      product = await Product.findOne({ slug: id }).lean();
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { slug, ...productData } = req.body;

    // Validate required fields
    if (!productData.name || typeof productData.name !== 'string' || productData.name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    if (!productData.category || !['men', 'women', 'unisex'].includes(String(productData.category).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Category is required and must be one of: men, women, unisex'
      });
    }

    if (productData.price === undefined || isNaN(Number(productData.price)) || Number(productData.price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number'
      });
    }

    if (productData.stock !== undefined && (isNaN(Number(productData.stock)) || Number(productData.stock) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer'
      });
    }

    if (!productData.description || typeof productData.description !== 'string' || productData.description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product description is required'
      });
    }

    if (!productData.image || typeof productData.image !== 'string' || productData.image.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Main product image is required'
      });
    }

    // Check duplicate SKU if SKU provided
    if (productData.sku && typeof productData.sku === 'string' && productData.sku.trim().length > 0) {
      const existingSku = await Product.findOne({ sku: productData.sku.trim() });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `SKU '${productData.sku.trim()}' already exists`
        });
      }
    }

    const product = await Product.create({
      ...productData,
      price: Number(productData.price),
      stock: Number(productData.stock || 0),
      category: String(productData.category).toLowerCase(),
      gender: String(productData.gender || productData.category).toLowerCase()
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { slug, ...productData } = req.body;

    // Validate fields if updated
    if (productData.category && !['men', 'women', 'unisex'].includes(String(productData.category).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Category must be one of: men, women, unisex'
      });
    }

    if (productData.price !== undefined && (isNaN(Number(productData.price)) || Number(productData.price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number'
      });
    }

    if (productData.stock !== undefined && (isNaN(Number(productData.stock)) || Number(productData.stock) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer'
      });
    }

    if (productData.status && !['active', 'inactive', 'discontinued'].includes(String(productData.status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: active, inactive, discontinued'
      });
    }

    if (productData.sku && typeof productData.sku === 'string' && productData.sku.trim().length > 0) {
      const existingSku = await Product.findOne({ sku: productData.sku.trim(), _id: { $ne: id } });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `SKU '${productData.sku.trim()}' is already assigned to another product`
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      productData,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    next(error);
  }
};

// @desc    Update product status (activate / deactivate / discontinue)
// @route   PUT /api/products/:id/status
// @access  Private/Admin
const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const { status } = req.body;

    if (!status || !['active', 'inactive', 'discontinued'].includes(String(status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be one of: active, inactive, discontinued'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.status = String(status).toLowerCase();
    await product.save();

    res.json({
      success: true,
      message: `Product status updated to ${product.status} successfully`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or soft-deactivate product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is referenced in historical orders
    const referencedOrder = await Order.findOne({ 'items.product': id });

    if (referencedOrder) {
      // Soft-deactivate product to protect historical order integrity
      product.status = 'inactive';
      await product.save();

      return res.json({
        success: true,
        message: 'Product deactivated successfully (soft-deleted due to existing customer order history)',
        data: product
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
};
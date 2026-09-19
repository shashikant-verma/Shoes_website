const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5;

// Helper to determine inventory status
const getInventoryStatus = (stock) => {
  if (stock === 0) return 'OUT_OF_STOCK';
  if (stock <= LOW_STOCK_THRESHOLD) return 'LOW_STOCK';
  return 'IN_STOCK';
};

// @desc    Get Inventory Dashboard Data & Table List (Admin)
// @route   GET /api/admin/inventory
// @access  Private/Admin
const getInventory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      category,
      sortBy = 'stock',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ];
    }

    if (status) {
      const st = status.toUpperCase();
      if (st === 'OUT_OF_STOCK') {
        query.stock = 0;
      } else if (st === 'LOW_STOCK') {
        query.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
      } else if (st === 'IN_STOCK') {
        query.stock = { $gt: LOW_STOCK_THRESHOLD };
      }
    }

    // Sort configuration
    const sortField = sortBy === 'name' ? 'name' : sortBy === 'updatedAt' ? 'updatedAt' : 'stock';
    const sortDir = sortOrder === 'desc' ? -1 : 1;
    const sortObj = { [sortField]: sortDir };

    // Execute paginated search
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const products = await Product.find(query)
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalMatching = await Product.countDocuments(query);

    // Calculate global aggregate stats
    const allProducts = await Product.find({}).select('stock price');
    const totalProducts = allProducts.length;
    const outOfStockCount = allProducts.filter(p => p.stock === 0).length;
    const lowStockCount = allProducts.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
    const inStockCount = allProducts.filter(p => p.stock > LOW_STOCK_THRESHOLD).length;
    const totalQuantity = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

    const enrichedProducts = products.map(p => {
      const obj = p.toObject();
      obj.inventoryStatus = getInventoryStatus(p.stock);
      return obj;
    });

    res.json({
      success: true,
      data: {
        products: enrichedProducts,
        pagination: {
          total: totalMatching,
          page: pageNum,
          totalPages: Math.ceil(totalMatching / limitNum),
          limit: limitNum
        },
        summary: {
          totalProducts,
          inStockCount,
          lowStockCount,
          outOfStockCount,
          totalQuantity,
          lowStockThreshold: LOW_STOCK_THRESHOLD
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Low Stock Products (Admin)
// @route   GET /api/admin/inventory/low-stock
// @access  Private/Admin
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1 });

    const enriched = products.map(p => {
      const obj = p.toObject();
      obj.inventoryStatus = getInventoryStatus(p.stock);
      return obj;
    });

    res.json({
      success: true,
      count: enriched.length,
      threshold: LOW_STOCK_THRESHOLD,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Product Inventory Details (Admin)
// @route   GET /api/admin/inventory/:productId
// @access  Private/Admin
const getProductInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID: ${productId}`
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const recentHistory = await InventoryTransaction.find({ product: productId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('changedBy', 'name email');

    const obj = product.toObject();
    obj.inventoryStatus = getInventoryStatus(product.stock);

    res.json({
      success: true,
      data: {
        product: obj,
        recentHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust Product Stock (Admin)
// @route   POST /api/admin/inventory/:productId/adjust
// @access  Private/Admin
const adjustStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { change, reason, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID: ${productId}`
      });
    }

    const changeNum = Number(change);
    if (!Number.isInteger(changeNum) || changeNum === 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock change quantity must be a non-zero integer'
      });
    }

    const VALID_REASONS = ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN', 'ORDER', 'DAMAGE', 'CORRECTION'];
    const selectedReason = (reason || 'ADJUSTMENT').toUpperCase();

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStock = product.stock;
    const targetStock = currentStock + changeNum;

    if (targetStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid adjustment: Stock cannot become negative (Current: ${currentStock}, Change: ${changeNum}, Result: ${targetStock})`
      });
    }

    // Atomic MongoDB Update
    const condition = changeNum < 0
      ? { _id: productId, stock: { $gte: Math.abs(changeNum) } }
      : { _id: productId };

    const updatedProduct = await Product.findOneAndUpdate(
      condition,
      { $inc: { stock: changeNum } },
      { returnDocument: 'after' }
    );

    if (!updatedProduct) {
      return res.status(400).json({
        success: false,
        message: `Stock reduction failed: Insufficient stock available for ${product.name}`
      });
    }

    const adminId = req.user._id || req.user.id;

    // Determine transaction type
    let transactionType = selectedReason;
    if (!VALID_REASONS.includes(transactionType)) {
      transactionType = changeNum > 0 ? 'STOCK_IN' : 'STOCK_OUT';
    }

    // Log immutable InventoryTransaction history record
    const transaction = await InventoryTransaction.create({
      product: updatedProduct._id,
      sku: updatedProduct.sku,
      type: transactionType,
      quantity: changeNum,
      previousStock: currentStock,
      newStock: updatedProduct.stock,
      reason: selectedReason,
      note: note || `Stock adjusted by ${changeNum > 0 ? '+' : ''}${changeNum}`,
      referenceType: 'ADMIN',
      changedBy: adminId
    });

    const populatedTransaction = await InventoryTransaction.findById(transaction._id)
      .populate('changedBy', 'name email');

    const resObj = updatedProduct.toObject();
    resObj.inventoryStatus = getInventoryStatus(updatedProduct.stock);

    res.json({
      success: true,
      message: `Stock updated successfully from ${currentStock} to ${updatedProduct.stock}`,
      data: {
        product: resObj,
        transaction: populatedTransaction
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Product Inventory History (Admin)
// @route   GET /api/admin/inventory/:productId/history
// @access  Private/Admin
const getInventoryHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID: ${productId}`
      });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const history = await InventoryTransaction.find({ product: productId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('changedBy', 'name email');

    const total = await InventoryTransaction.countDocuments({ product: productId });

    res.json({
      success: true,
      count: history.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getLowStockProducts,
  getProductInventory,
  adjustStock,
  getInventoryHistory
};

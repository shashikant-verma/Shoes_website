const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes (Admin only)
router.post('/', authenticate, authorize('ADMIN'), createProduct);
router.put('/:id/status', authenticate, authorize('ADMIN'), updateProductStatus);
router.put('/:id', authenticate, authorize('ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

module.exports = router;
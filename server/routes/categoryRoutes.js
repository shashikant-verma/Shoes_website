const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getCategories);
router.get('/:identifier', getCategory);

// Admin-only routes
router.post('/', authenticate, authorize('ADMIN'), createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.put('/:id/status', authenticate, authorize('ADMIN'), toggleCategoryStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

module.exports = router;

const express = require('express');
const {
  createOrder,
  getOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin routes (must come before /:id route)
router.get('/admin/all', authorize('ADMIN'), getAllOrders);

// User routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

// More admin routes
router.put('/:id/status', authorize('ADMIN'), updateOrderStatus);
router.delete('/:id', authorize('ADMIN'), deleteOrder);

module.exports = router;
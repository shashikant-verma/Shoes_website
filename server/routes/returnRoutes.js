const express = require('express');
const {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  cancelReturnRequest,
  getAllReturns,
  updateReturnStatus,
  processRefund
} = require('../controllers/returnController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All return routes require authentication
router.use(authenticate);

// Admin routes (must come before customer /:id route)
router.get('/admin/all', authorize('ADMIN'), getAllReturns);
router.put('/admin/:id/status', authorize('ADMIN'), updateReturnStatus);
router.post('/admin/:id/refund', authorize('ADMIN'), processRefund);

// Customer routes
router.post('/', createReturnRequest);
router.get('/my', getMyReturns);
router.get('/:id', getReturnById);
router.put('/:id/cancel', cancelReturnRequest);

module.exports = router;

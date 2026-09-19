const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getProductReviews,
  getMyReview,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  approveReviewAdmin,
  rejectReviewAdmin
} = require('../controllers/reviewController');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes (Logged-in user)
router.get('/my/:productId', authenticate, getMyReview);
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

// Protected Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllReviewsAdmin);
router.put('/admin/:id/approve', authenticate, authorize('ADMIN'), approveReviewAdmin);
router.put('/admin/:id/reject', authenticate, authorize('ADMIN'), rejectReviewAdmin);
router.delete('/admin/:id', authenticate, authorize('ADMIN'), deleteReview);

module.exports = router;

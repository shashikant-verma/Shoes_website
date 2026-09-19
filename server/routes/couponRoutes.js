const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  validateCouponCustomer,
  getAllCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin
} = require('../controllers/couponController');

// Customer validation endpoint (supports optional Auth token if provided)
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();
  authenticate(req, res, next);
};

router.post('/validate', optionalAuth, validateCouponCustomer);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllCouponsAdmin);
router.post('/admin', authenticate, authorize('ADMIN'), createCouponAdmin);
router.put('/admin/:id', authenticate, authorize('ADMIN'), updateCouponAdmin);
router.delete('/admin/:id', authenticate, authorize('ADMIN'), deleteCouponAdmin);

module.exports = router;

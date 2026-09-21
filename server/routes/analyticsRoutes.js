const express = require('express');
const router = express.Router();
const {
  getOverview,
  getSalesTrend,
  getTopProducts,
  getCategoryPerformance,
  getCustomerStats,
  getCouponStats,
  getReturnsStats,
  getInventoryStats,
  exportReport
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All analytics routes require Admin authentication
router.use(authenticate, authorize('ADMIN'));

router.get('/overview', getOverview);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/category-performance', getCategoryPerformance);
router.get('/customer-stats', getCustomerStats);
router.get('/coupon-stats', getCouponStats);
router.get('/returns-stats', getReturnsStats);
router.get('/inventory-stats', getInventoryStats);
router.get('/export', exportReport);

module.exports = router;

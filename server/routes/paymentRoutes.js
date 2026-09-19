const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  createPaymentOrder,
  verifyPayment
} = require('../controllers/paymentController');

// All payment routes require authentication
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook
} = require('../controllers/paymentController');

// Authenticated user checkout endpoints
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);

// Razorpay webhook endpoint (signed with x-razorpay-signature)
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getShippingMethods,
  calculateShippingFee,
  handleShippingWebhook
} = require('../controllers/shippingController');

router.get('/methods', getShippingMethods);
router.post('/calculate', calculateShippingFee);
router.post('/webhook', handleShippingWebhook);

module.exports = router;

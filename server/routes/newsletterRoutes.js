const express = require('express');
const router = express.Router();
const { subscribeNewsletter } = require('../controllers/newsletterController');

// Public route to subscribe
router.post('/subscribe', subscribeNewsletter);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public route to view store settings
router.get('/', getSettings);

// Admin-only route to update store settings
router.put('/', authenticate, authorize('ADMIN'), updateSettings);

module.exports = router;

const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadSingleImage, uploadMultipleImages } = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Authenticated upload for single image (works for profile, return photo proof, or product image)
router.post('/image', authenticate, upload.single('image'), uploadSingleImage);
router.post('/single', authenticate, upload.single('image'), uploadSingleImage);

// Admin-only upload for multiple product gallery images
router.post('/multiple', authenticate, authorize('ADMIN'), upload.array('images', 8), uploadMultipleImages);

module.exports = router;

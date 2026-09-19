const express = require('express');
const router = express.Router();
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate); // All address routes require authentication

router.route('/')
  .get(getAddresses)
  .post(createAddress);

router.route('/:id')
  .put(updateAddress)
  .delete(deleteAddress);

router.route('/:id/default')
  .put(setDefaultAddress);

module.exports = router;

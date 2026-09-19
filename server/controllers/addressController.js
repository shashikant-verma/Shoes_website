const Address = require('../models/Address');

// @desc    Get user addresses
// @route   GET /api/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
const createAddress = async (req, res, next) => {
  try {
    const { type, fullName, phone, addressLine1, addressLine2, landmark, city, state, postalCode, country } = req.body;

    // Validate required fields
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode || !country) {
      return res.status(400).json({ success: false, message: 'Missing required address fields' });
    }

    // Check if this is the user's first address
    const existingCount = await Address.countDocuments({ user: req.user._id });
    const isDefault = existingCount === 0;

    const address = await Address.create({
      user: req.user._id, // Enforce ownership from JWT
      type: type || 'HOME',
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : '',
      landmark: landmark ? landmark.trim() : '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      isDefault
    });

    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    if (!addressId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }

    let address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    const { type, fullName, phone, addressLine1, addressLine2, landmark, city, state, postalCode, country } = req.body;

    // Update fields (excluding isDefault, which is handled separately)
    if (type) address.type = type;
    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (addressLine1) address.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (postalCode) address.postalCode = postalCode.trim();
    if (country) address.country = country.trim();

    await address.save();

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    if (!addressId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }

    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If default was deleted, promote the most recently created remaining address to default
    if (wasDefault) {
      const remainingAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    if (!addressId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }

    const targetAddress = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!targetAddress) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    // Set all other addresses for this user to false
    await Address.updateMany({ user: req.user._id, _id: { $ne: addressId } }, { isDefault: false });

    // Set target to true
    targetAddress.isDefault = true;
    await targetAddress.save();

    // Return all updated addresses to refresh frontend state
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};

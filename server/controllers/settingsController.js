const Settings = require('../models/Settings');

// @desc    Get store configuration & settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=60');
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update store configuration
// @route   PUT /api/settings
// @access  Admin
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const updatableFields = [
      'storeName',
      'tagline',
      'supportEmail',
      'contactPhone',
      'storeAddress',
      'currencyCode',
      'currencySymbol',
      'taxPercentage',
      'isTaxInclusive',
      'gstNumber',
      'enableGst',
      'freeShippingThreshold',
      'standardShippingFee',
      'estimatedDeliveryDays',
      'returnWindowDays',
      'returnPolicy',
      'refundPolicy',
      'socialLinks',
      'enableCod',
      'maintenanceMode',
      'maintenanceMessage'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    res.json({
      success: true,
      message: 'Store settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};

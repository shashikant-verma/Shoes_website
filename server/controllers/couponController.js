const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Centralized Coupon Validation Engine
const evaluateCouponDiscount = async ({ code, cartItems, userId }) => {
  if (!code || typeof code !== 'string') {
    return { valid: false, message: 'Coupon code is required' };
  }

  const normalizedCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code' };
  }

  // 1. Active status check
  if (!coupon.isActive) {
    return { valid: false, message: 'This coupon is no longer active' };
  }

  // 2. Date range check
  const now = new Date();
  if (coupon.startDate && now < new Date(coupon.startDate)) {
    return { valid: false, message: 'This coupon is not yet valid' };
  }

  if (coupon.expiryDate && now > new Date(coupon.expiryDate)) {
    return { valid: false, message: 'This coupon has expired' };
  }

  // 3. Global usage limit check
  if (coupon.usageLimit !== undefined && coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, message: 'This coupon usage limit has been reached' };
  }

  // 4. Per-user limit check (if user is authenticated)
  if (userId && coupon.perUserLimit) {
    const userUsage = await Order.countDocuments({
      user: userId,
      'coupon.code': normalizedCode,
      status: { $ne: 'cancelled' }
    });

    if (userUsage >= coupon.perUserLimit) {
      return { valid: false, message: 'You have already used this coupon the maximum allowed times' };
    }
  }

  // 5. Fetch actual product details from MongoDB to calculate subtotals
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return { valid: false, message: 'Cart is empty' };
  }

  let totalSubtotal = 0;
  let eligibleSubtotal = 0;

  const appProductIds = (coupon.applicableProducts || []).map(id => id.toString());
  const appCategories = (coupon.applicableCategories || []).map(c => c.toLowerCase());

  for (const item of cartItems) {
    const productId = item.product || item._id || item.id;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;

    const dbProduct = await Product.findById(productId);
    if (!dbProduct) continue;

    const quantity = Math.max(1, Number(item.quantity) || 1);
    const itemTotal = dbProduct.price * quantity;
    totalSubtotal += itemTotal;

    // Check product / category applicability
    let isEligible = true;

    if (appProductIds.length > 0 && !appProductIds.includes(dbProduct._id.toString())) {
      isEligible = false;
    }

    if (appCategories.length > 0 && (!dbProduct.category || !appCategories.includes(dbProduct.category.toLowerCase()))) {
      isEligible = false;
    }

    if (isEligible) {
      eligibleSubtotal += itemTotal;
    }
  }

  // 6. Minimum Order Value check
  if (coupon.minimumOrderValue > 0 && totalSubtotal < coupon.minimumOrderValue) {
    return {
      valid: false,
      message: `Minimum order value of ₹${coupon.minimumOrderValue.toLocaleString()} required to use coupon ${normalizedCode}`
    };
  }

  // 7. Check if any items in cart are eligible
  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      message: `Coupon ${normalizedCode} is not applicable to any products in your cart`
    };
  }

  // 8. Calculate discount amount
  let discountAmount = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    if (coupon.discountValue <= 0 || coupon.discountValue > 100) {
      return { valid: false, message: 'Invalid coupon discount percentage' };
    }
    const rawDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discountAmount = Math.min(rawDiscount, coupon.maxDiscount);
    } else {
      discountAmount = rawDiscount;
    }
  } else if (coupon.discountType === 'FIXED') {
    if (coupon.discountValue <= 0) {
      return { valid: false, message: 'Invalid fixed coupon discount value' };
    }
    discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
  }

  // Round discount to nearest integer/decimal
  discountAmount = Math.round(discountAmount * 100) / 100;
  discountAmount = Math.min(discountAmount, eligibleSubtotal);

  return {
    valid: true,
    coupon,
    code: normalizedCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount,
    discountAmount,
    eligibleSubtotal,
    totalSubtotal
  };
};

// @desc    Validate coupon for customer cart
// @route   POST /api/coupons/validate
// @access  Public (Supports optional Auth)
const validateCouponCustomer = async (req, res, next) => {
  try {
    const { code, cartItems } = req.body;
    const userId = req.user ? req.user._id : null;

    const result = await evaluateCouponDiscount({ code, cartItems, userId });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      valid: true,
      code: result.code,
      discountType: result.discountType,
      discountValue: result.discountValue,
      maxDiscount: result.maxDiscount,
      discountAmount: result.discountAmount,
      eligibleSubtotal: result.eligibleSubtotal,
      totalSubtotal: result.totalSubtotal,
      message: `Coupon ${result.code} applied successfully!`
    });
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN COUPON CONTROLLERS =================

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons/admin/all
// @access  Private/Admin
const getAllCouponsAdmin = async (req, res, next) => {
  try {
    const coupons = await Coupon.find()
      .populate('applicableProducts', 'name price image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons/admin
// @access  Private/Admin
const createCouponAdmin = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderValue,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      applicableProducts,
      applicableCategories,
      isActive
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Code, discountType, and discountValue are required'
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check code uniqueness
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${normalizedCode}' already exists`
      });
    }

    // Validate discount values
    if (discountType === 'PERCENTAGE' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 1 and 100'
      });
    }

    if (discountType === 'FIXED' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed discount value must be greater than 0'
      });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description: description || '',
      discountType,
      discountValue,
      maxDiscount: maxDiscount || undefined,
      minimumOrderValue: minimumOrderValue || 0,
      startDate: startDate || new Date(),
      expiryDate: expiryDate || undefined,
      usageLimit: usageLimit || undefined,
      perUserLimit: perUserLimit || 1,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/admin/:id
// @access  Private/Admin
const updateCouponAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    if (req.body.code && req.body.code.trim().toUpperCase() !== coupon.code) {
      const normalizedCode = req.body.code.trim().toUpperCase();
      const existing = await Coupon.findOne({ code: normalizedCode, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Coupon code '${normalizedCode}' already exists`
        });
      }
      coupon.code = normalizedCode;
    }

    if (req.body.discountType) coupon.discountType = req.body.discountType;
    if (req.body.discountValue !== undefined) coupon.discountValue = req.body.discountValue;
    if (req.body.description !== undefined) coupon.description = req.body.description;
    if (req.body.maxDiscount !== undefined) coupon.maxDiscount = req.body.maxDiscount;
    if (req.body.minimumOrderValue !== undefined) coupon.minimumOrderValue = req.body.minimumOrderValue;
    if (req.body.startDate) coupon.startDate = req.body.startDate;
    if (req.body.expiryDate !== undefined) coupon.expiryDate = req.body.expiryDate;
    if (req.body.usageLimit !== undefined) coupon.usageLimit = req.body.usageLimit;
    if (req.body.perUserLimit !== undefined) coupon.perUserLimit = req.body.perUserLimit;
    if (req.body.applicableProducts) coupon.applicableProducts = req.body.applicableProducts;
    if (req.body.applicableCategories) coupon.applicableCategories = req.body.applicableCategories;
    if (req.body.isActive !== undefined) coupon.isActive = req.body.isActive;

    // Validate percentage
    if (coupon.discountType === 'PERCENTAGE' && (coupon.discountValue <= 0 || coupon.discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 1 and 100'
      });
    }

    await coupon.save();

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/admin/:id
// @access  Private/Admin
const deleteCouponAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  evaluateCouponDiscount,
  validateCouponCustomer,
  getAllCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin
};

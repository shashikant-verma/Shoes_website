const mongoose = require('mongoose');
const User = require('../models/User');

// @desc    Get all users / customers
// @route   GET /api/users
// @route   GET /api/admin/customers
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    // Build query
    const query = {};

    // Safe regex search by name or email
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role && typeof role === 'string' && role.trim().length > 0) {
      query.role = role.trim().toUpperCase();
    }

    // Filter by status
    if (status !== undefined && status !== null && String(status).trim() !== '') {
      const statusStr = String(status).toLowerCase().trim();
      if (statusStr === 'active' || statusStr === 'true') {
        query.isActive = true;
      } else if (statusStr === 'inactive' || statusStr === 'false') {
        query.isActive = false;
      }
    }

    // Execute query
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    // Get total count
    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total: totalUsers,
      page: pageNum,
      totalPages: Math.ceil(totalUsers / limitNum) || 1,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user / customer details with addresses, orders & order statistics
// @route   GET /api/users/:id
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Fetch user's saved addresses & orders
    const Address = require('../models/Address');
    const Order = require('../models/Order');

    const addresses = await Address.find({ user: user._id }).sort({ isDefault: -1, createdAt: -1 });

    const orders = await Order.find({ user: user._id })
      .select('_id items subtotal discount shipping shippingMethod carrier trackingNumber payment status createdAt')
      .sort({ createdAt: -1 });

    // Calculate Customer Order Statistics from actual Order database records
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    let returnedOrders = 0;
    try {
      const ReturnRequest = require('../models/ReturnRequest');
      returnedOrders = await ReturnRequest.countDocuments({ user: user._id });
    } catch (e) {}

    const totalOrderValue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || (o.subtotal - o.discount + o.shipping)), 0);

    const stats = {
      totalOrders,
      completedOrders,
      cancelledOrders,
      returnedOrders,
      totalOrderValue
    };

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        addresses,
        orders,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (activate / deactivate)
// @route   PUT /api/users/:id/status
// @route   PUT /api/admin/customers/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive status parameter must be a boolean (true or false)'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Prevent Admin from deactivating their own logged in account
    const adminId = (req.user._id || req.user.id).toString();
    if (adminId === userId && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot deactivate their own account'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `Customer account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details or role
// @route   PUT /api/users/:id
// @route   PUT /api/admin/customers/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    const { name, email, role, isActive } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (role !== undefined) {
      const roleUpper = String(role).toUpperCase();
      if (!['USER', 'ADMIN'].includes(roleUpper)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Role must be USER or ADMIN'
        });
      }

      const adminId = (req.user._id || req.user.id).toString();
      if (adminId === userId && roleUpper !== 'ADMIN') {
        return res.status(400).json({
          success: false,
          message: 'Admins cannot remove their own ADMIN role'
        });
      }

      user.role = roleUpper;
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase().trim();
    if (isActive !== undefined && typeof isActive === 'boolean') {
      const adminId = (req.user._id || req.user.id).toString();
      if (adminId === userId && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'Admins cannot deactivate their own account'
        });
      }
      user.isActive = isActive;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @route   DELETE /api/admin/customers/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    const adminId = (req.user._id || req.user.id).toString();
    if (adminId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own account'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserStatus,
  updateUser,
  deleteUser
};
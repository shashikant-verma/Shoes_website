const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const ReturnRequest = require('../models/ReturnRequest');
const InventoryTransaction = require('../models/InventoryTransaction');

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5;

// Helper to build date range query safely
const buildDateMatchQuery = (dateRange, startDate, endDate, dateField = 'createdAt') => {
  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;

  if (dateRange && dateRange !== 'all' && dateRange !== 'custom') {
    const now = new Date();
    if (dateRange === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === '7d') {
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      end = new Date();
    } else if (dateRange === '30d') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      end = new Date();
    } else if (dateRange === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }
  }

  const match = {};
  if (start || end) {
    match[dateField] = {};
    if (start && !isNaN(start.getTime())) match[dateField].$gte = start;
    if (end && !isNaN(end.getTime())) match[dateField].$lte = end;
    if (Object.keys(match[dateField]).length === 0) delete match[dateField];
  }
  return match;
};

// Valid Order Condition for Revenue Aggregation
const VALID_ORDER_MATCH = {
  status: { $ne: 'cancelled' },
  'payment.status': { $nin: ['FAILED', 'CANCELLED'] }
};

// @desc    Get Analytics Overview
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
const getOverview = async (req, res, next) => {
  try {
    const { dateRange, startDate, endDate } = req.query;
    const dateMatch = buildDateMatchQuery(dateRange, startDate, endDate);
    const orderMatch = { ...VALID_ORDER_MATCH, ...dateMatch };

    // 1. Order & Revenue Aggregation
    const orderStats = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $add: [{ $subtract: ["$subtotal", "$discount"] }, "$shipping"] } },
          totalOrders: { $sum: 1 },
          totalDiscounts: { $sum: "$discount" },
          totalSubtotal: { $sum: "$subtotal" },
          totalShipping: { $sum: "$shipping" }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalDiscounts: 0,
      totalSubtotal: 0,
      totalShipping: 0
    };

    // Delivered & Cancelled order counts
    const deliveredOrders = await Order.countDocuments({ status: 'delivered', ...dateMatch });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled', ...dateMatch });

    // 2. Customer & Product Counts
    const customerCountMatch = buildDateMatchQuery(dateRange, startDate, endDate);
    const totalCustomers = await User.countDocuments({ role: 'USER', ...customerCountMatch });
    const totalProducts = await Product.countDocuments();

    // 3. Refund Aggregation
    const refundDateMatch = buildDateMatchQuery(dateRange, startDate, endDate);
    const refundMatch = {
      $or: [
        { 'refund.status': 'COMPLETED' },
        { status: 'REFUNDED' }
      ],
      ...refundDateMatch
    };

    const refundStats = await ReturnRequest.aggregate([
      { $match: refundMatch },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: "$refund.amount" },
          totalRefundCount: { $sum: 1 }
        }
      }
    ]);

    const refundData = refundStats[0] || { totalRefunds: 0, totalRefundCount: 0 };
    const avgOrderValue = stats.totalOrders > 0 ? Math.round((stats.totalRevenue / stats.totalOrders) * 100) / 100 : 0;
    const netRevenue = Math.max(0, Math.round((stats.totalRevenue - refundData.totalRefunds) * 100) / 100);

    res.json({
      success: true,
      data: {
        period: dateRange || 'all',
        totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
        netRevenue,
        totalOrders: stats.totalOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        averageOrderValue: avgOrderValue,
        avgOrderValue,
        totalDiscounts: Math.round(stats.totalDiscounts * 100) / 100,
        totalRefunds: Math.round(refundData.totalRefunds * 100) / 100,
        totalRefundsAmount: Math.round(refundData.totalRefunds * 100) / 100,
        totalRefundCount: refundData.totalRefundCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales & Order Volume Trend Over Time
// @route   GET /api/admin/analytics/sales-trend
// @access  Private/Admin
const getSalesTrend = async (req, res, next) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    const dateMatch = buildDateMatchQuery(startDate, endDate);
    const orderMatch = { ...VALID_ORDER_MATCH, ...dateMatch };

    let dateFormat = '%Y-%m-%d';
    if (period === 'monthly') {
      dateFormat = '%Y-%m';
    } else if (period === 'weekly') {
      dateFormat = '%G-W%V';
    }

    const trendData = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: { $add: [{ $subtract: ["$subtotal", "$discount"] }, "$shipping"] } },
          orderCount: { $sum: 1 },
          discounts: { $sum: "$discount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedTrend = trendData.map(t => ({
      date: t._id,
      revenue: Math.round(t.revenue * 100) / 100,
      orderCount: t.orderCount,
      discounts: Math.round(t.discounts * 100) / 100
    }));

    res.json({
      success: true,
      period,
      count: formattedTrend.length,
      data: formattedTrend
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Top-Selling Products Performance
// @route   GET /api/admin/analytics/top-products
// @access  Private/Admin
const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const dateMatch = buildDateMatchQuery(startDate, endDate);
    const orderMatch = { ...VALID_ORDER_MATCH, ...dateMatch };

    const topProducts = await Order.aggregate([
      { $match: orderMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          grossSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { unitsSold: -1 } },
      { $limit: Math.max(1, Number(limit)) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          unitsSold: 1,
          grossSales: { $round: ["$grossSales", 2] },
          orderCount: 1,
          category: { $arrayElemAt: ["$productDetails.category", 0] },
          image: { $arrayElemAt: ["$productDetails.image", 0] },
          stock: { $arrayElemAt: ["$productDetails.stock", 0] }
        }
      }
    ]);

    res.json({
      success: true,
      count: topProducts.length,
      data: topProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Category Performance Statistics
// @route   GET /api/admin/analytics/category-performance
// @access  Private/Admin
const getCategoryPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateMatch = buildDateMatchQuery(startDate, endDate);
    const orderMatch = { ...VALID_ORDER_MATCH, ...dateMatch };

    const categoryStats = await Order.aggregate([
      { $match: orderMatch },
      { $unwind: "$items" },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          items: 1,
          category: {
            $ifNull: [
              { $arrayElemAt: ["$productInfo.category", 0] },
              'unspecified'
            ]
          }
        }
      },
      {
        $group: {
          _id: "$category",
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    const formatted = categoryStats.map(c => ({
      category: c._id,
      unitsSold: c.unitsSold,
      revenue: Math.round(c.revenue * 100) / 100,
      orderCount: c.orderCount
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customer Registration & Repeat Buyer Analytics
// @route   GET /api/admin/analytics/customer-stats
// @access  Private/Admin
const getCustomerStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateMatch = buildDateMatchQuery(startDate, endDate);

    const totalCustomers = await User.countDocuments({ role: 'USER' });
    const newCustomers = await User.countDocuments({ role: 'USER', ...dateMatch });

    const customerOrderAgg = await Order.aggregate([
      { $match: VALID_ORDER_MATCH },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $add: [{ $subtract: ["$subtotal", "$discount"] }, "$shipping"] } }
        }
      }
    ]);

    const customersWithOrders = customerOrderAgg.length;
    const repeatCustomers = customerOrderAgg.filter(c => c.orderCount >= 2).length;

    res.json({
      success: true,
      data: {
        totalCustomers,
        newCustomers,
        customersWithOrders,
        repeatCustomers,
        repeatRate: customersWithOrders > 0 ? Math.round((repeatCustomers / customersWithOrders) * 100) / 100 : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Coupon Usage & Performance Statistics
// @route   GET /api/admin/analytics/coupon-stats
// @access  Private/Admin
const getCouponStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateMatch = buildDateMatchQuery(startDate, endDate);
    const orderMatch = {
      ...VALID_ORDER_MATCH,
      promoCode: { $exists: true, $ne: null, $ne: '' },
      ...dateMatch
    };

    const totalCoupons = await Coupon.countDocuments();

    const couponAgg = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: "$promoCode",
          usageCount: { $sum: 1 },
          totalDiscountAmount: { $sum: "$discount" },
          associatedRevenue: { $sum: { $add: [{ $subtract: ["$subtotal", "$discount"] }, "$shipping"] } }
        }
      },
      { $sort: { usageCount: -1 } }
    ]);

    const summary = couponAgg.reduce((acc, curr) => {
      acc.totalCouponOrders += curr.usageCount;
      acc.totalDiscountAmount += curr.totalDiscountAmount;
      acc.totalAssociatedRevenue += curr.associatedRevenue;
      return acc;
    }, { totalCouponOrders: 0, totalDiscountAmount: 0, totalAssociatedRevenue: 0 });

    const formattedCoupons = couponAgg.map(c => ({
      code: c._id,
      usageCount: c.usageCount,
      totalDiscountAmount: Math.round(c.totalDiscountAmount * 100) / 100,
      associatedRevenue: Math.round(c.associatedRevenue * 100) / 100
    }));

    res.json({
      success: true,
      data: {
        totalCoupons,
        summary: {
          totalCouponOrders: summary.totalCouponOrders,
          totalDiscountAmount: Math.round(summary.totalDiscountAmount * 100) / 100,
          totalAssociatedRevenue: Math.round(summary.totalAssociatedRevenue * 100) / 100
        },
        coupons: formattedCoupons
      },
      summary: {
        totalCoupons,
        totalCouponOrders: summary.totalCouponOrders,
        totalDiscountAmount: Math.round(summary.totalDiscountAmount * 100) / 100,
        totalAssociatedRevenue: Math.round(summary.totalAssociatedRevenue * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Returns & Refunds Statistics
// @route   GET /api/admin/analytics/returns-stats
// @access  Private/Admin
const getReturnsStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateMatch = buildDateMatchQuery(startDate, endDate);

    const returnsAgg = await ReturnRequest.aggregate([
      { $match: dateMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$status",
          requestCount: { $sum: 1 },
          returnedQuantity: { $sum: "$items.quantity" },
          refundAmount: { $sum: "$refund.amount" }
        }
      }
    ]);

    const totalRequests = await ReturnRequest.countDocuments(dateMatch);

    const completedRefunds = await ReturnRequest.aggregate([
      {
        $match: {
          $or: [{ 'refund.status': 'COMPLETED' }, { status: 'REFUNDED' }],
          ...dateMatch
        }
      },
      {
        $group: {
          _id: null,
          totalRefundAmount: { $sum: "$refund.amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRefundedData = completedRefunds[0] || { totalRefundAmount: 0, count: 0 };

    res.json({
      success: true,
      data: {
        totalReturnRequests: totalRequests,
        totalRefundAmount: Math.round(totalRefundedData.totalRefundAmount * 100) / 100,
        completedRefundCount: totalRefundedData.count,
        byStatus: returnsAgg.map(r => ({
          status: r._id,
          count: r.requestCount,
          returnedQuantity: r.returnedQuantity,
          refundAmount: Math.round(r.refundAmount * 100) / 100
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Inventory Statistics & Movement Summary
// @route   GET /api/admin/analytics/inventory-stats
// @access  Private/Admin
const getInventoryStats = async (req, res, next) => {
  try {
    const products = await Product.find({}).select('stock price status category');
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
    const inStockCount = products.filter(p => p.stock > LOW_STOCK_THRESHOLD).length;

    const transactionAgg = await InventoryTransaction.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalStock,
        totalUnits: totalStock,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        transactionsByType: transactionAgg.map(t => ({
          type: t._id,
          count: t.count,
          totalQuantity: t.totalQuantity
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Sales / Products / Orders CSV Reports
// @route   GET /api/admin/analytics/export
// @access  Private/Admin
const exportReport = async (req, res, next) => {
  try {
    const { type = 'sales', startDate, endDate } = req.query;

    if (!['sales', 'products', 'orders'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export type. Allowed types: sales, products, orders'
      });
    }

    const dateMatch = buildDateMatchQuery(undefined, startDate, endDate);

    if (type === 'products') {
      const topProducts = await Order.aggregate([
        { $match: { ...VALID_ORDER_MATCH, ...dateMatch } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            unitsSold: { $sum: "$items.quantity" },
            grossSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        }
      ]);

      let csv = 'Product ID,Product Name,Units Sold,Gross Sales\n';
      topProducts.forEach(p => {
        csv += `"${p._id}","${p.name.replace(/"/g, '""')}",${p.unitsSold},${Math.round(p.grossSales * 100) / 100}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=products_report_${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    if (type === 'orders') {
      const orderMatch = { ...VALID_ORDER_MATCH, ...dateMatch };
      const orders = await Order.find(orderMatch)
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

      let csv = 'Order ID,Customer,Total Amount,Status,Date\n';
      orders.forEach(o => {
        const dateStr = new Date(o.createdAt).toISOString();
        const customerName = o.user?.name ? o.user.name.replace(/"/g, '""') : 'Guest';
        const total = o.subtotal - o.discount + o.shipping;
        csv += `"${o._id}","${customerName}",${total},"${o.status}","${dateStr}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orders_report_${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    // Default: Sales Trend Report
    const orderMatch = { ...VALID_ORDER_MATCH, ...dateMatch };
    const salesAgg = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $add: [{ $subtract: ["$subtotal", "$discount"] }, "$shipping"] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    let csv = 'Date,Gross Revenue,Orders Count\n';
    salesAgg.forEach(s => {
      csv += `"${s._id}",${Math.round(s.revenue * 100) / 100},${s.orderCount}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getSalesTrend,
  getTopProducts,
  getCategoryPerformance,
  getCustomerStats,
  getCouponStats,
  getReturnsStats,
  getInventoryStats,
  exportReport
};

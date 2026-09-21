const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5001/api';

let adminToken = '';
let customerToken = '';
let adminUser = null;
let customerUser = null;

let passed = 0;
let failed = 0;

const logTest = (num, title, status, details = '') => {
  if (status) {
    passed++;
    console.log(`[Test ${String(num).padStart(2, '0')}] ✅ ${title}: PASS ${details ? `(${details})` : ''}`);
  } else {
    failed++;
    console.error(`[Test ${String(num).padStart(2, '0')}] ❌ ${title}: FAIL ${details ? `(${details})` : ''}`);
  }
};

async function setupTestData() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinetic_stride');
  }

  const User = require('./models/User');
  const Product = require('./models/Product');
  const Order = require('./models/Order');
  const Coupon = require('./models/Coupon');
  const ReturnRequest = require('./models/ReturnRequest');

  const timestamp = Date.now();

  // Register & Promote Admin
  const adminEmail = `analytics_admin_${timestamp}@example.com`;
  const adminPassword = 'AdminPassword123!';
  const adminReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Analytics Test Admin',
    email: adminEmail,
    password: adminPassword
  });
  adminUser = adminReg.data.user;
  await User.findByIdAndUpdate(adminUser.id || adminUser._id, { role: 'ADMIN' });

  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
    email: adminEmail,
    password: adminPassword
  });
  adminToken = adminLogin.data.token;

  // Register Customer
  const customerEmail = `analytics_cust_${timestamp}@example.com`;
  const customerPassword = 'CustomerPassword123!';
  const customerReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Analytics Test Customer',
    email: customerEmail,
    password: customerPassword
  });
  customerUser = customerReg.data.user;

  const customerLogin = await axios.post(`${API_URL}/auth/login`, {
    email: customerEmail,
    password: customerPassword
  });
  customerToken = customerLogin.data.token;

  // Seed sample product if needed
  let sampleProduct = await Product.findOne();
  if (!sampleProduct) {
    sampleProduct = await Product.create({
      name: 'Analytics Runner Shoe',
      description: 'A test shoe for analytics tests',
      price: 1500,
      category: 'Running',
      stock: 25,
      brand: 'Kinetic',
      images: ['https://example.com/shoe.jpg']
    });
  }

  // Seed sample order
  const orderId = `ORD_ANALYTICS_${timestamp}`;
  const sampleOrder = await Order.create({
    user: customerUser.id || customerUser._id,
    orderId: orderId,
    items: [
      {
        product: sampleProduct._id,
        name: sampleProduct.name,
        image: sampleProduct.images?.[0] || '',
        quantity: 2,
        price: sampleProduct.price,
        size: '10'
      }
    ],
    subtotal: sampleProduct.price * 2,
    discount: 100,
    shipping: 50,
    status: 'delivered',
    payment: {
      provider: 'RAZORPAY',
      razorpayOrderId: `order_${timestamp}`,
      razorpayPaymentId: `pay_${timestamp}`,
      status: 'PAID',
      amount: sampleProduct.price * 2 - 100 + 50,
      paidAt: new Date()
    },
    shippingAddress: {
      street: '127 Test St',
      city: 'Analytics City',
      state: 'Tech',
      zipCode: '123456',
      country: 'India',
      phone: '9876543210'
    }
  });

  return { sampleProduct, sampleOrder };
}

async function runTests() {
  console.log('==================================================');
  console.log('       ANALYTICS & REPORTS SYSTEM API TEST SUITE   ');
  console.log('==================================================\n');

  try {
    await setupTestData();
  } catch (err) {
    console.error('Setup failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
  const customerHeaders = { headers: { Authorization: `Bearer ${customerToken}` } };

  // Test 1: Reject request without token (401)
  try {
    await axios.get(`${API_URL}/admin/analytics/overview`);
    logTest(1, 'Reject Overview without Auth Token', false, 'Expected 401');
  } catch (err) {
    logTest(1, 'Reject Overview without Auth Token', err.response?.status === 401, `Received ${err.response?.status}`);
  }

  // Test 2: Reject non-admin request (403)
  try {
    await axios.get(`${API_URL}/admin/analytics/overview`, customerHeaders);
    logTest(2, 'Reject Non-Admin Request (Customer User)', false, 'Expected 403');
  } catch (err) {
    logTest(2, 'Reject Non-Admin Request (Customer User)', err.response?.status === 403, `Received ${err.response?.status}`);
  }

  // Test 3: Get Overview Statistics (Admin)
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview`, adminHeaders);
    const valid = res.data.success && typeof res.data.data.totalRevenue === 'number' && typeof res.data.data.totalOrders === 'number';
    logTest(3, 'Get Overview Statistics', valid, `Revenue: ₹${res.data.data?.totalRevenue}, Orders: ${res.data.data?.totalOrders}`);
  } catch (err) {
    logTest(3, 'Get Overview Statistics', false, err.response?.data?.message || err.message);
  }

  // Test 4: Overview with Date Preset 'today'
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview?dateRange=today`, adminHeaders);
    logTest(4, 'Overview with Date Preset (today)', res.data.success && res.data.data.period === 'today');
  } catch (err) {
    logTest(4, 'Overview with Date Preset (today)', false, err.message);
  }

  // Test 5: Overview with Date Preset '7d'
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview?dateRange=7d`, adminHeaders);
    logTest(5, 'Overview with Date Preset (7d)', res.data.success && res.data.data.period === '7d');
  } catch (err) {
    logTest(5, 'Overview with Date Preset (7d)', false, err.message);
  }

  // Test 6: Overview with Date Preset '30d'
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview?dateRange=30d`, adminHeaders);
    logTest(6, 'Overview with Date Preset (30d)', res.data.success && res.data.data.period === '30d');
  } catch (err) {
    logTest(6, 'Overview with Date Preset (30d)', false, err.message);
  }

  // Test 7: Overview with Date Preset 'this_month'
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview?dateRange=this_month`, adminHeaders);
    logTest(7, 'Overview with Date Preset (this_month)', res.data.success && res.data.data.period === 'this_month');
  } catch (err) {
    logTest(7, 'Overview with Date Preset (this_month)', false, err.message);
  }

  // Test 8: Overview with Date Preset 'last_month'
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview?dateRange=last_month`, adminHeaders);
    logTest(8, 'Overview with Date Preset (last_month)', res.data.success && res.data.data.period === 'last_month');
  } catch (err) {
    logTest(8, 'Overview with Date Preset (last_month)', false, err.message);
  }

  // Test 9: Overview with Custom Date Range
  try {
    const startDate = '2026-01-01';
    const endDate = '2026-12-31';
    const res = await axios.get(`${API_URL}/admin/analytics/overview?dateRange=custom&startDate=${startDate}&endDate=${endDate}`, adminHeaders);
    logTest(9, 'Overview with Custom Date Range', res.data.success && res.data.data.period === 'custom');
  } catch (err) {
    logTest(9, 'Overview with Custom Date Range', false, err.message);
  }

  // Test 10: Sales Trend (Daily Interval)
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/sales-trend?interval=daily`, adminHeaders);
    const isArr = res.data.success && Array.isArray(res.data.data);
    logTest(10, 'Sales Trend API (Daily Interval)', isArr, `Data items: ${res.data.data?.length}`);
  } catch (err) {
    logTest(10, 'Sales Trend API (Daily Interval)', false, err.message);
  }

  // Test 11: Sales Trend (Weekly Interval)
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/sales-trend?interval=weekly`, adminHeaders);
    const isArr = res.data.success && Array.isArray(res.data.data);
    logTest(11, 'Sales Trend API (Weekly Interval)', isArr);
  } catch (err) {
    logTest(11, 'Sales Trend API (Weekly Interval)', false, err.message);
  }

  // Test 12: Sales Trend (Monthly Interval)
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/sales-trend?interval=monthly`, adminHeaders);
    const isArr = res.data.success && Array.isArray(res.data.data);
    logTest(12, 'Sales Trend API (Monthly Interval)', isArr);
  } catch (err) {
    logTest(12, 'Sales Trend API (Monthly Interval)', false, err.message);
  }

  // Test 13: Top Products Ranking API
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/top-products?limit=5`, adminHeaders);
    const isArr = res.data.success && Array.isArray(res.data.data);
    logTest(13, 'Top Products Ranking API', isArr, `Top products returned: ${res.data.data?.length}`);
  } catch (err) {
    logTest(13, 'Top Products Ranking API', false, err.message);
  }

  // Test 14: Category Performance breakdown API
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/category-performance`, adminHeaders);
    const isArr = res.data.success && Array.isArray(res.data.data);
    logTest(14, 'Category Performance API', isArr, `Categories returned: ${res.data.data?.length}`);
  } catch (err) {
    logTest(14, 'Category Performance API', false, err.message);
  }

  // Test 15: Customer Statistics API
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/customer-stats`, adminHeaders);
    const valid = res.data.success && typeof res.data.data.totalCustomers === 'number';
    logTest(15, 'Customer Statistics API', valid, `Total Customers: ${res.data.data?.totalCustomers}`);
  } catch (err) {
    logTest(15, 'Customer Statistics API', false, err.message);
  }

  // Test 16: Coupon Usage Statistics API
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/coupon-stats`, adminHeaders);
    const valid = res.data.success && typeof res.data.data.totalCoupons === 'number';
    logTest(16, 'Coupon Usage Statistics API', valid, `Total Coupons: ${res.data.data?.totalCoupons}`);
  } catch (err) {
    logTest(16, 'Coupon Usage Statistics API', false, err.message);
  }

  // Test 17: Returns & Refunds Statistics API
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/returns-stats`, adminHeaders);
    const valid = res.data.success && typeof res.data.data.totalReturnRequests === 'number';
    logTest(17, 'Returns & Refunds Statistics API', valid, `Total Return Requests: ${res.data.data?.totalReturnRequests}`);
  } catch (err) {
    logTest(17, 'Returns & Refunds Statistics API', false, err.message);
  }

  // Test 18: Inventory Statistics API
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/inventory-stats`, adminHeaders);
    const valid = res.data.success && typeof res.data.data.totalProducts === 'number';
    logTest(18, 'Inventory Statistics API', valid, `In Stock: ${res.data.data?.inStockCount}, Out of Stock: ${res.data.data?.outOfStockCount}`);
  } catch (err) {
    logTest(18, 'Inventory Statistics API', false, err.message);
  }

  // Test 19: Export CSV Sales Report
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/export?type=sales`, adminHeaders);
    const isCsv = typeof res.data === 'string' && res.data.includes('Date,Gross Revenue,Orders Count');
    logTest(19, 'Export CSV Sales Report', isCsv);
  } catch (err) {
    logTest(19, 'Export CSV Sales Report', false, err.message);
  }

  // Test 20: Export CSV Products Report
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/export?type=products`, adminHeaders);
    const isCsv = typeof res.data === 'string' && res.data.includes('Product ID,Product Name,Units Sold');
    logTest(20, 'Export CSV Products Report', isCsv);
  } catch (err) {
    logTest(20, 'Export CSV Products Report', false, err.message);
  }

  // Test 21: Export CSV Orders Report
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/export?type=orders`, adminHeaders);
    const isCsv = typeof res.data === 'string' && res.data.includes('Order ID,Customer,Total Amount');
    logTest(21, 'Export CSV Orders Report', isCsv);
  } catch (err) {
    logTest(21, 'Export CSV Orders Report', false, err.message);
  }

  // Test 22: Export Report Invalid Type Error Handling
  try {
    await axios.get(`${API_URL}/admin/analytics/export?type=invalid_type`, adminHeaders);
    logTest(22, 'Export Report Error Handling (Invalid Type)', false, 'Expected 400 error');
  } catch (err) {
    logTest(22, 'Export Report Error Handling (Invalid Type)', err.response?.status === 400, `Received status ${err.response?.status}`);
  }

  // Test 23: Future Date Filter Handling (Zero results gracefully returned)
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview?dateRange=custom&startDate=2099-01-01&endDate=2099-12-31`, adminHeaders);
    const valid = res.data.success && res.data.data.totalOrders === 0 && res.data.data.totalRevenue === 0;
    logTest(23, 'Future Date Filter Returns Zero Totals Gracefully', valid);
  } catch (err) {
    logTest(23, 'Future Date Filter Returns Zero Totals Gracefully', false, err.message);
  }

  // Test 24: Revenue calculation structure checks
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/overview`, adminHeaders);
    const d = res.data.data;
    const structureValid = 'totalRevenue' in d && 'totalOrders' in d && 'deliveredOrders' in d && 'cancelledOrders' in d && 'averageOrderValue' in d && 'totalRefundsAmount' in d && 'netRevenue' in d;
    logTest(24, 'Overview API Payload Schema Completeness', structureValid);
  } catch (err) {
    logTest(24, 'Overview API Payload Schema Completeness', false, err.message);
  }

  // Test 25: Inventory threshold calculation verification
  try {
    const res = await axios.get(`${API_URL}/admin/analytics/inventory-stats`, adminHeaders);
    const d = res.data.data;
    const valid = typeof d.totalProducts === 'number' && typeof d.totalUnits === 'number' && typeof d.outOfStockCount === 'number' && typeof d.lowStockCount === 'number';
    logTest(25, 'Inventory Stats Schema Completeness', valid);
  } catch (err) {
    logTest(25, 'Inventory Stats Schema Completeness', false, err.message);
  }

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('==================================================\n');

  mongoose.connection.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

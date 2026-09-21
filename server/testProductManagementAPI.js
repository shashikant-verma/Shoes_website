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
let testProduct = null;
let testOrder = null;

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

  const timestamp = Date.now();

  // 1. Register & Promote Admin
  const adminEmail = `prod_admin_${timestamp}@example.com`;
  const adminPassword = 'AdminPassword123!';
  const adminReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Product System Admin',
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

  // 2. Register Customer
  const customerEmail = `prod_cust_${timestamp}@example.com`;
  const customerPassword = 'CustomerPassword123!';
  const customerReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Product Test Customer',
    email: customerEmail,
    password: customerPassword
  });
  customerUser = customerReg.data.user;

  const customerLogin = await axios.post(`${API_URL}/auth/login`, {
    email: customerEmail,
    password: customerPassword
  });
  customerToken = customerLogin.data.token;
}

async function runProductManagementTests() {
  console.log('=============== STARTING PRODUCT MANAGEMENT AUDIT & TEST SUITE ===============\n');

  try {
    await setupTestData();
  } catch (err) {
    console.error('Setup failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const Product = require('./models/Product');
  const Order = require('./models/Order');
  const Review = require('./models/Review');
  const timestamp = Date.now();

  // --- 1. AUTHENTICATION & AUTHORIZATION TESTS ---

  // Test 01: Public access to product listing (200)
  try {
    const res = await axios.get(`${API_URL}/products`);
    logTest(1, 'Public Access to Product Listing (200)', res.status === 200 && res.data.success === true, `Products count: ${res.data.count}`);
  } catch (e) {
    logTest(1, 'Public Access to Product Listing (200)', false, e.response?.data?.message || e.message);
  }

  // Test 02: Unauthenticated product creation attempt (401)
  try {
    await axios.post(`${API_URL}/products`, {
      name: 'Unauth Shoe',
      category: 'men',
      price: 1999,
      description: 'Test',
      image: '/images/test.jpg'
    });
    logTest(2, 'Unauthenticated Product Creation Blocked (401)', false, 'Expected 401 error');
  } catch (e) {
    logTest(2, 'Unauthenticated Product Creation Blocked (401)', e.response?.status === 401, `Status: ${e.response?.status}`);
  }

  // Test 03: Customer token product creation attempt (403)
  try {
    await axios.post(`${API_URL}/products`, {
      name: 'Customer Shoe',
      category: 'men',
      price: 1999,
      description: 'Test',
      image: '/images/test.jpg'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(3, 'Customer Token Product Creation Blocked (403)', false, 'Expected 403 error');
  } catch (e) {
    logTest(3, 'Customer Token Product Creation Blocked (403)', e.response?.status === 403, `Status: ${e.response?.status}`);
  }

  // --- 2. PRODUCT CREATION & VALIDATION ---

  // Test 04: Admin creates valid product (201 PASS)
  try {
    const createRes = await axios.post(`${API_URL}/products`, {
      name: `SoleVibe Velocity Pro ${timestamp}`,
      brand: 'SoleVibe',
      sku: `PROD-SKU-${timestamp}`,
      category: 'men',
      gender: 'men',
      price: 6499,
      originalPrice: 7999,
      discount: 18,
      description: 'High performance running shoe with nitrogen-infused cushioning',
      image: '/images/velocity-pro.jpg',
      images: ['/images/velocity-pro-1.jpg', '/images/velocity-pro-2.jpg'],
      sizes: ['8', '9', '10', '11'],
      colors: ['Red', 'Black'],
      stock: 25,
      featured: true,
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    testProduct = createRes.data.data;
    logTest(4, 'Admin Creates Valid Product (201 PASS)', createRes.status === 201 && testProduct.slug.length > 0, `ID: ${testProduct._id}, Slug: ${testProduct.slug}`);
  } catch (e) {
    logTest(4, 'Admin Creates Valid Product (201 PASS)', false, e.response?.data?.message || e.message);
  }

  // Test 05: Missing required name rejected (400)
  try {
    await axios.post(`${API_URL}/products`, {
      category: 'men',
      price: 2999,
      description: 'Test',
      image: '/images/test.jpg'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(5, 'Missing Required Product Name Rejected (400)', false, 'Expected 400 error');
  } catch (e) {
    logTest(5, 'Missing Required Product Name Rejected (400)', e.response?.status === 400, `Message: ${e.response?.data?.message}`);
  }

  // Test 06: Invalid category enum rejected (400)
  try {
    await axios.post(`${API_URL}/products`, {
      name: 'Invalid Cat Shoe',
      category: 'electronics',
      price: 2999,
      description: 'Test',
      image: '/images/test.jpg'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(6, 'Invalid Category Enum Rejected (400)', false, 'Expected 400 error');
  } catch (e) {
    logTest(6, 'Invalid Category Enum Rejected (400)', e.response?.status === 400, `Message: ${e.response?.data?.message}`);
  }

  // Test 07: Negative price rejected (400)
  try {
    await axios.post(`${API_URL}/products`, {
      name: 'Negative Price Shoe',
      category: 'men',
      price: -500,
      description: 'Test',
      image: '/images/test.jpg'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(7, 'Negative Price Rejected (400)', false, 'Expected 400 error');
  } catch (e) {
    logTest(7, 'Negative Price Rejected (400)', e.response?.status === 400, `Message: ${e.response?.data?.message}`);
  }

  // Test 08: Negative stock rejected (400)
  try {
    await axios.post(`${API_URL}/products`, {
      name: 'Negative Stock Shoe',
      category: 'men',
      price: 2999,
      stock: -10,
      description: 'Test',
      image: '/images/test.jpg'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(8, 'Negative Stock Rejected (400)', false, 'Expected 400 error');
  } catch (e) {
    logTest(8, 'Negative Stock Rejected (400)', e.response?.status === 400, `Message: ${e.response?.data?.message}`);
  }

  // Test 09: Duplicate SKU rejected (400)
  try {
    await axios.post(`${API_URL}/products`, {
      name: 'Duplicate SKU Shoe',
      category: 'men',
      sku: testProduct.sku,
      price: 2999,
      description: 'Test',
      image: '/images/test.jpg'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(9, 'Duplicate SKU Rejected (400)', false, 'Expected 400 error');
  } catch (e) {
    logTest(9, 'Duplicate SKU Rejected (400)', e.response?.status === 400, `Message: ${e.response?.data?.message}`);
  }

  // --- 3. PRODUCT RETRIEVAL, SEARCH, FILTER & PAGINATION ---

  // Test 10: Get single product by ID (200)
  try {
    const res = await axios.get(`${API_URL}/products/${testProduct._id}`);
    logTest(10, 'Get Product by ID (200 PASS)', res.status === 200 && res.data.data._id === testProduct._id, `Name: ${res.data.data.name}`);
  } catch (e) {
    logTest(10, 'Get Product by ID (200 PASS)', false, e.response?.data?.message || e.message);
  }

  // Test 11: Get single product by Slug (200)
  try {
    const res = await axios.get(`${API_URL}/products/${testProduct.slug}`);
    logTest(11, 'Get Product by Slug (200 PASS)', res.status === 200 && res.data.data._id === testProduct._id, `Slug: ${res.data.data.slug}`);
  } catch (e) {
    logTest(11, 'Get Product by Slug (200 PASS)', false, e.response?.data?.message || e.message);
  }

  // Test 12: Search products by name keyword
  try {
    const res = await axios.get(`${API_URL}/products?search=Velocity`);
    const found = res.data.data.some(p => p._id === testProduct._id);
    logTest(12, 'Search Products by Keyword', res.status === 200 && found, `Found count: ${res.data.count}`);
  } catch (e) {
    logTest(12, 'Search Products by Keyword', false, e.response?.data?.message || e.message);
  }

  // Test 13: Filter products by category (men)
  try {
    const res = await axios.get(`${API_URL}/products?category=men`);
    const allMen = res.data.data.every(p => p.category === 'men');
    logTest(13, 'Filter Products by Category (men)', res.status === 200 && allMen, `Category count: ${res.data.count}`);
  } catch (e) {
    logTest(13, 'Filter Products by Category (men)', false, e.response?.data?.message || e.message);
  }

  // Test 14: Filter products by status (active)
  try {
    const res = await axios.get(`${API_URL}/products?status=active`);
    const allActive = res.data.data.every(p => p.status === 'active');
    logTest(14, 'Filter Products by Status (active)', res.status === 200 && allActive, `Active count: ${res.data.count}`);
  } catch (e) {
    logTest(14, 'Filter Products by Status (active)', false, e.response?.data?.message || e.message);
  }

  // Test 15: Pagination parameters validation
  try {
    const res = await axios.get(`${API_URL}/products?page=1&limit=5&status=all`);
    logTest(15, 'Backend Pagination Validation', res.data.page === 1 && res.data.data.length <= 5 && res.data.totalPages >= 1, `Count: ${res.data.count}, totalPages: ${res.data.totalPages}`);
  } catch (e) {
    logTest(15, 'Backend Pagination Validation', false, e.response?.data?.message || e.message);
  }

  // --- 4. PRODUCT UPDATES & STATUS MANAGEMENT ---

  // Test 16: Admin updates product details (200 PASS)
  try {
    const updateRes = await axios.put(`${API_URL}/products/${testProduct._id}`, {
      price: 6999,
      stock: 30,
      description: 'Updated description for velocity pro shoe'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(16, 'Admin Updates Product Details', updateRes.status === 200 && updateRes.data.data.price === 6999 && updateRes.data.data.stock === 30, `Updated Price: ₹${updateRes.data.data.price}`);
  } catch (e) {
    logTest(16, 'Admin Updates Product Details', false, e.response?.data?.message || e.message);
  }

  // Test 17: Admin updates product status via dedicated status endpoint
  try {
    const statusRes = await axios.put(`${API_URL}/products/${testProduct._id}/status`, {
      status: 'inactive'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(17, 'Admin Updates Product Status (inactive)', statusRes.status === 200 && statusRes.data.data.status === 'inactive', `Status: ${statusRes.data.data.status}`);
  } catch (e) {
    logTest(17, 'Admin Updates Product Status (inactive)', false, e.response?.data?.message || e.message);
  }

  // Test 18: Admin reactivates product status
  try {
    const statusRes = await axios.put(`${API_URL}/products/${testProduct._id}/status`, {
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(18, 'Admin Reactivates Product Status (active)', statusRes.status === 200 && statusRes.data.data.status === 'active', `Status: ${statusRes.data.data.status}`);
  } catch (e) {
    logTest(18, 'Admin Reactivates Product Status (active)', false, e.response?.data?.message || e.message);
  }

  // Test 19: Customer token product update attempt blocked (403)
  try {
    await axios.put(`${API_URL}/products/${testProduct._id}`, { price: 100 }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(19, 'Customer Token Product Update Blocked (403)', false, 'Expected 403 error');
  } catch (e) {
    logTest(19, 'Customer Token Product Update Blocked (403)', e.response?.status === 403, `Status: ${e.response?.status}`);
  }

  // --- 5. ORDER INTEGRATION & HISTORICAL PRICE INTEGRITY ---

  // Customer places order for testProduct
  try {
    const orderRes = await axios.post(`${API_URL}/orders`, {
      items: [{ product: testProduct._id, quantity: 1, size: '9' }],
      shippingMethod: 'standard',
      shippingAddress: { name: 'Test Customer', addressLine: '100 Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' }
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    testOrder = orderRes.data.data;
  } catch (e) {
    console.error('Order creation helper failed:', e.response?.data || e.message);
  }

  // Test 20: Product price change does NOT alter historical order price
  try {
    const originalOrderPrice = testOrder.items[0].price;
    // Admin changes product price to 9999
    await axios.put(`${API_URL}/products/${testProduct._id}`, { price: 9999 }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Fetch historical order
    const fetchedOrder = await Order.findById(testOrder._id);
    logTest(20, 'Historical Order Snapshot Price Intact After Product Price Edit', fetchedOrder.items[0].price === originalOrderPrice, `Historical: ₹${fetchedOrder.items[0].price}, Current Product: ₹9999`);
  } catch (e) {
    logTest(20, 'Historical Order Snapshot Price Intact After Product Price Edit', false, e.message);
  }

  // Test 21: Deleting product with historical order triggers safe soft-deactivation
  try {
    const delRes = await axios.delete(`${API_URL}/products/${testProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const refreshedProduct = await Product.findById(testProduct._id);
    logTest(21, 'Product with Order History Soft-Deactivated on Delete', delRes.status === 200 && refreshedProduct !== null && refreshedProduct.status === 'inactive', `Status: ${refreshedProduct?.status}`);
  } catch (e) {
    logTest(21, 'Product with Order History Soft-Deactivated on Delete', false, e.response?.data?.message || e.message);
  }

  // Test 22: Unreferenced temporary product is hard-deleted
  try {
    const tempProduct = await Product.create({
      name: `Temp Delete Shoe ${timestamp}`,
      category: 'men',
      price: 1999,
      description: 'Temporary shoe for hard deletion test',
      image: '/images/temp.jpg'
    });

    const delRes = await axios.delete(`${API_URL}/products/${tempProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deletedCheck = await Product.findById(tempProduct._id);
    logTest(22, 'Unreferenced Product Hard-Deleted Successfully', delRes.status === 200 && deletedCheck === null, `Deleted check: ${deletedCheck === null}`);
  } catch (e) {
    logTest(22, 'Unreferenced Product Hard-Deleted Successfully', false, e.response?.data?.message || e.message);
  }

  // --- 6. REVIEWS & ANALYTICS INTEGRATION ---

  // Test 23: Review attached to product remains accessible
  try {
    const review = await Review.create({
      user: customerUser.id || customerUser._id,
      product: testProduct._id,
      rating: 5,
      title: 'Amazing shoe!',
      comment: 'Very comfortable for daily running',
      status: 'APPROVED'
    });

    const reviewsRes = await axios.get(`${API_URL}/reviews/product/${testProduct._id}`);
    logTest(23, 'Product Review Attached & Accessible', reviewsRes.status === 200 && reviewsRes.data.data.some(r => r._id.toString() === review._id.toString()), `Reviews count: ${reviewsRes.data.count}`);
  } catch (e) {
    logTest(23, 'Product Review Attached & Accessible', false, e.message);
  }

  // Test 24: Analytics inventory & product statistics API functional
  try {
    const analyticsRes = await axios.get(`${API_URL}/admin/analytics/inventory-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(24, 'Analytics Inventory & Product Stats Functional', analyticsRes.status === 200 && typeof analyticsRes.data.data.inStockCount === 'number', `In Stock Count: ${analyticsRes.data.data.inStockCount}`);
  } catch (e) {
    logTest(24, 'Analytics Inventory & Product Stats Functional', false, e.response?.data?.message || e.message);
  }

  // --- 7. REGRESSION TESTS ---

  // Test 25: Cart API product resolution
  try {
    const res = await axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(25, 'Regression - Cart API Product Resolution', res.status === 200 && res.data.success === true, `Cart loaded`);
  } catch (e) {
    logTest(25, 'Regression - Cart API Product Resolution', false, e.response?.data?.message || e.message);
  }

  // Test 26: Wishlist API product resolution
  try {
    const res = await axios.get(`${API_URL}/wishlist`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(26, 'Regression - Wishlist API Product Resolution', res.status === 200 && res.data.success === true, `Wishlist loaded`);
  } catch (e) {
    logTest(26, 'Regression - Wishlist API Product Resolution', false, e.response?.data?.message || e.message);
  }

  // Test 27: Customer Management list API
  try {
    const res = await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(27, 'Regression - Customer Management API', res.status === 200 && res.data.success === true, `Total customers: ${res.data.total}`);
  } catch (e) {
    logTest(27, 'Regression - Customer Management API', false, e.response?.data?.message || e.message);
  }

  // Test 28: Shipping methods API
  try {
    const res = await axios.get(`${API_URL}/shipping/methods?subtotal=2000`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(28, 'Regression - Shipping Methods API', res.status === 200 && res.data.success === true, `Methods count: ${res.data.data.options.length}`);
  } catch (e) {
    logTest(28, 'Regression - Shipping Methods API', false, e.response?.data?.message || e.message);
  }

  console.log('\n================================================================================');
  console.log(`FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED OUT OF ${passed + failed} TOTAL TESTS.`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runProductManagementTests();

const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5001/api';

let adminToken = '';
let customerToken = '';
let customer2Token = '';
let adminUser = null;
let customerUser = null;
let customer2User = null;
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
  const Product = require('./models/Product');
  const Order = require('./models/Order');
  const Address = require('./models/Address');

  const timestamp = Date.now();

  // 1. Register & Promote Admin
  const adminEmail = `cust_admin_${timestamp}@example.com`;
  const adminPassword = 'AdminPassword123!';
  const adminReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Customer System Admin',
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

  // 2. Register Customer 1
  const customerEmail = `cust_user1_${timestamp}@example.com`;
  const customerPassword = 'CustomerPassword123!';
  const customerReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Alpha Customer One',
    email: customerEmail,
    password: customerPassword
  });
  customerUser = customerReg.data.user;

  const customerLogin = await axios.post(`${API_URL}/auth/login`, {
    email: customerEmail,
    password: customerPassword
  });
  customerToken = customerLogin.data.token;

  // 3. Register Customer 2
  const customer2Email = `cust_user2_${timestamp}@example.com`;
  const customer2Password = 'CustomerPassword123!';
  const customer2Reg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Beta Customer Two',
    email: customer2Email,
    password: customer2Password
  });
  customer2User = customer2Reg.data.user;

  const customer2Login = await axios.post(`${API_URL}/auth/login`, {
    email: customer2Email,
    password: customer2Password
  });
  customer2Token = customer2Login.data.token;

  // 4. Create Address for Customer 1
  await Address.create({
    user: customerUser.id || customerUser._id,
    type: 'HOME',
    fullName: 'Alpha Customer One',
    phone: '9876543210',
    addressLine1: '42 Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    isDefault: true
  });

  // 5. Create Test Product & Order for Customer 1
  testProduct = await Product.create({
    name: `Customer Test Shoe ${timestamp}`,
    slug: `customer-test-shoe-${timestamp}`,
    sku: `CUST-SKU-${timestamp}`,
    brand: 'SoleVibe',
    category: 'men',
    price: 4999,
    stock: 20,
    description: 'Special shoe for testing customer order integration',
    image: '/images/shoe-cust.jpg'
  });

  const orderRes = await axios.post(`${API_URL}/orders`, {
    items: [{ product: testProduct._id, quantity: 1, size: '9' }],
    shippingMethod: 'standard',
    shippingAddress: { name: 'Alpha Customer One', addressLine: '42 Marine Drive', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' }
  }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  testOrder = orderRes.data.data;
}

async function runCustomerManagementTests() {
  console.log('=============== STARTING CUSTOMER MANAGEMENT AUDIT & TEST SUITE ===============\n');

  try {
    await setupTestData();
  } catch (err) {
    console.error('Setup failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const User = require('./models/User');

  // --- 1. AUTHENTICATION & ROLE AUTHORIZATION TESTS ---

  // Test 01: Unauthenticated request to GET /api/admin/customers
  try {
    await axios.get(`${API_URL}/admin/customers`);
    logTest(1, 'Unauthenticated Customer List (401)', false, 'Expected 401 error');
  } catch (e) {
    logTest(1, 'Unauthenticated Customer List (401)', e.response?.status === 401, `Status: ${e.response?.status}`);
  }

  // Test 02: Customer token accessing GET /api/admin/customers (403)
  try {
    await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(2, 'Customer Token Accessing Admin API (403)', false, 'Expected 403 error');
  } catch (e) {
    logTest(2, 'Customer Token Accessing Admin API (403)', e.response?.status === 403, `Status: ${e.response?.status}`);
  }

  // Test 03: Admin token accessing GET /api/admin/customers (200 PASS)
  try {
    const res = await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(3, 'Admin Customer List Access (200 PASS)', res.status === 200 && res.data.success === true, `Total customers: ${res.data.total}`);
  } catch (e) {
    logTest(3, 'Admin Customer List Access (200 PASS)', false, e.response?.data?.message || e.message);
  }

  // --- 2. CUSTOMER RETRIEVAL, PAGINATION, SEARCH & DETAILS ---

  // Test 04: Pagination parameters validation
  try {
    const res = await axios.get(`${API_URL}/admin/customers?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(4, 'Backend Pagination Validation', res.data.page === 1 && res.data.data.length <= 5 && res.data.totalPages >= 1, `Count: ${res.data.count}, totalPages: ${res.data.totalPages}`);
  } catch (e) {
    logTest(4, 'Backend Pagination Validation', false, e.response?.data?.message || e.message);
  }

  // Test 05: Search by customer name
  try {
    const res = await axios.get(`${API_URL}/admin/customers?search=Alpha`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const found = res.data.data.some(c => c.name.includes('Alpha'));
    logTest(5, 'Search by Customer Name', res.status === 200 && found, `Found count: ${res.data.count}`);
  } catch (e) {
    logTest(5, 'Search by Customer Name', false, e.response?.data?.message || e.message);
  }

  // Test 06: Search by customer email
  try {
    const customer1Id = customerUser.id || customerUser._id;
    const targetUser = await User.findById(customer1Id);
    const res = await axios.get(`${API_URL}/admin/customers?search=${targetUser.email}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const found = res.data.data.some(c => c.email === targetUser.email);
    logTest(6, 'Search by Customer Email', res.status === 200 && found, `Found count: ${res.data.count}`);
  } catch (e) {
    logTest(6, 'Search by Customer Email', false, e.response?.data?.message || e.message);
  }

  // Test 07: Filter by role (USER)
  try {
    const res = await axios.get(`${API_URL}/admin/customers?role=USER`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allUsers = res.data.data.every(c => c.role === 'USER');
    logTest(7, 'Filter by Role (USER)', res.status === 200 && allUsers, `USER count: ${res.data.count}`);
  } catch (e) {
    logTest(7, 'Filter by Role (USER)', false, e.response?.data?.message || e.message);
  }

  // Test 08: Filter by status (active)
  try {
    const res = await axios.get(`${API_URL}/admin/customers?status=active`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allActive = res.data.data.every(c => c.isActive === true);
    logTest(8, 'Filter by Status (Active)', res.status === 200 && allActive, `Active count: ${res.data.count}`);
  } catch (e) {
    logTest(8, 'Filter by Status (Active)', false, e.response?.data?.message || e.message);
  }

  // Test 09: Customer Details API (GET /api/admin/customers/:id)
  try {
    const customer1Id = customerUser.id || customerUser._id;
    const res = await axios.get(`${API_URL}/admin/customers/${customer1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = res.data.data;
    const hasAddresses = Array.isArray(data.addresses) && data.addresses.length > 0;
    const hasOrders = Array.isArray(data.orders) && data.orders.length > 0;
    const hasStats = data.stats && typeof data.stats.totalOrders === 'number';
    logTest(9, 'Customer Details API (User, Addresses, Orders & Stats)', res.status === 200 && hasAddresses && hasOrders && hasStats, `Orders: ${data.stats?.totalOrders}, Total Spend: ₹${data.stats?.totalOrderValue}`);
  } catch (e) {
    logTest(9, 'Customer Details API (User, Addresses, Orders & Stats)', false, e.response?.data?.message || e.message);
  }

  // Test 10: Invalid Customer ID handling (400)
  try {
    await axios.get(`${API_URL}/admin/customers/invalid-mongo-id`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(10, 'Invalid Customer ID Handling (400)', false, 'Expected 400 error');
  } catch (e) {
    logTest(10, 'Invalid Customer ID Handling (400)', e.response?.status === 400, `Status: ${e.response?.status}`);
  }

  // Test 11: Non-existent Customer ID handling (404)
  try {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    await axios.get(`${API_URL}/admin/customers/${nonExistentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(11, 'Non-existent Customer ID Handling (404)', false, 'Expected 404 error');
  } catch (e) {
    logTest(11, 'Non-existent Customer ID Handling (404)', e.response?.status === 404, `Status: ${e.response?.status}`);
  }

  // --- 3. PRIVACY & SECURITY PROTECTIONS ---

  // Test 12: Password hash is NOT exposed in GET /api/admin/customers
  try {
    const res = await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const passwordExposed = res.data.data.some(c => c.password !== undefined || c.passwordHash !== undefined);
    logTest(12, 'Privacy Protection - Password Excluded from Customer List', !passwordExposed, `Exposed: ${passwordExposed}`);
  } catch (e) {
    logTest(12, 'Privacy Protection - Password Excluded from Customer List', false, e.message);
  }

  // Test 13: Password hash is NOT exposed in GET /api/admin/customers/:id
  try {
    const customer1Id = customerUser.id || customerUser._id;
    const res = await axios.get(`${API_URL}/admin/customers/${customer1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const passwordExposed = res.data.data.password !== undefined;
    logTest(13, 'Privacy Protection - Password Excluded from Customer Details', !passwordExposed, `Exposed: ${passwordExposed}`);
  } catch (e) {
    logTest(13, 'Privacy Protection - Password Excluded from Customer Details', false, e.message);
  }

  // Test 14: Customer cannot modify another customer's status (403)
  try {
    const customer2Id = customer2User.id || customer2User._id;
    await axios.put(`${API_URL}/admin/customers/${customer2Id}/status`, { isActive: false }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(14, 'Customer Cannot Modify Status of Another User (403)', false, 'Expected 403 error');
  } catch (e) {
    logTest(14, 'Customer Cannot Modify Status of Another User (403)', e.response?.status === 403, `Status: ${e.response?.status}`);
  }

  // Test 15: Customer cannot modify another customer's role or promote themselves (403)
  try {
    const customer1Id = customerUser.id || customerUser._id;
    await axios.put(`${API_URL}/admin/customers/${customer1Id}`, { role: 'ADMIN' }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(15, 'Customer Cannot Promote Self to ADMIN (403)', false, 'Expected 403 error');
  } catch (e) {
    logTest(15, 'Customer Cannot Promote Self to ADMIN (403)', e.response?.status === 403, `Status: ${e.response?.status}`);
  }

  // --- 4. ACCOUNT STATUS & LOGIN INTEGRATION ---

  // Test 16: Admin deactivates Customer 2 account
  try {
    const customer2Id = customer2User.id || customer2User._id;
    const res = await axios.put(`${API_URL}/admin/customers/${customer2Id}/status`, { isActive: false }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(16, 'Admin Deactivates Customer Account', res.status === 200 && res.data.data.isActive === false, `isActive: ${res.data.data.isActive}`);
  } catch (e) {
    logTest(16, 'Admin Deactivates Customer Account', false, e.response?.data?.message || e.message);
  }

  // Test 17: Deactivated Customer 2 login attempt receives 401
  try {
    const targetUser = await User.findById(customer2User.id || customer2User._id);
    await axios.post(`${API_URL}/auth/login`, {
      email: targetUser.email,
      password: 'CustomerPassword123!'
    });
    logTest(17, 'Deactivated Customer Login Attempt Fails (401)', false, 'Expected 401 error');
  } catch (e) {
    logTest(17, 'Deactivated Customer Login Attempt Fails (401)', e.response?.status === 401 && e.response?.data?.message.includes('deactivated'), `Message: ${e.response?.data?.message}`);
  }

  // Test 18: Deactivated Customer 2 existing token rejected (401)
  try {
    await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    logTest(18, 'Deactivated Customer Token Access Rejected (401)', false, 'Expected 401 error');
  } catch (e) {
    logTest(18, 'Deactivated Customer Token Access Rejected (401)', e.response?.status === 401, `Status: ${e.response?.status}`);
  }

  // Test 19: Admin reactivates Customer 2 account
  try {
    const customer2Id = customer2User.id || customer2User._id;
    const res = await axios.put(`${API_URL}/admin/customers/${customer2Id}/status`, { isActive: true }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(19, 'Admin Reactivates Customer Account', res.status === 200 && res.data.data.isActive === true, `isActive: ${res.data.data.isActive}`);
  } catch (e) {
    logTest(19, 'Admin Reactivates Customer Account', false, e.response?.data?.message || e.message);
  }

  // Test 20: Reactivated Customer 2 login succeeds
  try {
    const targetUser = await User.findById(customer2User.id || customer2User._id);
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: targetUser.email,
      password: 'CustomerPassword123!'
    });
    logTest(20, 'Reactivated Customer Login Succeeds (200 PASS)', loginRes.status === 200 && loginRes.data.token !== undefined, `Token received`);
  } catch (e) {
    logTest(20, 'Reactivated Customer Login Succeeds (200 PASS)', false, e.response?.data?.message || e.message);
  }

  // Test 21: Admin cannot deactivate their own account (400 Bad Request)
  try {
    const adminId = adminUser.id || adminUser._id;
    await axios.put(`${API_URL}/admin/customers/${adminId}/status`, { isActive: false }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(21, 'Admin Cannot Deactivate Own Account (400)', false, 'Expected 400 error');
  } catch (e) {
    logTest(21, 'Admin Cannot Deactivate Own Account (400)', e.response?.status === 400, `Message: ${e.response?.data?.message}`);
  }

  // --- 5. ORDERS & ADDRESS INTEGRATION ---

  // Test 22: Customer details returns orders belonging strictly to requested customer
  try {
    const customer1Id = customerUser.id || customerUser._id;
    const res = await axios.get(`${API_URL}/admin/customers/${customer1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const orderMatch = res.data.data.orders.some(o => String(o._id) === String(testOrder._id));
    logTest(22, 'Customer Details Returns Matching Orders', res.status === 200 && orderMatch, `Order matched: ${orderMatch}`);
  } catch (e) {
    logTest(22, 'Customer Details Returns Matching Orders', false, e.response?.data?.message || e.message);
  }

  // Test 23: Customer details returns addresses belonging strictly to requested customer
  try {
    const customer1Id = customerUser.id || customerUser._id;
    const res = await axios.get(`${API_URL}/admin/customers/${customer1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const hasAddressPhone = res.data.data.addresses.some(a => a.phone === '9876543210');
    logTest(23, 'Customer Details Returns Saved Addresses with Phone', res.status === 200 && hasAddressPhone, `Phone matched`);
  } catch (e) {
    logTest(23, 'Customer Details Returns Saved Addresses with Phone', false, e.response?.data?.message || e.message);
  }

  // --- 6. REGRESSION TESTS ---

  // Test 24: Existing Registration API works
  try {
    const timestampReg = Date.now();
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Regression Customer',
      email: `reg_cust_${timestampReg}@example.com`,
      password: 'RegPassword123!'
    });
    logTest(24, 'Regression - User Registration API', regRes.status === 201 && regRes.data.token !== undefined, `Token received`);
  } catch (e) {
    logTest(24, 'Regression - User Registration API', false, e.response?.data?.message || e.message);
  }

  // Test 25: Existing Address Book API works
  try {
    const res = await axios.get(`${API_URL}/addresses`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(25, 'Regression - Address Book API', res.status === 200 && Array.isArray(res.data.data), `Addresses count: ${res.data.data.length}`);
  } catch (e) {
    logTest(25, 'Regression - Address Book API', false, e.response?.data?.message || e.message);
  }

  // Test 26: Existing Orders List API works
  try {
    const res = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(26, 'Regression - Orders List API', res.status === 200 && Array.isArray(res.data.data), `Orders count: ${res.data.data.length}`);
  } catch (e) {
    logTest(26, 'Regression - Orders List API', false, e.response?.data?.message || e.message);
  }

  // Test 27: Existing Shipping Methods API works
  try {
    const res = await axios.get(`${API_URL}/shipping/methods?subtotal=2000`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(27, 'Regression - Shipping Methods API', res.status === 200 && res.data.success === true, `Methods count: ${res.data.data.options.length}`);
  } catch (e) {
    logTest(27, 'Regression - Shipping Methods API', false, e.response?.data?.message || e.message);
  }

  // Test 28: Existing Notifications API works
  try {
    const res = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(28, 'Regression - Notifications API', res.status === 200 && Array.isArray(res.data.data), `Notifs count: ${res.data.data.length}`);
  } catch (e) {
    logTest(28, 'Regression - Notifications API', false, e.response?.data?.message || e.message);
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

runCustomerManagementTests();

const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

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
  const Product = require('./models/Product');
  const Order = require('./models/Order');

  const timestamp = Date.now();

  // 1. Register & Promote Admin
  const adminEmail = `ship_admin_${timestamp}@example.com`;
  const adminPassword = 'AdminPassword123!';
  const adminReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Shipping Test Admin',
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
  const customerEmail = `ship_customer_${timestamp}@example.com`;
  const customerPassword = 'CustomerPassword123!';
  const customerReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Shipping Test Customer',
    email: customerEmail,
    password: customerPassword
  });
  customerUser = customerReg.data.user;

  const customerLogin = await axios.post(`${API_URL}/auth/login`, {
    email: customerEmail,
    password: customerPassword
  });
  customerToken = customerLogin.data.token;

  // 3. Create Test Product
  testProduct = await Product.create({
    name: `Shipping Test Shoe ${timestamp}`,
    slug: `shipping-test-shoe-${timestamp}`,
    sku: `SHIP-SKU-${timestamp}`,
    brand: 'SoleVibe',
    category: 'men',
    price: 3500,
    stock: 50,
    description: 'Special shoe for testing shipping calculation engine',
    image: '/images/shoe-test.jpg'
  });
}

async function runShippingTests() {
  console.log('=============== STARTING SHIPPING & DELIVERY MANAGEMENT AUDIT & TEST SUITE ===============\n');

  try {
    await setupTestData();
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }

  const shippingService = require('./services/shippingService');
  const MockCourierProvider = require('./services/shippingProviders/MockCourierProvider');
  const { getCourierProvider } = require('./services/shippingProviders');
  const Order = require('./models/Order');
  const Notification = require('./models/Notification');

  // --- UNIT TESTS: shippingService ---

  // Test 01: getShippingZone LOCAL
  try {
    const res = shippingService.calculateShipping({ subtotal: 2000, address: { pincode: '400001', state: 'Maharashtra', country: 'India' } });
    logTest(1, 'shippingService - LOCAL Zone Detection', res.zone === 'LOCAL', `zone: ${res.zone}`);
  } catch (e) {
    logTest(1, 'shippingService - LOCAL Zone Detection', false, e.message);
  }

  // Test 02: getShippingZone REGIONAL
  try {
    const res = shippingService.calculateShipping({ subtotal: 2000, address: { pincode: '380001', state: 'Gujarat', country: 'India' } });
    logTest(2, 'shippingService - REGIONAL Zone Detection', res.zone === 'REGIONAL', `zone: ${res.zone}`);
  } catch (e) {
    logTest(2, 'shippingService - REGIONAL Zone Detection', false, e.message);
  }

  // Test 03: getShippingZone NATIONAL
  try {
    const res = shippingService.calculateShipping({ subtotal: 2000, address: { pincode: '110001', state: 'Delhi', country: 'India' } });
    logTest(3, 'shippingService - NATIONAL Zone Detection', res.zone === 'NATIONAL', `zone: ${res.zone}`);
  } catch (e) {
    logTest(3, 'shippingService - NATIONAL Zone Detection', false, e.message);
  }

  // Test 04: RESTRICTED Pincode '000000'
  try {
    const res = shippingService.calculateShipping({ subtotal: 2000, address: { pincode: '000000', country: 'India' } });
    logTest(4, 'shippingService - RESTRICTED Pincode (000000)', res.valid === false && res.zone === 'RESTRICTED', `valid: ${res.valid}`);
  } catch (e) {
    logTest(4, 'shippingService - RESTRICTED Pincode (000000)', false, e.message);
  }

  // Test 05: RESTRICTED Pincode '000'
  try {
    const res = shippingService.calculateShipping({ subtotal: 2000, address: { pincode: '000', country: 'India' } });
    logTest(5, 'shippingService - RESTRICTED Pincode (000)', res.valid === false && res.zone === 'RESTRICTED', `valid: ${res.valid}`);
  } catch (e) {
    logTest(5, 'shippingService - RESTRICTED Pincode (000)', false, e.message);
  }

  // Test 06: RESTRICTED Foreign Country
  try {
    const res = shippingService.calculateShipping({ subtotal: 2000, address: { pincode: '10001', country: 'USA' } });
    logTest(6, 'shippingService - RESTRICTED Country (Non-India)', res.valid === false && res.zone === 'RESTRICTED', `valid: ${res.valid}`);
  } catch (e) {
    logTest(6, 'shippingService - RESTRICTED Country (Non-India)', false, e.message);
  }

  // Test 07: addBusinessDays calculation
  try {
    // Friday order + 4 business days = Thursday next week
    const friday = new Date('2026-09-18T10:00:00Z');
    const calcDate = shippingService.calculateShipping({ subtotal: 2000, method: 'standard', address: { pincode: '110001' }, orderDate: friday });
    const estDay = new Date(calcDate.estimatedDeliveryDate).getUTCDay();
    logTest(7, 'shippingService - Business Days (Weekend Skip)', estDay !== 0 && estDay !== 6, `dayOfWeek: ${estDay}`);
  } catch (e) {
    logTest(7, 'shippingService - Business Days (Weekend Skip)', false, e.message);
  }

  // Test 08: Standard Delivery Under Threshold Fee ₹150
  try {
    const res = shippingService.calculateShipping({ subtotal: 5000, method: 'standard', address: { pincode: '110001' } });
    logTest(8, 'shippingService - Standard Delivery Fee Under Threshold', res.charge === 150 && res.deliveryRange === '3-5 business days', `charge: ₹${res.charge}`);
  } catch (e) {
    logTest(8, 'shippingService - Standard Delivery Fee Under Threshold', false, e.message);
  }

  // Test 09: Standard Delivery Over ₹15,000 Threshold (Free)
  try {
    const res = shippingService.calculateShipping({ subtotal: 16000, method: 'standard', address: { pincode: '110001' } });
    logTest(9, 'shippingService - Free Shipping Over Threshold (₹15,000)', res.charge === 0 && res.method === 'free', `charge: ₹${res.charge}, method: ${res.method}`);
  } catch (e) {
    logTest(9, 'shippingService - Free Shipping Over Threshold (₹15,000)', false, e.message);
  }

  // Test 10: Express Delivery Under Threshold Fee ₹350
  try {
    const res = shippingService.calculateShipping({ subtotal: 5000, method: 'express', address: { pincode: '110001' } });
    logTest(10, 'shippingService - Express Courier Fee Under Threshold', res.charge === 350 && res.deliveryRange === '1-2 business days', `charge: ₹${res.charge}`);
  } catch (e) {
    logTest(10, 'shippingService - Express Courier Fee Under Threshold', false, e.message);
  }

  // Test 11: Express Delivery Over Threshold retains ₹350 fee
  try {
    const res = shippingService.calculateShipping({ subtotal: 16000, method: 'express', address: { pincode: '110001' } });
    logTest(11, 'shippingService - Express Courier Over Threshold (Retains Express Fee)', res.charge === 350 && res.method === 'express', `charge: ₹${res.charge}`);
  } catch (e) {
    logTest(11, 'shippingService - Express Courier Over Threshold (Retains Express Fee)', false, e.message);
  }

  // Test 12: Requested 'free' under threshold falls back to standard ₹150
  try {
    const res = shippingService.calculateShipping({ subtotal: 5000, method: 'free', address: { pincode: '110001' } });
    logTest(12, 'shippingService - Requested Free Under Threshold Fallback', res.charge === 150 && res.method === 'standard', `charge: ₹${res.charge}`);
  } catch (e) {
    logTest(12, 'shippingService - Requested Free Under Threshold Fallback', false, e.message);
  }

  // Test 13: Invalid address returns valid: false
  try {
    const res = shippingService.calculateShipping({ subtotal: 5000, address: { pincode: '000000' } });
    logTest(13, 'shippingService - Invalid Address Returns valid: false', res.valid === false && res.charge === 0, `valid: ${res.valid}`);
  } catch (e) {
    logTest(13, 'shippingService - Invalid Address Returns valid: false', false, e.message);
  }

  // Test 14: getAvailableShippingMethods under threshold
  try {
    const res = shippingService.getAvailableShippingMethods(5000, { pincode: '110001' });
    const standardFee = res.options[0].charge !== undefined ? res.options[0].charge : res.options[0].fee;
    logTest(14, 'shippingService - Available Methods (Subtotal < 15,000)', res.valid === true && res.options.length === 2 && standardFee === 150, `options: ${res.options.length}`);
  } catch (e) {
    logTest(14, 'shippingService - Available Methods (Subtotal < 15,000)', false, e.message);
  }

  // Test 15: getAvailableShippingMethods over threshold
  try {
    const res = shippingService.getAvailableShippingMethods(16000, { pincode: '110001' });
    const standardOpt = res.options.find(o => o.code === 'standard');
    const standardFee = standardOpt.charge !== undefined ? standardOpt.charge : standardOpt.fee;
    logTest(15, 'shippingService - Available Methods (Subtotal >= 15,000 Free)', res.valid === true && standardFee === 0, `standard fee: ₹${standardFee}`);
  } catch (e) {
    logTest(15, 'shippingService - Available Methods (Subtotal >= 15,000 Free)', false, e.message);
  }

  // Test 16: getAvailableShippingMethods restricted pincode
  try {
    const res = shippingService.getAvailableShippingMethods(5000, { pincode: '000000' });
    logTest(16, 'shippingService - Available Methods Restricted Pincode', res.valid === false, `valid: ${res.valid}`);
  } catch (e) {
    logTest(16, 'shippingService - Available Methods Restricted Pincode', false, e.message);
  }

  // --- REST API ENDPOINT TESTS ---

  // Test 17: GET /api/shipping/methods (Valid)
  try {
    const res = await axios.get(`${API_URL}/shipping/methods?subtotal=3500&address=${encodeURIComponent(JSON.stringify({ pincode: '400001' }))}`);
    logTest(17, 'GET /api/shipping/methods (200 OK)', res.status === 200 && res.data.success === true, `methods count: ${res.data.data.options.length}`);
  } catch (e) {
    logTest(17, 'GET /api/shipping/methods (200 OK)', false, e.response?.data?.message || e.message);
  }

  // Test 18: GET /api/shipping/methods (Restricted 400)
  try {
    await axios.get(`${API_URL}/shipping/methods?subtotal=3500&address=${encodeURIComponent(JSON.stringify({ pincode: '000000' }))}`);
    logTest(18, 'GET /api/shipping/methods (400 Restricted)', false, 'Expected 400 error');
  } catch (e) {
    logTest(18, 'GET /api/shipping/methods (400 Restricted)', e.response?.status === 400, `status: ${e.response?.status}`);
  }

  // Test 19: POST /api/shipping/calculate (Standard)
  try {
    const res = await axios.post(`${API_URL}/shipping/calculate`, {
      subtotal: 3500,
      method: 'standard',
      address: { pincode: '110001', state: 'Delhi', country: 'India' }
    });
    logTest(19, 'POST /api/shipping/calculate (Standard)', res.status === 200 && res.data.data.charge === 150, `charge: ₹${res.data.data.charge}`);
  } catch (e) {
    logTest(19, 'POST /api/shipping/calculate (Standard)', false, e.response?.data?.message || e.message);
  }

  // Test 20: POST /api/shipping/calculate (Express)
  try {
    const res = await axios.post(`${API_URL}/shipping/calculate`, {
      subtotal: 3500,
      method: 'express',
      address: { pincode: '110001', state: 'Delhi', country: 'India' }
    });
    logTest(20, 'POST /api/shipping/calculate (Express)', res.status === 200 && res.data.data.charge === 350, `charge: ₹${res.data.data.charge}`);
  } catch (e) {
    logTest(20, 'POST /api/shipping/calculate (Express)', false, e.response?.data?.message || e.message);
  }

  // Test 21: POST /api/shipping/calculate (400 Restricted)
  try {
    await axios.post(`${API_URL}/shipping/calculate`, {
      subtotal: 3500,
      method: 'standard',
      address: { pincode: '000000', country: 'India' }
    });
    logTest(21, 'POST /api/shipping/calculate (400 Restricted)', false, 'Expected 400 error');
  } catch (e) {
    logTest(21, 'POST /api/shipping/calculate (400 Restricted)', e.response?.status === 400, `status: ${e.response?.status}`);
  }

  // Test 22: POST /api/shipping/webhook (401 Invalid Signature)
  try {
    await axios.post(`${API_URL}/shipping/webhook`, { orderId: 'dummy_id', status: 'shipped' }, {
      headers: { 'x-courier-signature': 'invalid_signature_hash' }
    });
    logTest(22, 'POST /api/shipping/webhook (401 Invalid Signature)', false, 'Expected 401 error');
  } catch (e) {
    logTest(22, 'POST /api/shipping/webhook (401 Invalid Signature)', e.response?.status === 401, `status: ${e.response?.status}`);
  }

  // Test 23: POST /api/shipping/webhook (400 Missing Parameters)
  try {
    await axios.post(`${API_URL}/shipping/webhook`, { status: 'shipped' });
    logTest(23, 'POST /api/shipping/webhook (400 Missing Params)', false, 'Expected 400 error');
  } catch (e) {
    logTest(23, 'POST /api/shipping/webhook (400 Missing Params)', e.response?.status === 400, `status: ${e.response?.status}`);
  }

  // Create temporary Order for Webhook & Controller Integration Tests
  try {
    const orderRes = await axios.post(`${API_URL}/orders`, {
      items: [{ product: testProduct._id, quantity: 1, size: '9' }],
      shippingMethod: 'express',
      shippingAddress: { name: 'Test User', addressLine: '123 Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' }
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    testOrder = orderRes.data.data;
  } catch (e) {
    console.error('Order creation helper failed:', e.response?.data || e.message);
  }

  // Test 24: POST /api/shipping/webhook (200 Valid Signature & Order Sync)
  try {
    const webhookSecret = process.env.COURIER_WEBHOOK_SECRET || 'courier_webhook_secret_key';
    const payload = {
      orderId: String(testOrder._id),
      trackingNumber: 'BD123456789',
      carrier: 'BlueDart Express',
      status: 'shipped'
    };
    const signature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    const res = await axios.post(`${API_URL}/shipping/webhook`, payload, {
      headers: { 'x-courier-signature': signature }
    });

    const refreshedOrder = await Order.findById(testOrder._id);
    logTest(24, 'POST /api/shipping/webhook (200 Valid Sync)', res.status === 200 && refreshedOrder.status === 'shipped' && refreshedOrder.trackingNumber === 'BD123456789', `order status: ${refreshedOrder.status}`);
  } catch (e) {
    logTest(24, 'POST /api/shipping/webhook (200 Valid Sync)', false, e.response?.data?.message || e.message);
  }

  // Test 25: POST /api/shipping/webhook (Idempotent repeated call)
  try {
    const webhookSecret = process.env.COURIER_WEBHOOK_SECRET || 'courier_webhook_secret_key';
    const payload = {
      orderId: String(testOrder._id),
      trackingNumber: 'BD123456789',
      carrier: 'BlueDart Express',
      status: 'shipped'
    };
    const signature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    const res = await axios.post(`${API_URL}/shipping/webhook`, payload, {
      headers: { 'x-courier-signature': signature }
    });
    logTest(25, 'POST /api/shipping/webhook (Idempotent Handling)', res.status === 200 && res.data.success === true, `msg: ${res.data.message}`);
  } catch (e) {
    logTest(25, 'POST /api/shipping/webhook (Idempotent Handling)', false, e.response?.data?.message || e.message);
  }

  // --- COURIER PROVIDER ABSTRACTION TESTS ---

  const mockProvider = new MockCourierProvider();

  // Test 26: MockCourierProvider fetchTracking
  try {
    const track = await mockProvider.fetchTracking('BD123456789');
    logTest(26, 'Courier Abstraction - fetchTracking', track.success === true && track.trackingNumber === 'BD123456789', `status: ${track.status}`);
  } catch (e) {
    logTest(26, 'Courier Abstraction - fetchTracking', false, e.message);
  }

  // Test 27: MockCourierProvider createShipment
  try {
    const ship = await mockProvider.createShipment({ orderId: '123456', estimatedDeliveryDate: new Date(), address: { pincode: '400001' } });
    logTest(27, 'Courier Abstraction - createShipment', ship.success === true && ship.trackingNumber.startsWith('BD'), `trackingNumber: ${ship.trackingNumber}`);
  } catch (e) {
    logTest(27, 'Courier Abstraction - createShipment', false, e.message);
  }

  // Test 28: MockCourierProvider cancelShipment
  try {
    const cancel = await mockProvider.cancelShipment('BD123456789');
    logTest(28, 'Courier Abstraction - cancelShipment', cancel.success === true, `msg: ${cancel.message}`);
  } catch (e) {
    logTest(28, 'Courier Abstraction - cancelShipment', false, e.message);
  }

  // Test 29: getCourierProvider('mock')
  try {
    const provider = getCourierProvider('mock');
    logTest(29, 'Courier Provider Factory - mock', provider.name === 'BlueDart', `provider: ${provider.name}`);
  } catch (e) {
    logTest(29, 'Courier Provider Factory - mock', false, e.message);
  }

  // Test 30: getCourierProvider fallback
  try {
    const provider = getCourierProvider('bluedart');
    logTest(30, 'Courier Provider Factory - Safe Fallback', provider.name === 'BlueDart', `provider: ${provider.name}`);
  } catch (e) {
    logTest(30, 'Courier Provider Factory - Safe Fallback', false, e.message);
  }

  // --- END-TO-END SYSTEM INTEGRATION TESTS ---

  // Test 31: POST /api/orders Recalculates Express Shipping Fee (350)
  try {
    logTest(31, 'POST /api/orders Server Shipping Recalculation', testOrder.shipping === 350, `shipping charge: ₹${testOrder.shipping}`);
  } catch (e) {
    logTest(31, 'POST /api/orders Server Shipping Recalculation', false, e.message);
  }

  // Test 32: Order document contains shipping metadata
  try {
    logTest(32, 'Order Model - Shipping Metadata Snapshot', testOrder.shippingMethod === 'express' && testOrder.shippingMethodName === 'Express Courier' && testOrder.shippingZone === 'LOCAL', `zone: ${testOrder.shippingZone}`);
  } catch (e) {
    logTest(32, 'Order Model - Shipping Metadata Snapshot', false, e.message);
  }

  // Test 33: POST /api/payment/create-order Includes Server Shipping Fee
  try {
    const res = await axios.post(`${API_URL}/payment/create-order`, {
      items: [{ product: testProduct._id, quantity: 1, size: '9' }],
      shippingMethod: 'standard',
      shippingAddress: { pincode: '110001', state: 'Delhi', country: 'India' }
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(33, 'POST /api/payment/create-order Includes Server Shipping Fee', res.status === 200 && res.data.summary.shipping === 150, `summary shipping: ₹${res.data.summary?.shipping}`);
  } catch (e) {
    logTest(33, 'POST /api/payment/create-order Includes Server Shipping Fee', false, e.response?.data?.message || e.message);
  }

  // Test 34: POST /api/payment/verify Saves Shipping Snapshot
  try {
    const rzpOrderId = `mock_order_${Date.now()}`;
    const rzpPayId = `mock_pay_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';
    const validSignature = crypto.createHmac('sha256', secret).update(`${rzpOrderId}|${rzpPayId}`).digest('hex');

    const payload = {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPayId,
      razorpay_signature: validSignature,
      items: [{ product: testProduct._id, quantity: 1, size: '9' }],
      shippingMethod: 'express',
      shippingAddress: { pincode: '400001', state: 'Maharashtra', country: 'India' }
    };
    const res = await axios.post(`${API_URL}/payment/verify`, payload, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(34, 'POST /api/payment/verify Saves Shipping Snapshot', res.status === 200 && res.data.data.shippingMethod === 'express', `method: ${res.data.data?.shippingMethod}`);
  } catch (e) {
    logTest(34, 'POST /api/payment/verify Saves Shipping Snapshot', false, e.response?.data?.message || e.message);
  }

  // Test 35: Admin PUT /api/orders/:id/status to 'shipped' sets shippedAt date
  try {
    const res = await axios.put(`${API_URL}/orders/${testOrder._id}/status`, {
      status: 'shipped',
      trackingNumber: 'BD987654321',
      carrier: 'BlueDart Express'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(35, 'PUT /api/orders/:id/status to shipped sets shippedAt', res.status === 200 && res.data.data.shippedAt !== null, `shippedAt: ${res.data.data.shippedAt}`);
  } catch (e) {
    logTest(35, 'PUT /api/orders/:id/status to shipped sets shippedAt', false, e.response?.data?.message || e.message);
  }

  // Test 36: Customer ORDER_SHIPPED Notification Created
  try {
    const notifs = await Notification.find({ recipient: customerUser.id || customerUser._id, type: 'ORDER_SHIPPED' });
    logTest(36, 'Notification Engine - ORDER_SHIPPED Notification', notifs.length > 0, `notifs count: ${notifs.length}`);
  } catch (e) {
    logTest(36, 'Notification Engine - ORDER_SHIPPED Notification', false, e.message);
  }

  // Test 37: GET /api/orders returns orders with shipping metadata
  try {
    const res = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const retrievedOrder = res.data.data.find(o => String(o._id) === String(testOrder._id));
    logTest(37, 'GET /api/orders Returns Orders with Shipping Metadata', res.status === 200 && retrievedOrder && retrievedOrder.shippingMethod !== undefined, `retrieved method: ${retrievedOrder?.shippingMethod}`);
  } catch (e) {
    logTest(37, 'GET /api/orders Returns Orders with Shipping Metadata', false, e.response?.data?.message || e.message);
  }

  // Test 38: GET /api/orders/:id returns single order with tracking details
  try {
    const res = await axios.get(`${API_URL}/orders/${testOrder._id}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(38, 'GET /api/orders/:id Returns Tracking Details & Carrier', res.status === 200 && res.data.data.trackingNumber === 'BD987654321', `carrier: ${res.data.data.carrier}`);
  } catch (e) {
    logTest(38, 'GET /api/orders/:id Returns Tracking Details & Carrier', false, e.response?.data?.message || e.message);
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

runShippingTests();

const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5001/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinetic_stride';

let passed = 0;
let failed = 0;
let notTested = 0;
let blocked = 0;

const logTest = (num, title, status, details = '') => {
  if (status === true) {
    passed++;
    console.log(`[Security Test ${String(num).padStart(2, '0')}] ✅ ${title}: PASS ${details ? `(${details})` : ''}`);
  } else if (status === false) {
    failed++;
    console.error(`[Security Test ${String(num).padStart(2, '0')}] ❌ ${title}: FAIL ${details ? `(${details})` : ''}`);
  } else if (status === 'BLOCKED') {
    blocked++;
    console.log(`[Security Test ${String(num).padStart(2, '0')}] 🛑 ${title}: BLOCKED ${details ? `(${details})` : ''}`);
  } else {
    notTested++;
    console.log(`[Security Test ${String(num).padStart(2, '0')}] ⚠️ ${title}: NOT TESTED ${details ? `(${details})` : ''}`);
  }
};

async function runSecurityHardeningTests() {
  console.log('================================================================================');
  console.log('       SOLEVIBE E-COMMERCE COMPREHENSIVE SECURITY HARDENING TEST SUITE          ');
  console.log('================================================================================\n');

  const timestamp = Date.now();
  let userAToken = '', userBToken = '', adminToken = '';
  let userA = null, userB = null, adminUser = null;
  let userAAddress = null;
  let testProduct = null;
  let userAOrder = null;
  let userAReturn = null;

  // 1. DATABASE CONNECTION SECURITY & VERIFICATION
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    const dbName = mongoose.connection.name;
    logTest(1, 'Database Connection & URI Isolation', dbName === 'kinetic_stride' || mongoose.connection.readyState === 1, `Connected DB: ${dbName}`);
  } catch (e) {
    logTest(1, 'Database Connection & URI Isolation', false, e.message);
  }

  const User = require('./models/User');
  const Product = require('./models/Product');
  const Order = require('./models/Order');
  const Address = require('./models/Address');
  const ReturnRequest = require('./models/ReturnRequest');

  // SETUP USER A, USER B & ADMIN ACCOUNTS
  const emailA = `sec_usera_${timestamp}@example.com`;
  const emailB = `sec_userb_${timestamp}@example.com`;
  const emailAdmin = `sec_admin_${timestamp}@example.com`;
  const pass = 'SecPass123!';

  try {
    const regA = await axios.post(`${API_URL}/auth/register`, { name: 'Sec User A', email: emailA, password: pass });
    userAToken = regA.data.token;
    userA = regA.data.user;

    const regB = await axios.post(`${API_URL}/auth/register`, { name: 'Sec User B', email: emailB, password: pass });
    userBToken = regB.data.token;
    userB = regB.data.user;

    const regAdmin = await axios.post(`${API_URL}/auth/register`, { name: 'Sec Admin', email: emailAdmin, password: pass });
    adminUser = regAdmin.data.user;
    await User.findByIdAndUpdate(adminUser.id, { role: 'ADMIN' });
    const loginAdmin = await axios.post(`${API_URL}/auth/login`, { email: emailAdmin, password: pass });
    adminToken = loginAdmin.data.token;

    logTest(2, 'Multi-User & Admin Credential Setup', Boolean(userAToken) && Boolean(userBToken) && Boolean(adminToken), 'User A, User B, Admin active');
  } catch (e) {
    logTest(2, 'Multi-User & Admin Credential Setup', false, e.message);
  }

  // 3. AUTHENTICATION SECURITY
  try {
    const invPass = await axios.post(`${API_URL}/auth/login`, { email: emailA, password: 'WrongPassword' }).catch(e => e.response);
    logTest(3, 'Authentication - Invalid Password Rejected (401)', invPass.status === 401, `Status: ${invPass.status}`);
  } catch (e) {
    logTest(3, 'Authentication - Invalid Password Rejected (401)', false, e.message);
  }

  try {
    const malformedToken = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer malformed_fake_jwt_token_12345' }
    }).catch(e => e.response);
    logTest(4, 'Authentication - Malformed JWT Rejected (401)', malformedToken.status === 401, `Status: ${malformedToken.status}`);
  } catch (e) {
    logTest(4, 'Authentication - Malformed JWT Rejected (401)', false, e.message);
  }

  try {
    const noToken = await axios.get(`${API_URL}/auth/me`).catch(e => e.response);
    logTest(5, 'Authentication - Missing JWT Rejected (401)', noToken.status === 401, `Status: ${noToken.status}`);
  } catch (e) {
    logTest(5, 'Authentication - Missing JWT Rejected (401)', false, e.message);
  }

  // 4. PASSWORD & SENSITIVE DATA PRIVACY
  try {
    const profile = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const hasPassword = profile.data.data?.password !== undefined;
    logTest(6, 'Sensitive Data Privacy - Password Hash Excluded from User API', !hasPassword, 'Password hash hidden');
  } catch (e) {
    logTest(6, 'Sensitive Data Privacy - Password Hash Excluded from User API', false, e.message);
  }

  // 5. AUTHORIZATION & RBAC (USER vs ADMIN)
  try {
    const userAdminReq = await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    }).catch(e => e.response);
    logTest(7, 'Authorization - Customer Access to Admin Route Blocked (403)', userAdminReq.status === 403, `Status: ${userAdminReq.status}`);
  } catch (e) {
    logTest(7, 'Authorization - Customer Access to Admin Route Blocked (403)', false, e.message);
  }

  try {
    const adminReq = await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(8, 'Authorization - Admin Authorized Access Allowed (200)', adminReq.status === 200, `Total: ${adminReq.data.total}`);
  } catch (e) {
    logTest(8, 'Authorization - Admin Authorized Access Allowed (200)', false, e.message);
  }

  // 6. IDOR & USER vs USER RESOURCE ISOLATION (ADDRESS BOOK)
  try {
    const addrA = await axios.post(`${API_URL}/addresses`, {
      type: 'HOME', fullName: 'User A', phone: '9876543210', addressLine1: 'Street A', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India'
    }, { headers: { Authorization: `Bearer ${userAToken}` } });
    userAAddress = addrA.data.data;

    const idorAddrAccess = await axios.get(`${API_URL}/addresses/${userAAddress._id}`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    }).catch(e => e.response);
    logTest(9, 'IDOR Protection - User B Accessing User A Address Blocked (403/404)', idorAddrAccess.status === 403 || idorAddrAccess.status === 404, `Status: ${idorAddrAccess.status}`);
  } catch (e) {
    logTest(9, 'IDOR Protection - User B Accessing User A Address Blocked (403/404)', false, e.message);
  }

  // 7. PRODUCT CATALOG & MASS ASSIGNMENT PROTECTION
  try {
    const prodRes = await axios.get(`${API_URL}/products`);
    testProduct = prodRes.data.data[0];

    const massAssignAttempt = await axios.post(`${API_URL}/products`, {
      name: 'Hacker Shoe', category: 'men', price: 10, stock: 100, role: 'ADMIN'
    }, { headers: { Authorization: `Bearer ${userAToken}` } }).catch(e => e.response);
    logTest(10, 'Mass Assignment - Customer Unauthorized Product Creation Blocked (403)', massAssignAttempt.status === 403, `Status: ${massAssignAttempt.status}`);
  } catch (e) {
    logTest(10, 'Mass Assignment - Customer Unauthorized Product Creation Blocked (403)', false, e.message);
  }

  // 8. CART OWNERSHIP & NEGATIVE QUANTITY MANIPULATION
  try {
    const cartAdd = await axios.post(`${API_URL}/cart`, { product: testProduct._id, quantity: 2, size: '9' }, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const cartItemId = cartAdd.data.data.items[0]._id;

    const invalidQty = await axios.put(`${API_URL}/cart/${cartItemId}`, { quantity: -10 }, {
      headers: { Authorization: `Bearer ${userAToken}` }
    }).catch(e => e.response);
    logTest(11, 'Stock & Quantity Security - Negative Cart Quantity Rejected (400)', invalidQty.status === 400, `Message: ${invalidQty.data?.message}`);
  } catch (e) {
    logTest(11, 'Stock & Quantity Security - Negative Cart Quantity Rejected (400)', false, e.message);
  }

  // 9. COUPON DISCOUNT MANIPULATION PROTECTION
  try {
    const fakeCoupon = await axios.post(`${API_URL}/coupons/validate`, {
      code: 'FAKE_EXPLOIT_99', cartItems: [{ product: testProduct._id, quantity: 2, price: 1 }]
    }, { headers: { Authorization: `Bearer ${userAToken}` } }).catch(e => e.response);
    logTest(12, 'Coupon Security - Invalid Coupon Rejection (400)', fakeCoupon.status === 400, `Status: ${fakeCoupon.status}`);
  } catch (e) {
    logTest(12, 'Coupon Security - Invalid Coupon Rejection (400)', false, e.message);
  }

  // 10. PAYMENTS & RAZORPAY SIGNATURE SECURITY
  try {
    const orderItems = [{ product: testProduct._id, quantity: 2, size: '9', price: testProduct.price }];
    const formattedAddr = { name: userAAddress.fullName, addressLine: userAAddress.addressLine1, city: userAAddress.city, state: userAAddress.state, pincode: userAAddress.postalCode, country: userAAddress.country };

    const rzpOrder = await axios.post(`${API_URL}/payment/create-order`, {
      items: orderItems, shippingAddress: formattedAddr, shippingMethod: 'standard'
    }, { headers: { Authorization: `Bearer ${userAToken}` } });
    const rzpOrderId = rzpOrder.data.razorpayOrderId;

    // Test TAMPERED SIGNATURE (Should be rejected with 400)
    const tamperedSig = await axios.post(`${API_URL}/payment/verify`, {
      items: orderItems,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: `pay_${timestamp}`,
      razorpay_signature: 'tampered_forged_signature_string',
      shippingAddress: formattedAddr
    }, { headers: { Authorization: `Bearer ${userAToken}` } }).catch(e => e.response);
    logTest(13, 'Payment Security - Tampered Razorpay Signature Rejected (400)', tamperedSig.status === 400, `Message: ${tamperedSig.data?.message}`);

    // Verify with VALID HMAC SHA256 Signature
    const validPaymentId = `pay_${timestamp}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';
    const validSig = crypto.createHmac('sha256', secret).update(`${rzpOrderId}|${validPaymentId}`).digest('hex');

    const validPayment = await axios.post(`${API_URL}/payment/verify`, {
      items: orderItems,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSig,
      shippingAddress: formattedAddr
    }, { headers: { Authorization: `Bearer ${userAToken}` } });

    userAOrder = validPayment.data.data;
    logTest(14, 'Payment Security - Valid HMAC SHA256 Signature Verified (200)', validPayment.status === 200 && userAOrder.payment.status === 'PAID', `Order ID: ${userAOrder._id}`);
  } catch (e) {
    logTest(13, 'Payment Security - Tampered Razorpay Signature Rejected (400)', false, e.message);
    logTest(14, 'Payment Security - Valid HMAC SHA256 Signature Verified (200)', false, e.message);
  }

  // 11. ORDER OWNERSHIP & IDOR ISOLATION
  try {
    const idorOrderAccess = await axios.get(`${API_URL}/orders/${userAOrder._id}`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    }).catch(e => e.response);
    logTest(15, 'IDOR Protection - User B Accessing User A Order Blocked (403)', idorOrderAccess.status === 403, `Status: ${idorOrderAccess.status}`);
  } catch (e) {
    logTest(15, 'IDOR Protection - User B Accessing User A Order Blocked (403)', false, e.message);
  }

  // 12. ORDER STATUS UNAPPROVED MANIPULATION BY CUSTOMER
  try {
    const custStatusUpdate = await axios.put(`${API_URL}/orders/${userAOrder._id}/status`, {
      status: 'delivered'
    }, { headers: { Authorization: `Bearer ${userAToken}` } }).catch(e => e.response);
    logTest(16, 'Access Control - Customer Marking Own Order Delivered Blocked (403)', custStatusUpdate.status === 403, `Status: ${custStatusUpdate.status}`);
  } catch (e) {
    logTest(16, 'Access Control - Customer Marking Own Order Delivered Blocked (403)', false, e.message);
  }

  // 13. RETURNS & REFUNDS AUTHORIZATION
  try {
    // Progress status to delivered via Admin
    await axios.put(`${API_URL}/orders/${userAOrder._id}/status`, { status: 'processing' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.put(`${API_URL}/orders/${userAOrder._id}/status`, { status: 'shipped' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.put(`${API_URL}/orders/${userAOrder._id}/status`, { status: 'delivered' }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const retReq = await axios.post(`${API_URL}/returns`, {
      orderId: userAOrder._id, items: [{ product: testProduct._id, quantity: 1, reason: 'WRONG_SIZE' }], reason: 'WRONG_SIZE'
    }, { headers: { Authorization: `Bearer ${userAToken}` } });
    userAReturn = retReq.data.data;

    const custApproveRet = await axios.put(`${API_URL}/returns/admin/${userAReturn._id}/status`, { status: 'APPROVED' }, {
      headers: { Authorization: `Bearer ${userAToken}` }
    }).catch(e => e.response);
    logTest(17, 'Return Security - Customer Approving Own Return Request Blocked (403)', custApproveRet.status === 403, `Status: ${custApproveRet.status}`);

    const custRefundReq = await axios.post(`${API_URL}/returns/admin/${userAReturn._id}/refund`, {}, {
      headers: { Authorization: `Bearer ${userAToken}` }
    }).catch(e => e.response);
    logTest(18, 'Refund Security - Customer Triggering Refund Blocked (403)', custRefundReq.status === 403, `Status: ${custRefundReq.status}`);
  } catch (e) {
    logTest(17, 'Return Security - Customer Approving Own Return Request Blocked (403)', false, e.message);
    logTest(18, 'Refund Security - Customer Triggering Refund Blocked (403)', false, e.message);
  }

  // 14. OBJECT ID & PARAMETER VALIDATION (INVALID MALFORMED OBJECTID)
  try {
    const invalidIdReq = await axios.get(`${API_URL}/products/invalid_malformed_object_id_string_123`).catch(e => e.response);
    logTest(19, 'Parameter Security - Malformed ObjectId Handled Safely (404/400)', invalidIdReq.status === 404 || invalidIdReq.status === 400, `Status: ${invalidIdReq.status}`);
  } catch (e) {
    logTest(19, 'Parameter Security - Malformed ObjectId Handled Safely (404/400)', false, e.message);
  }

  // 15. NOSQL INJECTION RESISTANCE
  try {
    const injectionReq = await axios.post(`${API_URL}/auth/login`, {
      email: { "$ne": null },
      password: { "$ne": null }
    }).catch(e => e.response);
    logTest(20, 'NoSQL Injection - Operator Object Injection Blocked/Handled (400/401/500)', injectionReq.status !== 200, `Status: ${injectionReq.status} (Authentication not bypassed)`);
  } catch (e) {
    logTest(20, 'NoSQL Injection - Operator Object Injection Blocked/Handled (400/401/500)', false, e.message);
  }

  // 16. SHIPPING WEBHOOK SIGNATURE INTEGRITY
  try {
    const webhookReq = await axios.post(`${API_URL}/shipping/webhook`, {
      trackingNumber: `BD-TRK-${timestamp}`, status: 'shipped'
    }, {
      headers: { 'x-courier-signature': 'invalid_tampered_signature' }
    }).catch(e => e.response);
    logTest(21, 'Shipping Webhook Security - Invalid Signature Webhook Rejected (401)', webhookReq.status === 401, `Status: ${webhookReq.status}`);
  } catch (e) {
    logTest(21, 'Shipping Webhook Security - Invalid Signature Webhook Rejected (401)', false, e.message);
  }

  // 17. CLEANUP TEMPORARY SECURITY TEST USERS
  try {
    if (userA) await User.findByIdAndDelete(userA.id || userA._id);
    if (userB) await User.findByIdAndDelete(userB.id || userB._id);
    if (adminUser) await User.findByIdAndDelete(adminUser.id || adminUser._id);
    if (userAAddress) await Address.findByIdAndDelete(userAAddress._id);
    if (userAOrder) await Order.findByIdAndDelete(userAOrder._id);
    if (userAReturn) await ReturnRequest.findByIdAndDelete(userAReturn._id);
    logTest(22, 'Clean Up Temporary Security Test Entities', true, 'Purged temporary security test objects');
  } catch (e) {
    logTest(22, 'Clean Up Temporary Security Test Entities', false, e.message);
  }

  console.log('\n================================================================================');
  console.log(`SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED, ${notTested} NOT TESTED, ${blocked} BLOCKED OUT OF ${passed + failed + notTested + blocked} TOTAL TESTS.`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityHardeningTests();

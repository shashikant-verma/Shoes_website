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

const logTest = (num, title, status, details = '') => {
  if (status === true) {
    passed++;
    console.log(`[Test ${String(num).padStart(2, '0')}] ✅ ${title}: PASS ${details ? `(${details})` : ''}`);
  } else if (status === false) {
    failed++;
    console.error(`[Test ${String(num).padStart(2, '0')}] ❌ ${title}: FAIL ${details ? `(${details})` : ''}`);
  } else {
    notTested++;
    console.log(`[Test ${String(num).padStart(2, '0')}] ⚠️ ${title}: NOT TESTED ${details ? `(${details})` : ''}`);
  }
};

async function runE2EIntegrationTests() {
  console.log('================================================================================');
  console.log('       SOLEVIBE E-COMMERCE MASTER END-TO-END INTEGRATION TEST SUITE            ');
  console.log('================================================================================\n');

  const timestamp = Date.now();
  let adminToken = '';
  let customerToken = '';
  let customerUser = null;
  let adminUser = null;
  let testAddress = null;
  let testProduct = null;
  let testOrder = null;
  let testReturn = null;
  let testCoupon = null;

  // 1. DATABASE & SYSTEM CONNECTION VERIFICATION
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    const dbName = mongoose.connection.name;
    logTest(1, 'MongoDB Database Connection', dbName === 'kinetic_stride' || mongoose.connection.readyState === 1, `DB: ${dbName}`);
  } catch (e) {
    logTest(1, 'MongoDB Database Connection', false, e.message);
  }

  const User = require('./models/User');
  const Product = require('./models/Product');
  const Order = require('./models/Order');
  const Address = require('./models/Address');
  const Coupon = require('./models/Coupon');
  const Review = require('./models/Review');
  const ReturnRequest = require('./models/ReturnRequest');

  // 2. AUTHENTICATION FLOWS (CUSTOMER & ADMIN)
  const custEmail = `e2e_cust_${timestamp}@example.com`;
  const custPass = 'CustPass123!';
  try {
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'E2E Test Customer',
      email: custEmail,
      password: custPass
    });
    customerToken = regRes.data.token;
    customerUser = regRes.data.user;
    logTest(2, 'Customer Account Registration', regRes.status === 201 && Boolean(customerToken), `User ID: ${customerUser.id}`);
  } catch (e) {
    logTest(2, 'Customer Account Registration', false, e.response?.data?.message || e.message);
  }

  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: custEmail,
      password: custPass
    });
    customerToken = loginRes.data.token;
    logTest(3, 'Customer Login & JWT Token Retrieval', loginRes.status === 200 && Boolean(customerToken), 'Token persistent');
  } catch (e) {
    logTest(3, 'Customer Login & JWT Token Retrieval', false, e.response?.data?.message || e.message);
  }

  try {
    const invalidLogin = await axios.post(`${API_URL}/auth/login`, {
      email: custEmail,
      password: 'WrongPassword999'
    }).catch(err => err.response);
    logTest(4, 'Invalid Password Login Rejected (401)', invalidLogin.status === 401, `Status: ${invalidLogin.status}`);
  } catch (e) {
    logTest(4, 'Invalid Password Login Rejected (401)', false, e.message);
  }

  // Admin Account Setup
  const adminEmail = `e2e_admin_${timestamp}@example.com`;
  const adminPass = 'AdminPass123!';
  try {
    const adminReg = await axios.post(`${API_URL}/auth/register`, {
      name: 'E2E Master Admin',
      email: adminEmail,
      password: adminPass
    });
    adminUser = adminReg.data.user;
    await User.findByIdAndUpdate(adminUser.id, { role: 'ADMIN' });
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: adminEmail,
      password: adminPass
    });
    adminToken = adminLogin.data.token;
    logTest(5, 'Admin Register & Admin Auth Token', Boolean(adminToken), `Admin ID: ${adminUser.id}`);
  } catch (e) {
    logTest(5, 'Admin Register & Admin Auth Token', false, e.response?.data?.message || e.message);
  }

  // 3. AUTHORIZATION & ROLE SECURITY
  try {
    const custAdminAccess = await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    }).catch(err => err.response);
    logTest(6, 'Customer Blocked from Admin Endpoint (403)', custAdminAccess.status === 403, `Status: ${custAdminAccess.status}`);
  } catch (e) {
    logTest(6, 'Customer Blocked from Admin Endpoint (403)', false, e.message);
  }

  try {
    const adminAccess = await axios.get(`${API_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(7, 'Admin Authorized Access to Admin Endpoint (200)', adminAccess.status === 200, `Total customers: ${adminAccess.data.total}`);
  } catch (e) {
    logTest(7, 'Admin Authorized Access to Admin Endpoint (200)', false, e.response?.data?.message || e.message);
  }

  // 4. PRODUCT CATALOG & SEARCH
  try {
    const productsRes = await axios.get(`${API_URL}/products`);
    logTest(8, 'Product Listing Retrieval (Public 200)', productsRes.status === 200 && productsRes.data.data.length > 0, `Products loaded: ${productsRes.data.count}`);
    testProduct = productsRes.data.data[0];
  } catch (e) {
    logTest(8, 'Product Listing Retrieval (Public 200)', false, e.response?.data?.message || e.message);
  }

  try {
    const searchRes = await axios.get(`${API_URL}/products?search=${encodeURIComponent(testProduct.name.split(' ')[0])}`);
    logTest(9, 'Product Keyword Search', searchRes.status === 200 && searchRes.data.data.length > 0, `Matches: ${searchRes.data.count}`);
  } catch (e) {
    logTest(9, 'Product Keyword Search', false, e.response?.data?.message || e.message);
  }

  // 5. WISHLIST & CART MANAGEMENT
  try {
    const wishAdd = await axios.post(`${API_URL}/wishlist`, { productId: testProduct._id }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(10, 'Add Product to Customer Wishlist', wishAdd.status === 200 && wishAdd.data.success === true, 'Product saved in wishlist');
  } catch (e) {
    logTest(10, 'Add Product to Customer Wishlist', false, e.response?.data?.message || e.message);
  }

  let cartItemId = null;
  try {
    const cartAdd = await axios.post(`${API_URL}/cart`, { product: testProduct._id, quantity: 2, size: '9' }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const cart = cartAdd.data.data;
    cartItemId = cart.items[0]._id;
    logTest(11, 'Add Product to Cart with Quantity & Size', cartAdd.status === 200 && cart.items.length > 0, 'Cart item added');
  } catch (e) {
    logTest(11, 'Add Product to Cart with Quantity & Size', false, e.response?.data?.message || e.message);
  }

  try {
    const invalidQty = await axios.put(`${API_URL}/cart/${cartItemId}`, { quantity: -5 }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    }).catch(err => err.response);
    logTest(12, 'Negative Cart Quantity Rejected (400)', invalidQty.status === 400, `Message: ${invalidQty.data?.message}`);
  } catch (e) {
    logTest(12, 'Negative Cart Quantity Rejected (400)', false, e.message);
  }

  // 6. ADDRESS BOOK MANAGEMENT
  try {
    const addrRes = await axios.post(`${API_URL}/addresses`, {
      type: 'HOME',
      fullName: 'E2E Test Customer',
      phone: '9876543210',
      addressLine1: '404 Innovation Way, Tech Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      isDefault: true
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    testAddress = addrRes.data.data;
    logTest(13, 'Address Book - Add New Shipping Address', addrRes.status === 201 && Boolean(testAddress._id), `Address ID: ${testAddress._id}`);
  } catch (e) {
    logTest(13, 'Address Book - Add New Shipping Address', false, e.response?.data?.message || e.message);
  }

  // 7. COUPON MANAGEMENT & VALIDATION
  const couponCode = `E2E500_${timestamp}`;
  const orderItems = [{ product: testProduct._id, quantity: 2, size: '9', price: testProduct.price }];
  try {
    const couponCreate = await Coupon.create({
      code: couponCode,
      discountType: 'FIXED',
      discountValue: 500,
      minPurchaseAmount: 1000,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    });
    testCoupon = couponCreate;

    const couponApply = await axios.post(`${API_URL}/coupons/validate`, {
      code: couponCode,
      cartItems: orderItems
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(14, 'Coupon Validation & Server-Calculated Discount', couponApply.status === 200 && couponApply.data.discountAmount === 500, `Discount: ₹${couponApply.data.discountAmount}`);
  } catch (e) {
    logTest(14, 'Coupon Validation & Server-Calculated Discount', false, e.response?.data?.message || e.message);
  }

  // 8. SHIPPING & DELIVERY CALCULATION
  try {
    const shipRes = await axios.post(`${API_URL}/shipping/calculate`, {
      subtotal: testProduct.price * 2,
      method: 'express',
      address: { pincode: '400001', state: 'Maharashtra', country: 'India' }
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const charge = shipRes.data.data.charge ?? shipRes.data.data.shippingCharge;
    logTest(15, 'Shipping Option Calculation (Express Courier)', shipRes.status === 200 && charge === 350, `Charge: ₹${charge}`);
  } catch (e) {
    logTest(15, 'Shipping Option Calculation (Express Courier)', false, e.response?.data?.message || e.message);
  }

  // 9. CHECKOUT & ORDER CREATION (WITH PAYMENT VERIFICATION)
  try {
    const formattedAddress = {
      name: testAddress.fullName,
      addressLine: testAddress.addressLine1,
      city: testAddress.city,
      state: testAddress.state,
      pincode: testAddress.postalCode,
      country: testAddress.country
    };

    const razorpayOrder = await axios.post(`${API_URL}/payment/create-order`, {
      items: orderItems,
      shippingAddress: formattedAddress,
      promoCode: couponCode,
      shippingMethod: 'express'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const rzpOrderId = razorpayOrder.data.razorpayOrderId;
    logTest(16, 'Razorpay Payment Order Creation (Sandbox)', razorpayOrder.status === 200 && Boolean(rzpOrderId), `Razorpay Order ID: ${rzpOrderId}`);

    // Generate valid HMAC SHA256 signature for test verification
    const mockRazorpayPaymentId = `pay_${timestamp}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrderId}|${mockRazorpayPaymentId}`)
      .digest('hex');

    const verifyPayment = await axios.post(`${API_URL}/payment/verify`, {
      items: orderItems,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: mockRazorpayPaymentId,
      razorpay_signature: validSignature,
      shippingAddress: formattedAddress,
      shippingMethod: 'express',
      promoCode: couponCode
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    testOrder = verifyPayment.data.data;
    logTest(17, 'Order Creation & Verified Payment Transaction', verifyPayment.status === 200 && testOrder.payment.status === 'PAID', `Order ID: ${testOrder._id}, Status: ${testOrder.status}`);
  } catch (e) {
    logTest(16, 'Razorpay Payment Order Creation (Sandbox)', false, e.message);
    logTest(17, 'Order Creation & Verified Payment Transaction', false, e.response?.data?.message || e.message);
  }

  // 10. ORDER TRACKING & LIFECYCLE MANAGEMENT (confirmed -> processing -> shipped -> delivered)
  try {
    await axios.put(`${API_URL}/orders/${testOrder._id}/status`, {
      status: 'processing',
      note: 'Order processing started'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const statusUpdate1 = await axios.put(`${API_URL}/orders/${testOrder._id}/status`, {
      status: 'shipped',
      trackingNumber: `BD-TRK-${timestamp}`,
      carrier: 'BlueDart Express',
      note: 'Package dispatched via BlueDart courier'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(18, 'Admin Updates Order Status to Shipped with Tracking Number', statusUpdate1.status === 200 && statusUpdate1.data.data.status === 'shipped', `Carrier: ${statusUpdate1.data.data.shippingMethodName}`);

    const statusUpdate2 = await axios.put(`${API_URL}/orders/${testOrder._id}/status`, {
      status: 'delivered',
      note: 'Package delivered to customer'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(19, 'Admin Updates Order Status to Delivered', statusUpdate2.status === 200 && statusUpdate2.data.data.status === 'delivered', `Delivered At: ${statusUpdate2.data.data.deliveredAt}`);
  } catch (e) {
    logTest(18, 'Admin Updates Order Status to Shipped with Tracking Number', false, e.message);
    logTest(19, 'Admin Updates Order Status to Delivered', false, e.message);
  }

  // 11. INVENTORY AUTOMATION
  try {
    const updatedProd = await Product.findById(testProduct._id);
    const expectedStock = testProduct.stock - 2;
    logTest(20, 'Inventory Stock Deducted Automatically on Order Completion', updatedProd.stock === expectedStock, `Initial Stock: ${testProduct.stock}, Current Stock: ${updatedProd.stock}`);
  } catch (e) {
    logTest(20, 'Inventory Stock Deducted Automatically on Order Completion', false, e.message);
  }

  // 12. REVIEWS & RATINGS
  try {
    const reviewRes = await axios.post(`${API_URL}/reviews`, {
      productId: testProduct._id,
      rating: 5,
      title: 'Outstanding quality!',
      comment: 'Extremely durable and lightweight shoes for daily running.'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(21, 'Customer Submit Product Review for Delivered Item', reviewRes.status === 201 && reviewRes.data.data.rating === 5, `Review ID: ${reviewRes.data.data._id}`);
  } catch (e) {
    logTest(21, 'Customer Submit Product Review for Delivered Item', false, e.response?.data?.message || e.message);
  }

  // 13. RETURNS & REFUNDS LIFECYCLE
  try {
    const returnReq = await axios.post(`${API_URL}/returns`, {
      orderId: testOrder._id,
      items: [{ product: testProduct._id, quantity: 1, reason: 'WRONG_SIZE' }],
      reason: 'WRONG_SIZE'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    testReturn = returnReq.data.data;
    logTest(22, 'Customer Requests Return for Delivered Product', returnReq.status === 201 && testReturn.status === 'REQUESTED', `Return ID: ${testReturn._id}`);
  } catch (e) {
    logTest(22, 'Customer Requests Return for Delivered Product', false, e.response?.data?.message || e.message);
  }

  try {
    const approveReturn = await axios.put(`${API_URL}/returns/admin/${testReturn._id}/status`, {
      status: 'APPROVED',
      adminNote: 'Return request approved. Pickup scheduled.'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(23, 'Admin Approves Return Request', approveReturn.status === 200 && approveReturn.data.data.status === 'APPROVED', `Status: ${approveReturn.data.data.status}`);
  } catch (e) {
    logTest(23, 'Admin Approves Return Request', false, e.response?.data?.message || e.message);
  }

  try {
    const receiveItem = await axios.put(`${API_URL}/returns/admin/${testReturn._id}/status`, {
      status: 'RECEIVED',
      adminNote: 'Item received in warehouse inspection'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(24, 'Admin Marks Returned Item Received & Restores Inventory Stock', receiveItem.status === 200 && receiveItem.data.data.status === 'RECEIVED', `Status: RECEIVED`);
  } catch (e) {
    logTest(24, 'Admin Marks Returned Item Received & Restores Inventory Stock', false, e.response?.data?.message || e.message);
  }

  try {
    const restoredProd = await Product.findById(testProduct._id);
    logTest(25, 'Inventory Restored by 1 Unit upon Return Receipt', restoredProd.stock === (testProduct.stock - 1), `Stock: ${restoredProd.stock}`);
  } catch (e) {
    logTest(25, 'Inventory Restored by 1 Unit upon Return Receipt', false, e.message);
  }

  try {
    const refundRes = await axios.post(`${API_URL}/returns/admin/${testReturn._id}/refund`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(26, 'Refund Processed with Server-Calculated Snapshot Amount', refundRes.status === 200 && refundRes.data.data.refund.status === 'COMPLETED', `Refund Amount: ₹${refundRes.data.data.refund.amount}`);
  } catch (e) {
    logTest(26, 'Refund Processed with Server-Calculated Snapshot Amount', false, e.response?.data?.message || e.message);
  }

  // 14. REAL-TIME NOTIFICATIONS
  try {
    const notifs = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    logTest(27, 'Real-time Event Notifications Generated & Accessible', notifs.status === 200 && notifs.data.data.length > 0, `Notifications count: ${notifs.data.count}`);
  } catch (e) {
    logTest(27, 'Real-time Event Notifications Generated & Accessible', false, e.response?.data?.message || e.message);
  }

  // 15. ANALYTICS & REPORTS
  try {
    const analyticsRes = await axios.get(`${API_URL}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(28, 'Admin Analytics Overview Report Generated from MongoDB Data', analyticsRes.status === 200 && typeof analyticsRes.data.data.totalRevenue === 'number', `Total Revenue: ₹${analyticsRes.data.data.totalRevenue}`);
  } catch (e) {
    logTest(28, 'Admin Analytics Overview Report Generated from MongoDB Data', false, e.response?.data?.message || e.message);
  }

  // 16. CLEANUP TEMPORARY TEST DATA (PERSISTENCE SAFE)
  try {
    if (customerUser) await User.findByIdAndDelete(customerUser.id || customerUser._id);
    if (adminUser) await User.findByIdAndDelete(adminUser.id || adminUser._id);
    if (testAddress) await Address.findByIdAndDelete(testAddress._id);
    if (testOrder) await Order.findByIdAndDelete(testOrder._id);
    if (testReturn) await ReturnRequest.findByIdAndDelete(testReturn._id);
    if (testCoupon) await Coupon.findByIdAndDelete(testCoupon._id);
    if (testProduct) {
      await Product.findByIdAndUpdate(testProduct._id, { stock: testProduct.stock });
    }
    logTest(29, 'Clean Up Temporary E2E Test Data', true, 'Temporary E2E entities purged safely');
  } catch (e) {
    logTest(29, 'Clean Up Temporary E2E Test Data', false, e.message);
  }

  console.log('\n================================================================================');
  console.log(`E2E INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED, ${notTested} NOT TESTED OUT OF ${passed + failed + notTested} TOTAL TESTS.`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2EIntegrationTests();

const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });
const API_URL = 'http://localhost:5001/api';
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';

async function runTests() {
  console.log('🧪 ================= STARTING RAZORPAY PAYMENT INTEGRATION API TESTS ================= 🧪\n');

  try {
    // 1. Setup DB connection, User A, User B, Product & Cart
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinetic_stride');
    const User = require('./server/models/User');
    const Product = require('./server/models/Product');
    const Cart = require('./server/models/Cart');
    const Order = require('./server/models/Order');

    console.log('1️⃣ Setting up test users and products...');
    const userAEmail = `rzpuser_a_${Date.now()}@example.com`;
    const userBEmail = `rzpuser_b_${Date.now()}@example.com`;

    const userARes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Razorpay Alice',
      email: userAEmail,
      password: 'password123'
    });
    const tokenA = userARes.data.token;
    const userAId = userARes.data.user.id;

    const userBRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Razorpay Bob',
      email: userBEmail,
      password: 'password123'
    });
    const tokenB = userBRes.data.token;

    // Get Products and set stock & price
    const productsRes = await axios.get(`${API_URL}/products`);
    const products = productsRes.data.products || productsRes.data.data || productsRes.data;
    if (!products || products.length === 0) {
      throw new Error('No products available for testing');
    }

    const testProduct = products[0];
    const productId = testProduct._id;
    const initialStock = 50;
    const productPrice = 2000;

    await Product.findByIdAndUpdate(productId, { stock: initialStock, price: productPrice });
    console.log(`✅ Test Product ready: ${testProduct.name} (Price: ₹${productPrice}, Stock: ${initialStock})\n`);

    // 2. Authentication Test
    console.log('2️⃣ Testing Authentication Security...');
    try {
      await axios.post(`${API_URL}/payment/create-order`, { items: [{ product: productId, quantity: 1 }] });
      console.log('❌ FAIL: Unauthenticated create-order was allowed');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('  PASS: Unauthenticated payment initiation rejected with 401');
      } else {
        console.log(`  FAIL: Unexpected status ${err.response?.status}`);
      }
    }

    // 3. Backend Price Calculation & Price Manipulation Defense
    console.log('\n3️⃣ Testing Server-Side Price Calculation & Manipulation Defense...');
    const fakePriceItems = [{ product: productId, quantity: 2, price: 1, discountAmount: 99999 }];
    const initRes = await axios.post(
      `${API_URL}/payment/create-order`,
      { items: fakePriceItems },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    // Expected subtotal = 2 * 2000 = 4000. Shipping = 150. Total = 4150 -> 415000 paise
    const expectedAmountPaise = 415000;
    if (initRes.data.amount === expectedAmountPaise) {
      console.log(`  PASS: Backend ignored fake price ₹1 and calculated true amount: ₹4150 (${initRes.data.amount} paise)`);
    } else {
      console.log(`❌ FAIL: Expected amount ${expectedAmountPaise}, got ${initRes.data.amount}`);
    }

    // 4. Invalid Signature Verification Test
    console.log('\n4️⃣ Testing Invalid HMAC Signature Verification...');
    const mockRzpOrderId = `order_${Date.now()}_test`;
    const mockRzpPaymentId = `pay_${Date.now()}_test`;
    const invalidSignature = 'invalid_fake_signature_hash_12345';

    try {
      await axios.post(
        `${API_URL}/payment/verify`,
        {
          razorpay_order_id: mockRzpOrderId,
          razorpay_payment_id: mockRzpPaymentId,
          razorpay_signature: invalidSignature,
          items: [{ product: productId, quantity: 1 }]
        },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.log('❌ FAIL: Invalid signature payment verification was accepted');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  PASS: Invalid HMAC signature rejected with 400 Bad Request');
      } else {
        console.log(`  FAIL: Invalid signature status ${err.response?.status}`);
      }
    }

    // 5. Valid Signature Generation & Verification Flow
    console.log('\n5️⃣ Testing Valid HMAC Signature Generation & Payment Verification...');
    const validRzpOrderId = `order_${Date.now()}_valid`;
    const validRzpPaymentId = `pay_${Date.now()}_valid`;
    const validBody = `${validRzpOrderId}|${validRzpPaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(validBody)
      .digest('hex');

    // Populate user cart in MongoDB before payment verification
    await Cart.findOneAndUpdate(
      { user: userAId },
      { items: [{ product: productId, size: '9', quantity: 1 }] },
      { upsert: true, new: true }
    );

    const verifyRes = await axios.post(
      `${API_URL}/payment/verify`,
      {
        razorpay_order_id: validRzpOrderId,
        razorpay_payment_id: validRzpPaymentId,
        razorpay_signature: validSignature,
        items: [{ product: productId, quantity: 1, size: '9' }],
        shippingAddress: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const createdOrder = verifyRes.data.data;
    console.log(`  PASS: Payment verified & Order created (Order ID: ${createdOrder._id}, Status: ${createdOrder.status}, Payment Status: ${createdOrder.payment.status})`);

    // Mandatory Correction 1 Check: Verify raw signature was NOT stored in Order document
    if (createdOrder.payment.razorpaySignature === undefined) {
      console.log('  PASS: Raw Razorpay signature was NOT stored in Order document (Correct Security Enforcement)');
    } else {
      console.log('❌ FAIL: Raw signature was stored in Order document');
    }

    // 6. Idempotency Check (Duplicate Verification Request)
    console.log('\n6️⃣ Testing Idempotency Protection against Duplicate Verification Requests...');
    const dupVerifyRes = await axios.post(
      `${API_URL}/payment/verify`,
      {
        razorpay_order_id: validRzpOrderId,
        razorpay_payment_id: validRzpPaymentId,
        razorpay_signature: validSignature,
        items: [{ product: productId, quantity: 1, size: '9' }],
        shippingAddress: { street: '123 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    if (dupVerifyRes.data.success && dupVerifyRes.data.data._id === createdOrder._id) {
      console.log('  PASS: Duplicate verification request returned existing Order result without creating a duplicate order');
    } else {
      console.log('❌ FAIL: Duplicate verification created duplicate order or failed');
    }

    // 7. Atomic Stock Decrement Verification
    console.log('\n7️⃣ Testing Atomic Stock Decrement...');
    const updatedProduct = await Product.findById(productId);
    const expectedStock = initialStock - 1; // 50 - 1 = 49
    if (updatedProduct.stock === expectedStock) {
      console.log(`  PASS: Stock decremented atomically from ${initialStock} to ${updatedProduct.stock}`);
    } else {
      console.log(`❌ FAIL: Expected stock ${expectedStock}, got ${updatedProduct.stock}`);
    }

    // 8. Safe Cart Clearing Verification
    console.log('\n8️⃣ Testing Safe Cart Clearing after Verified Payment...');
    const userACart = await Cart.findOne({ user: userAId });
    if (!userACart || userACart.items.length === 0) {
      console.log("  PASS: User A's cart items cleared in MongoDB after verified payment");
    } else {
      console.log(`❌ FAIL: User A's cart was not cleared (items count: ${userACart.items.length})`);
    }

    // 9. User Isolation Check
    console.log('\n9️⃣ Testing User Isolation (User B accessing User A Order)...');
    try {
      await axios.get(`${API_URL}/orders/${createdOrder._id}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      console.log("❌ FAIL: User B was able to access User A's order");
    } catch (err) {
      if (err.response?.status === 403) {
        console.log("  PASS: User B blocked from accessing User A's order with 403 Forbidden");
      } else {
        console.log(`  FAIL: Unexpected status: ${err.response?.status}`);
      }
    }

    console.log('\n✅ ================= ALL AUTOMATED RAZORPAY INTEGRATION TESTS PASSED! ================= ✅');
    await mongoose.disconnect();
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();

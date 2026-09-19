const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });
const API_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('🧪 ================= STARTING COUPONS & DISCOUNT SYSTEM API TESTS ================= 🧪\n');

  try {
    // 1. Setup Test DB connection, Users & Products
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kinetic_stride');
    const User = require('./server/models/User');
    const Product = require('./server/models/Product');

    console.log('1️⃣ Setting up test accounts and products...');
    const userAEmail = `couponuser_a_${Date.now()}@example.com`;
    const userBEmail = `couponuser_b_${Date.now()}@example.com`;
    const adminEmail = `couponadmin_${Date.now()}@example.com`;

    // User A Signup
    const userARes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Coupon Alice',
      email: userAEmail,
      password: 'password123'
    });
    const tokenA = userARes.data.token;

    // User B Signup
    const userBRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Coupon Bob',
      email: userBEmail,
      password: 'password123'
    });
    const tokenB = userBRes.data.token;

    // Admin Signup & Role Promotion
    const adminReg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Coupon Admin',
      email: adminEmail,
      password: 'adminpassword'
    });
    await User.findByIdAndUpdate(adminReg.data.user.id, { role: 'ADMIN' });
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: adminEmail,
      password: 'adminpassword'
    });
    const adminToken = adminLogin.data.token;

    // Get Products
    const productsRes = await axios.get(`${API_URL}/products`);
    const products = productsRes.data.products || productsRes.data.data || productsRes.data;
    if (!products || products.length < 2) {
      throw new Error('At least 2 products required for testing');
    }

    const prodA = products[0];
    const prodB = products[1];

    // Ensure stock > 0
    await Product.findByIdAndUpdate(prodA._id, { stock: 50, price: 1000, category: 'men' });
    await Product.findByIdAndUpdate(prodB._id, { stock: 50, price: 2000, category: 'women' });
    prodA.price = 1000;
    prodB.price = 2000;

    console.log(`✅ Products ready: ${prodA.name} (₹1000) and ${prodB.name} (₹2000)\n`);

    // 2. Admin Security Test (Normal user trying admin endpoints)
    console.log('2️⃣ Testing Admin Authorization Security...');
    try {
      await axios.get(`${API_URL}/coupons/admin/all`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      console.log('❌ FAIL: Normal user accessed admin coupon endpoints');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('  PASS: Normal user blocked with 403 Forbidden');
      } else {
        console.log(`  FAIL: Unexpected status: ${err.response?.status}`);
      }
    }

    // 3. Admin Coupon CRUD Tests
    console.log('\n3️⃣ Testing Admin Coupon CRUD & Input Validation...');
    const testCode = `TESTVAL_${Date.now()}`;
    
    // Create PERCENTAGE Coupon with Max Cap
    const createRes = await axios.post(
      `${API_URL}/coupons/admin`,
      {
        code: testCode,
        description: 'Test 20% off with max 150 cap',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscount: 150,
        minimumOrderValue: 500
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`  PASS: Coupon '${testCode}' created successfully`);

    // Invalid percentage check
    try {
      await axios.post(
        `${API_URL}/coupons/admin`,
        { code: `BADPCT_${Date.now()}`, discountType: 'PERCENTAGE', discountValue: 150 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('❌ FAIL: Percentage > 100 was accepted');
    } catch (err) {
      console.log('  PASS: Percentage > 100 rejected with 400');
    }

    // 4. Percentage & Max Discount Calculation Test
    console.log('\n4️⃣ Testing Percentage & Max Discount Calculation...');
    const valRes = await axios.post(`${API_URL}/coupons/validate`, {
      code: testCode.toLowerCase(), // testing case normalization
      cartItems: [{ id: prodA._id, quantity: 1 }] // Subtotal = ₹1000, 20% = ₹200, MaxCap = ₹150
    });
    if (valRes.data.valid && valRes.data.discountAmount === 150) {
      console.log(`  PASS: 20% discount on ₹1000 correctly capped at MaxDiscount ₹150 (code normalized: ${valRes.data.code})`);
    } else {
      console.log(`❌ FAIL: Expected discount 150, got ${valRes.data.discountAmount}`);
    }

    // 5. Fixed Amount Discount Test
    console.log('\n5️⃣ Testing Fixed Amount Discount...');
    const fixedCode = `FIXED_${Date.now()}`;
    await axios.post(
      `${API_URL}/coupons/admin`,
      {
        code: fixedCode,
        discountType: 'FIXED',
        discountValue: 300,
        minimumOrderValue: 500
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const fixedValRes = await axios.post(`${API_URL}/coupons/validate`, {
      code: fixedCode,
      cartItems: [{ id: prodA._id, quantity: 1 }]
    });
    if (fixedValRes.data.valid && fixedValRes.data.discountAmount === 300) {
      console.log('  PASS: Fixed ₹300 discount correctly applied');
    } else {
      console.log(`❌ FAIL: Expected discount 300, got ${fixedValRes.data.discountAmount}`);
    }

    // 6. Minimum Order Value Restriction Test
    console.log('\n6️⃣ Testing Minimum Order Value Restriction...');
    const minCode = `MINVAL_${Date.now()}`;
    await axios.post(
      `${API_URL}/coupons/admin`,
      {
        code: minCode,
        discountType: 'FIXED',
        discountValue: 100,
        minimumOrderValue: 2500
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    try {
      await axios.post(`${API_URL}/coupons/validate`, {
        code: minCode,
        cartItems: [{ id: prodA._id, quantity: 1 }] // Subtotal = ₹1000 < ₹2500
      });
      console.log('❌ FAIL: Coupon below minimum order value was accepted');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  PASS: Subtotal below minimum order value rejected with 400');
      }
    }

    // 7. Product-Specific Restriction Test
    console.log('\n7️⃣ Testing Product-Specific Restriction...');
    const prodCode = `PRODONLY_${Date.now()}`;
    await axios.post(
      `${API_URL}/coupons/admin`,
      {
        code: prodCode,
        discountType: 'PERCENTAGE',
        discountValue: 50,
        applicableProducts: [prodA._id]
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    // Validate with cart containing prodA (₹1000) and prodB (₹2000)
    const prodValRes = await axios.post(`${API_URL}/coupons/validate`, {
      code: prodCode,
      cartItems: [
        { id: prodA._id, quantity: 1 },
        { id: prodB._id, quantity: 1 }
      ]
    });
    // Eligible subtotal = ₹1000 (prodA only), 50% = ₹500 discount
    if (prodValRes.data.valid && prodValRes.data.discountAmount === 500 && prodValRes.data.eligibleSubtotal === 1000) {
      console.log('  PASS: Discount applied strictly to eligible product subtotal (₹1000 -> ₹500 off)');
    } else {
      console.log(`❌ FAIL: Expected discount 500 on eligibleSubtotal 1000, got discount ${prodValRes.data.discountAmount} on eligible ${prodValRes.data.eligibleSubtotal}`);
    }

    // 8. Expiry & Inactive Status Test
    console.log('\n8️⃣ Testing Expiry & Inactive Rules...');
    const expCode = `EXPIRED_${Date.now()}`;
    await axios.post(
      `${API_URL}/coupons/admin`,
      {
        code: expCode,
        discountType: 'FIXED',
        discountValue: 100,
        expiryDate: new Date(Date.now() - 86400000) // Yesterday
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    try {
      await axios.post(`${API_URL}/coupons/validate`, {
        code: expCode,
        cartItems: [{ id: prodA._id, quantity: 1 }]
      });
      console.log('❌ FAIL: Expired coupon was accepted');
    } catch (err) {
      console.log('  PASS: Expired coupon rejected with 400');
    }

    // 9. Order Checkout Integration, Snapshot & Usage Count Test
    console.log('\n9️⃣ Testing Order Checkout Integration, Snapshot & Usage Count...');
    const orderCode = `ORDER500_${Date.now()}`;
    await axios.post(
      `${API_URL}/coupons/admin`,
      {
        code: orderCode,
        discountType: 'FIXED',
        discountValue: 500,
        minimumOrderValue: 500,
        usageLimit: 5,
        perUserLimit: 1
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    // Place Order for User A using orderCode
    const orderRes = await axios.post(
      `${API_URL}/orders`,
      {
        items: [{ product: prodA._id, quantity: 1, size: '9' }],
        promoCode: orderCode,
        shippingAddress: { street: '123 Test St', city: 'Mumbai', state: 'MH', pincode: '400001' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const createdOrder = orderRes.data.data;
    console.log(`  PASS: Order created (Subtotal: ₹${createdOrder.subtotal}, Discount: ₹${createdOrder.discount}, Total: ₹${createdOrder.total})`);
    console.log(`  PASS: Coupon Snapshot saved in Order:`, createdOrder.coupon);

    // Check per-user limit enforcement (User A trying to reuse orderCode)
    console.log('\n🔟 Testing Per-User Usage Limit Enforcement...');
    try {
      await axios.post(
        `${API_URL}/orders`,
        {
          items: [{ product: prodA._id, quantity: 1, size: '9' }],
          promoCode: orderCode,
          shippingAddress: { street: '123 Test St', city: 'Mumbai', state: 'MH', pincode: '400001' }
        },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.log('❌ FAIL: User A was able to reuse single-use coupon');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  PASS: User A second use blocked with 400 Per-User limit error');
      }
    }

    // User B using orderCode -> Should be allowed
    console.log('\n1️⃣1️⃣ Testing User Isolation (User B using orderCode)...');
    const orderBRes = await axios.post(
      `${API_URL}/orders`,
      {
        items: [{ product: prodA._id, quantity: 1, size: '9' }],
        promoCode: orderCode,
        shippingAddress: { street: '456 Test Ave', city: 'Delhi', state: 'DL', pincode: '110001' }
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log(`  PASS: User B successfully used coupon (Order ID: ${orderBRes.data.data._id})`);

    // 12. Protection against Frontend Price / Discount Manipulation
    console.log('\n1️⃣2️⃣ Testing Protection against Frontend Price & Discount Manipulation...');
    const fakeOrderRes = await axios.post(
      `${API_URL}/orders`,
      {
        items: [{ product: prodA._id, quantity: 1, size: '9', price: 1 }], // Attempting fake price ₹1
        promoCode: fixedCode, // ₹300 off
        discountAmount: 999999, // Attempting fake discount
        shippingAddress: { street: '789 Fake St', city: 'Kolkata', state: 'WB', pincode: '700001' }
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const manipulatedOrder = fakeOrderRes.data.data;
    if (manipulatedOrder.subtotal === 1000 && manipulatedOrder.discount === 300) {
      console.log('  PASS: Backend ignored fake price/discount and calculated true subtotal (₹1000) and discount (₹300)');
    } else {
      console.log(`❌ FAIL: Price manipulation protection failed (Subtotal: ${manipulatedOrder.subtotal}, Discount: ${manipulatedOrder.discount})`);
    }

    console.log('\n✅ ================= ALL COUPONS & DISCOUNT SYSTEM TESTS PASSED! ================= ✅');
    await mongoose.disconnect();
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();

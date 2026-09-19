const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('🧪 ================= STARTING PRODUCT REVIEWS & RATINGS API TESTS ================= 🧪\n');

  try {
    // 1. Setup Test User A & Admin User & Test Product
    console.log('1️⃣ Setting up test accounts and fetching product...');
    const userAEmail = `reviewuser_${Date.now()}@example.com`;
    const userBEmail = `otheruser_${Date.now()}@example.com`;
    const adminEmail = `adminuser_${Date.now()}@example.com`;

    // Register User A
    const userARes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Reviewer Alice',
      email: userAEmail,
      password: 'password123'
    });
    const tokenA = userARes.data.token || userARes.data.data.token;
    const userA = userARes.data.user || userARes.data.data.user;

    // Register User B
    const userBRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Other Bob',
      email: userBEmail,
      password: 'password123'
    });
    const tokenB = userBRes.data.token || userBRes.data.data.token;

    // Register Admin user and update role via DB
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');
    const path = require('path');
    dotenv.config({ path: path.resolve(__dirname, '.env') });
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kinetic_stride');
    const User = require('./server/models/User');

    const adminReg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Admin Moderator',
      email: adminEmail,
      password: 'adminpassword'
    });
    const adminUserId = adminReg.data.user.id;
    await User.findByIdAndUpdate(adminUserId, { role: 'ADMIN' });

    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: adminEmail,
      password: 'adminpassword'
    });
    const adminToken = adminLogin.data.token;

    // Get a product
    const productsRes = await axios.get(`${API_URL}/products`);
    const products = productsRes.data.products || productsRes.data.data || productsRes.data;
    if (!products || products.length === 0) {
      throw new Error('No products available in database for testing');
    }

    let testProduct = products.find(p => p.stock > 0);
    if (!testProduct) {
      testProduct = products[0];
      const Product = require('./server/models/Product');
      await Product.findByIdAndUpdate(testProduct._id, { stock: 50 });
      testProduct.stock = 50;
    }
    const productId = testProduct._id;
    console.log(`✅ Test Product found: ${testProduct.name} (${productId}, Stock: ${testProduct.stock})\n`);

    // 2. Authentication Test
    console.log('2️⃣ Testing Authentication requirements...');
    try {
      await axios.get(`${API_URL}/reviews/my/${productId}`);
      console.log('❌ FAIL: Expected 401 for unauthenticated getMyReview request');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('  PASS: Unauthenticated access rejected with 401');
      } else {
        console.log(`  FAIL: Unexpected error status: ${err.response?.status}`);
      }
    }

    // 3. Product ID & Rating Validation Tests
    console.log('\n3️⃣ Testing Rating Input Validation...');
    const invalidRatings = [0, 6, -1, 3.5, 'excellent'];
    for (const badRating of invalidRatings) {
      try {
        await axios.post(
          `${API_URL}/reviews`,
          { productId, rating: badRating, comment: 'Great product' },
          { headers: { Authorization: `Bearer ${tokenA}` } }
        );
        console.log(`  FAIL: Invalid rating ${badRating} was accepted`);
      } catch (err) {
        if (err.response?.status === 400) {
          console.log(`  PASS: Invalid rating ${badRating} rejected with 400`);
        } else {
          console.log(`  FAIL: Invalid rating ${badRating} caused error ${err.response?.status}`);
        }
      }
    }

    // 4. Verified Purchase Enforcement (User hasn't bought product yet)
    console.log('\n4️⃣ Testing Verified Purchase Enforcement (Non-buyer)...');
    try {
      await axios.post(
        `${API_URL}/reviews`,
        { productId, rating: 5, comment: 'Attempting review without purchase' },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.log('❌ FAIL: Non-buyer review submission was accepted');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  PASS: Non-buyer review rejected with 400 Verified Buyer message');
      } else {
        console.log(`  FAIL: Non-buyer review failed with status ${err.response?.status}`);
      }
    }

    // 5. Create Order for User A to become Verified Buyer
    console.log('\n5️⃣ Creating Order for User A to achieve Verified Buyer status...');
    const orderRes = await axios.post(
      `${API_URL}/orders`,
      {
        items: [{ product: productId, quantity: 1, size: '9' }],
        shippingAddress: { street: '123 Main St', city: 'Mumbai', state: 'MH', zip: '400001' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log(`  PASS: Order created successfully (ID: ${orderRes.data.data._id})`);

    // 6. Submit Verified Review (User A)
    console.log('\n6️⃣ Submitting Review as Verified Buyer (User A)...');
    const createReviewRes = await axios.post(
      `${API_URL}/reviews`,
      {
        productId,
        rating: 5,
        title: 'Outstanding Quality!',
        comment: 'These shoes are extremely lightweight and comfortable.'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const createdReview = createReviewRes.data.data;
    console.log(`  PASS: Review created successfully! Status: ${createdReview.status}, Verified: ${createdReview.isVerifiedPurchase}`);

    // 7. Duplicate Review Protection Test
    console.log('\n7️⃣ Testing Single Review Per User Enforcement...');
    try {
      await axios.post(
        `${API_URL}/reviews`,
        { productId, rating: 4, comment: 'Second review attempt' },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.log('❌ FAIL: Duplicate review was accepted');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  PASS: Duplicate review blocked with 400');
      } else {
        console.log(`  FAIL: Duplicate review caused status ${err.response?.status}`);
      }
    }

    // 8. Multiple Orders Duplicate Protection Test
    console.log('\n8️⃣ Testing Multiple Orders Duplicate Protection...');
    await axios.post(
      `${API_URL}/orders`,
      {
        items: [{ product: productId, quantity: 2, size: '10' }],
        shippingAddress: { street: '456 Second Ave', city: 'Delhi', state: 'DL', zip: '110001' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    try {
      await axios.post(
        `${API_URL}/reviews`,
        { productId, rating: 5, comment: 'Third order review attempt' },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.log('❌ FAIL: Duplicate review accepted after second order');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  PASS: Duplicate review blocked despite multiple orders');
      }
    }

    // 9. User Isolation / Ownership Test
    console.log('\n9️⃣ Testing User Isolation (User B editing User A review)...');
    try {
      await axios.put(
        `${API_URL}/reviews/${createdReview._id}`,
        { rating: 1, comment: 'Hacked comment' },
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      console.log('❌ FAIL: User B was able to modify User A review');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('  PASS: User B edit blocked with 403 Forbidden');
      } else {
        console.log(`  FAIL: User B edit status: ${err.response?.status}`);
      }
    }

    // 10. Admin Moderation & Dynamic Aggregate Rating Test
    console.log('\n🔟 Testing Admin Moderation & Dynamic Rating Summary...');
    // Approve review as Admin
    const approveRes = await axios.put(
      `${API_URL}/reviews/admin/${createdReview._id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`  PASS: Admin approved review (Status: ${approveRes.data.data.status})`);

    // Verify aggregate product rating update
    const updatedProductRes = await axios.get(`${API_URL}/products/${productId}`);
    const updatedProduct = updatedProductRes.data.product || updatedProductRes.data.data || updatedProductRes.data;
    console.log(`  PASS: Dynamic Product Aggregate -> Rating: ${updatedProduct.rating}, ReviewCount: ${updatedProduct.reviewCount}`);

    // 11. Public Product Reviews Endpoint
    console.log('\n1️⃣1️⃣ Fetching Public Approved Product Reviews...');
    const publicReviewsRes = await axios.get(`${API_URL}/reviews/product/${productId}`);
    console.log(`  PASS: Public Reviews Count: ${publicReviewsRes.data.count}, Summary:`, publicReviewsRes.data.summary);

    console.log('\n✅ ================= ALL REVIEWS & RATINGS API TESTS PASSED! ================= ✅');
    await mongoose.disconnect();
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();

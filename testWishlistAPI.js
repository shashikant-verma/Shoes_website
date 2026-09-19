const axios = require('axios');
const mongoose = require('mongoose');

async function testAPI() {
  const PORT = 5001;
  const baseURL = `http://localhost:${PORT}/api`;
  
  try {
    // 1. Create a dummy user
    console.log('Registering user...');
    const email = `testuser_${Date.now()}@test.com`;
    let res = await axios.post(`${baseURL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'password123'
    });
    const token = res.data.token;
    console.log('User registered, got token');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Get first product from DB
    const Product = require('./server/models/Product');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kinetic_stride');
    const product = await Product.findOne({});
    if (!product) {
      console.log('No products found to test with.');
      process.exit(1);
    }
    const productId = product._id.toString();

    // 3. POST /api/wishlist
    console.log('Adding to wishlist...');
    res = await axios.post(`${baseURL}/wishlist`, { productId }, { headers });
    console.log('Added to wishlist:', res.data.success);
    
    // 4. GET /api/wishlist
    console.log('Fetching wishlist...');
    res = await axios.get(`${baseURL}/wishlist`, { headers });
    console.log('Wishlist items count:', res.data.data.items.length);

    // 5. DELETE /api/wishlist/:productId
    console.log('Removing from wishlist...');
    res = await axios.delete(`${baseURL}/wishlist/${productId}`, { headers });
    console.log('Wishlist items count after remove:', res.data.data.items.length);

    console.log('API TESTS PASSED');
    process.exit(0);
  } catch (error) {
    console.error('API TESTS FAILED', error.response?.data || error.message);
    process.exit(1);
  }
}

testAPI();

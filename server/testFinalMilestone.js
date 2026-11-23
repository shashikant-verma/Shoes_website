const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

async function runMilestoneVerification() {
  console.log('================================================================');
  console.log('       SOLEVIBE FINAL COMPLETION VERIFICATION SUITE             ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('1. Testing System Health & MongoDB Connection...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(healthRes.status === 200 && healthRes.data.database === 'connected', 'Database is connected and server is healthy');

    // 2. Categories API
    console.log('\n2. Testing Category Model & Endpoints (/api/categories)...');
    const catRes = await axios.get(`${BASE_URL}/categories`);
    assert(catRes.status === 200 && Array.isArray(catRes.data.data), 'GET /api/categories returned category list');
    assert(catRes.data.data.length >= 8, `Found ${catRes.data.data.length} categories (>=8 required)`);
    const slugExists = catRes.data.data.some(c => c.slug === 'running');
    assert(slugExists, 'Running category exists with slug auto-generation');

    // 3. Settings API
    console.log('\n3. Testing Store Settings (/api/settings)...');
    const settingsRes = await axios.get(`${BASE_URL}/settings`);
    assert(settingsRes.status === 200 && settingsRes.data.success, 'GET /api/settings returned store configuration');
    assert(settingsRes.data.data.storeName.includes('SoleVibe'), 'Store name is properly configured with SoleVibe');
    assert(settingsRes.data.data.currencyCode === 'INR', 'Currency is configured as INR');
    assert(settingsRes.data.data.freeShippingThreshold > 0, 'Free shipping threshold is configured');

    // 4. Product Search API
    console.log('\n4. Testing Product Search (/api/products?search=...)...');
    const searchRes = await axios.get(`${BASE_URL}/products?search=Ozark`);
    assert(searchRes.status === 200 && searchRes.data.success, 'GET /api/products?search=Ozark succeeded');
    assert(searchRes.data.data.length > 0, `Search for "Ozark" returned ${searchRes.data.data.length} matching products`);

    // 5. User Authentication
    console.log('\n5. Testing Customer Auth & Token Generation...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'john@example.com',
      password: 'password123'
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Customer login succeeded with JWT token');
    const userToken = loginRes.data.token;
    const userHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

    // 6. Address API
    console.log('\n6. Testing Address Book CRUD (/api/addresses)...');
    const addrRes = await axios.get(`${BASE_URL}/addresses`, userHeaders);
    assert(addrRes.status === 200 && Array.isArray(addrRes.data.data), 'Customer addresses fetched successfully');
    assert(addrRes.data.data.length > 0, `Customer has ${addrRes.data.data.length} saved addresses`);

    // 7. Cart API with MongoDB Sync
    console.log('\n7. Testing Cart API & Database Sync (/api/cart)...');
    const cartRes = await axios.get(`${BASE_URL}/cart`, userHeaders);
    assert(cartRes.status === 200 && cartRes.data.success, 'GET /api/cart succeeded');

    // 8. Shipping Provider Architecture & Calculation Engine
    console.log('\n8. Testing Shipping Provider Dispatcher & Shipping Calculation...');
    const shippingService = require('./services/shippingService');
    const shippingProviders = require('./services/shippingProviders');
    const provider = shippingProviders.getCourierProvider();
    assert(provider && typeof provider.createShipment === 'function', 'Active shipping provider resolved dynamically (createShipment)');

    const ratesRes = shippingService.calculateShipping({
      subtotal: 3500,
      address: { pincode: '400050', state: 'Maharashtra', country: 'India' }
    });
    assert(ratesRes.valid && ratesRes.zone === 'LOCAL', 'Shipping calculated with zone & destination validation');

    // 9. PaymentTransaction Audit Model
    console.log('\n9. Testing PaymentTransaction Model & Schema...');
    const PaymentTransaction = require('./models/PaymentTransaction');
    assert(typeof PaymentTransaction.create === 'function', 'PaymentTransaction Mongoose model is registered');

    // 10. Email Service Templates
    console.log('\n10. Testing Email Service & Templates...');
    const emailService = require('./services/emailService');
    assert(typeof emailService.sendOrderConfirmationEmail === 'function', 'sendOrderConfirmationEmail method exists');
    assert(typeof emailService.sendPaymentSuccessEmail === 'function', 'sendPaymentSuccessEmail method exists');
    assert(typeof emailService.sendShippingUpdateEmail === 'function', 'sendShippingUpdateEmail method exists');

    console.log('\n================================================================');
    console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runMilestoneVerification();

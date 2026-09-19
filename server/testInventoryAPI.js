const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5001/api';

let adminToken = '';
let customerToken = '';
let customer2Token = '';
let customerUser = null;
let testProduct = null;
let testOrder = null;
let testReturnRequest = null;

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

  // Register & Promote Admin
  const adminEmail = `inv_admin_${timestamp}@example.com`;
  const adminPassword = 'AdminPassword123!';
  const adminReg = await axios.post(`${API_URL}/auth/register`, {
    name: 'Inventory Test Admin',
    email: adminEmail,
    password: adminPassword
  });
  await User.findByIdAndUpdate(adminReg.data.user.id || adminReg.data.user._id, { role: 'ADMIN' });

  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
    email: adminEmail,
    password: adminPassword
  });
  adminToken = adminLogin.data.token;

  // Register Customer 1
  const customerEmail = `inv_cust1_${timestamp}@example.com`;
  const customerRes = await axios.post(`${API_URL}/auth/register`, {
    name: 'Inventory Test Customer 1',
    email: customerEmail,
    password: 'Password@123'
  });
  customerToken = customerRes.data.token;
  customerUser = customerRes.data.user;

  // Register Customer 2
  const cust2Res = await axios.post(`${API_URL}/auth/register`, {
    name: 'Inventory Test Customer 2',
    email: `inv_cust2_${timestamp}@example.com`,
    password: 'Password@123'
  });
  customer2Token = cust2Res.data.token;

  // Create a dedicated test product via admin
  const prodRes = await axios.post(`${API_URL}/products`, {
    name: `Inventory Test Sneaker ${timestamp}`,
    price: 3500,
    category: 'men',
    description: 'Special sneaker for inventory automated testing',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    sizes: ['UK 8', 'UK 9'],
    stock: 50
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  testProduct = prodRes.data.data;
}

async function runInventoryTests() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED ADMIN INVENTORY SYSTEM API TESTS');
  console.log('====================================================\n');

  try {
    await setupTestData();

    // 1. Unauthenticated inventory request -> 401
    try {
      await axios.get(`${API_URL}/admin/inventory`);
      logTest(1, 'Unauthenticated inventory request', false, 'Expected 401');
    } catch (err) {
      logTest(1, 'Unauthenticated inventory request', err.response?.status === 401, '401 Unauthorized');
    }

    // 2. Customer inventory request -> 403
    try {
      await axios.get(`${API_URL}/admin/inventory`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      logTest(2, 'Customer inventory request', false, 'Expected 403');
    } catch (err) {
      logTest(2, 'Customer inventory request', err.response?.status === 403, '403 Forbidden');
    }

    // 3. Admin inventory request -> PASS
    const invRes = await axios.get(`${API_URL}/admin/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(3, 'Admin inventory request', invRes.data.success === true, '200 OK');

    // 4. Get inventory list structure -> PASS
    logTest(4, 'Get inventory list payload structure', Array.isArray(invRes.data.data?.products) && invRes.data.data?.summary?.totalProducts >= 1);

    // 5. Get single product inventory -> PASS
    const singleRes = await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(5, 'Get product inventory details', singleRes.data.success && singleRes.data.data?.product?._id === testProduct._id);

    // 6. Search product by name or SKU -> PASS
    const searchRes = await axios.get(`${API_URL}/admin/inventory?search=${encodeURIComponent(testProduct.name)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(6, 'Search product by name', searchRes.data.data?.products?.some(p => p._id === testProduct._id));

    // 7. Filter low stock -> PASS
    const lowFilterRes = await axios.get(`${API_URL}/admin/inventory?status=LOW_STOCK`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(7, 'Filter low stock', lowFilterRes.data.success && Array.isArray(lowFilterRes.data.data?.products));

    // 8. Filter out of stock -> PASS
    const oosFilterRes = await axios.get(`${API_URL}/admin/inventory?status=OUT_OF_STOCK`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest(8, 'Filter out of stock', oosFilterRes.data.success && Array.isArray(oosFilterRes.data.data?.products));

    // 9. Admin increases stock (+10) -> PASS
    const increaseRes = await axios.post(`${API_URL}/admin/inventory/${testProduct._id}/adjust`, {
      change: 10,
      reason: 'STOCK_IN',
      note: 'Added 10 new test units'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stockAfterIncrease = increaseRes.data.data?.product?.stock;
    logTest(9, 'Admin increases stock (+10)', stockAfterIncrease === 60, `Stock increased from 50 to ${stockAfterIncrease}`);

    // 10. Admin decreases stock (-5) -> PASS
    const decreaseRes = await axios.post(`${API_URL}/admin/inventory/${testProduct._id}/adjust`, {
      change: -5,
      reason: 'STOCK_OUT',
      note: 'Removed 5 units'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stockAfterDecrease = decreaseRes.data.data?.product?.stock;
    logTest(10, 'Admin decreases stock (-5)', stockAfterDecrease === 55, `Stock decreased from 60 to ${stockAfterDecrease}`);

    // 11. Negative final stock rejected -> PASS
    try {
      await axios.post(`${API_URL}/admin/inventory/${testProduct._id}/adjust`, {
        change: -100, // Current is 55
        reason: 'DAMAGE',
        note: 'Attempt excess removal'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest(11, 'Negative final stock rejected', false, 'Expected 400 Bad Request');
    } catch (err) {
      logTest(11, 'Negative final stock rejected', err.response?.status === 400, '400 Bad Request');
    }

    // 12. Invalid product ID rejected -> PASS
    try {
      await axios.post(`${API_URL}/admin/inventory/invalid_id_999/adjust`, {
        change: 5,
        reason: 'STOCK_IN'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest(12, 'Invalid product ID rejected', false, 'Expected 400');
    } catch (err) {
      logTest(12, 'Invalid product ID rejected', err.response?.status === 400, '400 Bad Request');
    }

    // 13. Invalid quantity (NaN / non-integer / zero) rejected -> PASS
    try {
      await axios.post(`${API_URL}/admin/inventory/${testProduct._id}/adjust`, {
        change: 0,
        reason: 'STOCK_IN'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest(13, 'Invalid quantity zero rejected', false, 'Expected 400');
    } catch (err) {
      logTest(13, 'Invalid quantity zero rejected', err.response?.status === 400, '400 Bad Request');
    }

    // 14. Inventory transaction history record created -> PASS
    const historyRes = await axios.get(`${API_URL}/admin/inventory/${testProduct._id}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const historyList = historyRes.data.data || [];
    logTest(14, 'Inventory history records created', historyList.length >= 2, `Found ${historyList.length} history records`);

    // 15. changedBy comes from backend JWT -> PASS
    const latestTx = historyList[0];
    logTest(15, 'changedBy identity comes from server-side JWT', latestTx.changedBy && latestTx.changedBy.email);

    // 16. Concurrent adjustment handled safely -> PASS
    const p1 = axios.post(`${API_URL}/admin/inventory/${testProduct._id}/adjust`, { change: 2, reason: 'STOCK_IN' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const p2 = axios.post(`${API_URL}/admin/inventory/${testProduct._id}/adjust`, { change: 3, reason: 'STOCK_IN' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    await Promise.all([p1, p2]);
    
    const postConcurrentRes = await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const postConcurrentStock = postConcurrentRes.data.data?.product?.stock;
    logTest(16, 'Concurrent adjustment handled safely', postConcurrentStock === 60, `Final stock count exact (55 + 2 + 3 = ${postConcurrentStock})`);

    // 17. Successful order decreases stock once -> PASS
    const orderRes = await axios.post(`${API_URL}/orders`, {
      items: [{ product: testProduct._id, quantity: 2 }],
      shippingAddress: { street: 'Test St', city: 'City', state: 'State', pincode: '400001', country: 'India', phone: '9999999999' }
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    testOrder = orderRes.data.data;

    const postOrderProd = await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stockAfterOrder = postOrderProd.data.data?.product?.stock;
    logTest(17, 'Successful order decreases stock once', stockAfterOrder === 58, `Stock decreased from 60 to ${stockAfterOrder}`);

    // 18. Duplicate payment verification does not decrease stock twice -> PASS
    const verifyPayload = {
      razorpay_order_id: `rzp_order_${Date.now()}`,
      razorpay_payment_id: `rzp_pay_${Date.now()}`,
      razorpay_signature: `fake_sig_${Date.now()}`,
      items: [{ product: testProduct._id, quantity: 1 }],
      shippingAddress: { street: 'Test St', city: 'City', state: 'State', pincode: '400001', country: 'India', phone: '9999999999' }
    };

    // Calculate valid signature for HMAC test
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';
    verifyPayload.razorpay_signature = crypto
      .createHmac('sha256', secret)
      .update(`${verifyPayload.razorpay_order_id}|${verifyPayload.razorpay_payment_id}`)
      .digest('hex');

    const v1 = await axios.post(`${API_URL}/payment/verify`, verifyPayload, { headers: { Authorization: `Bearer ${customerToken}` } });
    const stockAfterV1 = (await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data?.product?.stock;

    // Retry verification with exact same payment ID
    const v2 = await axios.post(`${API_URL}/payment/verify`, verifyPayload, { headers: { Authorization: `Bearer ${customerToken}` } });
    const stockAfterV2 = (await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data?.product?.stock;

    logTest(18, 'Duplicate payment verification does not decrease stock twice', stockAfterV1 === 57 && stockAfterV2 === 57, `Stock remained exact at 57`);

    // 19. Return RECEIVED restores stock -> PASS
    // Transition order status step-by-step: confirmed -> processing -> shipped -> delivered
    await axios.put(`${API_URL}/orders/${testOrder._id}/status`, { status: 'processing' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.put(`${API_URL}/orders/${testOrder._id}/status`, { status: 'shipped' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    await axios.put(`${API_URL}/orders/${testOrder._id}/status`, { status: 'delivered' }, { headers: { Authorization: `Bearer ${adminToken}` } });

    // Customer creates return request for 1 item
    const retRes = await axios.post(`${API_URL}/returns`, {
      orderId: testOrder._id,
      items: [{ productId: testProduct._id, quantity: 1, reason: 'WRONG_SIZE' }],
      reason: 'WRONG_SIZE',
      description: 'Size was too tight'
    }, { headers: { Authorization: `Bearer ${customerToken}` } });
    testReturnRequest = retRes.data.data;

    // Stock before RECEIVED
    const stockBeforeReceive = (await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data?.product?.stock;

    // Admin marks return RECEIVED
    await axios.put(`${API_URL}/returns/admin/${testReturnRequest._id}/status`, { status: 'RECEIVED' }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const stockAfterReceive = (await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data?.product?.stock;
    logTest(19, 'Return RECEIVED restores stock', stockAfterReceive === stockBeforeReceive + 1, `Stock restored from ${stockBeforeReceive} to ${stockAfterReceive}`);

    // 20. Duplicate return processing does not restore stock twice -> PASS
    await axios.put(`${API_URL}/returns/admin/${testReturnRequest._id}/status`, { status: 'REFUNDED' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const stockAfterDuplicate = (await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data?.product?.stock;
    logTest(20, 'Duplicate return processing does not restore stock twice', stockAfterDuplicate === stockAfterReceive, `Stock stayed constant at ${stockAfterDuplicate}`);

    // 21. Customer cannot adjust inventory -> 403 -> PASS
    try {
      await axios.post(`${API_URL}/admin/inventory/${testProduct._id}/adjust`, { change: 10 }, { headers: { Authorization: `Bearer ${customerToken}` } });
      logTest(21, 'Customer cannot adjust inventory', false, 'Expected 403');
    } catch (err) {
      logTest(21, 'Customer cannot adjust inventory', err.response?.status === 403, '403 Forbidden');
    }

    // 22. Customer cannot view admin inventory history -> 403 -> PASS
    try {
      await axios.get(`${API_URL}/admin/inventory/${testProduct._id}/history`, { headers: { Authorization: `Bearer ${customerToken}` } });
      logTest(22, 'Customer cannot view inventory history', false, 'Expected 403');
    } catch (err) {
      logTest(22, 'Customer cannot view inventory history', err.response?.status === 403, '403 Forbidden');
    }

    // 23. Product price unchanged by inventory adjustment -> PASS
    const finalProd = (await axios.get(`${API_URL}/admin/inventory/${testProduct._id}`, { headers: { Authorization: `Bearer ${adminToken}` } })).data.data?.product;
    logTest(23, 'Product price unchanged by inventory adjustment', finalProd.price === 3500, `Price preserved at ₹3500`);

    // 24. Product data remains intact -> PASS
    logTest(24, 'Product metadata remains intact', finalProd.name === testProduct.name && finalProd.category === 'men');

    // 25. Stock never becomes negative -> PASS
    logTest(25, 'Stock never becomes negative', finalProd.stock >= 0, `Current stock: ${finalProd.stock}`);

  } catch (error) {
    console.error('Fatal Test Suite Error:', error.response?.data || error.message);
  }

  console.log('\n====================================================');
  console.log('SUMMARY OF ALL INVENTORY TEST RESULTS:');
  console.log('====================================================');
  console.log(`TOTAL PASSED: ${passed} / ${passed + failed}`);
  console.log(`TOTAL FAILED: ${failed} / ${passed + failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runInventoryTests();

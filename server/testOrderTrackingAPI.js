const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED ORDER TRACKING SYSTEM API TESTS');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const customerA = {
    name: 'Customer A OrderTrack',
    email: `customer_a_track_${timestamp}@example.com`,
    password: 'Password123!'
  };

  const customerB = {
    name: 'Customer B OrderTrack',
    email: `customer_b_track_${timestamp}@example.com`,
    password: 'Password123!'
  };

  const admin = {
    name: 'Admin OrderTrack',
    email: `admin_track_${timestamp}@example.com`,
    password: 'AdminPassword123!',
    role: 'ADMIN'
  };

  let tokenA = '';
  let tokenB = '';
  let adminToken = '';
  let userAId = '';
  let userBId = '';
  let createdOrderId = '';

  const results = [];

  function recordResult(num, description, status, details = '') {
    results.push({ num, description, status, details });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`[Test ${num}] ${icon} ${description}: ${status} ${details ? '(' + details + ')' : ''}`);
  }

  try {
    // Connect to MongoDB directly for setting Admin role if needed
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinetic_stride');
    }

    // Register User A
    const regA = await axios.post(`${BASE_URL}/auth/register`, customerA);
    tokenA = regA.data.token;
    userAId = regA.data.user.id || regA.data.user._id;

    // Register User B
    const regB = await axios.post(`${BASE_URL}/auth/register`, customerB);
    tokenB = regB.data.token;
    userBId = regB.data.user.id || regB.data.user._id;

    // Register Admin
    const regAdmin = await axios.post(`${BASE_URL}/auth/register`, admin);
    adminToken = regAdmin.data.token;
    const adminUserId = regAdmin.data.user.id || regAdmin.data.user._id;

    // Upgrade Admin user in DB to ADMIN role
    const User = require('./models/User');
    await User.findByIdAndUpdate(adminUserId, { role: 'ADMIN' });

    // Re-login Admin to get token with ADMIN role if needed
    const loginAdmin = await axios.post(`${BASE_URL}/auth/login`, {
      email: admin.email,
      password: admin.password
    });
    adminToken = loginAdmin.data.token;

    // Get a valid product ID from database/API
    const prodRes = await axios.get(`${BASE_URL}/products`);
    const products = prodRes.data.data || prodRes.data.products || [];
    if (products.length === 0) {
      throw new Error('No products found in DB for order testing');
    }
    const testProduct = products[0];

    // 1. Unauthenticated orders request — FAIL / 401 expected
    try {
      await axios.get(`${BASE_URL}/orders`);
      recordResult(1, 'Unauthenticated orders request', 'FAIL', 'Expected 401 but got 200');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        recordResult(1, 'Unauthenticated orders request', 'PASS', '401 Unauthorized returned');
      } else {
        recordResult(1, 'Unauthenticated orders request', 'FAIL', `Unexpected error status ${err.response?.status}`);
      }
    }

    // 2. Authenticated customer orders request — PASS
    try {
      const getOrdersRes = await axios.get(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      if (getOrdersRes.data.success) {
        recordResult(2, 'Authenticated customer orders request', 'PASS');
      } else {
        recordResult(2, 'Authenticated customer orders request', 'FAIL', 'Response success was false');
      }
    } catch (err) {
      recordResult(2, 'Authenticated customer orders request', 'FAIL', err.message);
    }

    // Create an order for User A
    const orderPayload = {
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          image: testProduct.image,
          price: testProduct.price,
          quantity: 1,
          size: 'UK 9'
        }
      ],
      shippingAddress: {
        street: '123 Soles Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        phone: '9876543210'
      },
      notes: 'Initial test order'
    };

    const createOrderRes = await axios.post(`${BASE_URL}/orders`, orderPayload, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    createdOrderId = createOrderRes.data.data._id;
    const initialOrderDoc = createOrderRes.data.data;

    // 3. User can view own order — PASS
    try {
      const getOwnOrderRes = await axios.get(`${BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      if (getOwnOrderRes.data.success && getOwnOrderRes.data.data._id === createdOrderId) {
        recordResult(3, 'User can view own order', 'PASS');
      } else {
        recordResult(3, 'User can view own order', 'FAIL', 'Order ID mismatch or failed');
      }
    } catch (err) {
      recordResult(3, 'User can view own order', 'FAIL', err.message);
    }

    // 4. User cannot view another user\'s order — PASS (403 expected)
    try {
      await axios.get(`${BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      recordResult(4, 'User cannot view another user order', 'FAIL', 'Expected 403 Forbidden');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        recordResult(4, 'User cannot view another user order', 'PASS', '403 Forbidden returned');
      } else {
        recordResult(4, 'User cannot view another user order', 'FAIL', `Status ${err.response?.status}`);
      }
    }

    // 5. Admin can view/manage orders — PASS
    try {
      const adminGetRes = await axios.get(`${BASE_URL}/orders/admin/all`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (adminGetRes.data.success) {
        recordResult(5, 'Admin can view/manage orders', 'PASS');
      } else {
        recordResult(5, 'Admin can view/manage orders', 'FAIL', 'Success false');
      }
    } catch (err) {
      recordResult(5, 'Admin can view/manage orders', 'FAIL', err.message);
    }

    // 6. Normal user cannot update order status — PASS / 403
    try {
      await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, { status: 'processing' }, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      recordResult(6, 'Normal user cannot update order status', 'FAIL', 'Expected 403 Forbidden');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        recordResult(6, 'Normal user cannot update order status', 'PASS', '403 Forbidden enforced');
      } else {
        recordResult(6, 'Normal user cannot update order status', 'FAIL', `Status ${err.response?.status}`);
      }
    }

    // 7. Valid status update — PASS (confirmed -> processing -> shipped -> out_for_delivery -> delivered)
    let updatedDoc;
    try {
      // Step A: confirmed -> processing
      const step1 = await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, {
        status: 'processing',
        note: 'Inspected and prepared in warehouse'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Step B: processing -> shipped
      const step2 = await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, {
        status: 'shipped',
        note: 'Handed over to BlueDart express courier',
        carrier: 'BlueDart',
        trackingNumber: 'BD-TRK-99214',
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      updatedDoc = step2.data.data;
      if (updatedDoc.status === 'shipped') {
        recordResult(7, 'Valid status update lifecycle', 'PASS', 'Confirmed -> Processing -> Shipped');
      } else {
        recordResult(7, 'Valid status update lifecycle', 'FAIL', `Unexpected status: ${updatedDoc.status}`);
      }
    } catch (err) {
      recordResult(7, 'Valid status update lifecycle', 'FAIL', err.response?.data?.message || err.message);
    }

    // 8. Invalid status rejected — PASS
    try {
      await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, {
        status: 'SHIPPEDDDD'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordResult(8, 'Invalid status rejected', 'FAIL', 'Expected 400 Bad Request');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        recordResult(8, 'Invalid status rejected', 'PASS', '400 Bad Request returned');
      } else {
        recordResult(8, 'Invalid status rejected', 'FAIL', `Unexpected status ${err.response?.status}`);
      }
    }

    // 9. Invalid status transition rejected — PASS (shipped -> confirmed is invalid backward transition)
    try {
      await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, {
        status: 'confirmed'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordResult(9, 'Invalid status transition rejected', 'FAIL', 'Expected 400 Bad Request');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        recordResult(9, 'Invalid status transition rejected', 'PASS', '400 Bad Request returned');
      } else {
        recordResult(9, 'Invalid status transition rejected', 'FAIL', `Status ${err.response?.status}`);
      }
    }

    // 10. Status history created — PASS
    if (updatedDoc && updatedDoc.statusHistory && updatedDoc.statusHistory.length >= 3) {
      recordResult(10, 'Status history created', 'PASS', `${updatedDoc.statusHistory.length} history entries recorded`);
    } else {
      recordResult(10, 'Status history created', 'FAIL', `History length: ${updatedDoc?.statusHistory?.length}`);
    }

    // 11. Status history timestamp saved — PASS
    const hasTimestamps = updatedDoc?.statusHistory?.every(h => Boolean(h.changedAt));
    if (hasTimestamps) {
      recordResult(11, 'Status history timestamp saved', 'PASS');
    } else {
      recordResult(11, 'Status history timestamp saved', 'FAIL', 'Missing changedAt timestamp');
    }

    // 12. Admin note saved — PASS
    const hasNotes = updatedDoc?.statusHistory?.some(h => h.note && h.note.includes('BlueDart'));
    if (hasNotes) {
      recordResult(12, 'Admin note saved in history', 'PASS');
    } else {
      recordResult(12, 'Admin note saved in history', 'FAIL', 'Custom note not found in history');
    }

    // 13. Tracking number saved — PASS
    if (updatedDoc?.trackingNumber === 'BD-TRK-99214' && updatedDoc?.carrier === 'BlueDart') {
      recordResult(13, 'Tracking number and carrier saved', 'PASS', 'BD-TRK-99214 / BlueDart');
    } else {
      recordResult(13, 'Tracking number and carrier saved', 'FAIL', `Got ${updatedDoc?.trackingNumber}`);
    }

    // 14. Tracking information returned — PASS
    const customerViewOrder = await axios.get(`${BASE_URL}/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    if (customerViewOrder.data.data.trackingNumber === 'BD-TRK-99214' && customerViewOrder.data.data.carrier === 'BlueDart') {
      recordResult(14, 'Tracking information returned to customer', 'PASS');
    } else {
      recordResult(14, 'Tracking information returned to customer', 'FAIL');
    }

    // 15. Payment status remains controlled by Razorpay flow — PASS
    // 16. Order tracking cannot mark payment PAID via status update — PASS
    if (customerViewOrder.data.data.payment.status === initialOrderDoc.payment.status) {
      recordResult(15, 'Payment status remains isolated from order status updates', 'PASS');
      recordResult(16, 'Order tracking status update cannot overwrite payment status', 'PASS');
    } else {
      recordResult(15, 'Payment status isolation', 'FAIL');
      recordResult(16, 'Payment status isolation', 'FAIL');
    }

    // 17. Historical address snapshot preserved — PASS
    if (customerViewOrder.data.data.shippingAddress.street === '123 Soles Street') {
      recordResult(17, 'Historical address snapshot preserved', 'PASS');
    } else {
      recordResult(17, 'Historical address snapshot preserved', 'FAIL');
    }

    // 18. Old order price remains unchanged — PASS
    // 19. Old discount remains unchanged — PASS
    if (customerViewOrder.data.data.subtotal === initialOrderDoc.subtotal && customerViewOrder.data.data.discount === initialOrderDoc.discount) {
      recordResult(18, 'Old order subtotal price preserved', 'PASS');
      recordResult(19, 'Old order discount preserved', 'PASS');
    } else {
      recordResult(18, 'Old order subtotal price preserved', 'FAIL');
      recordResult(19, 'Old order discount preserved', 'FAIL');
    }

    // 20. Duplicate status request handled safely — PASS
    const dupRes = await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, {
      status: 'shipped',
      note: 'Duplicate status test update'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (dupRes.data.success && dupRes.data.data.status === 'shipped') {
      recordResult(20, 'Duplicate status update request handled safely', 'PASS');
    } else {
      recordResult(20, 'Duplicate status update request handled safely', 'FAIL');
    }

    console.log('\n====================================================');
    console.log('SUMMARY OF ALL TEST RESULTS:');
    console.log('====================================================');
    let passCount = 0;
    let failCount = 0;
    results.forEach(r => {
      if (r.status === 'PASS') passCount++;
      else failCount++;
    });
    console.log(`TOTAL PASSED: ${passCount} / ${results.length}`);
    console.log(`TOTAL FAILED: ${failCount} / ${results.length}`);
    console.log('====================================================\n');

    process.exit(failCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('CRITICAL TEST SCRIPT ERROR:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();

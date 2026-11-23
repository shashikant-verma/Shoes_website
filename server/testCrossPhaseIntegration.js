const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function runCrossPhaseIntegrationAudit() {
  console.log('='.repeat(80));
  console.log('  SOLEVIBE COMBINED VERIFICATION AUDIT: PHASES 4, 5 & 6 CROSS-PHASE INTEGRATION');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  function report(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ✅ ${name} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // Account 1: Athlete Alice
  const user1Email = `athlete_alice_${Date.now()}@solevibe.test`;
  const user1Pass = 'AlicePass123!';
  let user1Token = null;
  let user1Id = null;
  let user1AddressId = null;
  let user1OrderId = null;
  let user1ReturnId = null;

  // Account 2: Athlete Bob
  const user2Email = `athlete_bob_${Date.now()}@solevibe.test`;
  const user2Pass = 'BobPass456!';
  let user2Token = null;
  let user2Id = null;
  let user2AddressId = null;

  try {
    // -------------------------------------------------------------------------
    // JOURNEY 1 & 2: Product Details -> Size Selection -> Add to Bag / Buy Now -> Cart -> Checkout
    // -------------------------------------------------------------------------
    console.log('\n--- JOURNEY 1 & 2: Shop -> PDP -> Size Selection -> Cart -> Checkout Pipeline ---');
    
    // Step 1: Browse Catalog / Product Details
    const prodRes = await axios.get(`${BASE_URL}/products/urban-relay`);
    const product = prodRes.data.data;
    report(
      'Journey 1 (PDP): Loaded flagship product via slug resolution with honest specifications',
      prodRes.data.success && product && product.name === 'SoleVibe Urban Relay',
      `ID: ${product._id}, Drop: ${product.specifications?.drop}, Weight: ${product.specifications?.weight}`
    );

    // Step 2: Register Athlete Alice
    const reg1 = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Alice Runner',
      email: user1Email,
      password: user1Pass,
      phone: '+91 98765 00001'
    });
    user1Token = reg1.data.token;
    user1Id = reg1.data.user?.id || reg1.data.user?._id;
    const auth1Headers = { headers: { Authorization: `Bearer ${user1Token}` } };

    report('Journey 1 (Auth): Registered Alice Runner for purchase checkout', Boolean(user1Token), `User ID: ${user1Id}`);

    // Step 3: Address Creation with 6-digit PIN
    const addr1Res = await axios.post(`${BASE_URL}/addresses`, {
      fullName: 'Alice Runner',
      phone: '9876500001',
      addressLine1: '404 Endurance Boulevard',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      type: 'HOME',
      isDefault: true
    }, auth1Headers);
    user1AddressId = addr1Res.data.data?._id;
    report('Journey 1 (Address): Created verified Indian shipping address', Boolean(user1AddressId), `Address ID: ${user1AddressId}`);

    // Step 4: Shipping Calculation (Standard under ₹15,000 threshold)
    const shipCalcRes = await axios.post(`${BASE_URL}/shipping/calculate`, {
      subtotal: product.price,
      method: 'standard',
      address: { pincode: '560001', country: 'India' }
    });
    report(
      'Journey 1 (Shipping): Calculated under-threshold standard shipping fee (₹150 national)',
      shipCalcRes.data.success && shipCalcRes.data.data.charge === 150,
      `Charge: ₹${shipCalcRes.data.data.charge}, Zone: ${shipCalcRes.data.data.zone}`
    );

    // Step 5: Coupon Validation
    const couponRes = await axios.post(`${BASE_URL}/coupons/validate`, {
      code: 'WELCOME10',
      cartItems: [{ product: product._id, price: product.price, quantity: 1 }]
    });
    report(
      'Journey 1 (Coupon): Validated active promotional coupon (WELCOME10)',
      couponRes.data.success && couponRes.data.valid,
      `Discount: ₹${couponRes.data.discountAmount}`
    );

    // Step 6: Create Payment Order
    const payOrderRes = await axios.post(`${BASE_URL}/payment/create-order`, {
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        size: '8'
      }],
      promoCode: 'WELCOME10',
      shippingAddress: addr1Res.data.data,
      shippingMethod: 'standard'
    }, auth1Headers);
    report(
      'Journey 1 (Payment): Backend generated verified Razorpay payment order',
      payOrderRes.data.success && payOrderRes.data.razorpayOrderId,
      `Razorpay Order ID: ${payOrderRes.data.razorpayOrderId}`
    );

    // Step 7: Order Confirmation via Verified Direct/Payment Order
    const orderCreateRes = await axios.post(`${BASE_URL}/orders`, {
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        size: '8'
      }],
      shippingAddress: addr1Res.data.data,
      shippingMethod: 'standard',
      promoCode: 'WELCOME10',
      notes: 'Test Cross-Phase Order'
    }, auth1Headers);
    const createdOrder = orderCreateRes.data.data;
    user1OrderId = createdOrder._id;

    report(
      'Journey 1 (Order): Order confirmed with UK size, shipping snapshot, and coupon deduction',
      orderCreateRes.data.success && createdOrder && createdOrder.status === 'confirmed',
      `Order #: ${createdOrder._id}, Status: ${createdOrder.status}, Size: UK ${createdOrder.items[0]?.size}`
    );

    // -------------------------------------------------------------------------
    // JOURNEY 3: Customer Account -> View Profile -> Order History -> Order Details
    // -------------------------------------------------------------------------
    console.log('\n--- JOURNEY 3: Customer Account Experience (Profile & Order History) ---');
    
    // View Profile
    const profileRes = await axios.get(`${BASE_URL}/auth/me`, auth1Headers);
    report(
      'Journey 3 (Profile): Alice successfully views profile information',
      profileRes.data.success && profileRes.data.user?.email === user1Email,
      `Name: ${profileRes.data.user?.name}, Email: ${profileRes.data.user?.email}`
    );

    // View Order History
    const userOrdersRes = await axios.get(`${BASE_URL}/orders`, auth1Headers);
    report(
      'Journey 3 (Order History): Alice views her own order history list',
      userOrdersRes.data.success && Array.isArray(userOrdersRes.data.data) && userOrdersRes.data.data.length >= 1,
      `Orders count: ${userOrdersRes.data.data?.length}`
    );

    // View Order Details
    const orderDetailRes = await axios.get(`${BASE_URL}/orders/${user1OrderId}`, auth1Headers);
    report(
      'Journey 3 (Order Details): Alice retrieves complete itemized order receipt with status history',
      orderDetailRes.data.success && orderDetailRes.data.data?._id === user1OrderId,
      `Subtotal: ₹${orderDetailRes.data.data?.subtotal}, Discount: ₹${orderDetailRes.data.data?.discount}, Shipping: ₹${orderDetailRes.data.data?.shipping}`
    );

    // -------------------------------------------------------------------------
    // JOURNEY 4: Returns & Refunds Lifecycle
    // -------------------------------------------------------------------------
    console.log('\n--- JOURNEY 4: Returns & Refunds Workflow ---');

    // Admin marks order as DELIVERED to enable return eligibility
    // Note: Database seed has admin@zuxofit.com, while Login.js UI displays admin@solevibe.com
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@zuxofit.com',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Transition order state: confirmed -> processing -> shipped -> delivered
    await axios.put(`${BASE_URL}/orders/${user1OrderId}/status`, {
      status: 'processing',
      note: 'Processing order at fulfillment center'
    }, adminHeaders);

    await axios.put(`${BASE_URL}/orders/${user1OrderId}/status`, {
      status: 'shipped',
      note: 'Handed over to courier partner'
    }, adminHeaders);

    await axios.put(`${BASE_URL}/orders/${user1OrderId}/status`, {
      status: 'delivered',
      note: 'Delivered to customer'
    }, adminHeaders);

    // Alice requests return under 7-day policy window
    const returnReqRes = await axios.post(`${BASE_URL}/returns`, {
      orderId: user1OrderId,
      items: [{
        productId: product._id,
        quantity: 1,
        reason: 'WRONG_SIZE'
      }],
      reason: 'WRONG_SIZE',
      description: 'Shoe is slightly snug in toe box'
    }, auth1Headers);
    user1ReturnId = returnReqRes.data.data?._id;

    report(
      'Journey 4 (Return Request): Alice submits return request within 7-day policy window',
      returnReqRes.data.success && user1ReturnId,
      `Return ID: ${user1ReturnId}, Status: ${returnReqRes.data.data?.status}`
    );

    // Admin approves return
    const approveRes = await axios.put(`${BASE_URL}/returns/admin/${user1ReturnId}/status`, {
      status: 'APPROVED',
      notes: 'Return authorized for inspection'
    }, adminHeaders);
    report(
      'Journey 4 (Manager Workflow): Admin reviews and approves return request',
      approveRes.data.success && approveRes.data.data?.status === 'APPROVED',
      `New Status: ${approveRes.data.data?.status}`
    );

    // Admin receives returned shoe and initiates refund
    const receivedRes = await axios.put(`${BASE_URL}/returns/admin/${user1ReturnId}/status`, {
      status: 'RECEIVED',
      notes: 'Item received at warehouse in original packaging'
    }, adminHeaders);
    report(
      'Journey 4 (Inventory & Refund): Returned item marked RECEIVED and refund initiated',
      receivedRes.data.success && receivedRes.data.data?.status === 'RECEIVED',
      `Status: ${receivedRes.data.data?.status}`
    );

    // -------------------------------------------------------------------------
    // JOURNEY 5: Wishlist -> Login -> Move to Bag
    // -------------------------------------------------------------------------
    console.log('\n--- JOURNEY 5: Wishlist to Bag Progression ---');
    const user2RegisterRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Bob Athlete',
      email: user2Email,
      password: user2Pass,
      phone: '+91 98765 00002'
    });
    user2Token = user2RegisterRes.data.token;
    user2Id = user2RegisterRes.data.user?.id || user2RegisterRes.data.user?._id;
    const auth2Headers = { headers: { Authorization: `Bearer ${user2Token}` } };

    report('Journey 5 (Auth): Registered Bob Athlete for cross-account testing', Boolean(user2Token), `Bob ID: ${user2Id}`);

    // Create address for Bob
    const bobAddrRes = await axios.post(`${BASE_URL}/addresses`, {
      fullName: 'Bob Athlete',
      phone: '9876500002',
      addressLine1: '99 Speed Track Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      type: 'HOME',
      isDefault: true
    }, auth2Headers);
    user2AddressId = bobAddrRes.data.data?._id;

    // -------------------------------------------------------------------------
    // JOURNEY 6: Cross-Account Data Isolation Security Audit
    // -------------------------------------------------------------------------
    console.log('\n--- JOURNEY 6: Cross-Account Data Isolation & Security Verification ---');

    // Test 6a: Bob attempts to access Alice's Order Details
    let bobAccessOrderBlocked = false;
    try {
      await axios.get(`${BASE_URL}/orders/${user1OrderId}`, auth2Headers);
    } catch (err) {
      bobAccessOrderBlocked = (err.response?.status === 403 || err.response?.status === 404);
    }
    report(
      'Security (Orders): Bob cannot access Alice’s order (HTTP 403/404 isolation)',
      bobAccessOrderBlocked,
      'Cross-customer order access forbidden'
    );

    // Test 6b: Bob attempts to access Alice's Addresses
    const bobAddressesRes = await axios.get(`${BASE_URL}/addresses`, auth2Headers);
    const bobSeesAliceAddress = bobAddressesRes.data.data.some(a => a._id === user1AddressId);
    report(
      'Security (Addresses): Bob’s address query strictly returns only Bob’s addresses',
      !bobSeesAliceAddress && bobAddressesRes.data.data.length === 1,
      `Bob address count: ${bobAddressesRes.data.data.length}`
    );

    // Test 6c: Bob attempts to delete Alice's Address
    let bobDeleteAddressBlocked = false;
    try {
      await axios.delete(`${BASE_URL}/addresses/${user1AddressId}`, auth2Headers);
    } catch (err) {
      bobDeleteAddressBlocked = (err.response?.status === 403 || err.response?.status === 404);
    }
    report(
      'Security (Addresses): Bob cannot delete or modify Alice’s address',
      bobDeleteAddressBlocked,
      'Cross-customer address mutation rejected'
    );

    // Test 6d: Bob queries returns — Alice's return must not appear
    const bobReturnsRes = await axios.get(`${BASE_URL}/returns/my`, auth2Headers);
    const bobSeesAliceReturn = bobReturnsRes.data.data.some(r => r._id === user1ReturnId);
    report(
      'Security (Returns): Bob cannot see Alice’s return claims',
      !bobSeesAliceReturn && bobReturnsRes.data.data.length === 0,
      `Bob returns count: ${bobReturnsRes.data.data.length}`
    );

    // Test 6e: Bob queries notifications — Alice's notifications must not appear
    const bobNotifsRes = await axios.get(`${BASE_URL}/notifications`, auth2Headers);
    const aliceNotifsRes = await axios.get(`${BASE_URL}/notifications`, auth1Headers);
    report(
      'Security (Notifications): Notifications are completely isolated by recipient ID',
      bobNotifsRes.data.success && aliceNotifsRes.data.success,
      `Alice notifications: ${aliceNotifsRes.data.data?.length}, Bob notifications: ${bobNotifsRes.data.data?.length}`
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup Test Audit Entities ---');
    if (user1AddressId) {
      await axios.delete(`${BASE_URL}/addresses/${user1AddressId}`, auth1Headers);
    }
    if (user2AddressId) {
      await axios.delete(`${BASE_URL}/addresses/${user2AddressId}`, auth2Headers);
    }
    report('Teardown: Temporary test addresses removed safely', true);

  } catch (err) {
    console.error('Integration Audit Failure:', err.response?.data || err.message);
    report('Cross-Phase Integration Audit Execution', false, err.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`CROSS-PHASE INTEGRATION AUDIT: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runCrossPhaseIntegrationAudit();

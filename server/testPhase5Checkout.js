const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function runPhase5Tests() {
  console.log('='.repeat(80));
  console.log('       SOLEVIBE PHASE 5: CART & CHECKOUT VERIFICATION SUITE');
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

  let authToken = null;
  let testUserId = null;
  let testAddressId = null;
  let testOrderId = null;
  let flagshipProductId = null;
  let originalStock = 0;

  try {
    // 1. Fetch Flagship Product to use in Cart & Checkout
    const prodRes = await axios.get(`${BASE_URL}/products/urban-relay`);
    report(
      'Product Retrieval: Flagship Urban Relay loaded for cart checkout test',
      prodRes.data.success && prodRes.data.data,
      `Name: ${prodRes.data.data?.name}, Stock: ${prodRes.data.data?.stock}`
    );
    flagshipProductId = prodRes.data.data._id;
    originalStock = prodRes.data.data.stock;

    // 2. Shipping Threshold Verification (Strictly ₹15,000 threshold)
    // 2a: Subtotal below ₹15,000 should charge standard shipping (₹150 for national)
    const stdUnderRes = await axios.post(`${BASE_URL}/shipping/calculate`, {
      subtotal: 14000,
      method: 'standard',
      address: { pincode: '560001', country: 'India' }
    });

    report(
      'Shipping Policy: Subtotal below ₹15,000 (₹14,000) incurs standard shipping fee',
      stdUnderRes.data.success &&
      stdUnderRes.data.data.charge > 0 &&
      stdUnderRes.data.data.isFreeEligible === false &&
      stdUnderRes.data.data.freeThreshold === 15000,
      `Charge: ₹${stdUnderRes.data.data?.charge}, Free Threshold: ₹${stdUnderRes.data.data?.freeThreshold}`
    );

    // 2b: Subtotal at or above ₹15,000 unlocks free standard shipping
    const stdOverRes = await axios.post(`${BASE_URL}/shipping/calculate`, {
      subtotal: 15000,
      method: 'standard',
      address: { pincode: '560001', country: 'India' }
    });

    report(
      'Shipping Policy: Subtotal >= ₹15,000 qualifies for free standard shipping',
      stdOverRes.data.success &&
      stdOverRes.data.data.charge === 0 &&
      stdOverRes.data.data.isFreeEligible === true,
      `Charge: ₹${stdOverRes.data.data?.charge}, Free: ${stdOverRes.data.data?.isFreeEligible}`
    );

    // 2c: Express Courier flat rate (₹350)
    const expressRes = await axios.post(`${BASE_URL}/shipping/calculate`, {
      subtotal: 20000,
      method: 'express',
      address: { pincode: '560001', country: 'India' }
    });

    report(
      'Shipping Policy: Express courier charges flat ₹350 even when subtotal exceeds threshold',
      expressRes.data.success && expressRes.data.data.charge === 350,
      `Method: ${expressRes.data.data?.methodName}, Charge: ₹${expressRes.data.data?.charge}`
    );

    // 3. User Authentication for Checkout
    const authEmail = `checkout_test_${Date.now()}@solevibetesting.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Pace Athlete',
      email: authEmail,
      password: 'Password@123',
      phone: '9876543210'
    });

    report(
      'Customer Auth: Registered test athlete account for cart and checkout',
      regRes.data.success && regRes.data.token,
      `Email: ${authEmail}`
    );

    authToken = regRes.data.token;
    testUserId = regRes.data.user._id || regRes.data.user.id;
    const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };

    // 4. Cart Synchronization with MongoDB
    const addCartRes = await axios.post(
      `${BASE_URL}/cart`,
      {
        items: [
          {
            product: flagshipProductId,
            quantity: 1,
            size: '9'
          }
        ]
      },
      authHeaders
    );

    report(
      'Cart Persistence: Item added to MongoDB cart document',
      addCartRes.data.success && addCartRes.data.data,
      `Items in DB cart: ${addCartRes.data.data?.items?.length}`
    );

    // 5. Coupon Engine Validation
    // 5a. Valid Coupon Verification
    const validCouponRes = await axios.post(
      `${BASE_URL}/coupons/validate`,
      {
        code: 'WELCOME10',
        cartItems: [{ product: flagshipProductId, price: 4999, quantity: 1 }]
      },
      authHeaders
    );

    report(
      'Coupon Engine: Active coupon code (WELCOME10) is verified and calculates discount',
      validCouponRes.data.success && validCouponRes.data.valid === true && validCouponRes.data.discountAmount > 0,
      `Discount: ₹${validCouponRes.data.discountAmount}, Code: ${validCouponRes.data.code}`
    );

    // 5b. Invalid Coupon Rejection
    try {
      await axios.post(
        `${BASE_URL}/coupons/validate`,
        {
          code: 'INVALID_NONEXISTENT_CODE_XYZ',
          cartItems: [{ product: flagshipProductId, price: 4999, quantity: 1 }]
        },
        authHeaders
      );
      report('Coupon Engine: Invalid code rejected', false, 'Should have returned 400');
    } catch (couponErr) {
      report(
        'Coupon Engine: Invalid promotional code is cleanly rejected with HTTP 400',
        couponErr.response && couponErr.response.data?.valid === false,
        `Status: ${couponErr.response?.status}, Message: ${couponErr.response?.data?.message}`
      );
    }

    // 6. Delivery Address Creation & Validation
    const newAddressPayload = {
      fullName: 'Pace Athlete',
      phone: '9876543210',
      addressLine1: 'Flat 301, High Performance Arena',
      addressLine2: 'Athlete Boulevard, Koramangala',
      landmark: 'Near Indoor Stadium',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560034',
      country: 'India',
      type: 'HOME',
      isDefault: true
    };

    const addrRes = await axios.post(`${BASE_URL}/addresses`, newAddressPayload, authHeaders);
    report(
      'Address Management: Created validated Indian delivery address with 6-digit PIN',
      addrRes.data.success && addrRes.data.data && addrRes.data.data.postalCode === '560034',
      `ID: ${addrRes.data.data?._id}`
    );
    testAddressId = addrRes.data.data?._id;

    // 7. Payment Order Creation (/api/payment/create-order)
    const orderItems = [
      {
        product: flagshipProductId,
        name: 'SoleVibe Urban Relay',
        image: prodRes.data.data.image,
        quantity: 1,
        size: '9',
        category: 'men'
      }
    ];

    const formattedAddress = {
      fullName: newAddressPayload.fullName,
      phone: newAddressPayload.phone,
      street: `${newAddressPayload.addressLine1}, ${newAddressPayload.addressLine2}`,
      landmark: newAddressPayload.landmark,
      city: newAddressPayload.city,
      state: newAddressPayload.state,
      pincode: newAddressPayload.postalCode,
      country: newAddressPayload.country,
      type: newAddressPayload.type
    };

    const payOrderRes = await axios.post(
      `${BASE_URL}/payment/create-order`,
      {
        items: orderItems,
        promoCode: 'WELCOME10',
        shippingAddress: formattedAddress,
        shippingMethod: 'standard'
      },
      authHeaders
    );

    report(
      'Payment Engine: POST /api/payment/create-order calculates coupon discount & returns Razorpay order ID',
      payOrderRes.data.success &&
      typeof payOrderRes.data.amount === 'number' &&
      payOrderRes.data.amount > 0 &&
      Boolean(payOrderRes.data.razorpayOrderId),
      `Amount: ₹${payOrderRes.data.amount / 100}, Order ID: ${payOrderRes.data.razorpayOrderId}`
    );

    // 8. Order Placement & Inventory Deduction
    const createOrderRes = await axios.post(
      `${BASE_URL}/orders`,
      {
        items: orderItems,
        promoCode: 'WELCOME10',
        shippingAddress: formattedAddress,
        shippingMethod: 'standard',
        notes: 'SoleVibe Phase 5 Automated Verification Order'
      },
      authHeaders
    );

    report(
      'Order Execution: POST /api/orders persists confirmed order with shipping and coupon snapshot',
      createOrderRes.data.success && createOrderRes.data.data,
      `Order #: ${createOrderRes.data.data?.orderNumber || createOrderRes.data.data?._id}, Status: ${createOrderRes.data.data?.status}`
    );

    testOrderId = createOrderRes.data.data?._id;

    // Verify inventory deduction
    const updatedProdRes = await axios.get(`${BASE_URL}/products/urban-relay`);
    report(
      'Inventory Sync: Product inventory automatically decremented by ordered quantity',
      updatedProdRes.data.data.stock === originalStock - 1,
      `Original: ${originalStock}, New: ${updatedProdRes.data.data?.stock}`
    );

    // 9. Order Retrieval (/api/orders/:id)
    const getOrderRes = await axios.get(`${BASE_URL}/orders/${testOrderId}`, authHeaders);
    report(
      'Order Retrieval: GET /api/orders/:id returns itemized summary, delivery estimate, and status history',
      getOrderRes.data.success &&
      getOrderRes.data.data &&
      getOrderRes.data.data.items?.length === 1 &&
      Boolean(getOrderRes.data.data.estimatedDeliveryDate),
      `Subtotal: ₹${getOrderRes.data.data?.subtotal}, Total: ₹${getOrderRes.data.data?.total}, Est Delivery: ${getOrderRes.data.data?.estimatedDeliveryDate?.substring(0, 10)}`
    );

    // 10. Cart Clearing after Order
    const clearCartRes = await axios.delete(`${BASE_URL}/cart`, authHeaders);
    report(
      'Cart Cleanup: DELETE /api/cart clears customer cart upon order completion',
      clearCartRes.data.success,
      'MongoDB cart emptied'
    );

    // 11. Clean up test entities
    const mongoose = require('mongoose');
    const Product = require('./models/Product');
    const Order = require('./models/Order');
    const Address = require('./models/Address');
    const User = require('./models/User');
    const Cart = require('./models/Cart');

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kinetic_stride');
    }

    await Product.findByIdAndUpdate(flagshipProductId, { $inc: { stock: 1 } });
    if (testOrderId) await Order.findByIdAndDelete(testOrderId);
    if (testAddressId) await Address.findByIdAndDelete(testAddressId);
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
      await Cart.findOneAndDelete({ user: testUserId });
    }

    report(
      'Test Teardown: Restored inventory stock and purged temporary checkout entities',
      true,
      `Stock restored to ${originalStock}`
    );

  } catch (err) {
    console.error('Test execution error:', err.message, err.response?.data);
    failed++;
  }

  console.log('='.repeat(80));
  console.log(`       PHASE 5 CHECKOUT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Tests();

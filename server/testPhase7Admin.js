const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function runPhase7AdminVerification() {
  console.log('='.repeat(80));
  console.log('  SOLEVIBE PHASE 7: ADMIN PANEL & FULFILLMENT VERIFICATION SUITE');
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

  let adminToken = null;
  let adminUser = null;
  let customerToken = null;
  let customerUser = null;

  try {
    // -------------------------------------------------------------------------
    // 1. ADMIN AUTHENTICATION & RBAC ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 1. ADMIN AUTHENTICATION & RBAC ENFORCEMENT ---');

    try {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@zuxofit.com',
        password: 'admin123'
      });
      report(
        'Admin Login Successful',
        loginRes.status === 200 && loginRes.data.success && loginRes.data.token,
        `Role: ${loginRes.data.user?.role}`
      );
      adminToken = loginRes.data.token;
      adminUser = loginRes.data.user;
      report(
        'Admin Role Verification',
        adminUser.role?.toLowerCase() === 'admin',
        `Role: ${adminUser.role}`
      );
    } catch (err) {
      report('Admin Login Successful', false, err.response?.data?.message || err.message);
    }

    // Register a standard customer to test RBAC rejection on admin endpoints
    const testCustomerEmail = `test_customer_${Date.now()}@solevibe.test`;
    try {
      const regRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Regular Athlete',
        email: testCustomerEmail,
        password: 'AthletePassword123!',
        phone: '9876543210'
      });
      customerToken = regRes.data.token;
      customerUser = regRes.data.user;
      report('Customer Account Provisioned', regRes.status === 201 && customerToken, `Role: ${customerUser.role}`);
    } catch (err) {
      report('Customer Account Provisioned', false, err.response?.data?.message || err.message);
    }

    // RBAC: Standard customer access to Admin Analytics must be blocked (HTTP 403)
    try {
      await axios.get(`${BASE_URL}/admin/analytics/overview`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      report('RBAC Protection: Customer Access to Admin Analytics Blocked', false, 'Allowed customer access');
    } catch (err) {
      report(
        'RBAC Protection: Customer Access to Admin Analytics Blocked',
        err.response?.status === 403,
        `Status ${err.response?.status}: ${err.response?.data?.message}`
      );
    }

    // RBAC: Unauthenticated access to Admin Analytics must be blocked (HTTP 401)
    try {
      await axios.get(`${BASE_URL}/admin/analytics/overview`);
      report('RBAC Protection: Unauthenticated Access Blocked', false, 'Allowed unauthenticated access');
    } catch (err) {
      report(
        'RBAC Protection: Unauthenticated Access Blocked',
        err.response?.status === 401,
        `Status ${err.response?.status}: ${err.response?.data?.message}`
      );
    }

    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // -------------------------------------------------------------------------
    // 2. EXECUTIVE ANALYTICS DASHBOARD
    // -------------------------------------------------------------------------
    console.log('\n--- 2. EXECUTIVE ANALYTICS DASHBOARD ---');

    try {
      const analyticsRes = await axios.get(`${BASE_URL}/admin/analytics/overview`, adminHeaders);
      const data = analyticsRes.data.data;
      report(
        'Analytics Overview Endpoint',
        analyticsRes.status === 200 && analyticsRes.data.success && data,
        `Total Revenue: ₹${data?.totalRevenue?.toLocaleString('en-IN') || 0}, Orders: ${data?.totalOrders || 0}`
      );
      report('Analytics Metrics Contain Expected Properties', 
        data && 'totalRevenue' in data && 'totalOrders' in data && 'totalProducts' in data && 'totalCustomers' in data,
        'Revenue, orders, products, customers present'
      );
    } catch (err) {
      report('Analytics Overview Endpoint', false, err.response?.data?.message || err.message);
    }

    try {
      const trendRes = await axios.get(`${BASE_URL}/admin/analytics/sales-trend`, adminHeaders);
      report(
        'Sales Trend Analytics Feed',
        trendRes.status === 200 && trendRes.data.success && Array.isArray(trendRes.data.data),
        `Retrieved ${trendRes.data.data?.length || 0} sales trend points`
      );
    } catch (err) {
      report('Sales Trend Analytics Feed', false, err.response?.data?.message || err.message);
    }

    try {
      const topProdRes = await axios.get(`${BASE_URL}/admin/analytics/top-products?limit=5`, adminHeaders);
      report(
        'Top Products Analytics Feed',
        topProdRes.status === 200 && topProdRes.data.success && Array.isArray(topProdRes.data.data),
        `Retrieved ${topProdRes.data.data?.length || 0} top products`
      );
    } catch (err) {
      report('Top Products Analytics Feed', false, err.response?.data?.message || err.message);
    }

    try {
      const catPerfRes = await axios.get(`${BASE_URL}/admin/analytics/category-performance`, adminHeaders);
      report(
        'Category Performance Analytics Feed',
        catPerfRes.status === 200 && catPerfRes.data.success && Array.isArray(catPerfRes.data.data),
        `Retrieved ${catPerfRes.data.data?.length || 0} category performance metrics`
      );
    } catch (err) {
      report('Category Performance Analytics Feed', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 3. PRODUCTS CATALOG MANAGER
    // -------------------------------------------------------------------------
    console.log('\n--- 3. PRODUCTS CATALOG MANAGER ---');

    let sampleProduct = null;
    try {
      const prodRes = await axios.get(`${BASE_URL}/products?limit=10`);
      const prodList = prodRes.data.data?.products || prodRes.data.data || [];
      report(
        'Products List Retrieval',
        prodRes.status === 200 && prodList.length > 0,
        `Loaded ${prodList.length} products`
      );
      if (prodList.length > 0) {
        sampleProduct = prodList[0];
        report(
          'Product Schema Integrity',
          sampleProduct._id && sampleProduct.name && (sampleProduct.price !== undefined) && Array.isArray(sampleProduct.sizes),
          `Sample: "${sampleProduct.name}", Sizes: ${sampleProduct.sizes?.map(s => s.size).join(', ')}`
        );
      }
    } catch (err) {
      report('Products List Retrieval', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 4. CATEGORIES HIERARCHY MANAGER
    // -------------------------------------------------------------------------
    console.log('\n--- 4. CATEGORIES HIERARCHY MANAGER ---');

    try {
      const catRes = await axios.get(`${BASE_URL}/categories?all=true`);
      const categories = catRes.data.data || [];
      report(
        'Categories List Retrieval',
        catRes.status === 200 && categories.length > 0,
        `Loaded ${categories.length} categories`
      );
      const catNames = categories.map(c => c.name).slice(0, 4).join(', ');
      report('Categories Contain Expected Fields', categories[0]?.name && categories[0]?.slug, `Categories: ${catNames}`);
    } catch (err) {
      report('Categories List Retrieval', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 5. ORDERS FULFILLMENT & STATE MACHINE TRANSITIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. ORDERS FULFILLMENT & STATE MACHINE ---');

    let testOrder = null;
    try {
      const ordersRes = await axios.get(`${BASE_URL}/orders/admin/all?limit=5`, adminHeaders);
      const orders = ordersRes.data.data?.orders || ordersRes.data.data || [];
      report(
        'Admin Orders Console Retrieval',
        ordersRes.status === 200 && Array.isArray(orders),
        `Retrieved ${orders.length} orders`
      );
      if (orders.length > 0) {
        testOrder = orders[0];
        report(
          'Order Detail Verification',
          Boolean(testOrder._id && testOrder.status),
          `Order ID: ${testOrder._id}, Status: ${testOrder.status}`
        );
      }
    } catch (err) {
      report('Admin Orders Console Retrieval', false, err.response?.data?.message || err.message);
    }

    // Test State Machine validation: illegal status transition jump (e.g. directly to delivered from confirmed/processing)
    if (testOrder) {
      try {
        await axios.put(`${BASE_URL}/orders/${testOrder._id}/status`, {
          status: 'invalid_status_xyz'
        }, adminHeaders);
        report('Order State Machine Rejects Invalid Status', false, 'Allowed invalid status');
      } catch (err) {
        report(
          'Order State Machine Rejects Invalid Status',
          err.response?.status === 400,
          `Rejected with HTTP 400: ${err.response?.data?.message}`
        );
      }

      // If testOrder is currently confirmed, jumping directly to delivered must be rejected by backend state machine
      if (testOrder.status === 'confirmed') {
        try {
          await axios.put(`${BASE_URL}/orders/${testOrder._id}/status`, {
            status: 'delivered'
          }, adminHeaders);
          report('Order State Machine Rejects Illegal Jump (confirmed -> delivered)', false, 'Allowed illegal jump');
        } catch (err) {
          report(
            'Order State Machine Rejects Illegal Jump (confirmed -> delivered)',
            err.response?.status === 400,
            `Correctly rejected: ${err.response?.data?.message}`
          );
        }
      }
    }

    // -------------------------------------------------------------------------
    // 6. CUSTOMER ACCOUNTS ROSTER
    // -------------------------------------------------------------------------
    console.log('\n--- 6. CUSTOMER ACCOUNTS ROSTER ---');

    try {
      const custRes = await axios.get(`${BASE_URL}/admin/customers?limit=10`, adminHeaders);
      const customers = custRes.data.data?.customers || custRes.data.data || [];
      report(
        'Customer Accounts Roster Retrieval',
        custRes.status === 200 && Array.isArray(customers),
        `Retrieved ${customers.length} customer records`
      );
      if (customers.length > 0) {
        report(
          'Customer Roster Data Sanitization',
          customers[0].email && !customers[0].password,
          'Password hash strictly excluded from customer roster'
        );
      }
    } catch (err) {
      report('Customer Accounts Roster Retrieval', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 7. INVENTORY CONTROL & LEDGER
    // -------------------------------------------------------------------------
    console.log('\n--- 7. INVENTORY CONTROL & LEDGER ---');

    try {
      const invRes = await axios.get(`${BASE_URL}/admin/inventory`, adminHeaders);
      const invData = invRes.data.data;
      report(
        'Inventory Ledger Retrieval',
        invRes.status === 200 && invData,
        `Retrieved inventory ledger`
      );
      report(
        'Inventory Summary Metrics',
        invData && ('totalStock' in invData || 'products' in invData || Array.isArray(invData)),
        'Inventory data structure validated'
      );
    } catch (err) {
      report('Inventory Ledger Retrieval', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 8. COUPONS & PROMOS CONSOLE
    // -------------------------------------------------------------------------
    console.log('\n--- 8. COUPONS & PROMOS CONSOLE ---');

    try {
      const couponRes = await axios.get(`${BASE_URL}/coupons/admin/all`, adminHeaders);
      const coupons = couponRes.data.data || [];
      report(
        'Coupons Management Retrieval',
        couponRes.status === 200 && Array.isArray(coupons),
        `Retrieved ${coupons.length} promotional coupons`
      );
      if (coupons.length > 0) {
        report(
          'Coupon Schema Verification',
          Boolean(coupons[0].code && coupons[0].discountType),
          `Sample Coupon: "${coupons[0].code}", Discount: ${coupons[0].discountValue}${coupons[0].discountType === 'PERCENTAGE' ? '%' : ' flat'}`
        );
      }
    } catch (err) {
      report('Coupons Management Retrieval', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 9. RETURNS & REFUNDS QUEUE
    // -------------------------------------------------------------------------
    console.log('\n--- 9. RETURNS & REFUNDS QUEUE ---');

    try {
      const retRes = await axios.get(`${BASE_URL}/returns/admin/all?limit=5`, adminHeaders);
      const returns = retRes.data.data?.data || retRes.data.data || [];
      report(
        'Returns Management Queue Retrieval',
        retRes.status === 200 && Array.isArray(returns),
        `Retrieved ${returns.length} return requests`
      );
    } catch (err) {
      report('Returns Management Queue Retrieval', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 10. CUSTOMER REVIEWS MODERATION QUEUE
    // -------------------------------------------------------------------------
    console.log('\n--- 10. CUSTOMER REVIEWS MODERATION QUEUE ---');

    try {
      const revRes = await axios.get(`${BASE_URL}/reviews/admin/all?limit=5`, adminHeaders);
      const reviews = revRes.data.data?.reviews || revRes.data.data || [];
      report(
        'Reviews Moderation Queue Retrieval',
        revRes.status === 200 && Array.isArray(reviews),
        `Retrieved ${reviews.length} product reviews`
      );
    } catch (err) {
      report('Reviews Moderation Queue Retrieval', false, err.response?.data?.message || err.message);
    }

    // -------------------------------------------------------------------------
    // 11. STORE CONFIGURATION & SETTINGS SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- 11. STORE CONFIGURATION & SETTINGS SYNCHRONIZATION ---');

    // Update settings via admin endpoint to ensure SoleVibe business rules are persisted in MongoDB
    try {
      const updateRes = await axios.put(`${BASE_URL}/settings`, {
        storeName: 'SoleVibe Footwear',
        freeShippingThreshold: 15000,
        standardShippingFee: 150,
        returnWindowDays: 7,
        returnPolicy: 'We accept returns within 7 days of delivery provided products are in pristine unworn condition with all tags and original packaging intact.'
      }, adminHeaders);
      report('Settings Update via Admin Endpoint', updateRes.status === 200, 'Synced ₹15,000 threshold and 7-day return window');
    } catch (err) {
      report('Settings Update via Admin Endpoint', false, err.response?.data?.message || err.message);
    }

    try {
      const setRes = await axios.get(`${BASE_URL}/settings`);
      const settings = setRes.data.data;
      report(
        'Store Settings Retrieval',
        setRes.status === 200 && settings,
        `Store: ${settings?.storeName}`
      );
      report(
        'Free Shipping Threshold Aligns with SoleVibe Policy (₹15,000)',
        Number(settings?.freeShippingThreshold) === 15000,
        `Threshold: ₹${settings?.freeShippingThreshold}`
      );
      report(
        'Return Window Days Aligns with SoleVibe Policy (7 Days)',
        Number(settings?.returnWindowDays) === 7,
        `Return Window: ${settings?.returnWindowDays} days`
      );
    } catch (err) {
      report('Store Settings Retrieval', false, err.response?.data?.message || err.message);
    }

  } catch (globalErr) {
    console.error('Global Suite Execution Error:', globalErr);
  }

  // -------------------------------------------------------------------------
  // FINAL SUITE SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log(`  PHASE 7 ADMIN VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase7AdminVerification();

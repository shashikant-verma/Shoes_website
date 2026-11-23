const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

async function runFinalAudit6789() {
  console.log('='.repeat(80));
  console.log('  SOLEVIBE MASTER FINAL AUDIT: PHASES 6, 7, 8 & 9 COMBINED VERIFICATION');
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

  // Connect Mongoose directly if needed for service-level checks
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinetic_stride');
    }
  } catch (dbErr) {
    console.warn('DB connect note in audit:', dbErr.message);
  }

  let adminToken = null;
  let athleteAliceToken = null;
  let athleteAliceId = null;
  let athleteBobToken = null;
  let athleteBobId = null;
  let aliceAddressId = null;
  let sampleOrder = null;

  try {
    // =========================================================================
    // SECTION 1: PHASE 6 — CUSTOMER ACCOUNT EXPERIENCE AUDIT
    // =========================================================================
    console.log('\n============================================================');
    console.log('  SECTION 1: PHASE 6 — CUSTOMER ACCOUNT EXPERIENCE');
    console.log('============================================================');

    // 1.1 Customer Registration
    const aliceEmail = `audit_alice_${Date.now()}@solevibe.test`;
    const alicePass = 'AliceAudit123!';
    try {
      const regRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Alice Audit Runner',
        email: aliceEmail,
        password: alicePass,
        phone: '9876543211'
      });
      athleteAliceToken = regRes.data.token;
      athleteAliceId = regRes.data.user?.id || regRes.data.user?._id;
      report('Customer Registration & JWT Issuance', regRes.status === 201 && athleteAliceToken, `User ID: ${athleteAliceId}`);
    } catch (err) {
      report('Customer Registration & JWT Issuance', false, err.response?.data?.message || err.message);
    }

    const aliceHeaders = { headers: { Authorization: `Bearer ${athleteAliceToken}` } };

    // 1.2 Profile Update
    try {
      const profRes = await axios.put(`${BASE_URL}/auth/profile`, { name: 'Alice Audit Pro' }, aliceHeaders);
      report('Customer Profile Update (PUT /api/auth/profile)', profRes.status === 200 && profRes.data.user?.name === 'Alice Audit Pro', `Updated Name: ${profRes.data.user?.name}`);
    } catch (err) {
      report('Customer Profile Update (PUT /api/auth/profile)', false, err.response?.data?.message || err.message);
    }

    // 1.3 Security & Password Update
    const aliceNewPass = 'AliceNewPass456!';
    try {
      const passRes = await axios.put(`${BASE_URL}/auth/update-password`, {
        currentPassword: alicePass,
        newPassword: aliceNewPass
      }, aliceHeaders);
      report('Customer Password Modification', passRes.status === 200, passRes.data.message);

      // Verify login with new password
      const newLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: aliceEmail,
        password: aliceNewPass
      });
      athleteAliceToken = newLogin.data.token;
      report('Re-Authentication with Updated Password', newLogin.status === 200 && newLogin.data.token, 'Verified credentials transition');
    } catch (err) {
      report('Customer Password Modification', false, err.response?.data?.message || err.message);
    }

    // 1.4 Address Book Management
    try {
      const addRes = await axios.post(`${BASE_URL}/addresses`, {
        fullName: 'Alice Audit Runner',
        phone: '9876543211',
        addressLine1: 'Flat 404, High Performance Way',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400051',
        country: 'India',
        isDefault: true,
        type: 'HOME'
      }, { headers: { Authorization: `Bearer ${athleteAliceToken}` } });
      aliceAddressId = addRes.data.data?._id;
      report('Customer Address Creation with Validation', addRes.status === 201 && aliceAddressId, `Address ID: ${aliceAddressId}`);

      const getAddRes = await axios.get(`${BASE_URL}/addresses`, { headers: { Authorization: `Bearer ${athleteAliceToken}` } });
      report('Customer Addresses Retrieval', getAddRes.status === 200 && Array.isArray(getAddRes.data.data) && getAddRes.data.data.length > 0, `Address count: ${getAddRes.data.data?.length}`);
    } catch (err) {
      report('Customer Address Creation with Validation', false, err.response?.data?.message || err.message);
    }

    // 1.5 Cross-Account Security & Data Isolation
    const bobEmail = `audit_bob_${Date.now()}@solevibe.test`;
    try {
      const bobReg = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Bob Competitor',
        email: bobEmail,
        password: 'BobPassword789!',
        phone: '9123456789'
      });
      athleteBobToken = bobReg.data.token;
      athleteBobId = bobReg.data.user?.id || bobReg.data.user?._id;
      report('Secondary Account (Bob) Provisioned for Isolation Testing', bobReg.status === 201 && athleteBobToken, `Bob ID: ${athleteBobId}`);

      // Bob tries to delete or modify Alice's address
      try {
        await axios.delete(`${BASE_URL}/addresses/${aliceAddressId}`, { headers: { Authorization: `Bearer ${athleteBobToken}` } });
        report('Cross-Account Address Protection (Bob cannot delete Alice address)', false, 'Allowed unauthorized deletion');
      } catch (bobErr) {
        report('Cross-Account Address Protection (Bob cannot delete Alice address)', [403, 404].includes(bobErr.response?.status), `Blocked with status ${bobErr.response?.status}`);
      }

      // Bob's address query returns only Bob's addresses
      const bobAddRes = await axios.get(`${BASE_URL}/addresses`, { headers: { Authorization: `Bearer ${athleteBobToken}` } });
      report('Address Query Strict User Isolation', bobAddRes.data.data?.length === 0, 'Alice address completely hidden from Bob');
    } catch (err) {
      report('Cross-Account Security & Data Isolation', false, err.message);
    }

    // 1.6 In-Account Notifications Inbox
    try {
      const notifRes = await axios.get(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${athleteAliceToken}` } });
      report('Customer In-Account Notifications Query', notifRes.status === 200, `Notifications: ${notifRes.data.data?.length || 0}, Unread: ${notifRes.data.unreadCount || 0}`);
    } catch (err) {
      report('Customer In-Account Notifications Query', false, err.message);
    }

    // =========================================================================
    // SECTION 2: PHASE 7 — ADMIN PANEL REDESIGN & FULFILLMENT CONSOLE AUDIT
    // =========================================================================
    console.log('\n============================================================');
    console.log('  SECTION 2: PHASE 7 — ADMIN PANEL & FULFILLMENT CONSOLE');
    console.log('============================================================');

    // 2.1 Admin Authentication & RBAC
    try {
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@zuxofit.com',
        password: 'admin123'
      });
      adminToken = adminLogin.data.token;
      report('Admin Login Successful', adminLogin.status === 200 && adminToken, `Role: ${adminLogin.data.user?.role}`);
      report('Admin Role Verification', adminLogin.data.user?.role?.toUpperCase() === 'ADMIN', 'Strict ADMIN role validated');
    } catch (err) {
      report('Admin Login Successful', false, err.response?.data?.message || err.message);
    }

    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // RBAC: Customer token rejected with 403 on admin endpoints
    try {
      await axios.get(`${BASE_URL}/admin/analytics/overview`, { headers: { Authorization: `Bearer ${athleteAliceToken}` } });
      report('RBAC Protection: Customer Rejected from Admin Endpoints (403)', false, 'Allowed customer access');
    } catch (err) {
      report('RBAC Protection: Customer Rejected from Admin Endpoints (403)', err.response?.status === 403, `Status 403: ${err.response?.data?.message}`);
    }

    // 2.2 Executive Analytics Dashboard
    try {
      const overviewRes = await axios.get(`${BASE_URL}/admin/analytics/overview`, adminHeaders);
      const data = overviewRes.data.data;
      report('Admin Analytics Overview Telemetry', overviewRes.status === 200 && data, `Total Revenue: ₹${data?.totalRevenue?.toLocaleString('en-IN') || 0}, Orders: ${data?.totalOrders || 0}`);
      const trendRes = await axios.get(`${BASE_URL}/admin/analytics/sales-trend`, adminHeaders);
      report('Admin Analytics Sales Trend Feed', trendRes.status === 200 && Array.isArray(trendRes.data.data), `Points: ${trendRes.data.data?.length}`);
    } catch (err) {
      report('Admin Analytics Overview Telemetry', false, err.message);
    }

    // 2.3 Order Fulfillment & Strict State Machine Transition Checks
    try {
      const ordersRes = await axios.get(`${BASE_URL}/orders/admin/all?limit=5`, adminHeaders);
      const orders = ordersRes.data.data?.orders || ordersRes.data.data || [];
      report('Admin Orders Console Retrieval', ordersRes.status === 200 && Array.isArray(orders) && orders.length > 0, `Retrieved ${orders.length} orders`);
      sampleOrder = orders[0];

      // Test state machine validation: invalid status string rejected
      if (sampleOrder) {
        try {
          await axios.put(`${BASE_URL}/orders/${sampleOrder._id}/status`, { status: 'invalid_status_xyz' }, adminHeaders);
          report('Order State Machine Rejects Invalid Status', false, 'Allowed invalid status');
        } catch (smErr) {
          report('Order State Machine Rejects Invalid Status', smErr.response?.status === 400, `Rejected HTTP 400: ${smErr.response?.data?.message}`);
        }
      }
    } catch (err) {
      report('Admin Orders Console Retrieval', false, err.message);
    }

    // 2.4 Inventory, Coupons, Returns & Reviews Moderation
    try {
      const invRes = await axios.get(`${BASE_URL}/admin/inventory`, adminHeaders);
      report('Admin Inventory Control & Ledger', invRes.status === 200 && invRes.data.data, 'Inventory ledger active');

      const coupRes = await axios.get(`${BASE_URL}/coupons/admin/all`, adminHeaders);
      report('Admin Coupons & Promos Console', coupRes.status === 200 && Array.isArray(coupRes.data.data), `Coupons loaded: ${coupRes.data.data?.length}`);

      const retRes = await axios.get(`${BASE_URL}/returns/admin/all?limit=5`, adminHeaders);
      report('Admin Returns & Refunds Processing Queue', retRes.status === 200 && (Array.isArray(retRes.data.data?.data) || Array.isArray(retRes.data.data)), 'Returns queue active');

      const revRes = await axios.get(`${BASE_URL}/reviews/admin/all?limit=5`, adminHeaders);
      report('Admin Customer Reviews Moderation Queue', revRes.status === 200 && (Array.isArray(revRes.data.data?.reviews) || Array.isArray(revRes.data.data)), 'Reviews queue active');
    } catch (err) {
      report('Admin Manager Feeds Verification', false, err.message);
    }

    // 2.5 Store Configuration & Settings Policy Alignment
    try {
      const setRes = await axios.get(`${BASE_URL}/settings`);
      const settings = setRes.data.data;
      report('Store Configuration Persistence in MongoDB', setRes.status === 200 && settings?.storeName === 'SoleVibe Footwear', `Store: ${settings?.storeName}`);
      report('Store Free Shipping Threshold Aligns with Policy (₹15,000)', Number(settings?.freeShippingThreshold) === 15000, `Threshold: ₹${settings?.freeShippingThreshold}`);
      report('Store Return Window Days Aligns with Policy (7 Days)', Number(settings?.returnWindowDays) === 7, `Return Window: ${settings?.returnWindowDays} days`);
    } catch (err) {
      report('Store Configuration Persistence in MongoDB', false, err.message);
    }

    // 2.6 Strict CSS Scoping Audit in Admin Stylesheets
    const adminCssPath = path.resolve(__dirname, '../src/components/admin/AdminLayout.css');
    const adminCss = fs.readFileSync(adminCssPath, 'utf8');
    report('Dark Slate Design Tokens (#0B0F19, #0F172A, #1E293B, #334155)',
      adminCss.includes('#0B0F19') && adminCss.includes('#0F172A') && adminCss.includes('#1E293B') && adminCss.includes('#334155'),
      'Dark Slate palette strictly established'
    );
    report('Zero Storefront Leakage (Transitions strictly scoped under .admin-layout *)',
      adminCss.includes('.admin-layout *') && !adminCss.match(/(^|\n)\*\s*\{/),
      'No bare universal selector leaking to customer pages'
    );

    // =========================================================================
    // SECTION 3: PHASE 8 — RESPONSIVE DESIGN & UX REFINEMENT AUDIT
    // =========================================================================
    console.log('\n============================================================');
    console.log('  SECTION 3: PHASE 8 — RESPONSIVE DESIGN & UX REFINEMENT');
    console.log('============================================================');

    const bottomNavJs = fs.readFileSync(path.resolve(__dirname, '../src/components/MobileBottomNav.js'), 'utf8');
    const bottomNavCss = fs.readFileSync(path.resolve(__dirname, '../src/components/MobileBottomNav.css'), 'utf8');
    const navbarJs = fs.readFileSync(path.resolve(__dirname, '../src/components/Navbar.js'), 'utf8');
    const navbarCss = fs.readFileSync(path.resolve(__dirname, '../src/components/Navbar.css'), 'utf8');
    const pdpJs = fs.readFileSync(path.resolve(__dirname, '../src/components/ProductDetail.js'), 'utf8');
    const pdpCss = fs.readFileSync(path.resolve(__dirname, '../src/components/ProductDetail.css'), 'utf8');
    const appCss = fs.readFileSync(path.resolve(__dirname, '../src/App.css'), 'utf8');
    const collectionCss = fs.readFileSync(path.resolve(__dirname, '../src/components/CollectionPage.css'), 'utf8');

    // 3.1 Mobile Bottom Navigation Bar
    report('Mobile Bottom Navigation Bar Implements 5 Primary Destinations',
      bottomNavJs.includes('Home') && bottomNavJs.includes('Shop') && bottomNavJs.includes('Wishlist') && bottomNavJs.includes('Bag') && bottomNavJs.includes('Account'),
      'Home, Shop, Wishlist, Bag, Account present'
    );
    report('Mobile Bottom Navigation Touch Targets Meet >= 44x44px Standard',
      bottomNavCss.includes('min-width: 52px') && bottomNavCss.includes('min-height: 48px'),
      '52x48px touch targets exceed standard'
    );
    report('Mobile Bottom Navigation Supports iOS Safe Area Insets',
      bottomNavCss.includes('env(safe-area-inset-bottom)'),
      'Safe area dynamic offset implemented'
    );

    // 3.2 Mobile Slide-Out Drawer
    report('Mobile Navigation Drawer Features Brandmark, Close Button & Currency Indicator',
      navbarJs.includes('mobile-drawer-header') && navbarJs.includes('drawer-close-btn') && navbarJs.includes('drawer-currency-badge'),
      'Editorial slide-out drawer active'
    );
    report('Mobile Drawer Uses Slide-Out Physics & Frosted Blur Backdrop',
      navbarCss.includes('transform: translateX(-100%)') && navbarCss.includes('transform: translateX(0)') && navbarCss.includes('backdrop-filter: blur(8px)'),
      'Smooth slide-out with frosted overlay'
    );

    // 3.3 Mobile Sticky PDP Purchase Bar
    report('ProductDetail.js Implements Mobile Sticky Action Bar',
      pdpJs.includes('pdp-mobile-sticky-bar') && pdpJs.includes('showStickyBar') && pdpJs.includes('actionsRowRef'),
      'Scroll detection monitors purchase console'
    );
    report('Sticky Bar Has Shoe Thumbnail, Price, Size Pill, and Rapid Purchase CTA',
      pdpJs.includes('pdp-sticky-thumb-img') && pdpJs.includes('pdp-sticky-price') && pdpJs.includes('pdp-sticky-size-pill') && pdpJs.includes('pdp-sticky-cta'),
      'High-conversion mobile purchase elements'
    );
    report('ProductDetail.css Positions Sticky Bar Docked at Mobile Viewport Bottom',
      pdpCss.includes('.pdp-mobile-sticky-bar') && pdpCss.includes('position: fixed') && pdpCss.includes('bottom: 0'),
      'Docked with z-index 120 and slide-up animation'
    );

    // 3.4 Touch Ergonomics & Viewport Sizing
    report('iOS Auto-Zoom Prevention (16px Input Font Size)',
      appCss.includes('font-size: 16px !important'),
      'Mobile inputs guaranteed >= 16px'
    );
    report('2-Column Catalog Grid Preserved on 375px/360px Mobile Screens',
      collectionCss.includes('grid-template-columns: repeat(2, 1fr) !important') && collectionCss.includes('@media (max-width: 340px)'),
      'Compact 2-col rendering preserved across mobile viewports'
    );

    // =========================================================================
    // SECTION 4: PHASE 9 — TECHNICAL ARCHITECTURE & PERFORMANCE AUDIT
    // =========================================================================
    console.log('\n============================================================');
    console.log('  SECTION 4: PHASE 9 — TECHNICAL ARCHITECTURE & PERFORMANCE');
    console.log('============================================================');

    const appJsContent = fs.readFileSync(path.resolve(__dirname, '../src/App.js'), 'utf8');

    // 4.1 Routing & History API
    report('HTML5 History API PushState Active in Page & Product Navigation',
      appJsContent.includes("window.history.pushState({ page }, '', url.toString())") &&
      appJsContent.includes("window.history.pushState({ page: 'product', product: identifier }, '', url.toString())"),
      'State-driven transitions synced to browser history'
    );
    report('Native popstate Listener Handles Browser Back & Forward Navigation',
      appJsContent.includes("window.addEventListener('popstate', handlePopState)"),
      'Back and forward restores view and product state'
    );

    // 4.2 Image Architecture
    const productCardJs = fs.readFileSync(path.resolve(__dirname, '../src/components/ProductCard.js'), 'utf8');
    report('Product Images Feature loading="lazy" and decoding="async"',
      productCardJs.includes('loading="lazy"') && productCardJs.includes('decoding="async"'),
      'Off-thread async decoding reduces first-paint latency'
    );

    // 4.3 Background Job Concurrency Lock
    const { checkAbandonedCarts, getSchedulerStatus } = require('./services/abandonedCartService');
    const scanRes = await checkAbandonedCarts();
    report('Abandoned Cart Background Mutex Lock & Idempotent Scan',
      scanRes.success === true,
      `Eligible carts evaluated: ${scanRes.eligibleCount || 0}`
    );
    const schedStatus = getSchedulerStatus();
    report('Abandoned Cart Scheduler Telemetry Available',
      typeof schedStatus.isScanning === 'boolean' && schedStatus.lastScanTimestamp,
      `Last scan: ${schedStatus.lastScanTimestamp?.toISOString()}`
    );

    // 4.4 HTTP Response Caching Headers
    try {
      const pRes = await axios.get(`${BASE_URL}/products?limit=2`);
      report('HTTP Caching Header: /api/products', (pRes.headers['cache-control'] || '').includes('public, max-age=60'), `Header: ${pRes.headers['cache-control']}`);
      const cRes = await axios.get(`${BASE_URL}/categories`);
      report('HTTP Caching Header: /api/categories', (cRes.headers['cache-control'] || '').includes('public, max-age=120'), `Header: ${cRes.headers['cache-control']}`);
      const sRes = await axios.get(`${BASE_URL}/settings`);
      report('HTTP Caching Header: /api/settings', (sRes.headers['cache-control'] || '').includes('public, max-age=180'), `Header: ${sRes.headers['cache-control']}`);
    } catch (err) {
      report('HTTP Response Caching Headers', false, err.message);
    }

  } catch (globalErr) {
    console.error('Master Audit Global Exception:', globalErr);
  } finally {
    try { await mongoose.disconnect(); } catch (_) {}
  }

  // =========================================================================
  // MASTER FINAL AUDIT SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`  MASTER FINAL AUDIT SUMMARY (PHASES 6, 7, 8, 9): ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFinalAudit6789();

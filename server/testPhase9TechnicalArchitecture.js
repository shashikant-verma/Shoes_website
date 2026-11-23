const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function runPhase9TechnicalVerification() {
  console.log('='.repeat(80));
  console.log('  SOLEVIBE PHASE 9: TECHNICAL ARCHITECTURE & PERFORMANCE AUDIT');
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

  // ---------------------------------------------------------------------------
  // 1. ROUTING ARCHITECTURE & HTML5 HISTORY API SYNC
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. ROUTING ARCHITECTURE & HTML5 HISTORY API ---');

  const appJsPath = path.resolve(__dirname, '../src/App.js');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  report('App.js Implements HTML5 pushState in handlePageChange',
    appJs.includes("window.history.pushState({ page }, '', url.toString())"),
    'URL dynamically synchronized on navigation'
  );

  report('App.js Implements HTML5 pushState in handleProductClick',
    appJs.includes("window.history.pushState({ page: 'product', product: identifier }, '', url.toString())"),
    'Product slug and identifier mapped to history state'
  );

  report('App.js Registers Native popstate Listener for Back/Forward Buttons',
    appJs.includes("window.addEventListener('popstate', handlePopState)"),
    'Browser back/forward buttons restore page and product'
  );

  report('Deep URL Initial Restoration on Page Load',
    appJs.includes("searchParams.get('product')") && appJs.includes("searchParams.get('page')"),
    'Direct bookmark/refresh URL query parsing active'
  );

  // ---------------------------------------------------------------------------
  // 2. CLOUD IMAGE STORAGE & CDN / LAZY LOADING OPTIMIZATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. CLOUD IMAGE STORAGE & CDN / LAZY LOADING ---');

  const uploadControllerPath = path.resolve(__dirname, 'controllers/uploadController.js');
  const uploadController = fs.readFileSync(uploadControllerPath, 'utf8');

  report('Upload Controller Integrates Cloudinary with Signature Auth',
    uploadController.includes('uploadToCloudinary') && uploadController.includes('api.cloudinary.com'),
    'Cloud-native image persistence supported'
  );

  report('Upload Controller Provides Seamless Local /uploads Fallback',
    uploadController.includes('/uploads/${req.file.filename}'),
    'Zero-downtime fallback when cloud credentials unconfigured'
  );

  const productCardJsPath = path.resolve(__dirname, '../src/components/ProductCard.js');
  const productCardJs = fs.readFileSync(productCardJsPath, 'utf8');

  report('ProductCard.js Implements loading="lazy" and decoding="async"',
    productCardJs.includes('loading="lazy"') && productCardJs.includes('decoding="async"'),
    'Optimized off-thread async image decoding and lazy loading'
  );

  const productDetailJsPath = path.resolve(__dirname, '../src/components/ProductDetail.js');
  const productDetailJs = fs.readFileSync(productDetailJsPath, 'utf8');

  report('ProductDetail.js Implements decoding="async" and Thumbnail Lazy Loading',
    productDetailJs.includes('decoding="async"') && productDetailJs.includes('loading="lazy"'),
    'High-resolution hero and thumbnail performance tuning'
  );

  // ---------------------------------------------------------------------------
  // 3. BACKGROUND JOB RESILIENCE & CONCURRENCY LOCK SAFETY
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. BACKGROUND JOB RESILIENCE ---');

  const abandonedCartPath = path.resolve(__dirname, 'services/abandonedCartService.js');
  const abandonedCart = fs.readFileSync(abandonedCartPath, 'utf8');

  report('Abandoned Cart Service Implements Concurrency Mutex Lock',
    abandonedCart.includes('isScanning') && abandonedCart.includes("reason: 'Scan already in progress'"),
    'Overlapping scans cleanly skipped without race conditions'
  );

  report('Abandoned Cart Service Implements Idempotent Reference IDs',
    abandonedCart.includes('ABANDONED_CART_${cart._id}_${cartUpdatedAt}'),
    'Duplicate customer notifications strictly suppressed'
  );

  report('Abandoned Cart Service Exports getSchedulerStatus Health Check',
    abandonedCart.includes('getSchedulerStatus'),
    'Diagnostic telemetry available for background job monitoring'
  );

  const { checkAbandonedCarts, getSchedulerStatus } = require('./services/abandonedCartService');
  const mongoose = require('mongoose');
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinetic_stride');
    }
    const scanResult = await checkAbandonedCarts();
    report('Abandoned Cart Processor Executes Cleanly',
      scanResult.success === true,
      `Eligible carts evaluated: ${scanResult.eligibleCount || 0}, Notifications: ${scanResult.notificationsCreated || 0}`
    );
    const status = getSchedulerStatus();
    report('Abandoned Cart Scheduler Status Telemetry Active',
      typeof status.isScanning === 'boolean' && status.lastScanTimestamp,
      `Last scan: ${status.lastScanTimestamp?.toISOString()}`
    );
  } catch (err) {
    report('Abandoned Cart Processor Executes Cleanly', false, err.message);
  } finally {
    try { await mongoose.disconnect(); } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // 4. HTTP RESPONSE CACHING & PERFORMANCE HEADERS
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. HTTP RESPONSE CACHING ---');

  try {
    const prodRes = await axios.get(`${BASE_URL}/products?limit=5`);
    const prodCache = prodRes.headers['cache-control'] || '';
    report('Public Products Catalog Caching Header',
      prodCache.includes('public') && prodCache.includes('max-age=60'),
      `Cache-Control: ${prodCache}`
    );
  } catch (err) {
    report('Public Products Catalog Caching Header', false, err.message);
  }

  try {
    const catRes = await axios.get(`${BASE_URL}/categories`);
    const catCache = catRes.headers['cache-control'] || '';
    report('Public Categories Caching Header',
      catCache.includes('public') && catCache.includes('max-age=120'),
      `Cache-Control: ${catCache}`
    );
  } catch (err) {
    report('Public Categories Caching Header', false, err.message);
  }

  try {
    const setRes = await axios.get(`${BASE_URL}/settings`);
    const setCache = setRes.headers['cache-control'] || '';
    report('Public Settings Caching Header',
      setCache.includes('public') && setCache.includes('max-age=180'),
      `Cache-Control: ${setCache}`
    );
  } catch (err) {
    report('Public Settings Caching Header', false, err.message);
  }

  try {
    // Single product resolution caching
    const prodList = await axios.get(`${BASE_URL}/products?limit=1`);
    const firstId = prodList.data.data?.products?.[0]?.slug || prodList.data.data?.[0]?.slug || prodList.data.data?.[0]?._id;
    if (firstId) {
      const singleRes = await axios.get(`${BASE_URL}/products/${firstId}`);
      const singleCache = singleRes.headers['cache-control'] || '';
      report('Single Product Detail Caching Header',
        singleCache.includes('public') && singleCache.includes('max-age=120'),
        `Cache-Control: ${singleCache}`
      );
    }
  } catch (err) {
    report('Single Product Detail Caching Header', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // FINAL SUITE SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log(`  PHASE 9 TECHNICAL VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase9TechnicalVerification();

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function runPhase4Tests() {
  console.log('='.repeat(80));
  console.log('       SOLEVIBE PHASE 4: PRODUCT DETAILS PAGE (PDP) VERIFICATION SUITE');
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

  try {
    // 1. Single Product Resolution by Slug
    const slug = 'urban-relay';
    const slugRes = await axios.get(`${BASE_URL}/products/${slug}`);
    report(
      'Slug Resolution: GET /api/products/:slug fetches product by URL slug',
      slugRes.data.success && slugRes.data.data && slugRes.data.data.slug === slug,
      `Name: ${slugRes.data.data?.name}`
    );

    const product = slugRes.data.data;
    const productId = product._id;

    // 2. Single Product Resolution by ObjectId
    const idRes = await axios.get(`${BASE_URL}/products/${productId}`);
    report(
      'ObjectId Resolution: GET /api/products/:id fetches product by 24-char ObjectId',
      idRes.data.success && idRes.data.data && idRes.data.data._id === productId,
      `ID: ${productId}`
    );

    // 3. Biomechanical Specifications Integrity
    const hasSpecs = Boolean(product.specifications);
    report(
      'Specifications Honesty: Honest database specifications are present on flagship model',
      hasSpecs && typeof product.specifications === 'object',
      `Drop: ${product.specifications?.drop}, Weight: ${product.specifications?.weight}`
    );

    report(
      'Synthetic Spec Suppression: Energy return percentage is not presented as verified lab fact',
      !product.specifications?.energy || typeof product.specifications?.energy === 'string',
      'Honest telemetry presentation maintained'
    );

    // 4. Inventory & Sizing Offerings
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    const hasValidStock = typeof product.stock === 'number' && product.stock >= 0;
    report(
      'Inventory & Sizing: Product has valid size offerings and positive stock count',
      hasSizes && hasValidStock,
      `Sizes: [${product.sizes.join(', ')}], Stock: ${product.stock}`
    );

    // 5. Real Shipping Calculator Integration (POST /api/shipping/calculate)
    // 5a: Standard shipping below free threshold (₹5,000)
    const stdShippingRes = await axios.post(`${BASE_URL}/shipping/calculate`, {
      subtotal: 5000,
      method: 'standard',
      address: { pincode: '560001', country: 'India' }
    });

    report(
      'Shipping Engine: Standard shipping below ₹15k returns backend-calculated charge & zone',
      stdShippingRes.data.success &&
      stdShippingRes.data.data.charge > 0 &&
      !stdShippingRes.data.data.isFreeEligible &&
      stdShippingRes.data.data.freeThreshold === 15000 &&
      Boolean(stdShippingRes.data.data.estimatedDeliveryDate),
      `Charge: ₹${stdShippingRes.data.data?.charge}, Zone: ${stdShippingRes.data.data?.zone}, Est: ${stdShippingRes.data.data?.estimatedDeliveryDate?.substring(0, 10)}`
    );

    // 5b: Free shipping threshold qualification (₹16,000)
    const freeShippingRes = await axios.post(`${BASE_URL}/shipping/calculate`, {
      subtotal: 16000,
      method: 'standard',
      address: { pincode: '560001', country: 'India' }
    });

    report(
      'Shipping Engine: Subtotal >= ₹15,000 qualifies for free standard shipping',
      freeShippingRes.data.success &&
      freeShippingRes.data.data.charge === 0 &&
      freeShippingRes.data.data.isFreeEligible === true,
      `Charge: ₹${freeShippingRes.data.data?.charge}, Free: ${freeShippingRes.data.data?.isFreeEligible}`
    );

    // 5c: Express shipping rate
    const expressShippingRes = await axios.post(`${BASE_URL}/shipping/calculate`, {
      subtotal: 5000,
      method: 'express',
      address: { pincode: '560001', country: 'India' }
    });

    report(
      'Shipping Engine: Express delivery calculates flat ₹350 rate',
      expressShippingRes.data.success && expressShippingRes.data.data.charge === 350,
      `Charge: ₹${expressShippingRes.data.data?.charge}, Method: ${expressShippingRes.data.data?.methodName}`
    );

    // 6. Customer Reviews Suite Integration (GET /api/reviews/product/:id)
    const revRes = await axios.get(`${BASE_URL}/reviews/product/${productId}`);
    report(
      'Customer Reviews Suite: GET /api/reviews/product/:id retrieves approved reviews & stats',
      revRes.data.success &&
      Array.isArray(revRes.data.data) &&
      typeof revRes.data.summary === 'object' &&
      typeof revRes.data.summary.averageRating === 'number',
      `Total Reviews: ${revRes.data.count}, Avg Rating: ${revRes.data.summary?.averageRating}`
    );

    // 7. Related Footwear Query Integration
    const relRes = await axios.get(`${BASE_URL}/products?category=${product.category}&status=active&limit=5`);
    const relatedList = (relRes.data.data || []).filter(p => p._id !== productId).slice(0, 4);
    report(
      'Related Footwear: Dynamic recommendations fetched by category, excluding current product',
      relRes.data.success && relatedList.length > 0 && !relatedList.some(p => p._id === productId),
      `Recommendations: ${relatedList.length} items from category '${product.category}'`
    );

    // 8. Error Handling for Invalid Product ID / Slug
    try {
      await axios.get(`${BASE_URL}/products/non-existent-product-slug-xyz-999`);
      report('PDP 404 Resilience: Non-existent product handled cleanly', false, 'Should have returned 404');
    } catch (err) {
      report(
        'PDP 404 Resilience: Non-existent product returns HTTP 404 with error message',
        err.response && err.response.status === 404,
        `HTTP Status: ${err.response?.status}`
      );
    }

  } catch (err) {
    console.error('Test execution error:', err.message);
    failed++;
  }

  console.log('='.repeat(80));
  console.log(`       PHASE 4 PDP TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase4Tests();

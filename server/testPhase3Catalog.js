const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

async function runPhase3Tests() {
  console.log('='.repeat(80));
  console.log('       SOLEVIBE PHASE 3: CATALOG, SHOP & CATEGORY VERIFICATION SUITE');
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
    // 1. Categories endpoint test
    const catRes = await axios.get(`${BASE_URL}/categories?isActive=true`);
    report(
      'Categories Retrieval: Fetches active categories from MongoDB',
      catRes.data.success && Array.isArray(catRes.data.data) && catRes.data.data.length >= 8,
      `Count: ${catRes.data.count}`
    );

    // 2. Full product catalog test
    const prodRes = await axios.get(`${BASE_URL}/products?status=active&limit=100`);
    report(
      'Full Catalog Retrieval: Fetches active products',
      prodRes.data.success && prodRes.data.count > 0,
      `Products: ${prodRes.data.count}`
    );

    const allProducts = prodRes.data.data;

    // 3. Category filtering (Men)
    const menRes = await axios.get(`${BASE_URL}/products?category=men&status=active`);
    report(
      'Category Filtering: Men category returns strictly men products',
      menRes.data.success && menRes.data.data.every(p => p.category === 'men'),
      `Count: ${menRes.data.count}`
    );

    // 4. Category filtering (Women)
    const womenRes = await axios.get(`${BASE_URL}/products?category=women&status=active`);
    report(
      'Category Filtering: Women category returns strictly women products',
      womenRes.data.success && womenRes.data.data.every(p => p.category === 'women'),
      `Count: ${womenRes.data.count}`
    );

    // 5. Special collection (Ozark)
    const ozarkRes = await axios.get(`${BASE_URL}/products?collectionName=Ozark&status=active`);
    report(
      'Special Collection: Ozark adventure footwear retrieved',
      ozarkRes.data.success && ozarkRes.data.data.length > 0,
      `Count: ${ozarkRes.data.count}`
    );

    // 6. Price range filtering
    const minP = 2000;
    const maxP = 4000;
    const priceRes = await axios.get(`${BASE_URL}/products?minPrice=${minP}&maxPrice=${maxP}&status=active`);
    report(
      `Price Range Filtering: Products bounded between ₹${minP} and ₹${maxP}`,
      priceRes.data.success && priceRes.data.data.every(p => p.price >= minP && p.price <= maxP),
      `Matches: ${priceRes.data.count}`
    );

    // 7. Sorting by Price: Low to High
    const sortLowRes = await axios.get(`${BASE_URL}/products?sort=price&order=asc&status=active&limit=20`);
    let isAscending = true;
    for (let i = 0; i < sortLowRes.data.data.length - 1; i++) {
      if (sortLowRes.data.data[i].price > sortLowRes.data.data[i + 1].price) {
        isAscending = false;
        break;
      }
    }
    report('Sorting: Price Low to High orders prices ascendingly', isAscending);

    // 8. Sorting by Price: High to Low
    const sortHighRes = await axios.get(`${BASE_URL}/products?sort=price&order=desc&status=active&limit=20`);
    let isDescending = true;
    for (let i = 0; i < sortHighRes.data.data.length - 1; i++) {
      if (sortHighRes.data.data[i].price < sortHighRes.data.data[i + 1].price) {
        isDescending = false;
        break;
      }
    }
    report('Sorting: Price High to Low orders prices descendingly', isDescending);

    // 9. Sorting by Rating
    const sortRatingRes = await axios.get(`${BASE_URL}/products?sort=rating&status=active&limit=20`);
    let isRatingDesc = true;
    for (let i = 0; i < sortRatingRes.data.data.length - 1; i++) {
      if ((sortRatingRes.data.data[i].rating || 0) < (sortRatingRes.data.data[i + 1].rating || 0)) {
        isRatingDesc = false;
        break;
      }
    }
    report('Sorting: Customer Rating orders rating descendingly', isRatingDesc);

    // 10. Specifications validation: Heel-to-toe drop values present
    const productsWithDrop = allProducts.filter(p => p.specifications && p.specifications.drop);
    report(
      'Technical Specs: Heel-to-toe drops present in catalog',
      productsWithDrop.length > 0,
      `Products with drop specs: ${productsWithDrop.length}`
    );

    // 11. Size availability: Valid sizes in catalog
    const productsWithSizes = allProducts.filter(p => Array.isArray(p.sizes) && p.sizes.length > 0);
    report(
      'Size Options: Real footwear sizes associated with products',
      productsWithSizes.length > 0,
      `Products with sizes: ${productsWithSizes.length}`
    );

    // 12. Search keyword query
    const searchRes = await axios.get(`${BASE_URL}/products?search=relay&status=active`);
    report(
      'Search Filter: Keyword "relay" returns matching products',
      searchRes.data.success && searchRes.data.data.some(p => p.name.toLowerCase().includes('relay')),
      `Matches: ${searchRes.data.count}`
    );

  } catch (error) {
    console.error('Test execution error:', error.message);
    failed++;
  }

  console.log('='.repeat(80));
  console.log(`PHASE 3 CATALOG TEST RESULTS: ${passed} PASSED, ${failed} FAILED OUT OF ${passed + failed} TOTAL TESTS.`);
  console.log('='.repeat(80));

  if (failed > 0) process.exit(1);
}

runPhase3Tests();

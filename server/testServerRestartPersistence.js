const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function phase1_prepare() {
  console.log('--- Phase 1: Preparing Data before Server Restart ---');
  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@zuxofit.com',
    password: 'admin123'
  });
  const token = adminLogin.data.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const uniqueSlug = `persist-cat-${Date.now()}`;
  const catRes = await axios.post(`${BASE_URL}/categories`, {
    name: 'Server Restart Test Category',
    slug: uniqueSlug,
    description: 'Verifies database persistence across server restarts',
    isActive: true,
    displayOrder: 88
  }, headers);

  console.log('Category Created in MongoDB:', catRes.data.data._id, 'slug:', uniqueSlug);

  const setRes = await axios.put(`${BASE_URL}/settings`, {
    storeName: 'SoleVibe Precision India',
    freeShippingThreshold: 2500
  }, headers);

  console.log('Settings Updated in MongoDB:', setRes.data.data.storeName, 'threshold:', setRes.data.data.freeShippingThreshold);

  return { uniqueSlug, categoryId: catRes.data.data._id };
}

async function phase2_verify(uniqueSlug, categoryId) {
  console.log('--- Phase 2: Verifying Data after Server Restart ---');
  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@zuxofit.com',
    password: 'admin123'
  });
  const token = adminLogin.data.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  // 1. Verify Category
  const catListRes = await axios.get(`${BASE_URL}/categories`);
  const foundCat = catListRes.data.data.find(c => c.slug === uniqueSlug);
  if (!foundCat) {
    throw new Error(`Category with slug ${uniqueSlug} was lost across server restart!`);
  }
  console.log('✅ PASS: Category persisted across server restart:', foundCat.name);

  // 2. Verify Settings
  const setRes = await axios.get(`${BASE_URL}/settings`);
  if (setRes.data.data.storeName !== 'SoleVibe Precision India' || setRes.data.data.freeShippingThreshold !== 2500) {
    throw new Error('Settings were lost or reverted across server restart!');
  }
  console.log('✅ PASS: Settings persisted across server restart:', setRes.data.data.storeName, setRes.data.data.freeShippingThreshold);

  // Clean up
  await axios.delete(`${BASE_URL}/categories/${categoryId}`, headers);
  await axios.put(`${BASE_URL}/settings`, {
    storeName: 'SoleVibe Footwear',
    freeShippingThreshold: 2000
  }, headers);
  console.log('✅ Cleaned up test category and restored default store settings');
}

const mode = process.argv[2];
if (mode === 'prepare') {
  phase1_prepare().then(res => {
    console.log(JSON.stringify(res));
    process.exit(0);
  }).catch(e => {
    console.error(e.response?.data || e.message);
    process.exit(1);
  });
} else if (mode === 'verify') {
  const slug = process.argv[3];
  const id = process.argv[4];
  phase2_verify(slug, id).then(() => {
    process.exit(0);
  }).catch(e => {
    console.error(e.response?.data || e.message);
    process.exit(1);
  });
}

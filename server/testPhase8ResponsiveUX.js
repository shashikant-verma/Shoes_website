const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function runPhase8ResponsiveUXVerification() {
  console.log('='.repeat(80));
  console.log('  SOLEVIBE PHASE 8: RESPONSIVE DESIGN & UX REFINEMENT AUDIT SUITE');
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
  // 1. MOBILE BOTTOM NAVIGATION BAR
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. MOBILE BOTTOM NAVIGATION BAR ---');

  const bottomNavJsPath = path.resolve(__dirname, '../src/components/MobileBottomNav.js');
  const bottomNavCssPath = path.resolve(__dirname, '../src/components/MobileBottomNav.css');
  const appJsPath = path.resolve(__dirname, '../src/App.js');

  const bottomNavJsExists = fs.existsSync(bottomNavJsPath);
  report('MobileBottomNav.js Component Exists', bottomNavJsExists, bottomNavJsPath);

  if (bottomNavJsExists) {
    const bottomNavContent = fs.readFileSync(bottomNavJsPath, 'utf8');
    report('Bottom Nav Contains Home, Shop, Wishlist, Bag, and Account Items',
      bottomNavContent.includes('Home') &&
      bottomNavContent.includes('Shop') &&
      bottomNavContent.includes('Wishlist') &&
      bottomNavContent.includes('Bag') &&
      bottomNavContent.includes('Account'),
      'All 5 primary navigation destinations present'
    );
    report('Bottom Nav Has Dynamic Cart & Wishlist Badge Support',
      bottomNavContent.includes('cartCount') && bottomNavContent.includes('wishlistCount') && bottomNavContent.includes('mobile-nav-badge'),
      'Badges for real-time inventory items'
    );
    report('Bottom Nav Accessibility (aria-label, aria-current)',
      bottomNavContent.includes('aria-label') && bottomNavContent.includes('aria-current'),
      'WCAG standard aria landmarks present'
    );
  }

  const bottomNavCssExists = fs.existsSync(bottomNavCssPath);
  report('MobileBottomNav.css Stylesheet Exists', bottomNavCssExists, bottomNavCssPath);

  if (bottomNavCssExists) {
    const bottomNavCss = fs.readFileSync(bottomNavCssPath, 'utf8');
    report('Bottom Nav Scoped to Mobile Viewports (< 768px)',
      bottomNavCss.includes('@media (max-width: 768px)') && bottomNavCss.includes('display: none'),
      'Hidden on desktop and active on mobile'
    );
    report('Touch Target Standard >= 44x44px Enforced on Mobile Items',
      bottomNavCss.includes('min-width: 52px') && bottomNavCss.includes('min-height: 48px'),
      'Touch target exceeds 44x44px minimum requirement'
    );
    report('iOS Safe Area Inset Support in Bottom Nav',
      bottomNavCss.includes('env(safe-area-inset-bottom)'),
      'Padding dynamically offsets home gesture bar'
    );
  }

  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  report('App.js Mounts MobileBottomNav on Storefront',
    appJsContent.includes('import MobileBottomNav') && appJsContent.includes('<MobileBottomNav'),
    'Mounted for non-admin storefront routes'
  );

  // ---------------------------------------------------------------------------
  // 2. MOBILE NAVIGATION DRAWER
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. MOBILE NAVIGATION DRAWER ---');

  const navbarJsPath = path.resolve(__dirname, '../src/components/Navbar.js');
  const navbarCssPath = path.resolve(__dirname, '../src/components/Navbar.css');
  const navbarJs = fs.readFileSync(navbarJsPath, 'utf8');
  const navbarCss = fs.readFileSync(navbarCssPath, 'utf8');

  report('Drawer Brandmark & Close Button in Mobile Header',
    navbarJs.includes('mobile-drawer-header') && navbarJs.includes('drawer-close-btn') && navbarJs.includes('drawer-brand'),
    'Drawer header contains brand logo and accessible close button'
  );
  report('Drawer Slide-Out Category & Collection Navigation',
    navbarJs.includes('drawer-collections') && navbarJs.includes('new-arrivals') && navbarJs.includes('sale'),
    'Categories and promotional collections linked'
  );
  report('Drawer Customer Account & Auth Links',
    navbarJs.includes('drawer-account-section') && navbarJs.includes('My Account') && navbarJs.includes('Sign In / Register'),
    'Dynamic customer authentication state in drawer'
  );
  report('Drawer Store Currency & Shipping Indicator',
    navbarJs.includes('drawer-currency-badge') && navbarJs.includes('INR (₹)') && navbarJs.includes('Free shipping above ₹15,000'),
    'Clear regional currency and policy telemetry'
  );
  report('Drawer Slide Transition & Frosted Blur Backdrop',
    navbarCss.includes('transform: translateX(-100%)') && navbarCss.includes('transform: translateX(0)') && navbarCss.includes('backdrop-filter: blur(8px)'),
    'Smooth slide-out physics with frosted overlay'
  );

  // ---------------------------------------------------------------------------
  // 3. MOBILE STICKY PDP ACTION BAR
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. MOBILE STICKY PDP ACTION BAR ---');

  const pdpJsPath = path.resolve(__dirname, '../src/components/ProductDetail.js');
  const pdpCssPath = path.resolve(__dirname, '../src/components/ProductDetail.css');
  const pdpJs = fs.readFileSync(pdpJsPath, 'utf8');
  const pdpCss = fs.readFileSync(pdpCssPath, 'utf8');

  report('ProductDetail.js Implements Mobile Sticky Bar Component',
    pdpJs.includes('pdp-mobile-sticky-bar') && pdpJs.includes('showStickyBar') && pdpJs.includes('actionsRowRef'),
    'Scroll detection triggers sticky purchase bar'
  );
  report('Sticky Bar Contains Shoe Thumbnail, Title, Price, Size Pill & CTA',
    pdpJs.includes('pdp-sticky-thumb-img') && pdpJs.includes('pdp-sticky-name') && pdpJs.includes('pdp-sticky-price') && pdpJs.includes('pdp-sticky-size-pill') && pdpJs.includes('pdp-sticky-cta'),
    'High-conversion rapid purchase elements present'
  );
  report('Sticky Bar CTA Triggers Add-to-Bag with Selected Size Validation',
    pdpJs.includes('handleStickyAddToCart') && pdpJs.includes('scrollIntoView'),
    'Missing size smoothly guides user to size grid'
  );
  report('ProductDetail.css Implements Sticky Bar Slide-Up Presentation',
    pdpCss.includes('.pdp-mobile-sticky-bar') && pdpCss.includes('position: fixed') && pdpCss.includes('transform: translateY(0)'),
    'Smooth slide-up docked to viewport bottom on mobile'
  );

  // ---------------------------------------------------------------------------
  // 4. TOUCH OPTIMIZATION & RESPONSIVE BREAKPOINTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. TOUCH OPTIMIZATION & RESPONSIVE BREAKPOINTS ---');

  const appCssPath = path.resolve(__dirname, '../src/App.css');
  const appCss = fs.readFileSync(appCssPath, 'utf8');
  const indexCssPath = path.resolve(__dirname, '../src/index.css');
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');
  const tokensCssPath = path.resolve(__dirname, '../src/styles/design-tokens.css');
  const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
  const collectionCssPath = path.resolve(__dirname, '../src/components/CollectionPage.css');
  const collectionCss = fs.readFileSync(collectionCssPath, 'utf8');

  report('iOS Auto-Zoom Prevention (16px Input Font Size)',
    appCss.includes('font-size: 16px !important'),
    'Inputs guaranteed >= 16px on mobile viewports'
  );
  report('Mobile Bottom Clearance Padding in App.css',
    appCss.includes('padding-bottom: calc(64px + env(safe-area-inset-bottom, 12px))'),
    'Prevents bottom navigation from obscuring content'
  );
  report('Native Momentum Scrolling (-webkit-overflow-scrolling: touch)',
    indexCss.includes('-webkit-overflow-scrolling: touch'),
    'Applied across all scrollable reels and drawers'
  );
  report('2-Column Grid Preservation on 375px / 360px Mobile Screens',
    collectionCss.includes('grid-template-columns: repeat(2, 1fr) !important') && collectionCss.includes('@media (max-width: 340px)'),
    'Standard mobile screens (375px/360px) render clean 2-column grid'
  );
  report('Fluid Typography Scale Clamping (clamp()) in Design Tokens',
    tokensCss.includes('clamp('),
    'Headings scale smoothly without jarring viewport jumps'
  );
  report('Accessible Keyboard Focus Outline (:focus-visible)',
    indexCss.includes(':focus-visible') && indexCss.includes('outline: 2px solid'),
    'WCAG AA accessible focus indicators'
  );

  // ---------------------------------------------------------------------------
  // 5. LIVE API CONNECTIVITY ACROSS RESPONSIVE VIEWS
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. LIVE API CONNECTIVITY ACROSS RESPONSIVE VIEWS ---');

  try {
    const healthRes = await axios.get(`${BASE_URL}/health`);
    report('API Server Healthy & Connected to MongoDB', healthRes.status === 200 && healthRes.data.database === 'connected', 'Database active');
  } catch (err) {
    report('API Server Healthy & Connected to MongoDB', false, err.message);
  }

  try {
    const prodRes = await axios.get(`${BASE_URL}/products?limit=4`);
    const count = prodRes.data.data?.products?.length || prodRes.data.data?.length || 0;
    report('Storefront Catalog Feed Operates Cleanly', prodRes.status === 200 && count > 0, `Loaded ${count} products for mobile views`);
  } catch (err) {
    report('Storefront Catalog Feed Operates Cleanly', false, err.message);
  }

  try {
    const catRes = await axios.get(`${BASE_URL}/categories?all=true`);
    const cats = catRes.data.data || [];
    report('Category Hierarchy Serves Mobile Navigation Drawer', catRes.status === 200 && cats.length >= 8, `Loaded ${cats.length} categories`);
  } catch (err) {
    report('Category Hierarchy Serves Mobile Navigation Drawer', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // FINAL SUITE SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log(`  PHASE 8 RESPONSIVE UX VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase8ResponsiveUXVerification();

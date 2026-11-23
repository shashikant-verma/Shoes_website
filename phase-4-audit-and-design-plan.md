# SOLEVIBE — PHASE 4: PRODUCT DETAILS PAGE (PDP) AUDIT & DESIGN PLAN (REVISED)

**Document Version:** 2.0.0 (Final Corrected Plan)  
**Date:** November 23, 2026  
**Status:** Inspection & Corrected Planning Complete — Awaiting Approval Before Implementation  
**Governing Documents:**  
- [design.md](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/design.md) (Section 6.3)  
- [archetrect.md](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/archetrect.md)  
- [planphase.md](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/planphase.md) (Phase 4)  
- [phase-3-completion-report.md](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/phase-3-completion-report.md)

---

## 1. Executive Summary

This document establishes the verified baseline audit and final engineering design plan for **Phase 4: Product Details Page (PDP) Redesign** of the SoleVibe footwear e-commerce application.

All findings and architectural decisions in this revised document are grounded in direct inspection of the live MongoDB database (`kinetic_stride`), Mongoose models, backend controllers, and existing frontend components.

Key architectural realities established in this plan:
1. **Dynamic Backend Shipping Engine:** Shipping charges, thresholds, and delivery dates are calculated exclusively by the backend endpoint `POST /api/shipping/calculate`. The frontend never hardcodes shipping fees or dates.
2. **Verified Product Specifications:** Of 58 active catalog products, 52 contain specification data and 6 have missing or undefined specifications. Missing specification fields will be dynamically hidden or shown as unavailable. Synthetic energy-return percentages (`specs.energy`) are strictly omitted.
3. **Integrated "Buy Now" Flow:** Buy Now leverages the established Cart and Payment architecture (`onAddToCart` followed by `onPageChange('cart')`), ensuring 100% adherence to existing address selection, coupon calculation, Razorpay order authorization, and inventory reduction logic.
4. **Product-Level Inventory Architecture:** Inventory is tracked at the product level (`product.stock: Number`) while size offerings are maintained via `product.sizes: [String]`. Size selection and quantity limits strictly enforce these boundaries.
5. **Full-Page State-Driven Routing:** The PDP transitions from a modal overlay to a full-page responsive view with stable URL query synchronization (`?product=slug` or `?page=product&id=...`) and native browser Back/Forward support.

---

## 2. Current Architecture & File Path Inspection

| Component / Service | File Path | Role in Existing Application |
|---|---|---|
| **Product Detail Component** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js) | Currently renders as a modal overlay (`.product-detail-modal`) with fixed viewport height. |
| **Product Detail Styles** | [src/components/ProductDetail.css](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.css) | 1,141 lines of legacy styles with fixed modal positioning and non-tokenized color hexes. |
| **Product Service** | [src/services/productService.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/services/productService.js) | Frontend client for `/api/products` (supports `getProduct(id)` querying by ID or slug). |
| **Shipping Controller & Engine** | [server/controllers/shippingController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/shippingController.js) & [server/services/shippingService.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/services/shippingService.js) | Dynamic server-side rate and delivery engine executing `POST /api/shipping/calculate`. |
| **Review Service & Controller** | [src/services/reviewService.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/services/reviewService.js) & [server/controllers/reviewController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/reviewController.js) | Handles approved product reviews, 5-to-1 star summary distribution, and customer submissions. |
| **Recently Viewed** | [src/components/RecentlyViewed.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/RecentlyViewed.js) | LocalStorage manager and carousel for recently visited shoes. |
| **Cart & Checkout Suite** | [src/components/Cart.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/Cart.js) & [server/controllers/paymentController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/paymentController.js) | Authoritative checkout pipeline handling address validation, Razorpay orders, and inventory stock decrement. |
| **Application State Router** | [src/App.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/App.js) | Top-level state-driven coordinator holding `selectedProduct`, `currentPage`, `cart`, and `wishlist`. |

---

## 3. Verified Backend Integrations & Business Rules

### A. Shipping Integration (`POST /api/shipping/calculate`)
Inspection of [server/services/shippingService.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/services/shippingService.js) and [server/controllers/shippingController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/shippingController.js) confirms:

1. **Endpoint & Request Contract:**
   - Route: `POST /api/shipping/calculate` (Public access).
   - Payload:
     ```json
     {
       "subtotal": 2499,
       "method": "standard",
       "address": { "pincode": "400001" }
     }
     ```
2. **Server-Calculated Response Structure:**
   ```json
   {
     "success": true,
     "data": {
       "valid": true,
       "method": "standard",
       "methodName": "Standard Delivery",
       "charge": 150,
       "freeThreshold": 15000,
       "isFreeEligible": false,
       "zone": "LOCAL",
       "deliveryRange": "3-5 business days",
       "estimatedDeliveryDate": "2026-11-27T10:15:01.873Z"
     }
   }
   ```
3. **Backend Calculation Rules:**
   - **Destination Zone Determination:**
     - Invalid/Restricted: Pincode `'000000'`, `'000'`, or non-India returns `valid: false` and `message: 'Delivery unavailable to specified destination address or pincode'`.
     - `LOCAL`: Pincodes starting with `'40'`, `'41'`, or state `'maharashtra'`.
     - `REGIONAL`: States `'gujarat'`, `'goa'`, `'karnataka'`, `'madhya pradesh'`.
     - `NATIONAL`: All other valid destinations in India.
   - **Shipping Methods & Charges:**
     - Free Shipping: When `subtotal >= FREE_SHIPPING_THRESHOLD` (backend default: ₹15,000), `charge = 0` and `method = 'free'`.
     - Standard Delivery: Under threshold, returns server-configured standard fee (`charge: 150`).
     - Express Courier: Flat rate of `charge: 350`, regardless of subtotal.
   - **Delivery Date Calculation:**
     - Executed via `addBusinessDays(orderDate, businessDays)` on the server (Standard: 4 business days, Express: 2 business days; skipping Saturdays and Sundays).
4. **PDP Integration Mandate:**
   - The PDP **must never hardcode** shipping charges (such as assuming ₹150) or arrival dates.
   - The PDP pincode checker will dispatch `POST /api/shipping/calculate` with the product's price and entered pincode.
   - The UI will render the exact `data.charge`, `data.methodName`, `data.deliveryRange`, and human-formatted `data.estimatedDeliveryDate` returned by the server.

---

### B. Product Specifications Audit & Policy
Live audit of the 58 active products in MongoDB (`kinetic_stride`) reveals:

1. **Catalog Data Availability:**
   - **52 Products:** Have complete `specifications` subdocuments containing `weight`, `drop`, `material`, `sole`, `closure`, `type`, and `use`.
   - **6 Products:** Have `specifications: undefined` or missing specifications (e.g., dynamically seeded test products).
2. **Genuinely Available Specification Fields:**
   - `specifications.weight`: String (e.g., `"180g"`, `"193g"`, `"206g"`).
   - `specifications.drop`: String (e.g., `"3mm"`, `"4mm"`, `"5mm"`, `"6mm"`, `"7mm"`).
   - `specifications.material`: Upper construction (e.g., `"Breathable mesh and synthetic"`).
   - `specifications.sole`: Outsole & midsole composition (e.g., `"Rubber and EVA"`, `"Flexible rubber"`).
   - `specifications.closure`: Lacing system (e.g., `"Lace-up"`).
   - `specifications.use`: Intended athletic discipline (e.g., `"Everyday"`, `"Running"`, `"Training"`).
3. **Mandatory Specification Display Rules on PDP:**
   - **Conditional Rendering:** A specification box will only render if the property exists, is a string, and is non-empty on `product.specifications`.
   - **Missing Field Handling:** If a field is missing (e.g., product has no `drop` defined), that individual spec box will either be omitted or clearly state `"Not specified"`. If the entire `specifications` object is undefined (as in the 6 test products), the technical telemetry box will gracefully collapse without causing runtime errors.
   - **Strict Omission of Synthetic Claims:** Under no circumstances will `specifications.energy` (synthetic percentage like `+10%`, `+11%`) be displayed as laboratory fact or marketing telemetry, in full compliance with Phase 2 decisions.
   - **No Invented Numbers:** The frontend will never default missing weights or drops to hardcoded numbers (e.g., never fallback to "180g" or "4mm").

---

### C. Buy Now Architecture & Checkout Integration
Inspection of [src/components/Cart.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/Cart.js) and [server/controllers/orderController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/orderController.js) confirms the exact Buy Now integration path:

1. **Zero Duplicate Checkout Logic:**
   - Buy Now will **not** implement a separate payment endpoint, separate Razorpay modal, or duplicate address form.
2. **Step-by-Step Buy Now Flow:**
   - **Step 1 (Size & Stock Validation):** When customer clicks "Buy Now" on PDP, verify `selectedSize` is selected, exists in `product.sizes`, and `product.stock > 0`. If invalid, flag size error and halt.
   - **Step 2 (Cart Addition):** Dispatch existing `onAddToCart({ ...product, size: selectedSize, quantity: quantity })`. This adds the item to the cart, synchronizes with guest `localStorage` (`cart-guest`) or backend MongoDB (`/api/cart`), and updates the navbar badge.
   - **Step 3 (Navigation Transition):** Close PDP (`onClose()`) and immediately transition view to Cart (`onPageChange('cart')`), updating the URL to `?page=cart`.
   - **Step 4 (Existing Authoritative Checkout):** In `Cart.js`, the item is preloaded, where the customer selects their delivery address (from saved addresses or new address form) and proceeds through the verified Razorpay checkout modal.
3. **Preserved Backend Guarantees:**
   - Server-side price recalculation in `paymentController.js`.
   - Server-side stock deduction in `orderController.js` (`product.stock -= item.quantity`).
   - Server-side coupon verification in `couponService.js`.
   - Razorpay signature verification in `paymentService.verifyPayment`.
   - Real-time stock alerts (`OUT_OF_STOCK`, `LOW_STOCK`) created in `orderController.js`.

---

### D. Quantity & Inventory Architecture
Direct inspection of [server/models/Product.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/models/Product.js) and [server/controllers/orderController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/orderController.js) reveals:

1. **Inventory Level:**
   - Inventory is tracked strictly at the **Product level** (`product.stock: Number`).
   - There is **no individual size-level stock subdocument** in the database schema (e.g., no `sizeStock: [{ size, qty }]`).
   - `product.sizes` is an array of strings representing manufactured/available size options for that model.
2. **Inventory Rules Enforced on PDP:**
   - **Sold-Out Product (`stock === 0`):**
     - All size buttons are rendered with an unavailable strikethrough state, `disabled={true}`, and `aria-disabled="true"`.
     - Quantity selector is disabled and displays `0`.
     - "Add to Bag" and "Buy Now" buttons are disabled with label `OUT OF STOCK`.
     - Badge displays `SOLD OUT`.
   - **In-Stock Product (`stock > 0`):**
     - Sizes present in `product.sizes` are selectable.
     - Sizes outside `product.sizes` (or if sizes array is empty) are disabled with a diagonal slash.
     - Quantity selector has minimum of `1` and maximum of `product.stock`.
     - Increment button `+` is disabled when `quantity >= product.stock`.
     - Prevents adding quantities exceeding available warehouse stock.

---

## 4. Comprehensive Audit Findings & Classifications

Every PDP area has been audited and classified with direct evidence:

| Audit Item | Area | Finding Description | Classification | Codebase Evidence |
|---|---|---|---|---|
| **01** | Routing & URL | No URL parameter set on product view; refresh resets to home; direct links fail. | **FAIL** | [src/App.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/App.js#L34): `selectedProduct` is memory-only; no URL slug sync. |
| **02** | Browser History | Browser Back button does not close or navigate away from product view. | **FAIL** | `popstate` listener in `App.js` does not handle product detail dismissal. |
| **03** | Full-Page Experience | Product detail rendered as popup modal overlay (`.product-detail-modal`) with fixed height. | **FAIL** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js#L224): Uses `.product-detail-overlay`. |
| **04** | "Buy Now" CTA | Instant checkout CTA button is completely absent. | **FAIL** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js#L428): Only `.btn-add-to-cart-large` exists. |
| **05** | Shipping Integration | Delivery estimator uses simulated `setTimeout` instead of backend API. | **FAIL** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js#L35-L45): Hardcodes simulated message. |
| **06** | Product Specifications | Displays synthetic energy-return percentage (`specs.energy`), violating Phase 2 rules. | **FAIL** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js#L310): Displays `ENERGY RETURN: {specs.energy}`. |
| **07** | Size Out-of-Stock UX | Size buttons render without checking inventory or showing disabled strikethrough state. | **FAIL** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js#L350): Plain button map without disabled states. |
| **08** | Related Footwear | Lacks database query for related category products; only renders `RecentlyViewed`. | **FAIL** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js#L635): Embeds `<RecentlyViewed />` only. |
| **09** | Image Zoom | Lacks smooth mouse-follow hover zoom lens on desktop. | **FAIL** | [src/components/ProductDetail.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.js#L236): Only has fullscreen lightbox on click. |
| **10** | Design Tokens | Styles use legacy classes and non-tokenized hex codes (`#2563eb`, `#059669`). | **FAIL** | [src/components/ProductDetail.css](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/src/components/ProductDetail.css): 1,141 lines of pre-redesign CSS. |
| **11** | Add to Bag | Adds item with size & quantity to cart state, localStorage, and MongoDB. | **PASS** | `handleAddToCart` in `ProductDetail.js` executes and updates navbar cart counter. |
| **12** | Size Validation | Prevents adding to bag if size is omitted with clear error message. | **PASS** | `sizeError` displays `⚠️ Please select a size before adding to cart`. |
| **13** | Size Guide Modal | Interactive international conversion modal (UK, US Men, US Women, EU, CM). | **PASS** | Size conversion modal renders on clicking "📏 Size Guide". |
| **14** | Thumbnail Switching | Clicking thumbnails updates main display image. | **PASS** | `activeImageIndex` updates `currentDisplayImage` smoothly. |
| **15** | Public Reviews API | Fetches real approved reviews and calculates 5-to-1 star distribution summary. | **PASS** | `reviewService.getProductReviews` connects to `GET /api/reviews/product/:id`. |
| **16** | Verified Buyer Badge | Highlights verified purchasers on authentic customer review cards. | **PASS** | Reviews display `✓ Verified Purchase` when `rev.isVerifiedPurchase === true`. |
| **17** | Review Submission | Authenticated verified buyers can submit, edit, or delete reviews. | **PASS** | Connected to `POST /api/reviews` and `PUT /api/reviews/:id`. |
| **18** | Product API Resolver | Endpoint accepts both 24-char ObjectId and URL slug. | **PASS** | [server/controllers/productController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/productController.js#L123): Supports `findById` and `findOne({ slug })`. |
| **19** | Shipping API Engine | Endpoint calculates live rate, zone, threshold, and business day arrival date. | **PASS** | [server/controllers/shippingController.js](file:///c:/Users/SHASHIKANT/Downloads/Shoes_website-main/Shoes_website-main/server/controllers/shippingController.js#L43): `POST /api/shipping/calculate`. |

---

## 5. Proposed Phase 4 Engineering Plan

### A. Layout Structure (Full-Page Two-Column Asymmetric Grid)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BREADCRUMB: Home  /  Shop  /  Men  /  SoleVibe Urban Relay                  │
├───────────────────────────────────────┬─────────────────────────────────────┤
│ STICKY MEDIA GALLERY (Left 55%)       │ PURCHASE CONSOLE (Right 45%)        │
│                                       │                                     │
│ ┌───┐ ┌─────────────────────────────┐ │ SOLEVIBE ATHLETICS • MEN            │
│ │ 1 │ │                             │ │ SOLEVIBE URBAN RELAY                │
│ ├───┤ │                             │ │ ₹2,499  ₹3,999  [38% OFF]          │
│ │ 2 │ │                             │ │ Inclusive of all taxes              │
│ ├───┤ │      MAIN HIGH-RES          │ │ ★★★★★ 4.6 (128 Reviews) [Jump]     │
│ │ 3 │ │      HOVER-ZOOM LENS        │ │                                     │
│ ├───┤ │                             │ │ SELECT SIZE (UK/IN)   [Size Guide]  │
│ │ 4 │ │                             │ │ [ 6 ] [ 7 ] [ 8 ] [ 9 ] [ 10 ]      │
│ └───┘ └─────────────────────────────┘ │ [ 11 ] [ 12-Out ]                   │
│                                       │                                     │
│ [ 🔍 Click for Fullscreen Lightbox ]   │ QUANTITY: [ - ] 1 [ + ]  16 In Stock│
│                                       │                                     │
│                                       │ [  ⚡ ADD TO BAG  -  ₹2,499  ]       │
│                                       │ [  INSTANT BUY NOW  ]               │
│                                       │                                     │
│                                       │ 🚚 CHECK DELIVERY & PINCODE:        │
│                                       │ [ Enter Pincode ] [ Check ]         │
│                                       │ ↳ Live API: Standard / Express      │
│                                       │                                     │
│                                       │ 🔄 7-Day Return Policy Guarantee    │
│                                       │ 🔒 100% Secure Checkout via Razorpay│
│                                       │                                     │
│                                       │ ▼ BIOMECHANICAL SPECIFICATIONS      │
│                                       │   Weight: 180g | Drop: 3mm          │
│                                       │   Sole: Rubber & EVA | Use: Running │
│                                       │   (Conditioned on actual DB data)   │
│                                       │                                     │
│                                       │ ▼ PRODUCT STORY & CRAFTSMANSHIP     │
│                                       │   Breathable open-cell mesh upper   │
├───────────────────────────────────────┴─────────────────────────────────────┤
│ CUSTOMER REVIEWS & RATINGS SECTION                                          │
│ - 5-to-1 Star Distribution Breakdown                                        │
│ - Verified Buyer submission console                                         │
│ - Approved customer review cards                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ RELATED FOOTWEAR (Same Category / Collection from MongoDB)                  │
│ - 4-Card Responsive Grid with 4:5 ProductCards                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ RECENTLY VIEWED CAROUSEL                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### B. Implementation Checkpoints

1. **Page Frame & Breadcrumb Trail:**
   - Navigational path: `Home > Shop > [Category] > [Product Name]`.
   - "← Back to Collection" button restoring previous catalog filters.
2. **Sticky Media Gallery:**
   - 4:5 vertical aspect ratio.
   - Smooth mouse-move hover-zoom lens magnifying focal points (`scale(1.8)`).
   - Thumbnail reel with active kinetic indicator and image error fallback.
   - Lightbox modal for fullscreen examination.
3. **Purchase Console:**
   - Category eyebrow and bold title in `#111827`.
   - Price block: current price, strikethrough original price, discount pill.
   - Star rating link with smooth-scroll to `#reviews`.
   - Size grid: UK/IN sizes, strikethrough disabled state for unavailable sizes, size guide link.
   - Quantity selector: bounded by `1` and `product.stock`.
   - Primary CTA: "ADD TO BAG" with micro-feedback.
   - Secondary CTA: "BUY NOW" with instant cart transition.
   - Live pincode lookup via `POST /api/shipping/calculate` (dynamic fee, zone, delivery date).
   - Biomechanical telemetry chips: only displaying genuine fields (`weight`, `drop`, `sole`, `material`, `use`).
   - 7-Day return policy statement.
4. **Customer Reviews Suite:**
   - Real 5-star distribution chart, verified buyer badge, submission form, and approved reviews list.
5. **Related Footwear Recommendations:**
   - Real MongoDB query for products matching category/collection (using 4:5 `ProductCard`).
6. **Recently Viewed Shoes:**
   - Powered by `RecentlyViewed.js`.
7. **URL Routing & History:**
   - State-driven URL synchronization (`?product=slug` or `?page=product&id=...`).
   - Browser refresh hydration via `productService.getProduct(slug)`.
   - Browser Back and Forward navigation via `popstate` listener.

---

## 6. Testing Strategy

1. **Automated Verification:**
   - `npm run build`: Production build check.
   - `node server/testPhase4PDP.js` *(to be created during implementation)*: Verifying single product retrieval, review aggregation, shipping calculation, and related products query.
   - Existing regression suites (`testPhase3Catalog.js`, `testPhase2Remediation.js`, `testE2EIntegration.js`, `testFinalMilestone.js`).
2. **Functional & Responsive Verification:**
   - Refresh test on direct URL (`/?product=urban-relay`).
   - Browser Back/Forward navigation test.
   - Out-of-stock size disablement test.
   - Live pincode test against `/api/shipping/calculate`.
   - "Buy Now" flow to cart checkout test.
   - Mobile viewport testing (< 768px and < 480px).

---

## 7. Strict Stop Condition Affirmation

- **No application source code or backend APIs have been modified.**
- **No database records have been modified.**
- This document represents the finalized, corrected design plan.
- Standing by for explicit user approval before beginning Phase 4 implementation.

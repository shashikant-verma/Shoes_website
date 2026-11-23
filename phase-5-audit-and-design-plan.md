# SOLEVIBE — PHASE 5: CART & CHECKOUT REDESIGN AUDIT & DESIGN PLAN

**Document Version:** 1.0.0  
**Phase:** Phase 5 — Cart & Checkout Experience Redesign  
**Date:** 2026-11-23  
**Status:** IMPLEMENTATION BLUEPRINT  
**Target Architecture:** Node.js v20+ / React 18 / Express 5 / MongoDB 8+  
**Design Reference:** `design.md` §6.4 & `planphase.md` §Phase 5  

---

## 1. Executive Summary & Audit Findings

The Cart and Checkout flow is the critical conversion funnel of the SoleVibe platform. An empirical audit of the existing codebase (`src/components/Cart.js`, `src/components/Cart.css`, `src/components/AddressBook.js`, `src/components/AddressForm.js`, `src/components/OrderConfirmation.js`) revealed solid foundational payment and order APIs, but multiple visual, functional, and policy discrepancies:

### Verified Defects in Existing Cart & Checkout:
1. **Violation of Shipping Policy (₹2,000 vs ₹15,000 Free Shipping Threshold):**
   - Lines 54, 410, 417, and 564 in `Cart.js` hardcode a `₹2,000` free shipping threshold.
   - *Correction:* Must reflect the official backend shipping engine (`shippingService.js`) threshold of **₹15,000**.
2. **Violation of Return Policy (14-Day vs 7-Day Returns):**
   - Line 603 in `Cart.js` displays a `14-DAY RETURNS` trust badge.
   - *Correction:* Must strictly display `7-Day Return Policy` in accordance with Phase 2 remediation and backend return controller rules.
3. **Synthetic Specification Bleed-Through:**
   - Lines 459–462 in `Cart.js` hardcode `item.specifications?.energy || '85%'`.
   - *Correction:* Completely remove unverified synthetic energy percentages. Display only genuine database specs if available (`item.specifications?.weight`, `item.specifications?.drop`) or clean footwear category/sizing metadata.
4. **Dark-Theme Clashing in Checkout Modal:**
   - The delivery address selection and form modal in `Cart.js` uses dark inline styles (`#16181f`, `#272a38`, `#0e1017`), which directly clashes with the customer storefront's Alabaster & White canvas (`#F9FAFB` / `#FFFFFF`).
   - *Correction:* Redesign the address selector and form into a clean, modern, tokenized modal with proper `--color-white`, `--color-alabaster`, `--color-slate-900`, and vermilion accents.
5. **Shipping Method Selection & Live Rate Integration:**
   - Existing `Cart.js` does not offer a shipping method toggle (Standard vs Express Courier ₹350) and does not query `paymentService.calculateShipping` when address is selected.
   - *Correction:* Allow users to select between Standard Delivery (Free over ₹15k, or standard fee) and Express Courier (+₹350), with live calculation.
6. **Order Confirmation Inconsistencies:**
   - `OrderConfirmation.js` displays `Order #{order.id}` and `SIZE: US {item.size}`.
   - *Correction:* SoleVibe standard is UK/Indian sizing (`UK {item.size}`) and official order number (`order.orderNumber || order._id`).

---

## 2. Target Design & Architecture Specification

### A. Shopping Bag Interface (`src/components/Cart.js` & `src/components/Cart.css`)
- **Canvas & Spacing:** Alabaster background (`#F9FAFB`), max width container (`1280px`), responsive 2-column grid (`1fr` left items / `400px` sticky right summary).
- **Free Shipping Progress Tracker:**
  - Progress bar dynamically calculating percentage towards ₹15,000 threshold: `Math.min(100, (subtotal / 15000) * 100)%`.
  - Clear message: *"Add ₹X more to unlock FREE STANDARD SHIPPING"*, or *"🎉 Congratulations! You have unlocked FREE STANDARD SHIPPING!"*.
- **Cart Item Cards:**
  - High-resolution footwear thumbnail (`120px x 120px` with rounded corners).
  - Shoe title in Deep Charcoal (`Space Grotesk`, weight 700).
  - Sizing & Category pill badges: `UK {item.size}` • `MEN'S` / `WOMEN'S` / `UNISEX`.
  - Unit and line price (`₹(item.price * item.quantity)`).
  - Quantity Stepper: `[ − ] quantity [ + ]` with disabled states at `1` and `item.stock`.
  - Remove button with subtle hover micro-interaction.
  - Empty state with athletic footwear graphic and *"START SHOPPING"* CTA.

### B. Promotional Coupon Engine
- Integrated input field inside Order Summary with `APPLY` / `REMOVE` button.
- Consumes `couponService.validateCoupon({ code, cartItems: cart })`.
- Real-time reactive re-validation whenever cart item quantities change.
- Discount row displayed in green with strikethrough savings.

### C. Sticky Order Summary Console
- Subtotal line.
- Coupon discount line (if applied).
- Shipping method selection pills:
  - **Standard Delivery:** Free over ₹15,000, or dynamic backend fee (skips weekends, 3-5 business days).
  - **Express Courier:** Flat ₹350 rate (1-2 business days).
- Estimated Total in bold Slate 900.
- Primary CTA: Pill-shaped Vermilion button (`.btn-primary`) with tactile spring micro-interaction.
- Trust & Security strip:
  - 🔒 Razorpay 256-Bit SSL Encryption
  - ↩️ 7-Day Return Policy
  - ⚡ 100% Authentic Footwear Guarantee

### D. Delivery Address Selection & Creation Modal
- Styled with modern Alabaster & White modal cards (`--radius-lg: 16px`, subtle box shadow).
- **For Authenticated Customers:**
  - List of saved addresses with custom radio indicators.
  - Active selection highlighted with 2px vermilion border and subtle warm tint.
  - Default address badge (`DEFAULT`).
  - Toggle to `+ Add New Delivery Address`.
- **Address Form (New or Guest):**
  - Full Name (required)
  - Mobile Number (strictly validates 10-digit Indian mobile: `^[6-9]\d{9}$`)
  - Flat / House No. / Building (required)
  - Street / Area / Colony (required)
  - Landmark (optional)
  - City (required)
  - State (required)
  - PIN Code (strictly validates 6-digit Indian PIN: `^\d{6}$`)
  - Address Type: `HOME` vs `OFFICE` pills
- **Persistence:**
  - If authenticated, saves new address to MongoDB via `addressService.createAddress()`.
  - If guest, formats address in memory and localStorage for checkout execution.

### E. Razorpay Payment & Order Execution Pipeline
- Preserves existing robust dual-path checkout:
  1. **Razorpay Modal:** Dispatches `paymentService.createPaymentOrder()`, opens Razorpay Checkout script with order ID, verifies signature via `paymentService.verifyPayment()`.
  2. **Direct/Demo Order Creation:** If Razorpay keys are in mock mode, executes `orderService.createOrder()` with verified address, coupon snapshot, and shipping metadata.
- Automatically clears cart in MongoDB and localStorage upon order completion.
- Dispatches `onOrderComplete(createdOrder)` to transition to `OrderConfirmation`.

### F. Order Confirmation Page (`OrderConfirmation.js` & `OrderConfirmation.css`)
- Success checkmark icon with pulse animation.
- Reference Order Number (`order.orderNumber || order._id`).
- Date formatted with Indian locale.
- Confirmed items list with thumbnail, UK sizing, quantity, and price.
- Cost breakdown (subtotal, coupon savings, shipping method, total paid).
- Delivery address summary card.
- Delivery timeline with estimated delivery date.
- Dual CTAs: *"VIEW ORDER HISTORY"* and *"CONTINUE SHOPPING"*.

---

## 3. Implementation Plan & File Modifications

| File | Scope of Modification |
| :--- | :--- |
| `src/components/Cart.js` | Update threshold to ₹15k, remove synthetic energy spec, integrate shipping method choice, redesign address modal to light theme, correct 7-day return badge, connect live calculations |
| `src/components/Cart.css` | Tokenize cart layout, card styles, steppers, summary console, and light-theme address modal |
| `src/components/OrderConfirmation.js` | Correct UK sizing label, order reference display, improve delivery timeline and summary details |
| `src/components/OrderConfirmation.css` | Tokenize order confirmation styling matching SoleVibe Alabaster design system |
| `server/testPhase5Checkout.js` | Dedicated automated test suite verifying cart, coupons, address validation, shipping engine, order creation |

---

## 4. Verification Checklist & Strict Rules

- [ ] Free shipping threshold is strictly ₹15,000 (not ₹2,000).
- [ ] Return policy badge is strictly 7-Day Returns.
- [ ] Zero synthetic specifications (no fabricated `85% energy`).
- [ ] Address form strictly validates 10-digit Indian mobile and 6-digit PIN code.
- [ ] Both standard and express shipping options compute accurately.
- [ ] Order creation saves address, shipping method, and coupon snapshot.
- [ ] All regression suites (Phase 4 PDP, Phase 3 Catalog, Phase 2 Remediation, E2E Integration, Final Milestone) pass with 100% success rate.
- [ ] `npm run build` compiles with 0 errors and 0 warnings.

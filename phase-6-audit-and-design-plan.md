# SOLEVIBE — PHASE 6: CUSTOMER ACCOUNT EXPERIENCE AUDIT & DESIGN PLAN

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Customer Account Experience Redesign  
**Date:** 2026-11-23  
**Status:** IMPLEMENTATION BLUEPRINT  
**Target Architecture:** Node.js v20+ / React 18 / Express 5 / MongoDB 8+  
**Design Reference:** `design.md` §6.5 & `planphase.md` §Phase 6  

---

## 1. Executive Summary & Audit Findings

The Customer Account suite serves as the athlete's personal headquarters on SoleVibe. An inspection of existing components (`Login.js`, `CustomerAccount.js`, `OrderHistory.js`, `Wishlist.js`, `AddressBook.js`, `NotificationCenter.js`) reveals strong functional capabilities but significant visual, thematic, and organizational fragmentation:

### Key Audit Findings:
1. **Outdated Gold & Dark Theme in `Login.js` / `Login.css`:**
   - `Login.css` uses legacy dark gradients (`#1a1a1a`, `#2d2d2d`) and gold accents (`#d4af37`), an artifact from a pre-SoleVibe brand.
   - `Login.js` contains a hardcoded hint referencing `admin@zuxofit.com` rather than the official `admin@solevibe.com`.
   - *Fix:* Redesign `Login.js` and `Login.css` using the approved Alabaster & White card theme with Vermilion accents (`#FF4D2E`), modern segmented sign-in/sign-up tabs, password visibility toggle, and honest brand credentials.
2. **Missing Dedicated Returns Tab in `CustomerAccount.js`:**
   - While `OrderHistory.js` contains a return submission modal, `CustomerAccount` lacks a dedicated "Returns & Refunds" tab for reviewing submitted return requests, inspection statuses (`REQUESTED`, `APPROVED`, `RECEIVED`, `REJECTED`), and refunds.
   - *Fix:* Add a dedicated "Returns & Refunds" tab connected to `returnService.getMyReturns()` with status filters, tracking cards, and cancellation options.
3. **Notification Tab Disconnect in `CustomerAccount.js`:**
   - The "Notifications" tab in `CustomerAccount.js` currently renders `<NotificationCenter />`, which is only the transient floating toast manager (empty/invisible unless a popup is active), rather than the persistent notifications inbox.
   - *Fix:* Create a dedicated in-account `NotificationsInbox` view connected to `notificationService.getNotifications()`, featuring unread badges, order/shipping icons, and "Mark All as Read" capabilities.
4. **Dark-Mode Legacy in `Wishlist.css` & Hardcoded Specs:**
   - `Wishlist.css` contains obsolete dark-mode rules (`--surface-container`, `rgba(18, 19, 26, 0.9)`), and `Wishlist.js` hardcodes a fallback weight of `'290g'`.
   - *Fix:* Align Wishlist cards with the Phase 3 `ProductCard` visual tokens on the Alabaster light canvas, with real database specs and a clean "Move to Bag" CTA.
5. **Layout Spacing Clash in `OrderHistory.css`:**
   - `OrderHistory.css` applies a top padding of `7rem` (112px), causing an excessive whitespace gap when embedded within the `CustomerAccount` tabbed view.
   - *Fix:* Scoping and responsive adjustments for seamless embedded rendering inside the account dashboard as well as standalone view.
6. **ESLint Hook Warning in `AddressBook.js`:**
   - `AddressBook.js` triggers an exhaustive-deps warning for `loadAddresses`.
   - *Fix:* Wrap `loadAddresses` in `useCallback` to achieve 0 build warnings.

---

## 2. Target Design & Architecture Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CUSTOMER ACCOUNT ARCHITECTURE                         │
├─────────────────────┬───────────────────────────────────────────────────────┤
│ SIDEBAR NAVIGATION  │ MAIN CONTENT CANVAS                                   │
│                     │                                                       │
│ 👤 My Profile       │ [ Overview / Personal Info / Password & Security ]    │
│ 📦 Order History    │ [ All Orders / Status Tabs / Real-time Timeline ]     │
│ ↩️ Returns & Refunds│ [ Active Returns / Status / 7-Day Window Enforcement] │
│ ♥ Saved Wishlist    │ [ 4-Column Footwear Grid / Move to Bag / Remove ]     │
│ 📍 Address Book     │ [ Saved Cards / Default Badge / Add & Edit Form ]     │
│ 🔔 Notifications    │ [ Persistent Alerts / Order Status / Mark All Read ]  │
│ ─────────────────── │                                                       │
│ 🚪 Sign Out         │                                                       │
└─────────────────────┴───────────────────────────────────────────────────────┘
```

### A. Authentication View (`Login.js` & `Login.css`)
- Light, athletic editorial card (`#FFFFFF`, subtle border `#E5E7EB`, shadow `0 20px 48px rgba(0,0,0,0.08)`).
- Header: Brand wordmark `⚡ SOLEVIBE` in Space Grotesk.
- Segmented pill tab switch: `[ SIGN IN ] [ CREATE ACCOUNT ]`.
- Password input with toggle button (👁️ Show / 🙈 Hide).
- Error alerts with clean inline styling instead of blocking `window.confirm` dialogs.
- Clear administrative portal link and credentials.

### B. Customer Account Dashboard (`CustomerAccount.js` & `CustomerAccount.css`)
- Header glass banner: Athlete avatar initials, name, email, and `VERIFIED ATHLETE` membership badge.
- Sidebar menu with icons, active state indicators, and counter badges (orders, wishlist items, unread notifications).
- Overview quick-stats grid:
  - Total Orders Count
  - Wishlist Items Count
  - Saved Addresses Count
  - Active Returns Count
- Profile Information Form: Update full name via `authService.updateProfile()`.
- Password Security Form: Change password with validation (min 6 characters, confirmation match).

### C. Order History & Fulfillment Tracking (`OrderHistory.js`)
- Filter tabs: `ALL`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- Itemized card: Order date, reference order number (`order.orderNumber || order._id`), total amount, line items with UK sizing badges (`SIZE: UK {item.size}`).
- Live fulfillment timeline: Order Confirmed ➔ Processing ➔ Shipped ➔ Delivered.
- Order Details Modal: Delivery address snapshot, tracking number, carrier name, financial summary.
- "Request Return" button: Strictly displayed only for delivered orders within the verified 7-day return policy window (`daysSinceDelivery <= 7`).

### D. Returns & Refunds Management View
- Dedicated panel inside `CustomerAccount`:
  - List of return requests from `returnService.getMyReturns()`.
  - Status pill: `REQUESTED` (amber), `APPROVED` (blue), `RECEIVED` (purple), `REFUNDED` (emerald), `CANCELLED` (charcoal).
  - Item details, returned quantity, reason (`WRONG_SIZE`, `DEFECTIVE`, `STYLE_PREFERENCE`, etc.), description.
  - Action to cancel pending return requests (`returnService.cancelReturn()`).

### E. Saved Wishlist Experience (`Wishlist.js` & `Wishlist.css`)
- Clean Alabaster & White grid.
- High-res footwear imagery, shoe name, current price, and stock status badge.
- Only displays real database specifications if present; never fabricates dummy weights.
- "MOVE TO BAG" CTA: Adds shoe with default size (`UK 8` or first available) to bag, removes from wishlist, and dispatches toast feedback.
- Individual item removal heart button and "Clear All" action with confirmation.

### F. Address Book (`AddressBook.js` & `AddressBook.css`)
- 2-column card grid of saved delivery addresses.
- Default address indicator (`DEFAULT` emerald pill).
- Actions: Edit Address, Delete Address, Set as Default.
- Add / Edit Address form with 10-digit mobile and 6-digit Indian PIN code validation.
- Clean hook dependency management eliminating all ESLint warnings.

### G. Persistent Notification Inbox
- In-account notifications list:
  - Fetches notifications from `notificationService.getNotifications()`.
  - Type-specific status icons (Payment, Shipped, Delivered, Return, Abandoned Cart).
  - Time formatting (`Just now`, `5m ago`, `2h ago`, formatted date).
  - Individual "Mark as Read" action and header "Mark All as Read" button.
  - Interactive click navigation to relevant order, return, or bag.

---

## 3. Implementation Plan & Modified Files

| File | Scope of Modification |
| :--- | :--- |
| `src/components/Login.js` | Redesign with segmented tabs, show/hide password toggle, modern alerts, official credentials |
| `src/components/Login.css` | Complete redesign: Alabaster light theme, clean inputs, vermilion buttons, remove legacy gold |
| `src/components/CustomerAccount.js` | Add Returns & Refunds tab, add in-account Notifications Inbox, modernize layout & quick stats |
| `src/components/CustomerAccount.css` | Tokenized styling: sidebar nav, header banner, form controls, responsive breakpoints |
| `src/components/OrderHistory.js` | Ensure UK sizing badge, order number display, seamless embedding in account dashboard |
| `src/components/OrderHistory.css` | Optimize padding for embedded container, clean card styling |
| `src/components/Wishlist.js` | Align card markup with Phase 3 design tokens, remove dummy 290g spec fallback |
| `src/components/Wishlist.css` | Complete light-theme rewrite: white cards, vermilion hover, clean move-to-bag buttons |
| `src/components/AddressBook.js` | Fix `useCallback` dependency warning, harmonize styling |
| `server/testPhase6Account.js` | Dedicated automated test suite verifying auth, profile updates, order history, returns, addresses, notifications |

---

## 4. Verification Checklist & Strict Rules

- [ ] Zero backend schema or API modifications.
- [ ] Strict 7-day return policy preserved.
- [ ] Authentication works for user and admin logins.
- [ ] Profile name updates persist to MongoDB via `/api/auth/profile`.
- [ ] Address book CRUD operations function cleanly without ESLint warnings.
- [ ] Wishlist move to bag adds item and updates cart count.
- [ ] All regression suites (Phase 5 Checkout, Phase 4 PDP, Phase 3 Catalog, Phase 2 Remediation, E2E Integration, Final Milestone) pass at 100%.
- [ ] `npm run build` compiles with 0 errors and 0 warnings.

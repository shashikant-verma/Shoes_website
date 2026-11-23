# SOLEVIBE — PREMIUM FOOTWEAR E-COMMERCE DESIGN SYSTEM

> **Document Version:** 1.0.0  
> **Target Application:** SoleVibe Footwear (formerly Zuxofit)  
> **Status:** Architecture & Design Specification  
> **Scope:** Full-Stack Design System, UI/UX Guidelines, Component Specifications, and Migration Roadmap

---

## 1. Design Vision & Brand Philosophy

SoleVibe is a contemporary performance footwear brand engineered at the intersection of biomechanical precision and modern lifestyle aesthetics. The design system unifies three distinct design traditions into a proprietary visual language:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE TRIAD OF ATHLETIC LUXURY                          │
├─────────────────────┬───────────────────────────┬───────────────────────────┤
│    NIKE INFLUENCE   │   NEW BALANCE INFLUENCE   │    ON RUNNING INFLUENCE   │
│  Bold, Energetic,   │   Crafted Lifestyle,      │   Swiss Technical,        │
│  Assertive Motion   │   Refined Editorial Tone  │   Minimalist Micro-Specs  │
└─────────────────────┴───────────────────────────┴───────────────────────────┘
```

1. **Athletic Boldness (Nike):** Dynamic diagonal momentum, high-impact typography, assertive contrast, energetic telemetry badges, and strong visual hierarchy.
2. **Lifestyle Refinement (New Balance):** Understated editorial dignity, rich neutral washes, breathable white space, tactile textures, and heritage-inspired craftsmanship.
3. **Engineered Precision (On Running):** Micro-spacing discipline, technical telemetry chips (drop, weight, stack height, carbon plate specs), crisp hairline dividers, and functional clarity.

### Core Design Tenets
- **Clarity Over Clutter:** Eliminate unnecessary decorative gradients, random drop shadows, and visual noise. Every element serves product discovery, sizing certainty, or conversion.
- **Biomechanical Authenticity:** Product imagery and technical callouts communicate performance metrics clearly without gimmicks.
- **Zero-Friction Commerce:** The path from browsing to address selection and Razorpay checkout must be frictionless, trustworthy, and lightning-fast on both mobile and desktop.
- **Unified Light Canvas:** The consumer storefront utilizes a high-clarity white/alabaster canvas with deep charcoal contrast, eliminating the jarring dark-to-light theme inconsistencies in the legacy codebase. The Admin Portal utilizes a purpose-built high-productivity dark slate interface.

---

## 2. Visual Identity & Brand Foundations

### 2.1 The Brandmark & Typography Mark
- **Wordmark:** `SOLE` (Heavy grotesk, uppercase, tracking `+0.08em`, in Deep Charcoal `#111827`) paired with `VIBE` (Heavy grotesk, uppercase, in Kinetic Vermilion `#FF4D2E`).
- **Micro-Icon:** The Kinetic Bolt (`⚡`) used sparingly as an editorial accent in telemetry badges, loading spinners, and brand favicon.
- **Clearspace:** Minimum margin around the brandmark equals 50% of the height of the letter "S".

### 2.2 Color Architecture

The color system uses CSS custom properties defined in semantic tiers.

#### Primitive Swatches
```css
/* Core Neutrals */
--color-white:        #FFFFFF;
--color-alabaster:    #F9FAFB;  /* Page canvas wash */
--color-platinum:     #F3F4F6;  /* Card surface alt */
--color-line-subtle:  #E5E7EB;  /* Hairline borders */
--color-line-strong:  #D1D5DB;  /* Input borders */
--color-slate-400:    #9CA3AF;  /* Muted metadata */
--color-slate-600:    #4B5563;  /* Secondary body */
--color-slate-800:    #1F2937;  /* Headings */
--color-slate-900:    #111827;  /* Deep Charcoal (Primary text) */
--color-black:        #000000;

/* Brand Accents */
--color-kinetic-red:   #FF4D2E;  /* Primary brand vermilion */
--color-kinetic-hover: #E03E22;  /* Primary hover state */
--color-racing-crimson:#C9232D;  /* Deep accent / Sale highlights */
--color-racing-dark:   #9F1823;
--color-volt-lime:     #D4FF00;  /* High-visibility badge highlight */
--color-cyber-cyan:    #00F0FF;  /* Technical telemetry highlight */

/* Semantic States */
--color-success:      #10B981;  /* Verified address, in-stock, success toast */
--color-warning:      #F59E0B;  /* Low stock alert, coupon reminder */
--color-danger:       #EF4444;  /* Validation errors, out of stock, delete */
--color-info:         #3B82F6;  /* Order tracking updates */
```

#### Semantic Token Mapping (Storefront)
```css
:root {
  --bg-page:            var(--color-white);
  --bg-surface:         var(--color-white);
  --bg-surface-subtle:  var(--color-alabaster);
  --bg-surface-muted:   var(--color-platinum);
  
  --text-primary:       var(--color-slate-900);
  --text-secondary:     var(--color-slate-600);
  --text-muted:         var(--color-slate-400);
  --text-inverted:      var(--color-white);
  
  --border-subtle:      var(--color-line-subtle);
  --border-strong:      var(--color-line-strong);
  --border-focus:       var(--color-kinetic-red);
  
  --accent-primary:     var(--color-kinetic-red);
  --accent-primary-hover: var(--color-kinetic-hover);
  --accent-contrast:    var(--color-white);
}
```

#### Admin Panel Dark Tokens (Isolated Scope)
```css
.admin-scope {
  --bg-page:            #0B0E14;
  --bg-surface:         #111622;
  --bg-surface-subtle:  #182030;
  --text-primary:       #F9FAFB;
  --text-secondary:     #9CA3AF;
  --text-muted:         #6B7280;
  --border-subtle:      #1F293D;
  --border-strong:      #374151;
}
```

---

## 3. Typography System

The typography system pairs an athletic, bold grotesk display face with an ultra-readable geometric sans-serif for interface elements and telemetry data.

### 3.1 Font Families
- **Display & Headlines:** `'Outfit'`, `sans-serif` (Weights: 600 SemiBold, 700 Bold, 800 ExtraBold).
- **Body & Interface:** `'Manrope'`, `-apple-system`, `sans-serif` (Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold).
- **Technical Telemetry & Sizing Specs:** `'JetBrains Mono'`, `'SF Mono'`, `monospace` (Weight: 500 Medium).

### 3.2 Type Hierarchy Scale

| Token | Size (Desktop) | Size (Mobile) | Line Height | Letter Spacing | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-2xl` | `4.5rem` (72px) | `2.75rem` (44px) | `1.0` | `-0.03em` | 800 | Hero title, Seasonal launch |
| `display-xl` | `3.75rem` (60px) | `2.25rem` (36px) | `1.05` | `-0.025em`| 800 | Category hero title |
| `headline-lg` | `2.5rem` (40px) | `1.875rem` (30px) | `1.15` | `-0.02em` | 700 | Section headers |
| `headline-md` | `1.75rem` (28px) | `1.375rem` (22px) | `1.2` | `-0.015em`| 700 | Product detail title, Card headers |
| `headline-sm` | `1.25rem` (20px) | `1.125rem` (18px) | `1.3` | `-0.01em` | 600 | Card titles, Modal titles |
| `body-lg` | `1.125rem` (18px) | `1rem` (16px) | `1.6` | `0` | 400 | Editorial intro copy |
| `body-md` | `1rem` (16px) | `0.938rem` (15px) | `1.55` | `0` | 400 | Primary paragraph text, descriptions |
| `body-sm` | `0.875rem` (14px) | `0.875rem` (14px) | `1.5` | `0` | 400/500 | Metadata, table cells, form labels |
| `caption` | `0.75rem` (12px) | `0.75rem` (12px) | `1.4` | `+0.02em` | 500 | Badges, footnotes, timestamps |
| `telemetry` | `0.75rem` (12px) | `0.688rem` (11px) | `1.2` | `+0.08em` | 600 | Spec tags (`DROP 4MM`, `WT 6.8OZ`) |

---

## 4. Spacing, Elevation & Layout Grid

### 4.1 Spacing Scale (8-Point System)
```css
--space-1:   0.25rem;  /* 4px  - micro gaps */
--space-2:   0.5rem;   /* 8px  - icon offsets, tight badges */
--space-3:   0.75rem;  /* 12px - card content gap */
--space-4:   1rem;     /* 16px - standard padding */
--space-5:   1.25rem;  /* 20px - button padding */
--space-6:   1.5rem;   /* 24px - card body padding */
--space-8:   2rem;     /* 32px - container gutter */
--space-10:  2.5rem;   /* 40px - section sub-headers */
--space-12:  3rem;     /* 48px - component block spacing */
--space-16:  4rem;     /* 64px - desktop section spacing */
--space-20:  5rem;     /* 80px - major editorial breaks */
--space-24:  6rem;     /* 96px - hero margins */
```

### 4.2 Elevation & Shadows
```css
/* Minimal ambient lighting */
--shadow-none:      none;
--shadow-subtle:    0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
--shadow-card:      0 4px 12px rgba(17, 24, 39, 0.04);
--shadow-hover:     0 12px 28px rgba(17, 24, 39, 0.08);
--shadow-modal:     0 20px 48px rgba(17, 24, 39, 0.16);
--shadow-dropdown:  0 10px 24px rgba(17, 24, 39, 0.08);
```

### 4.3 Corner Radii Scale
```css
--radius-sharp:  0px;        /* Strict athletic editorial boxes */
--radius-xs:     3px;        /* Form input focus tags */
--radius-sm:     6px;        /* Inputs, secondary buttons, badges */
--radius-md:     10px;       /* Product cards, address selector cards */
--radius-lg:     16px;       /* Modals, QuickView drawers */
--radius-full:   9999px;     /* Category chips, primary CTA pills */
```

### 4.4 Grid & Responsive Breakpoints
- **Mobile (`< 640px`):** Single column, `16px` outer margin, `16px` gutter.
- **Tablet (`640px - 1024px`):** 2-column product grid, `24px` gutter, `32px` margin.
- **Desktop (`1024px - 1440px`):** 3 or 4-column product grid, `1200px` content container, `32px` gutter.
- **Ultra-Wide (`> 1440px`):** Max container width clamped at `1400px` with centered auto-margins.

---

## 5. Component Design Specifications

### 5.1 Buttons & Interactive Controls

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BUTTON HIERARCHY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. PRIMARY CTA:      [ SOLID VERMILION PILL / WHITE TEXT / BOLD UPPERCASE ] │
│ 2. SECONDARY CTA:    [ 1.5PX CHARCOAL BORDER / TRANSPARENT / CHARCOAL TEXT] │
│ 3. TECHNICAL CHIP:   [ ALABASTER FILL / 1PX BORDER / TELEMETRY CAPS ]       │
│ 4. TEXT LINK:        [ CHARCOAL / UNDERLINE ON HOVER / ARROW ACCENT → ]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Primary Button (`.btn-primary`):**
  - Height: `52px` (Desktop) / `48px` (Mobile).
  - Background: `var(--color-kinetic-red)` (`#FF4D2E`).
  - Hover: `var(--color-kinetic-hover)` (`#E03E22`) with subtle `-1px` transform.
  - Text: Uppercase, `0.875rem`, letter-spacing `+0.06em`, weight `700`, white.
  - Border-radius: `var(--radius-full)` (Pill shape).
  - Active: Scale `0.98` for tactile spring feedback.

- **Secondary Button (`.btn-secondary`):**
  - Height: `52px` / `48px`.
  - Background: `transparent`.
  - Border: `1.5px solid var(--color-slate-900)`.
  - Text: `var(--color-slate-900)`, weight `700`.
  - Hover: Background `var(--color-slate-900)`, text `var(--color-white)`.

- **Wishlist Toggle Button:**
  - Shape: Circular `42px x 42px`, white background with subtle shadow.
  - Inactive State: 1.5px hairline heart icon stroke.
  - Active State: Filled vermilion heart with gentle spring scale pulse (`scale(1.15) -> scale(1.0)`).

### 5.2 Form Inputs & Checkout Fields
- **Container:** Minimum height `50px`.
- **Background:** White (`#FFFFFF`) with `1px solid var(--color-line-strong)`.
- **Text:** `1rem`, `var(--color-slate-900)`.
- **Placeholder:** `var(--color-slate-400)`.
- **Focus State:** `1.5px solid var(--color-kinetic-red)` with outer glow `0 0 0 3px rgba(255, 77, 46, 0.12)`.
- **Error State:** `1.5px solid var(--color-danger)` with animated slide-down error message in `0.75rem` red text.
- **Address Radio Cards:**
  - Card background: `#FFFFFF`.
  - Unselected: `1px solid var(--color-line-subtle)`.
  - Selected: `2px solid var(--color-kinetic-red)`, background `rgba(255, 77, 46, 0.03)`.
  - Includes custom radio indicator and green `DEFAULT` tag.

### 5.3 Product Badges & Telemetry Chips
- **NEW DROP:** Pure black pill (`#111827`), white text, `0.688rem`, bold caps.
- **SALE / DISCOUNT:** Vermilion background (`#FF4D2E`), white text, bold caps.
- **CARBON RACER:** Electric Cyan border (`#00F0FF`), obsidian fill, monospace font.
- **IN STOCK / LOW STOCK:** Green (`#10B981`) or Amber (`#F59E0B`) dot with uppercase label.

---

## 6. Page-by-Page Layout Specifications

### 6.1 Homepage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ANNOUNCEMENT BAR (34px, High-Contrast Red, Free Shipping Threshold)      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. STICKY NAVBAR (80px, Glassmorphism, Logo, Menu, Search, Wishlist, Cart) │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. EDITORIAL HERO (Perspective Tilt Showcase, Dual CTA, Telemetry Badges)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. BIOMECHANICAL BENTO GRID (Men, Women, Running, Trail, Racing, Ozark)    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. FEATURED VELOCITY DROPS (High-Impact Horizontal Carousel, Rating Badges) │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. TECH INNOVATION SHOWCASE (Carbon-Infused Dual Plate, Supercritical Foam) │
├─────────────────────────────────────────────────────────────────────────────┤
│ 7. SEASONAL EDITORIAL LOOKBOOK (Full-Bleed Lifestyle Imagery & Storytelling)│
├─────────────────────────────────────────────────────────────────────────────┤
│ 8. VERIFIED ATHLETE REVIEWS (Star Ratings, Verified Runner Badges)          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 9. SOLEVIBE CLUB NEWSLETTER (VIP Early Drops, Minimalist Input Form)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 10. COMPREHENSIVE GLOBAL FOOTER (Sitemap, Help, Payment Badges, Policies)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Top Announcement Bar:**
   - Height: `34px`.
   - Background: `var(--color-racing-crimson)` (`#C9232D`).
   - Content: Central rotating ticker: `"🎉 FREE SHIPPING ON ORDERS ABOVE ₹2,000"`, `"14-DAY HASSLE-FREE RETURNS"`, `"100% SECURE RAZORPAY CHECKOUT"`.
2. **Global Navigation (`Navbar`):**
   - Height: `80px` desktop / `64px` mobile. Sticky with `backdrop-filter: blur(16px)` and hairline bottom border.
   - Left: Wordmark `SOLE VIBE`.
   - Center: Categorical mega-menu triggers (`MEN`, `WOMEN`, `RUNNING`, `TRAINING`, `TRAIL`, `OZARK`, `ACCESSORIES`).
   - Right: Search toggle, Wishlist icon with pill badge, Shopping Bag icon with live counter pill, Account avatar dropdown.
   - Search Dropdown: Controlled overlay with keyboard shortcut (`/` to focus), debounced suggestions, and clear action.
3. **Hero Section (`Hero3D` Fallback & Editorial Mode):**
   - Left Column: Bold display typography (`"ENGINEERED FOR PEAK STRIDE"`), performance subhead, dual CTAs (`"Explore Men"`, `"Explore Women"`).
   - Right Column: High-resolution editorial shoe showcase with 3D perspective mouse physics, floating carbon plate tags, and model thumbnail switcher.
4. **Bento Category Grid:**
   - Modular 4-column asymmetrical grid with rich photographic backdrops.
   - Large cards for `Men's Racing` and `Women's Performance`; medium cards for `Trail / Ozark` and `Accessories`.
5. **Featured Velocity Drops:**
   - Smooth horizontal carousel displaying top active catalog products.
   - Each card displays badge, photo, colorway count, price, and instant quick-add drawer trigger.
6. **Technical Innovation Showcase:**
   - Three key pillars: `Carbon Dynamics`, `Supercritical Cushioning`, `Aerodynamic Zonal Knit`.
   - Clean exploded technical diagrams with interactive metric callouts.
7. **Customer Reviews Section:**
   - Authentic runner feedback cards with 5-star ratings, verified purchase tags, and reviewer shoe model.
8. **Footer:**
   - Clean 4-column layout: Products, Support & Returns, Brand Mission, Legal/Compliance.
   - Secured payment badges (Razorpay, UPI, Visa, Mastercard).

---

### 6.2 Product Listing Experience (`CollectionPage` & `ProductShowcase`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EDITORIAL CATEGORY HEADER (Photographic Background, Category Tag, Heading)  │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ STICKY FILTER BAR:            │ 48 PRODUCTS FOUND   [GRID: 2 | 3 | 4]       │
│ Subcategory Pills [ALL, ...]  │ SORT: [Featured | Price: Low | Newest ▼]    │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ DESKTOP FILTER SIDEBAR        │ PRODUCT GRID (Aspect Ratio 3:4)             │
│ - Price Range Slider (0-20k)  │ ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│ - Size Pills [7, 8, 9, 10...] │ │ PHOTO   │  │ PHOTO   │  │ PHOTO   │       │
│ - Color Swatches              │ │ Name    │  │ Name    │  │ Name    │       │
│ - Availability (In Stock)     │ │ ₹4,999  │  │ ₹3,899  │  │ ₹6,499  │       │
│ - Collection Tags             │ └─────────┘  └─────────┘  └─────────┘       │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

- **Image Ratio:** Clean `3:4` portrait aspect ratio or `1:1` square on pure alabaster background (`#F9FAFB`).
- **Product Card Hover States:**
  - Micro-lift: `transform: translateY(-4px)` with shadow transition (`0.25s cubic-bezier(0.16, 1, 0.3, 1)`).
  - Quick-Size Bar: Smooth slide-up bar revealing available sizes (`7`, `8`, `9`, `10`, `11`) for 1-click addition without navigating away.
  - QuickView icon on top-right of image.
- **Price Presentation:**
  - Bold current price in Deep Charcoal (`₹4,999`).
  - Strikethrough original price in Muted Slate (`₹5,999`).
  - Discount tag in Vermilion (`-16% OFF`).
- **Empty States:**
  - If a filter or search produces zero results: Display athletic shoe icon, `"No matching shoes found"`, and a one-click button to `"Reset All Filters"`.

---

### 6.3 Product Detail Experience (`ProductDetail` & `QuickViewModal`)

```
┌───────────────────────────────────────┬─────────────────────────────────────┐
│ STICKY GALLERY (Left 55%)             │ PURCHASE CONSOLE (Right 45%)        │
│                                       │                                     │
│ ┌───┐ ┌─────────────────────────────┐ │ SOLEVIBE EDIT • MEN'S RACING        │
│ │   │ │                             │ │ VELOCITY PRO CARBON                 │
│ ├───┤ │                             │ │ ₹6,999  ₹7,999  [12% OFF]          │
│ │   │ │                             │ │ Inclusive of all taxes              │
│ ├───┤ │      MAIN HIGH-RES          │ │                                     │
│ │   │ │      EDITORIAL PHOTO        │ │ SELECT SIZE (UK/INDIA)  [Size Guide]│
│ ├───┤ │                             │ │ [ 7 ] [ 8 ] [ 9 ] [ 10 ] [ 11 ]     │
│ │   │ │                             │ │                                     │
│ └───┘ └─────────────────────────────┘ │ [  ADD TO BAG  -  ₹6,999  ]         │
│                                       │ [  INSTANT BUY NOW  ]               │
│ [Zoom Lens & Fullscreen Modal]        │                                     │
│                                       │ 🚚 Free Express Delivery by Wed     │
│                                       │ 🔄 14-Day Free Returns Guarantee    │
│                                       │                                     │
│                                       │ ▼ BIOMECHANICAL SPECIFICATIONS      │
│                                       │ ▼ MATERIALS & CRAFTSMANSHIP         │
└───────────────────────────────────────┴─────────────────────────────────────┘
```

- **Visual Gallery:** Vertical thumbnail strip on the left with a large, high-resolution viewport supporting smooth zoom on mouse hover.
- **Size Selector:**
  - Standard Indian/UK sizing tiles.
  - Active tile: Solid black with white text.
  - Available tile: 1px border with hover vermilion outline.
  - Out of stock tile: Muted slate with diagonal strikethrough.
- **Size Guide Modal:**
  - Interactive table displaying Foot Length (cm), UK/India size, US size, and EU size.
  - Measurement guide showing how to trace and measure foot length at home.
- **Technical Specifications Grid:**
  - 4-card metric strip:
    - `Weight`: `6.8 oz / 192g`
    - `Heel-to-Toe Drop`: `4 mm`
    - `Plate`: `Carbon-Infused Dynamic Wing`
    - `Foam`: `Dual-Density Supercritical PEBA`

---

### 6.4 Shopping Bag & Checkout Experience (`Cart`)

```
┌──────────────────────────────────────────────────┬──────────────────────────┐
│ SHOPPING BAG (3 Items)                           │ ORDER SUMMARY            │
├──────────────────────────────────────────────────┼──────────────────────────┤
│ ┌─────┐ SoleVibe Velocity Pro Carbon             │ Subtotal:         ₹6,999 │
│ │ IMG │ Size: UK 9 • Color: Arctic White         │ Estimated GST:    ₹1,260 │
│ │     │ ₹6,999                                   │ Standard Delivery:  FREE │
│ └─────┘ [ - ] 1 [ + ]           [ Remove ✕ ]     │ Promo (SOLE20):  - ₹1,400│
│                                                  ├──────────────────────────┤
│ ┌─────┐ SoleVibe Trail Shield Ozark              │ TOTAL:            ₹6,859 │
│ │ IMG │ Size: UK 10 • Color: Olive Dusk          │                          │
│ │     │ ₹4,499                                   │ [ PROCEED TO CHECKOUT ]  │
│ └─────┘ [ - ] 1 [ + ]           [ Remove ✕ ]     │                          │
│                                                  │ 🔒 256-Bit SSL Encrypted │
│ 🏷️ [ Enter Coupon Code... ] [ Apply ]            │ ⚡ Instant UPI & Cards   │
└──────────────────────────────────────────────────┴──────────────────────────┘
```

#### Modal Checkout Flow (Address & Payment)
1. **Step 1: Delivery Address Selection:**
   - Display saved customer addresses with radio selection cards.
   - "Add New Address" toggle opening inline validated form (Full Name, 10-Digit Phone, House/Street, Area, City, State, 6-Digit PIN, Address Type).
   - Zero hardcoded defaults; explicit customer selection required.
2. **Step 2: Payment Authorization (Razorpay):**
   - Seamless integration with Razorpay Checkout modal (UPI, Google Pay, PhonePe, Netbanking, Credit/Debit cards).
   - Clear test/live indicator.
3. **Step 3: Order Confirmation (`OrderConfirmation`):**
   - Clear green verified badge.
   - Order Number (e.g., `#SV104928AB`).
   - Estimated Delivery Date range.
   - Summary of items, shipping address, and tracking callout.
   - Actions: `"View Order in Account"`, `"Continue Shopping"`.

---

### 6.5 Customer Account Suite (`CustomerAccount`, `OrderHistory`, `AddressBook`)

- **Unified Navigation Sidebar:** Clean list of tabs:
  - 👤 `Profile & Security`
  - 📦 `My Orders & Returns`
  - 📍 `Address Book`
  - 🖤 `Wishlist`
- **Order History:**
  - Filter tabs: `All Orders`, `In Progress`, `Delivered`, `Cancelled/Returned`.
  - Order card displays order date, total, status pill (`CONFIRMED`, `SHIPPED`, `DELIVERED`), and item preview.
  - Interactive Tracking Modal with timeline steps: `Order Placed` ➔ `Shipped` ➔ `In Transit` ➔ `Out for Delivery` ➔ `Delivered`.
  - 1-Click Return Request modal with reason dropdown (`Wrong Size`, `Defective`, `Style Preference`) and photo upload proof.
- **Address Book (`AddressBook`):**
  - Responsive 2-column grid of address tiles.
  - Actions: Edit, Delete, Set as Default.

---

### 6.6 Admin Dashboard System (`AdminDashboard`)

The Admin portal uses a purpose-built high-contrast dark theme designed for data clarity and operational speed:

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ SOLEVIBE     │ 📊 STORE OVERVIEW                                            │
│ [ADMIN]      │ [Today's Sales: ₹42,850] [Orders: 14] [Low Stock Alerts: 3]  │
├──────────────┼──────────────────────────────────────────────────────────────┤
│ 📊 Overview  │ DATA TABLE: PRODUCTS MANAGEMENT       [ + Add New Product ]  │
│ 📦 Products  │ ┌────────┬─────────────────┬──────────┬────────┬──────────┐ │
│ 📁 Categories│ │ Image  │ Name            │ Category │ Price  │ Stock    │ │
│ 🛍️ Orders    │ ├────────┼─────────────────┼──────────┼────────┼──────────┤ │
│ 👥 Customers │ │ [IMG]  │ Velocity Pro    │ Men      │ ₹6,999 │ 24 (OK)  │ │
│ 🏷️ Coupons   │ │ [IMG]  │ Trail Shield    │ Trail    │ ₹4,499 │ 4 (LOW)  │ │
│ ⚙️ Settings  │ └────────┴─────────────────┴──────────┴────────┴──────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

- **Navigation:** Fixed dark sidebar (`#0E1117`) with active indicator in Kinetic Vermilion.
- **Data Tables:**
  - Sticky table headers.
  - Alternating subtle row backgrounds (`#111622` / `#161D2B`).
  - Search and filter controls above the table.
  - Live status chips (`Active`, `Inactive`, `Pending`, `Delivered`).
- **Categories Manager (`CategoriesManager`):**
  - Connected directly to MongoDB CRUD.
  - Image upload with drag-and-drop preview.
  - Orphan product check before category deletion.
- **Store Settings (`AdminSettings`):**
  - MongoDB persistent settings for Store Name, Support Contacts, INR Currency, GST percentage, Free Shipping Threshold, and Return Policy.

---

## 7. Responsive & Mobile-First Specifications

### 7.1 Breakpoint Standards
```css
@media (max-width: 639px)  { /* Mobile Phones */ }
@media (min-width: 640px)  { /* Tablets / Large Phones */ }
@media (min-width: 1024px) { /* Laptops & Small Desktops */ }
@media (min-width: 1280px) { /* Standard Desktop */ }
@media (min-width: 1536px) { /* Ultrawide Displays */ }
```

### 7.2 Mobile-First Patterns
1. **Touch Targets:** All buttons, size pills, and navigation icons must measure a minimum of `48px x 48px` clickable area.
2. **Fixed Bottom Action Bar (Mobile PDP):**
   - On screens `< 640px`, a sticky bottom bar pins `"Add to Bag — ₹6,999"` to the viewport bottom for thumb-reach ergonomics.
3. **Slide-Over Filter Drawer:**
   - Filters on mobile open as a full-height slide-over drawer with a bottom sticky `"Apply Filters (48 items)"` button.
4. **Swipeable Image Carousels:**
   - Product detail galleries convert from vertical thumbnail strips to native horizontal swipe containers with discrete pagination dots.

---

## 8. Animations, Transitions & Micro-Interactions

All interface animations must feel snappy, athletic, and purposeful. Sluggish or excessive decorative animations are prohibited.

### 8.1 Motion Timing Standards
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);  /* Athletic spring */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);    /* Standard transition */

--duration-fast: 150ms;  /* Button clicks, color changes */
--duration-base: 250ms;  /* Card hover lift, modal reveals */
--duration-slow: 400ms;  /* Full page transitions, drawer slides */
```

### 8.2 Micro-Interactions
- **Product Card Image Hover:** Scale image `1.04` with ease-out expo curve over `400ms`.
- **Button Press:** Scale `0.98` on `:active` state.
- **Wishlist Heart:** Heart stroke pulses with spring scale `1.18` upon addition.
- **Cart Count Badge:** Brief scale bounce (`scale(1.25) -> scale(1.0)`) whenever `cartCount` increments.
- **Skeleton Loading Shimmer:** Subtle linear gradient moving across `#F3F4F6` to `#E5E7EB` on skeleton cards.
- **Reduced Motion:** Honor user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Accessibility (WCAG 2.1 AA) & Performance Guidelines

### 9.1 Accessibility
- **Color Contrast:** All body text must maintain a minimum contrast ratio of `4.5:1` against its background; headlines and brand accents must maintain at least `3:1`.
- **Keyboard Navigation:** Every interactive element must be reachable via `Tab` and show a visible focus indicator (`2px solid var(--color-kinetic-red)` with `2px` offset).
- **Form Labels & ARIA:** All input fields must feature explicit `<label>` tags or `aria-label` attributes. Modals must trap focus and close on `Escape`.
- **Semantic HTML:** Strict usage of `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, and `<footer>` rather than generic `<div>` soup.

### 9.2 Performance & Core Web Vitals
- **Cumulative Layout Shift (CLS < 0.1):** All product cards and hero banners must specify explicit CSS `aspect-ratio` to prevent layout jumps during image loading.
- **Largest Contentful Paint (LCP < 2.0s):** Hero editorial photographs must use optimized WebP/AVIF formats and preload tags where applicable.
- **Lazy Loading:** All catalog images below the initial fold must utilize `loading="lazy"`.

---

## 10. Existing Functionality Preservation Checklist

Any future implementation of this design system must preserve all existing functional workflows without regression:

- [x] **Guest Browsing:** Unauthenticated visitors can browse home, shop, categories, and view product details without being redirected to login.
- [x] **Guest Cart & Wishlist Sync:** Local items stored in `cart-guest` and `wishlist-guest` migrate cleanly into MongoDB upon authentication.
- [x] **Verified Address Checkout:** The checkout flow in `Cart.js` must continue passing verified recipient address payloads to `orderService` and Razorpay.
- [x] **Global Search:** The Navbar search input must continue dispatching queries to `productService.getProducts({ search: query })` with full regex matching.
- [x] **Category CRUD:** Admin Category management must preserve active/inactive toggles, slug generation, and orphan product deletion protection.
- [x] **Store Settings API:** Admin Settings must read and write to the MongoDB `Settings` singleton model.
- [x] **Razorpay Webhook & Audit Log:** Webhook signature verification and `PaymentTransaction` idempotency records must remain intact.
- [x] **Courier Architecture:** Shipping rate calculations and courier provider dispatching (`MockCourierProvider`, `ShiprocketProvider`, `DelhiveryProvider`) must remain functional.

---

## 11. Priority-Wise Redesign Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IMPLEMENTATION ROADMAP (PHASED)                       │
├─────────┬──────────────────────┬────────────────────────────────────────────┤
│ PHASE 1 │ Foundations & Tokens │ Consolidate CSS tokens, remove dark-mode   │
│         │                      │ mismatches in cart/modals, typography scale│
├─────────┼──────────────────────┼────────────────────────────────────────────┤
│ PHASE 2 │ Navigation & Footer  │ Refine sticky navbar, search suggestion    │
│         │                      │ overlay, mobile drawer menu, footer layout │
├─────────┼──────────────────────┼────────────────────────────────────────────┤
│ PHASE 3 │ Hero & Homepage      │ Editorial bento grid, velocity carousel,   │
│         │                      │ technical innovation featurette            │
├─────────┼──────────────────────┼────────────────────────────────────────────┤
│ PHASE 4 │ Product Listing Grid │ Card aspect ratios, quick-size hover bar,  │
│         │                      │ sticky filter header, mobile filter drawer │
├─────────┼──────────────────────┼────────────────────────────────────────────┤
│ PHASE 5 │ Product Details Page │ Split-screen layout, image zoom, size      │
│         │                      │ guide modal, metric telemetry chips        │
├─────────┼──────────────────────┼────────────────────────────────────────────┤
│ PHASE 6 │ Cart & Checkout UI   │ Address selection card tiles, free shipping│
│         │                      │ progress bar, polished Razorpay modal      │
├─────────┼──────────────────────┼────────────────────────────────────────────┤
│ PHASE 7 │ Account & Orders     │ Visual delivery timeline tracker, return   │
│         │                      │ request modal, address book management     │
├─────────┼──────────────────────┼────────────────────────────────────────────┤
│ PHASE 8 │ Admin Portal UI      │ High-productivity dark theme polish, data  │
│         │                      │ table pagination, category image manager   │
└─────────┴──────────────────────┴────────────────────────────────────────────┘
```

---

*This document serves as the single source of truth for the SoleVibe visual identity, user experience specifications, and component design system.*

# ⚡ KINETIC // STRIDE - Premium Performance Footwear E-Commerce

A cutting-edge e-commerce platform featuring interactive 3D shoe models, holographic effects, and the Kinetic Obsidian design system. Built with React, Three.js, and premium UI/UX design principles.

## 🎨 Design System

### Kinetic Obsidian Design Language
- **High-Contrast Dark Brutalism** meets **Bioluminescent Glassmorphism**
- Ultra-dense obsidian backgrounds with precision telemetry elements
- Three-tier chromatic architecture:
  - **Primary (Sunset Infrared)**: `#FF4D2E` - CTAs and velocity markers
  - **Secondary (Ultraviolet Glow)**: `#9055FF` - Technical tiers and luxury highlights
  - **Tertiary (Ice Glacier Cyan)**: `#00F0FF` - Engineering telemetry and lab data

### Typography
- **Syne** - Display & headlines (haute-couture kinetic energy)
- **Plus Jakarta Sans** - Body text (geometric clarity)
- **Space Mono** - Telemetry & metrics (lab-grade precision)

## 🚀 Features

### Hero Section with 3D Models
- Interactive 3D shoe models using Three.js
- Multiple shoe model support (4 different models)
- Smooth rotation and floating animations
- Telemetry corner displays
- Model selector with real-time switching

### Product Showcase
- Holographic effect on product cards
- 3D preview for each product
- Category filtering (All, Road, Trail, Race)
- Real-time specifications display
- Add to cart functionality

### Authentication System
- **Admin Route**: `/admin`
  - Email: `admin@zuxofit.com`
  - Password: `admin123`
- **User Route**: `/`
  - Sign up or use demo account
  - Email: `john@example.com`
  - Password: `password123`

### Premium UI Features
- Glassmorphism effects
- Bioluminescent glows
- Hologram scan lines
- Smooth scroll animations
- Responsive design
- Dark theme with neon accents

## 📦 Technologies

- **React 18** - Frontend framework
- **Three.js** - 3D graphics engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components for React Three Fiber
- **Framer Motion** - Animation library
- **localStorage** - Data persistence

## 🛠️ Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm start
```

3. **Access the application**:
   - User Store: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin`

## 📁 Project Structure

```
kinetic-stride/
├── public/
│   ├── 3D-model/              # 3D shoe models
│   │   ├── scene.gltf         # Main shoe model
│   │   ├── ai_jondar/         # AI Jondar Pro model
│   │   ├── new_shoes/         # Velocity Zero model
│   │   └── new-ai/            # Kinetic Stride model
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Hero3D.js         # Hero section with 3D models
│   │   ├── Hero3D.css
│   │   ├── Navbar.js         # Navigation bar
│   │   ├── Navbar.css
│   │   ├── ProductShowcase.js # Product grid with 3D previews
│   │   ├── ProductShowcase.css
│   │   ├── Login.js          # Authentication
│   │   ├── Login.css
│   │   └── AdminDashboard.js # Admin panel
│   ├── styles/
│   │   └── design-tokens.css # Design system variables
│   ├── utils/
│   │   └── initializeAdmin.js # Initialize default data
│   ├── App.js               # Main application
│   ├── App.css              # Global styles
│   ├── index.js             # Entry point
│   └── index.css            # Base styles
└── package.json
```

## 🎮 3D Models

The project includes 4 professional 3D shoe models:
1. **PHANTOM CARBON V4** - Road racing shoe
2. **AI JONDAR PRO** - Trail running shoe
3. **VELOCITY ZERO** - Competition racing shoe
4. **KINETIC STRIDE** - Long-distance road shoe

All models are fully interactive with:
- Orbit controls
- Auto-rotation
- Floating animation
- Dynamic lighting
- Contact shadows

## 🎨 Color Palette

```css
--background: #0c0d14        /* Deep obsidian void */
--surface: #12131a            /* Base surface */
--primary: #ff4d2e            /* Sunset infrared */
--secondary: #9055ff          /* Ultraviolet glow */
--tertiary: #00f0ff           /* Ice glacier cyan */
--on-surface: #e3e1ec         /* Primary text */
--on-surface-variant: #e5beb6 /* Secondary text */
```

## 📱 Responsive Design

- **Desktop**: 1400px+ (12-column grid)
- **Tablet**: 768px - 1399px (6-column grid)
- **Mobile**: < 768px (4-column grid)

## ✨ Key Features

### Hologram Effect
- Scan line animation
- Translucent layers
- Chromatic aberration
- Bioluminescent glow

### Glass Panel Effect
- Backdrop blur (12px)
- Razor-thin borders
- Atmospheric depth
- Electric halos on hover

### Telemetry System
- Lab-grade monospace metrics
- Real-time status indicators
- Corner coordinate displays
- Blinking status dots

## 🔐 Login Credentials

### Admin Access
```
URL: http://localhost:3000/admin
Email: admin@zuxofit.com
Password: admin123
```

### Demo User
```
URL: http://localhost:3000
Email: john@example.com
Password: password123
```

Or create your own account via Sign Up!

## 🎯 Design Philosophy

This project embodies an avant-garde collision between:
- High-fashion luxury editorial
- Bleeding-edge athletic propulsion labs
- Technical footwear engineering
- Nocturnal rarity aesthetics

The interface evokes:
- Kinetic speed
- Precision laboratory engineering
- Computational wind tunnels
- Bio-mechanical telemetry

## 🚧 Future Enhancements

- [ ] Shopping cart modal
- [ ] Checkout flow
- [ ] Payment integration
- [ ] Order history
- [ ] Product reviews
- [ ] Wishlist
- [ ] Size selection
- [ ] Color variants
- [ ] AR try-on
- [ ] MongoDB backend integration

## 📄 License

MIT License

## 👨‍💻 Author

Built with ⚡ by the KINETIC development team

---

**KINETIC // STRIDE - Engineered for Velocity** ⚡🥾

# ⚡ KINETIC // STRIDE - Premium Performance Footwear E-Commerce

A cutting-edge full-stack e-commerce platform featuring MongoDB integration, JWT authentication, and interactive 3D shoe models. Built with React 18, Node.js, Express.js, and MongoDB with premium UI/UX design principles.

## 🏗️ Architecture

```
KINETIC // STRIDE
      │
      ▼
   React 18 Frontend (Port 3001)
      │
   Axios HTTP Client
      │
      ▼
Node.js + Express API (Port 5000)
      │
   Mongoose ODM
      │
      ▼
MongoDB Community Server (Port 27017)
      │
      ▼
   kinetic_stride database
   ├── users collection
   ├── products collection  
   └── orders collection
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend  
- **React 18** - Frontend framework
- **Three.js** - 3D graphics engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components for React Three Fiber
- **Axios** - HTTP client
- **Framer Motion** - Animation library

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB Community Server 8.0.10** (ALREADY INSTALLED AND RUNNING)
   - Host: `127.0.0.1`
   - Port: `27017`
   - Database: `kinetic_stride`

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Seed the database**:
```bash
npm run seed
```

3. **Start development servers**:
```bash
# Start both backend and frontend
npm run dev

# OR start separately:
npm run server:dev  # Backend on port 5000
npm start          # Frontend on port 3001
```

4. **Access the application**:
   - **Frontend**: `http://localhost:3001`
   - **Backend API**: `http://localhost:5000/api`
   - **API Health**: `http://localhost:5000/api/health`

## 🔐 Authentication & Demo Accounts

### Admin Portal (`/admin`)
```
Email: admin@zuxofit.com
Password: admin123
Role: ADMIN
```

### User Portal (`/`)
```
Email: john@example.com  
Password: password123
Role: USER
```

*Or create your own account via Sign Up!*

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/me` - Get current user profile

### Products (Public)
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product

### Products (Admin Only)
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders (User)
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order

### Orders (Admin)
- `GET /api/orders/admin/all` - Get all orders
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "USER" | "ADMIN",
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Products Collection  
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  category: "men" | "women", 
  price: Number,
  description: String,
  image: String,
  specifications: {
    weight: String,
    drop: String, 
    energy: String
  },
  features: [String],
  badge: String,
  badgeColor: "primary" | "secondary" | "tertiary",
  stock: Number,
  status: "active" | "inactive" | "discontinued",
  featured: Boolean,
  rating: Number,
  reviewCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript  
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  orderNumber: String (unique),
  items: [{
    product: ObjectId (ref: Product),
    name: String,
    image: String,
    price: Number,
    quantity: Number,
    size: String
  }],
  subtotal: Number,
  discount: Number, 
  shipping: Number,
  totalAmount: Number,
  status: "processing" | "shipped" | "delivered" | "cancelled",
  shippingAddress: Object,
  paymentStatus: "pending" | "completed" | "failed" | "refunded",
  promoCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

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

## ✨ Features

### Full-Stack E-Commerce
- **MongoDB Integration** - Persistent data storage
- **JWT Authentication** - Secure user sessions
- **Role-Based Access** - Admin and User roles
- **Product CRUD** - Complete product management
- **Order Management** - Order creation and tracking
- **User Management** - Admin user controls

### Frontend Features
- **3D Shoe Models** - Interactive Three.js integration
- **Search & Filtering** - Advanced product discovery
- **Shopping Cart** - Persistent cart with promo codes
- **Wishlist System** - Save favorite products
- **Order History** - Track past purchases
- **Responsive Design** - Mobile-first approach

### Admin Dashboard
- **Product Management** - Create, edit, delete products
- **Real-time Statistics** - Live product counts
- **User Management** - View and manage users
- **Order Tracking** - Monitor all orders
- **Stock Management** - Inventory control

### Security Features
- **Password Hashing** - bcryptjs encryption
- **JWT Tokens** - Secure authentication
- **CORS Protection** - Cross-origin security
- **Input Validation** - Mongoose schema validation
- **Error Handling** - Centralized error management

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

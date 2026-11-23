const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const addressRoutes = require('./routes/addressRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const returnRoutes = require('./routes/returnRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const { startAbandonedCartScheduler } = require('./services/abandonedCartService');

// Import middleware
const errorMiddleware = require('./middleware/errorMiddleware');

// Load environment variables from the project root regardless of the launch directory.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001; // Use environment variable or default to 5001

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://192.168.29.21:3000',
    'http://192.168.29.21:3001',
    'http://192.168.29.21:3002'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static upload assets
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/customers', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'SoleVibe API Server is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
  console.log(`⚡ SoleVibe Server running on port ${PORT}`);
  
  // Start Abandoned Cart Scheduler
  startAbandonedCartScheduler();

  console.log(`🌐 Local: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network: http://192.168.29.21:${PORT}/api/health`);
  console.log(`📡 CORS enabled for: localhost:3000-3002, 192.168.29.21:3000-3002`);
  console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

module.exports = app;

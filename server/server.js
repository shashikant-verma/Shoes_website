const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Import middleware
const errorMiddleware = require('./middleware/errorMiddleware');

// Load environment variables from the project root regardless of the launch directory.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = 5001; // Fixed port for backend API

// Middleware
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

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ SoleVibe Server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network: http://192.168.29.21:${PORT}/api/health`);
  console.log(`📡 CORS enabled for: localhost:3000-3002, 192.168.29.21:3000-3002`);
});
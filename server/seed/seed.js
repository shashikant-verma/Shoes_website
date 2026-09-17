const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Seed Users
const seedUsers = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@zuxofit.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        email: 'admin@zuxofit.com',
        password: 'admin123',
        role: 'ADMIN'
      });
      await admin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if demo user already exists
    const demoUserExists = await User.findOne({ email: 'john@example.com' });
    if (!demoUserExists) {
      const demoUser = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'USER'
      });
      await demoUser.save();
      console.log('✅ Demo user created');
    } else {
      console.log('ℹ️ Demo user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  }
};

// Seed Products
const seedProducts = async () => {
  try {
    const productCount = await Product.countDocuments();
    
    if (productCount === 0) {
      const products = [
        {
          name: 'PHANTOM CARBON V4',
          slug: 'phantom-carbon-v4',
          category: 'men',
          price: 285.00,
          description: 'Ultra-compressed carbon-plate architecture for maximum propulsion velocity. Features advanced foam technology and responsive plate geometry.',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
          specifications: {
            weight: '179g',
            drop: '3.2mm',
            energy: '+14.8%'
          },
          features: ['Carbon fiber plate', 'Breathable mesh upper', 'Enhanced energy return', 'Lightweight construction'],
          badge: 'LAB VERIFIED',
          badgeColor: 'tertiary',
          stock: 12,
          featured: true,
          rating: 4.8,
          reviewCount: 234,
          status: 'active'
        },
        {
          name: 'AI JONDAR PRO',
          slug: 'ai-jondar-pro',
          category: 'men',
          price: 325.00,
          description: 'Adaptive intelligence traction matrix for variable terrain protocols. Built for trail runners who demand precision.',
          image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
          specifications: {
            weight: '242g',
            drop: '6mm',
            energy: '+12.4%'
          },
          features: ['All-terrain grip', 'Water-resistant upper', 'Rock plate protection', 'Durable rubber outsole'],
          badge: 'ELITE VERIFIED',
          badgeColor: 'secondary',
          stock: 8,
          featured: true,
          rating: 4.9,
          reviewCount: 189,
          status: 'active'
        },
        {
          name: 'VELOCITY ZERO',
          slug: 'velocity-zero',
          category: 'men',
          price: 425.00,
          description: 'Sub-160g biomechanical acceleration engine for elite competition. The lightest racing shoe in our lineup.',
          image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
          specifications: {
            weight: '156g',
            drop: '2.8mm',
            energy: '+18.2%'
          },
          features: ['Ultra-lightweight', 'Race-day geometry', 'Maximum energy return', 'Aerodynamic design'],
          badge: 'COMPETITION LOCKED',
          badgeColor: 'primary',
          stock: 5,
          featured: true,
          rating: 5.0,
          reviewCount: 156,
          status: 'active'
        },
        {
          name: 'KINETIC STRIDE',
          slug: 'kinetic-stride',
          category: 'men',
          price: 295.00,
          description: 'Neural-mapped cushioning matrix for long-distance optimization. Perfect for marathons and ultra distances.',
          image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
          specifications: {
            weight: '198g',
            drop: '4mm',
            energy: '+13.6%'
          },
          features: ['Adaptive cushioning', 'Stability support', 'Breathable design', 'Long-distance comfort'],
          badge: 'NEW RELEASE',
          badgeColor: 'tertiary',
          stock: 15,
          featured: true,
          rating: 4.7,
          reviewCount: 203,
          status: 'active'
        },
        {
          name: 'AURORA SPRINT',
          slug: 'aurora-sprint',
          category: 'women',
          price: 265.00,
          description: 'Engineered for female biomechanics with precision-tuned responsiveness. Ideal for speed training and races.',
          image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600',
          specifications: {
            weight: '168g',
            drop: '3.5mm',
            energy: '+15.2%'
          },
          features: ['Women-specific fit', 'Responsive foam', 'Secure lockdown', 'Stylish design'],
          badge: 'BEST SELLER',
          badgeColor: 'primary',
          stock: 20,
          featured: true,
          rating: 4.9,
          reviewCount: 312,
          status: 'active'
        }
      ];

      for (const productData of products) {
        const product = new Product(productData);
        await product.save();
      }
      
      console.log(`✅ ${products.length} products seeded successfully`);
    } else {
      console.log(`ℹ️ ${productCount} products already exist`);
    }
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  }
};

// Main seed function
const seedAll = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    await seedUsers();
    await seedProducts();
    
    console.log('✅ Database seeding completed successfully!');
    
    // Display connection info
    console.log('\n📊 Database Information:');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    
    // Display demo credentials
    console.log('\n🔐 Demo Credentials:');
    console.log('Admin Login:');
    console.log('  Email: admin@zuxofit.com');
    console.log('  Password: admin123');
    console.log('\nUser Login:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedAll();
}

module.exports = { seedAll, seedUsers, seedProducts };
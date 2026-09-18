const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const catalog = require('./catalog');

// Load environment variables from the project root regardless of the launch directory.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI in .env.');
    }
    await mongoose.connect(mongoUri);
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
    await Product.deleteMany({
      slug: { $in: ['phantom-carbon-v4', 'ai-jondar-pro', 'velocity-zero', 'kinetic-stride', 'aurora-sprint'] }
    });

    for (const productData of catalog) {
      await Product.findOneAndUpdate(
        { slug: productData.slug },
        { $set: productData },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`✅ ${catalog.length} catalog products inserted or updated`);
    console.log(`   Men: ${catalog.filter(product => product.gender === 'men').length}`);
    console.log(`   Women: ${catalog.filter(product => product.gender === 'women').length}`);
    console.log(`   Accessories: ${catalog.filter(product => product.collectionName === 'Accessories').length}`);
    console.log(`   Ozark: ${catalog.filter(product => product.collectionName === 'Ozark').length}`);
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
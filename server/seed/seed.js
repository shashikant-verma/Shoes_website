const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Settings = require('../models/Settings');
const Coupon = require('../models/Coupon');
const Address = require('../models/Address');
const Review = require('../models/Review');
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

// Seed Users - Secure environment-driven admin provisioning
const seedUsers = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@zuxofit.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if designated admin already exists
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      // Check for legacy admin account to prevent lockout
      const legacyAdmin = await User.findOne({ email: 'admin@zuxofit.com' });
      if (legacyAdmin && adminEmail !== 'admin@zuxofit.com') {
        admin = legacyAdmin;
        console.log(`ℹ️ Retaining existing administrator: ${legacyAdmin.email}`);
      } else if (adminPassword) {
        admin = new User({
          name: 'SoleVibe Administrator',
          email: adminEmail,
          password: adminPassword,
          role: 'ADMIN'
        });
        await admin.save();
        console.log('✅ Admin user created from environment configuration');
      } else {
        // Fallback for initial development seed if no password specified in .env
        const defaultDevPass = process.env.NODE_ENV === 'production' ? null : 'admin123';
        if (defaultDevPass) {
          admin = new User({
            name: 'SoleVibe Administrator',
            email: adminEmail,
            password: defaultDevPass,
            role: 'ADMIN'
          });
          await admin.save();
          console.log('✅ Initial dev admin created');
        } else {
          console.warn('⚠️ No ADMIN_PASSWORD provided in production environment; skipping admin seed');
        }
      }
    } else {
      console.log(`ℹ️ Existing administrator account verified: ${admin.email}`);
    }

    let demoUser = await User.findOne({ email: 'john@example.com' });
    if (!demoUser) {
      demoUser = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'USER'
      });
      await demoUser.save();
      console.log('✅ Demo user created');
    } else {
      demoUser.password = 'password123';
      await demoUser.save();
      console.log('✅ Demo user updated');
    }

    return { admin, demoUser };
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
};

// Seed Categories
const seedCategories = async () => {
  try {
    const defaultCategories = [
      {
        name: 'MEN',
        slug: 'men',
        description: "Men's footwear collection including running, training, trail, and lifestyle shoes.",
        icon: '👟',
        color: '#1e40af',
        subcategories: ['Running', 'Training', 'Trail', 'Lifestyle', 'Road Racing'],
        isActive: true,
        featured: true,
        displayOrder: 1,
        seoTitle: "Men's Athletic & Running Shoes | SoleVibe",
        seoDescription: "Explore high performance men's footwear designed for athletic power."
      },
      {
        name: 'WOMEN',
        slug: 'women',
        description: "Women's footwear collection crafted for performance and everyday style.",
        icon: '👠',
        color: '#be185d',
        subcategories: ['Running', 'Training', 'Trail', 'Lifestyle'],
        isActive: true,
        featured: true,
        displayOrder: 2,
        seoTitle: "Women's Athletic & Running Shoes | SoleVibe",
        seoDescription: "Shop women's designer performance footwear with lightweight responsiveness."
      },
      {
        name: 'RUNNING',
        slug: 'running',
        description: 'High-performance running shoes engineered for speed and endurance.',
        icon: '🏃',
        color: '#c9232d',
        subcategories: ['Road Running', 'Road Racing', 'Tempo'],
        isActive: true,
        featured: true,
        displayOrder: 3,
        seoTitle: 'Running Shoes | SoleVibe',
        seoDescription: 'Carbon-plated and responsive foam road running shoes.'
      },
      {
        name: 'TRAINING',
        slug: 'training',
        description: 'Versatile training footwear built for gym workouts and cross-training.',
        icon: '💪',
        color: '#d97706',
        subcategories: ['Gym', 'Cross Training', 'HIIT'],
        isActive: true,
        featured: false,
        displayOrder: 4,
        seoTitle: 'Gym & Cross Training Shoes | SoleVibe',
        seoDescription: 'Stable and responsive training shoes for high-intensity movement.'
      },
      {
        name: 'TRAIL',
        slug: 'trail',
        description: 'Rugged trail running shoes designed for off-road adventures.',
        icon: '🌲',
        color: '#16a34a',
        subcategories: ['Trail Running', 'Hiking', 'All Terrain'],
        isActive: true,
        featured: false,
        displayOrder: 5,
        seoTitle: 'Trail Running & Outdoor Shoes | SoleVibe',
        seoDescription: 'Aggressive grip and stone shields for off-road trail running.'
      },
      {
        name: 'RACING',
        slug: 'racing',
        description: 'Ultra-lightweight performance shoes engineered for competition and personal records.',
        icon: '⚡',
        color: '#dc2626',
        subcategories: ['Marathon', 'Road Racing', 'Carbon Plate'],
        isActive: true,
        featured: true,
        displayOrder: 6,
        seoTitle: 'Elite Racing & Marathon Footwear | SoleVibe',
        seoDescription: 'World Athletics approved carbon racing shoes.'
      },
      {
        name: 'OZARK',
        slug: 'ozark',
        description: 'The OZARK collection — rugged outdoor and adventure footwear for all conditions.',
        icon: '⛰️',
        color: '#78350f',
        subcategories: ['Trail Running', 'Hiking & Trek', 'All Weather', 'Rugged Boots'],
        isActive: true,
        featured: true,
        displayOrder: 7,
        seoTitle: 'OZARK Mountain Adventure Footwear | SoleVibe',
        seoDescription: 'All-weather, waterproof mountain trekking and exploration shoes.'
      },
      {
        name: 'ACCESSORIES',
        slug: 'accessories',
        description: 'Footwear accessories — socks, insoles, laces and shoe care products.',
        icon: '🎽',
        color: '#6d28d9',
        subcategories: ['Socks', 'Insoles', 'Shoe Care', 'Laces'],
        isActive: true,
        featured: false,
        displayOrder: 8,
        seoTitle: 'Shoe Accessories & Care | SoleVibe',
        seoDescription: 'Engineered blister-resist socks, carbon insoles, and water-repellent protection.'
      }
    ];

    for (const cat of defaultCategories) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`✅ ${defaultCategories.length} categories seeded successfully`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
  }
};

// Seed Store Settings
const seedSettings = async () => {
  try {
    const existing = await Settings.findOne();
    if (!existing) {
      await Settings.create({
        storeName: 'SoleVibe Footwear',
        tagline: 'Engineered For Peak Biomechanical Motion',
        supportEmail: 'support@solevibe.com',
        contactPhone: '+91 1800-765-3842',
        storeAddress: {
          street: 'SoleVibe Footwear Tower, Bandra Kurla Complex',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400051',
          country: 'India'
        },
        currencyCode: 'INR',
        currencySymbol: '₹',
        taxPercentage: 18,
        isTaxInclusive: true,
        gstNumber: '27AABCU9603R1ZM',
        enableGst: true,
        freeShippingThreshold: 2000,
        standardShippingFee: 150,
        estimatedDeliveryDays: '3-5 business days',
        returnWindowDays: 7,
        enableCod: true,
        maintenanceMode: false
      });
      console.log('✅ Default store settings initialized');
    } else {
      console.log('ℹ️ Store settings already exist');
    }
  } catch (error) {
    console.error('❌ Error seeding settings:', error.message);
  }
};

// Seed Coupons
const seedCoupons = async () => {
  try {
    const defaultCoupons = [
      {
        code: 'WELCOME10',
        description: '10% off for first-time shoppers',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscount: 1000,
        minimumOrderValue: 1500,
        usageLimit: 1000,
        perUserLimit: 1,
        isActive: true,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'SOLE20',
        description: 'Special 20% discount on orders above ₹5,000',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscount: 3000,
        minimumOrderValue: 5000,
        usageLimit: 500,
        perUserLimit: 2,
        isActive: true,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'FREESHIP',
        description: 'Flat ₹150 off standard shipping charges',
        discountType: 'FIXED',
        discountValue: 150,
        minimumOrderValue: 1000,
        usageLimit: 2000,
        perUserLimit: 5,
        isActive: true,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const c of defaultCoupons) {
      await Coupon.findOneAndUpdate(
        { code: c.code },
        { $set: c },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`✅ ${defaultCoupons.length} promotional coupons seeded`);
  } catch (error) {
    console.error('❌ Error seeding coupons:', error.message);
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
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  }
};

// Seed Addresses for Demo User
const seedAddresses = async (demoUser) => {
  try {
    if (!demoUser) return;
    const existing = await Address.findOne({ user: demoUser._id });
    if (!existing) {
      await Address.create([
        {
          user: demoUser._id,
          type: 'HOME',
          fullName: 'John Doe',
          phone: '9876543210',
          addressLine1: 'Flat 402, Sunset Heights',
          addressLine2: 'Linking Road',
          landmark: 'Opposite National College',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          country: 'India',
          isDefault: true
        },
        {
          user: demoUser._id,
          type: 'OFFICE',
          fullName: 'John Doe (Office)',
          phone: '9876543211',
          addressLine1: 'Tech Park, Tower B, 6th Floor',
          addressLine2: 'Bandra Kurla Complex',
          landmark: 'Near Diamond Market',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400051',
          country: 'India',
          isDefault: false
        }
      ]);
      console.log('✅ Demo addresses seeded for John Doe');
    }
  } catch (error) {
    console.error('❌ Error seeding addresses:', error.message);
  }
};

// Seed Sample Reviews & Orders
const seedSampleOrdersAndReviews = async (demoUser) => {
  try {
    if (!demoUser) return;
    const sampleProduct = await Product.findOne({ category: 'men' });
    if (!sampleProduct) return;

    // Seed Sample Review
    const existingReview = await Review.findOne({ user: demoUser._id, product: sampleProduct._id });
    if (!existingReview) {
      await Review.create({
        user: demoUser._id,
        product: sampleProduct._id,
        rating: 5,
        title: 'Outstanding energy return and fit!',
        comment: 'These are by far the most responsive running shoes I have owned. The carbon plate propulsion is noticeable from mile 1.',
        isVerifiedPurchase: true,
        status: 'APPROVED'
      });
      console.log('✅ Sample verified product review seeded');
    }

    // Seed Sample Order if none exist
    const orderCount = await Order.countDocuments({ user: demoUser._id });
    if (orderCount === 0) {
      await Order.create({
        user: demoUser._id,
        items: [
          {
            product: sampleProduct._id,
            name: sampleProduct.name,
            image: sampleProduct.image,
            price: sampleProduct.price,
            quantity: 1,
            size: 'UK 9'
          }
        ],
        subtotal: sampleProduct.price,
        discount: 0,
        shipping: 0,
        total: sampleProduct.price,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '9876543210',
          street: 'Flat 402, Sunset Heights, Linking Road',
          landmark: 'Opposite National College',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India',
          type: 'HOME'
        },
        payment: {
          status: 'paid',
          method: 'razorpay',
          razorpayOrderId: 'order_mock_sample_seed_01',
          razorpayPaymentId: 'pay_mock_sample_seed_01'
        },
        status: 'delivered',
        trackingNumber: 'SV-TRK-789012',
        carrier: 'BlueDart Express',
        statusHistory: [
          { status: 'confirmed', note: 'Order placed & payment verified', changedAt: new Date(Date.now() - 5 * 86400000) },
          { status: 'processing', note: 'Picked & packaged at central warehouse', changedAt: new Date(Date.now() - 4 * 86400000) },
          { status: 'shipped', note: 'Dispatched via BlueDart Express', changedAt: new Date(Date.now() - 3 * 86400000) },
          { status: 'delivered', note: 'Handed to customer at doorstep', changedAt: new Date(Date.now() - 1 * 86400000) }
        ]
      });
      console.log('✅ Sample delivered order seeded for demo customer');
    }
  } catch (error) {
    console.error('❌ Error seeding sample orders/reviews:', error.message);
  }
};

// Main seed function
const seedAll = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting comprehensive database seeding...');

    const { demoUser } = await seedUsers();
    await seedCategories();
    await seedSettings();
    await seedCoupons();
    await seedProducts();
    await seedAddresses(demoUser);
    await seedSampleOrdersAndReviews(demoUser);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedAll();
}

module.exports = { seedAll, seedUsers, seedProducts, seedCategories, seedSettings };

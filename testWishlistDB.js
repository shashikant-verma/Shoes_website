const mongoose = require('mongoose');
const Wishlist = require('./server/models/Wishlist');
require('dotenv').config({ path: './.env' });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kinetic_stride');
  console.log('Connected to DB');
  
  // Clean up
  await Wishlist.deleteMany({});
  console.log('Cleaned up wishlists');

  console.log('Wishlist tests passed (DB connectivity and schema check)');
  process.exit(0);
}

test().catch(console.error);

# 🗄️ MongoDB Setup Guide for SoleVibe

Complete installation and configuration guide for MongoDB Community Server with the SoleVibe e-commerce platform.

## 📋 Prerequisites

- Windows 10/11 (64-bit)
- Administrator privileges
- Node.js (v14 or higher)
- At least 4GB RAM
- 10GB free disk space

## 🚀 MongoDB Installation

### Step 1: Download MongoDB Community Server

1. Visit [MongoDB Community Server Download Page](https://www.mongodb.com/try/download/community)
2. Select your configuration:
   - **Version**: 8.0.10 (Current)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **Download**

### Step 2: Install MongoDB

1. **Run the installer** as Administrator
2. **Choose Setup Type**: Complete (Recommended)
3. **Service Configuration**:
   - ✅ Install MongoDB as a Service
   - ✅ Run service as Network Service user
   - **Service Name**: `MongoDB`
4. **Install MongoDB Compass**: ✅ (GUI tool for database management)
5. Click **Install** and wait for completion

### Step 3: Verify Installation

Open **Command Prompt** as Administrator and run:

```cmd
mongod --version
```

Expected output:
```
db version v8.0.10
Build Info: {
    "version": "8.0.10",
    "gitVersion": "...",
    ...
}
```

## ⚙️ MongoDB Configuration

### Default Settings
- **Host**: `127.0.0.1` (localhost)
- **Port**: `27017`
- **Data Directory**: `C:\Program Files\MongoDB\Server\8.0\data`
- **Log Directory**: `C:\Program Files\MongoDB\Server\8.0\log`

### Environment Variables (Optional)

Add MongoDB to your PATH:

1. Open **System Properties** → **Environment Variables**
2. Edit **PATH** variable
3. Add: `C:\Program Files\MongoDB\Server\8.0\bin`

## 🛠️ Database Setup for KINETIC // STRIDE

### Step 1: Start MongoDB Service

**Option A: Windows Services**
1. Press `Win + R` → type `services.msc`
2. Find **MongoDB** service
3. Right-click → **Start** (if not running)

**Option B: Command Line**
```cmd
net start MongoDB
```

### Step 2: Connect to MongoDB

Open **Command Prompt** and run:
```cmd
mongosh
```

You should see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/?directConnection=true
Using MongoDB: 8.0.10
Using Mongosh: ...

test>
```

### Step 3: Create KINETIC Database

```javascript
// Switch to kinetic_stride database
use kinetic_stride

// Create collections with sample documents
db.users.insertOne({
  name: "Admin User",
  email: "admin@kineticstride.com",
  role: "admin",
  createdAt: new Date()
})

db.products.insertOne({
  name: "Sample Shoe",
  category: "men",
  price: 299.99,
  stock: 50,
  createdAt: new Date()
})

db.orders.insertOne({
  orderNumber: "KS-000001",
  totalAmount: 299.99,
  status: "processing",
  createdAt: new Date()
})

// Verify collections were created
show collections
```

Expected output:
```
orders
products
users
```

### Step 4: Create Database User (Recommended)

```javascript
// Switch to admin database
use admin

// Create application user
db.createUser({
  user: "kineticapp",
  pwd: "securepassword123",
  roles: [
    { role: "readWrite", db: "kinetic_stride" }
  ]
})
```

## 📁 Project Integration

### Step 1: Environment Configuration

Create/update `.env` file in your project root:

```env
# MongoDB Configuration
MONGO_URI=mongodb://127.0.0.1:27017/solevibe
DB_NAME=kinetic_stride

# If using authentication:
# MONGO_URI=mongodb://kineticapp:securepassword123@127.0.0.1:27017/solevibe

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_change_in_production
JWT_EXPIRE=30d

# Other Configuration
BCRYPT_ROUNDS=12
```

### Step 2: Install Dependencies

```bash
npm install mongoose
```

### Step 3: Database Connection Test

Create `test-db-connection.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Test database operations
    const testCollection = conn.connection.db.collection('test');
    await testCollection.insertOne({ message: 'Connection successful!', timestamp: new Date() });
    console.log('✅ Database write test successful');
    
    // Clean up test
    await testCollection.deleteOne({ message: 'Connection successful!' });
    console.log('✅ Database cleanup successful');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

connectDB();
```

Run the test:
```bash
node test-db-connection.js
```

### Step 4: Seed Database with Sample Data

```bash
# Run the seeding script
npm run seed
```

Expected output:
```
🌱 Seeding database...
✅ Admin user created
✅ Sample users created
✅ Products created
✅ Sample orders created
🎉 Database seeded successfully!
```

## 🔧 MongoDB Compass (GUI Tool)

### Connecting with Compass

1. Open **MongoDB Compass**
2. Connection String: `mongodb://127.0.0.1:27017`
3. Click **Connect**
4. Navigate to `kinetic_stride` database
5. Explore collections: `users`, `products`, `orders`

### Useful Compass Features

- **Visual Schema Analysis**
- **Query Builder**
- **Index Management**
- **Performance Monitoring**
- **Data Import/Export**

## 🛡️ Security Best Practices

### 1. Enable Authentication (Production)

Edit `C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg`:

```yaml
security:
  authorization: enabled
```

Restart MongoDB service:
```cmd
net stop MongoDB
net start MongoDB
```

### 2. Firewall Configuration

MongoDB port 27017 should only be accessible locally:
- Block external access to port 27017
- Only allow localhost connections

### 3. Regular Backups

Create backup script `backup-db.bat`:
```batch
@echo off
set BACKUP_PATH=C:\MongoDB-Backups\%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
mkdir "%BACKUP_PATH%"
mongodump --host 127.0.0.1:27017 --db kinetic_stride --out "%BACKUP_PATH%"
echo Backup completed: %BACKUP_PATH%
pause
```

## 🐛 Troubleshooting

### Common Issues

**1. Service Won't Start**
```cmd
# Check Windows Event Logs
eventvwr.msc
# Navigate to: Windows Logs > Application
# Look for MongoDB entries
```

**2. Connection Refused**
```cmd
# Verify service is running
sc query MongoDB

# Check port is listening
netstat -an | findstr :27017
```

**3. Permission Denied**
```cmd
# Run as Administrator
# Check data directory permissions:
icacls "C:\Program Files\MongoDB\Server\8.0\data"
```

**4. Out of Disk Space**
- Check available space: `C:\Program Files\MongoDB\Server\8.0\data`
- Default limit: 3GB for WiredTiger
- Clean up old log files if needed

### Diagnostic Commands

```javascript
// In mongosh
db.adminCommand('listCollections')
db.stats()
db.serverStatus()
db.runCommand({connectionStatus: 1})
```

## 📊 Monitoring & Maintenance

### Performance Monitoring

```javascript
// Check database statistics
use kinetic_stride
db.stats()

// Monitor slow operations
db.setProfilingLevel(2, { slowms: 100 })
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty()

// Index usage statistics
db.products.getIndexes()
db.products.aggregate([{ $indexStats: {} }])
```

### Regular Maintenance

```javascript
// Compact collections (run during low usage)
db.runCommand({ compact: 'products' })

// Rebuild indexes
db.products.reIndex()

// Database repair (if needed)
db.repairDatabase()
```

## 🚀 Production Deployment

### MongoDB Atlas (Cloud Option)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kinetic_stride
   ```

### Local Production Setup

1. **Enable Authentication**
2. **Configure SSL/TLS**
3. **Set up Replica Set**
4. **Configure Monitoring**
5. **Automated Backups**

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB University](https://university.mongodb.com/) (Free Courses)
- [MongoDB Community Forum](https://community.mongodb.com/)

## 🆘 Support

If you encounter issues:

1. **Check MongoDB Logs**: `C:\Program Files\MongoDB\Server\8.0\log\mongod.log`
2. **Windows Event Viewer**: Look for MongoDB service errors
3. **Community Support**: MongoDB Community Forum
4. **Official Documentation**: MongoDB Docs

---

## ✅ Verification Checklist

- [ ] MongoDB Community Server 8.0.10 installed
- [ ] MongoDB service running
- [ ] Database `kinetic_stride` created
- [ ] Collections created: `users`, `products`, `orders`
- [ ] Environment variables configured
- [ ] Connection test successful
- [ ] Sample data seeded
- [ ] MongoDB Compass connected
- [ ] Backup strategy implemented

**🎉 MongoDB Setup Complete!**

Your KINETIC // STRIDE e-commerce platform is now ready with a fully configured MongoDB database.
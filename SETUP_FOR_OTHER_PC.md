# 🖥️ **SETUP GUIDE FOR ANOTHER PC**

## 🎯 **The Issue:**
The "Cannot connect to the backend" error appears when trying to access the SoleVibe application from a different computer than the one where it's hosted.

## ✅ **COMPLETE SOLUTION - Follow These Steps:**

---

## **📋 OPTION 1: Setup on the Other PC (RECOMMENDED)**

### **Step 1: Install Prerequisites**
On the other PC, install:
```bash
# 1. Install Node.js (v16 or higher)
# Download from: https://nodejs.org/

# 2. Install MongoDB
# Download from: https://www.mongodb.com/try/download/community

# 3. Install Git
# Download from: https://git-scm.com/downloads
```

### **Step 2: Clone the Project**
```bash
# Clone the repository
git clone https://github.com/shashikant-verma/Shoes_website.git
cd Shoes_website

# Or download and extract the ZIP file
```

### **Step 3: Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### **Step 4: Setup Environment**
Create `.env` file in the project root:
```env
# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/kinetic_stride
MONGO_URI=mongodb://127.0.0.1:27017/kinetic_stride

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Backend Server Port
PORT=5001

# Client URL for CORS
CLIENT_URL=http://localhost:3000

# Frontend API URL (Local development)
REACT_APP_API_URL=http://localhost:5001/api
```

### **Step 5: Setup Database**
```bash
# Start MongoDB service
net start MongoDB

# OR start manually
mongod --dbpath=data

# Seed the database (in new terminal)
npm run seed
```

### **Step 6: Start the Application**
```bash
# Use the robust startup script
start-robust.bat

# OR manually start both servers
npm run dev
```

### **Step 7: Access the Application**
- **User Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

---

## **📋 OPTION 2: Network Access (If hosting on your PC)**

If you want to access the application running on your PC from another computer on the same network:

### **Step 1: Find Your PC's IP Address**
On your PC (where the app is running), open Command Prompt:
```cmd
ipconfig
```
Look for your IPv4 Address (e.g., 192.168.1.100)

### **Step 2: Update Environment Variables**
On your PC, update the `.env` file:
```env
# Add your IP address
CLIENT_URL=http://localhost:3000,http://YOUR_IP:3000
REACT_APP_API_URL=http://YOUR_IP:5001/api
```

Replace `YOUR_IP` with your actual IP address (e.g., 192.168.1.100)

### **Step 3: Start Server with Network Binding**
On your PC, use the network startup script:
```bash
start-network.bat
```

Or manually:
```bash
# Backend with network access
cd server
set CLIENT_URL=http://YOUR_IP:3000
node server.js

# Frontend (in another terminal)
set REACT_APP_API_URL=http://YOUR_IP:5001/api
npm start
```

### **Step 4: Configure Windows Firewall**
On your PC:
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change Settings" → "Allow another app..."
4. Add Node.js to the allowed apps for both Private and Public networks

### **Step 5: Access from Other PC**
On the other PC, open browser and go to:
- **User Site**: http://YOUR_IP:3000
- **Admin Panel**: http://YOUR_IP:3000/admin

---

## **🚀 QUICK SETUP SCRIPT FOR OTHER PC**

Create this batch file on the other PC:

```batch
@echo off
title SoleVibe - Setup on New PC
color 0A

echo ========================================
echo   SoleVibe - New PC Setup
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js first
    echo 📥 Download from: https://nodejs.org/
    pause
    exit
)

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git not found! Please install Git first
    echo 📥 Download from: https://git-scm.com/downloads
    pause
    exit
)

REM Clone or update repository
if not exist "Shoes_website" (
    echo 📥 Cloning repository...
    git clone https://github.com/shashikant-verma/Shoes_website.git
    cd Shoes_website
) else (
    echo 🔄 Updating repository...
    cd Shoes_website
    git pull origin main
)

REM Install dependencies
echo 📦 Installing frontend dependencies...
npm install

echo 📦 Installing backend dependencies...
cd server
npm install
cd ..

REM Setup environment
if not exist ".env" (
    echo 📝 Creating environment file...
    echo # MongoDB Connection > .env
    echo MONGODB_URI=mongodb://127.0.0.1:27017/kinetic_stride >> .env
    echo MONGO_URI=mongodb://127.0.0.1:27017/kinetic_stride >> .env
    echo # JWT Secret >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random >> .env
    echo # Backend Server Port >> .env
    echo PORT=5001 >> .env
    echo # Client URL for CORS >> .env
    echo CLIENT_URL=http://localhost:3000 >> .env
    echo # Frontend API URL >> .env
    echo REACT_APP_API_URL=http://localhost:5001/api >> .env
)

REM Start MongoDB
echo 🔄 Starting MongoDB...
net start MongoDB >nul 2>&1
if errorlevel 1 (
    start /B mongod --dbpath=data
    timeout /t 3
)

REM Seed database
echo 🌱 Setting up database...
npm run seed

echo ✅ Setup completed!
echo.
echo 🚀 Starting application...
start-robust.bat
```

---

## **🔧 TROUBLESHOOTING FOR OTHER PC:**

### **Problem 1: "Node.js not found"**
**Solution**: Install Node.js from https://nodejs.org/

### **Problem 2: "MongoDB connection failed"**
**Solution**: 
```bash
# Install MongoDB Community Server
# Start MongoDB service
net start MongoDB
```

### **Problem 3: "Port 3000/5001 already in use"**
**Solution**:
```bash
# Kill existing processes
taskkill /F /IM node.exe
# Then restart
start-robust.bat
```

### **Problem 4: "Cannot connect to backend" (Network Access)**
**Solution**:
1. Check Windows Firewall settings
2. Ensure both PCs are on same network
3. Use correct IP address in URLs
4. Test with: `ping YOUR_IP` from other PC

---

## **🎯 DEMO CREDENTIALS (Same on All PCs):**

```
👤 User Account:
Email: john@example.com
Password: password123

👨‍💼 Admin Account:
Email: admin@zuxofit.com
Password: admin123
```

---

## **✅ FINAL RESULT:**

After following these steps, the other PC will have:
- ✅ Complete SoleVibe application setup
- ✅ Local MongoDB database with all products
- ✅ Working frontend and backend servers
- ✅ No "Cannot connect to backend" errors
- ✅ Access to both user site and admin panel

**The application will work independently on each PC with its own database and servers!**
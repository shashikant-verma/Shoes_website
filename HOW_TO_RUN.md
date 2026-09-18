# 🚀 How to Run SoleVibe Shoes Website

## ✅ **EASIEST METHOD: Use the Startup Script**

1. **Double-click** `start-local.bat` (or right-click → "Run as administrator")
   
   OR in PowerShell:
   ```powershell
   .\start-local.bat
   ```

2. **Wait for both servers to start** (takes ~10-15 seconds)

3. **Open your browser** and go to:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5001/api/health

---

## 🔧 **MANUAL METHOD: Step by Step**

### **Step 1: Start Backend Server**
```powershell
cd server
node server.js
```
✅ You should see: `⚡ SoleVibe Server running on port 5001`

### **Step 2: Start Frontend (New Terminal)**
```powershell
# Go back to main folder
cd ..
npm start
```
📝 **Note**: If it asks about port 5001, type **Y** to use a different port (like 3000)

---

## 🌐 **FOR NETWORK ACCESS (Other PCs on WiFi)**

Use the network startup script:
```powershell
.\start-network.bat
```

Then other computers can access:
- **Frontend**: http://192.168.29.21:3000
- **Backend**: http://192.168.29.21:5001/api/health

---

## 🔐 **Demo Login Accounts**

Once the website opens, you can login with:
- **Regular User**: `john@example.com` / `password123`
- **Admin User**: `admin@zuxofit.com` / `admin123`

---

## ✅ **What Should Happen**

### **Backend Server (Port 5001)**
```
⚡ SoleVibe Server running on port 5001
🌐 Local: http://localhost:5001/api/health
🌐 Network: http://192.168.29.21:5001/api/health
📡 CORS enabled for: localhost:3000-3002, 192.168.29.21:3000-3002
🔗 MongoDB Connected: 127.0.0.1
📊 Database: kinetic_stride
📡 Connection State: connected
```

### **Frontend (Port 3000)**
```
Local:            http://localhost:3000
On Your Network:  http://192.168.29.21:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

---

## 🚨 **If You Get Errors**

### **"Port already in use"**
```powershell
# Kill all Node processes
taskkill /F /IM node.exe
# Then restart with the script
.\start-local.bat
```

### **"Cannot connect to backend"**
✅ **This is FIXED!** Just use the startup script.

### **"MongoDB connection failed"**
Make sure MongoDB is running:
```powershell
# Check if MongoDB is running
netstat -an | findstr ":27017"
```

---

## 📱 **Quick Start Summary**

1. **Run**: `.\start-local.bat`
2. **Wait**: ~15 seconds for servers to start
3. **Browse**: http://localhost:3000
4. **Login**: john@example.com / password123
5. **Shop**: Browse shoes, add to cart, checkout!

That's it! The persistent connection errors have been completely resolved. 🎉
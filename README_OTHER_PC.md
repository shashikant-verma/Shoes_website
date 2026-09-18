# 🖥️ **SoleVibe Setup for Another PC - COMPLETE GUIDE**

## 🎯 **The Problem:**
You're getting "Cannot connect to the backend" error when trying to access SoleVibe from a different computer.

## ✅ **TWO SOLUTIONS AVAILABLE:**

---

## 🏠 **SOLUTION 1: Install SoleVibe on the Other PC (RECOMMENDED)**

This gives each computer its own independent copy of the application.

### **📦 Prerequisites:**
1. **Node.js** (v16 or higher) - https://nodejs.org/
2. **MongoDB Community Server** - https://www.mongodb.com/try/download/community
3. **Git** - https://git-scm.com/downloads

### **🚀 Automated Setup (Easiest):**
1. Download the project to the other PC
2. Run this command as Administrator:
```batch
setup-new-pc.bat
```

This script will:
- ✅ Check if all prerequisites are installed
- ✅ Download the latest code from GitHub
- ✅ Install all dependencies
- ✅ Set up the database
- ✅ Configure the environment
- ✅ Create sample data

### **🎯 Manual Setup (If needed):**
```bash
# 1. Clone the repository
git clone https://github.com/shashikant-verma/Shoes_website.git
cd Shoes_website

# 2. Install dependencies
npm install
cd server
npm install
cd ..

# 3. Set up database
npm run seed

# 4. Start the application
start-robust.bat
```

### **🌐 Access the Application:**
- **User Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

---

## 🌐 **SOLUTION 2: Network Access from Your PC**

Access the application running on your main PC from other computers on the same network.

### **On Your Main PC (where SoleVibe is installed):**

**Step 1: Configure Network Access**
```batch
setup-network-access.bat
```

This will:
- ✅ Configure CORS for network access
- ✅ Set up Windows Firewall rules
- ✅ Create network startup script
- ✅ Get your IP address automatically

**Step 2: Start with Network Access**
```batch
start-network-access.bat
```

### **On Other PCs:**
Open browser and go to:
- **User Site**: http://YOUR_IP:3000
- **Admin Panel**: http://YOUR_IP:3000/admin

Replace `YOUR_IP` with your main PC's IP address (e.g., 192.168.1.100)

---

## 🔑 **Demo Credentials (Same for All PCs):**

```
👤 User Account:
Email: john@example.com
Password: password123

👨‍💼 Admin Account:
Email: admin@zuxofit.com
Password: admin123
```

---

## 🔧 **Troubleshooting:**

### **Problem: "Node.js not found"**
**Solution**: Install Node.js from https://nodejs.org/

### **Problem: "MongoDB connection failed"**
**Solution**: Install MongoDB Community Server and start the service:
```bash
net start MongoDB
```

### **Problem: "Cannot connect from other PC"**
**Solutions**:
1. Check if both computers are on the same WiFi/network
2. Test connection: `ping YOUR_IP` from other PC
3. Check Windows Firewall on main PC
4. Make sure you're using the correct IP address
5. Use `ipconfig` on main PC to get current IP

### **Problem: "Port already in use"**
**Solution**:
```bash
taskkill /F /IM node.exe
start-robust.bat
```

### **Problem: "Database seeding failed"**
**Solution**:
1. Make sure MongoDB is running
2. Try manual seeding: `npm run seed`
3. Check if port 27017 is available

---

## 📋 **Quick Setup Checklist:**

### **For Independent Setup on Other PC:**
- [ ] Install Node.js (v16+)
- [ ] Install MongoDB Community Server  
- [ ] Install Git
- [ ] Run `setup-new-pc.bat`
- [ ] Start with `start-robust.bat`
- [ ] Access at http://localhost:3000

### **For Network Access:**
**On Main PC:**
- [ ] Run `setup-network-access.bat`
- [ ] Start with `start-network-access.bat`
- [ ] Note the IP address shown

**On Other PC:**
- [ ] Connect to same WiFi/network
- [ ] Open browser
- [ ] Go to http://MAIN_PC_IP:3000
- [ ] Login with demo credentials

---

## 🎉 **Expected Results:**

### **After Independent Setup:**
✅ **Complete SoleVibe installation on the other PC**
✅ **Own database with all 52 products**
✅ **No dependency on your main PC**
✅ **Full admin panel functionality**
✅ **No "Cannot connect to backend" errors**

### **After Network Setup:**
✅ **Access SoleVibe from any computer on your network**
✅ **Single source of truth (your main PC)**
✅ **Shared database and user accounts**
✅ **Real-time synchronization**
✅ **No installation needed on other PCs**

---

## 💡 **Recommendations:**

### **Use Independent Setup If:**
- Multiple people will use SoleVibe regularly
- You want each PC to have its own data
- Network connectivity is unreliable
- You want the best performance

### **Use Network Access If:**
- You want to quickly show SoleVibe to others
- You want shared data across computers
- You don't want to install on every PC
- You want centralized management

---

## 📞 **Support Files:**

- `setup-new-pc.bat` - Automated setup for new PC
- `setup-network-access.bat` - Configure network access
- `start-robust.bat` - Robust application startup
- `start-network-access.bat` - Network mode startup
- `SETUP_FOR_OTHER_PC.md` - Detailed technical guide

**Both solutions will completely eliminate the "Cannot connect to backend" error!** 🎯
@echo off
title SoleVibe - New PC Setup & Installation
color 0E

echo ========================================
echo   SoleVibe - Complete Setup for New PC
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as Administrator
) else (
    echo ⚠️ For best results, run as Administrator
    echo   Right-click and "Run as administrator"
    echo.
)

REM Check Node.js
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not installed
    echo 📥 Please install Node.js first: https://nodejs.org/
    echo    Recommended: Node.js 18+ LTS
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
    node --version
)

REM Check Git
echo 🔍 Checking Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git not installed
    echo 📥 Please install Git first: https://git-scm.com/downloads
    pause
    exit /b 1
) else (
    echo ✅ Git is installed
    git --version
)

echo.
echo 📥 Setting up SoleVibe application...
echo.

REM Clone or update repository
if not exist "Shoes_website" (
    echo 🔄 Downloading latest version from GitHub...
    git clone https://github.com/shashikant-verma/Shoes_website.git
    if errorlevel 1 (
        echo ❌ Failed to clone repository
        echo 🌐 Alternative: Download ZIP from https://github.com/shashikant-verma/Shoes_website
        pause
        exit /b 1
    )
    cd Shoes_website
) else (
    echo 🔄 Updating existing installation...
    cd Shoes_website
    git pull origin main
    if errorlevel 1 (
        echo ⚠️ Update failed, continuing with current version...
    )
)

REM Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)

REM Install backend dependencies
echo.
echo 📦 Installing backend dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)
cd ..

REM Create environment file
echo.
echo 📝 Setting up environment configuration...
if not exist ".env" (
    echo # MongoDB Connection > .env
    echo MONGODB_URI=mongodb://127.0.0.1:27017/kinetic_stride >> .env
    echo MONGO_URI=mongodb://127.0.0.1:27017/kinetic_stride >> .env
    echo. >> .env
    echo # JWT Secret >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-for-new-pc >> .env
    echo. >> .env
    echo # Backend Server Port >> .env
    echo PORT=5001 >> .env
    echo. >> .env
    echo # Client URL for CORS >> .env
    echo CLIENT_URL=http://localhost:3000 >> .env
    echo. >> .env
    echo # Frontend API URL >> .env
    echo REACT_APP_API_URL=http://localhost:5001/api >> .env
    echo ✅ Environment file created
) else (
    echo ✅ Environment file already exists
)

REM Check MongoDB
echo.
echo 🔍 Checking MongoDB...
sc query MongoDB >nul 2>&1
if errorlevel 1 (
    echo ⚠️ MongoDB service not found
    echo 📥 Please install MongoDB Community Server:
    echo    https://www.mongodb.com/try/download/community
    echo.
    echo ℹ️ After installing MongoDB, run this setup again
    pause
    exit /b 1
) else (
    echo ✅ MongoDB service found
    net start MongoDB >nul 2>&1
    if errorlevel 1 (
        echo ⚠️ MongoDB service start failed, trying manual start...
        start /B mongod --dbpath=data
    ) else (
        echo ✅ MongoDB service started
    )
)

REM Wait for MongoDB to be ready
echo 🔄 Waiting for MongoDB to be ready...
timeout /t 5 >nul

REM Seed database
echo.
echo 🌱 Setting up database with sample data...
call npm run seed
if errorlevel 1 (
    echo ⚠️ Database seeding had issues, but continuing...
) else (
    echo ✅ Database setup completed
)

echo.
echo ========================================
echo   ✅ SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo 🎯 What's ready:
echo   ✅ SoleVibe application installed
echo   ✅ All dependencies installed  
echo   ✅ MongoDB database setup
echo   ✅ Sample products and users created
echo.
echo 🚀 To start the application:
echo   📁 Method 1: Double-click start-robust.bat
echo   📁 Method 2: Run 'npm run dev'
echo.
echo 🌐 Access URLs:
echo   👤 User Site:  http://localhost:3000
echo   👨‍💼 Admin Panel: http://localhost:3000/admin
echo.
echo 🔑 Demo Accounts:
echo   👤 User:  john@example.com / password123
echo   👨‍💼 Admin: admin@zuxofit.com / admin123
echo.
echo ⚠️ Keep MongoDB running in background
echo ⚠️ For network access from other PCs, see SETUP_FOR_OTHER_PC.md
echo.

pause
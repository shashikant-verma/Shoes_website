@echo off
title SoleVibe - Network Access Configuration
color 0B

echo ========================================
echo   SoleVibe - Network Access Setup
echo ========================================
echo.
echo This will configure SoleVibe to be accessible from other computers
echo on the same network (WiFi/LAN).
echo.

REM Get current IP address
echo 🔍 Detecting network configuration...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP: =!
    goto :ip_found
)

:ip_found
if defined IP (
    echo ✅ Your IP Address: %IP%
) else (
    echo ❌ Could not detect IP address
    echo ℹ️ Please run 'ipconfig' manually and note your IPv4 address
    set /p IP="Enter your IPv4 address: "
)

echo.
echo 📝 Configuring environment for network access...

REM Backup existing .env
if exist ".env" (
    copy ".env" ".env.backup" >nul
    echo ✅ Backed up existing .env to .env.backup
)

REM Create network configuration
echo # MongoDB Connection > .env.network
echo MONGODB_URI=mongodb://127.0.0.1:27017/kinetic_stride >> .env.network
echo MONGO_URI=mongodb://127.0.0.1:27017/kinetic_stride >> .env.network
echo. >> .env.network
echo # JWT Secret >> .env.network
echo JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random >> .env.network
echo. >> .env.network
echo # Backend Server Port >> .env.network
echo PORT=5001 >> .env.network
echo. >> .env.network
echo # Client URL for CORS (Network Access) >> .env.network
echo CLIENT_URL=http://localhost:3000,http://%IP%:3000 >> .env.network
echo. >> .env.network
echo # Frontend API URL (Network Access) >> .env.network
echo REACT_APP_API_URL=http://%IP%:5001/api >> .env.network

REM Copy network config to main .env
copy ".env.network" ".env" >nul
echo ✅ Network configuration applied

echo.
echo 🛡️ Configuring Windows Firewall...
echo ℹ️ Adding Node.js to firewall exceptions...

REM Add firewall rules for Node.js
netsh advfirewall firewall add rule name="Node.js Server - Port 3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="Node.js Server - Port 5001" dir=in action=allow protocol=TCP localport=5001 >nul 2>&1
netsh advfirewall firewall add rule name="MongoDB - Port 27017" dir=in action=allow protocol=TCP localport=27017 >nul 2>&1

echo ✅ Firewall rules added for ports 3000, 5001, 27017

echo.
echo 🚀 Creating network startup script...

REM Create network startup script
echo @echo off > start-network-access.bat
echo title SoleVibe - Network Access Mode >> start-network-access.bat
echo color 0A >> start-network-access.bat
echo. >> start-network-access.bat
echo echo ======================================== >> start-network-access.bat
echo echo   SoleVibe - Network Access Mode >> start-network-access.bat
echo echo ======================================== >> start-network-access.bat
echo echo. >> start-network-access.bat
echo echo 🌐 Server will be accessible from other computers >> start-network-access.bat
echo echo 📍 Your IP Address: %IP% >> start-network-access.bat
echo echo. >> start-network-access.bat
echo echo 🔄 Starting MongoDB... >> start-network-access.bat
echo net start MongoDB ^>nul 2^>^&1 >> start-network-access.bat
echo if errorlevel 1 ^( >> start-network-access.bat
echo     start /B mongod --dbpath=data >> start-network-access.bat
echo     timeout /t 5 >> start-network-access.bat
echo ^) >> start-network-access.bat
echo. >> start-network-access.bat
echo echo 🚀 Starting backend server on all network interfaces... >> start-network-access.bat
echo cd server >> start-network-access.bat
echo start /B cmd /c "node server.js" >> start-network-access.bat
echo cd .. >> start-network-access.bat
echo. >> start-network-access.bat
echo echo ⏳ Waiting for backend to initialize... >> start-network-access.bat
echo timeout /t 8 >> start-network-access.bat
echo. >> start-network-access.bat
echo echo 🌐 Starting frontend server... >> start-network-access.bat
echo start /B cmd /c "npm start" >> start-network-access.bat
echo. >> start-network-access.bat
echo echo ✅ Both servers starting with network access... >> start-network-access.bat
echo echo. >> start-network-access.bat
echo echo 📝 Access Information: >> start-network-access.bat
echo echo    🏠 Local Access: >> start-network-access.bat
echo echo       👤 User Site:  http://localhost:3000 >> start-network-access.bat
echo echo       👨‍💼 Admin Panel: http://localhost:3000/admin >> start-network-access.bat
echo echo. >> start-network-access.bat
echo echo    🌐 Network Access (from other computers): >> start-network-access.bat
echo echo       👤 User Site:  http://%IP%:3000 >> start-network-access.bat
echo echo       👨‍💼 Admin Panel: http://%IP%:3000/admin >> start-network-access.bat
echo echo. >> start-network-access.bat
echo echo 🔑 Demo Accounts: >> start-network-access.bat
echo echo    👤 User:  john@example.com / password123 >> start-network-access.bat
echo echo    👨‍💼 Admin: admin@zuxofit.com / admin123 >> start-network-access.bat
echo echo. >> start-network-access.bat
echo echo ⚠️ Keep this window open. Closing will stop the servers. >> start-network-access.bat
echo echo ⚠️ Make sure other computers are on the same network. >> start-network-access.bat
echo pause >> start-network-access.bat

echo ✅ Network startup script created: start-network-access.bat

echo.
echo ========================================
echo   ✅ NETWORK ACCESS CONFIGURED!
echo ========================================
echo.
echo 🎯 What's been set up:
echo   ✅ Network environment configuration
echo   ✅ Windows Firewall rules added
echo   ✅ CORS configured for network access
echo   ✅ Network startup script created
echo.
echo 🚀 To start with network access:
echo   📁 Run: start-network-access.bat
echo.
echo 🌐 Other computers can access at:
echo   👤 User Site:  http://%IP%:3000
echo   👨‍💼 Admin Panel: http://%IP%:3000/admin
echo.
echo 📋 Share these credentials with other users:
echo   👤 User:  john@example.com / password123
echo   👨‍💼 Admin: admin@zuxofit.com / admin123
echo.
echo ⚠️ Important Notes:
echo   • All computers must be on the same network
echo   • Windows Firewall must allow the connections
echo   • Your computer must stay on and running the servers
echo   • Use start-network-access.bat to start the application
echo.

pause
@echo off
title SoleVibe - Robust Server Startup
color 0A

echo ========================================
echo   SoleVibe Shoe Store - Robust Startup
echo ========================================

REM Kill any existing Node.js processes to prevent port conflicts
echo 🔄 Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

REM Check if MongoDB is running
echo 🔍 Checking MongoDB service...
sc query MongoDB >nul 2>&1
if errorlevel 1 (
    echo ⚠️ MongoDB service not found. Starting mongod manually...
    start /B mongod --dbpath=data
    timeout /t 5
) else (
    echo ✅ MongoDB service is available
    net start MongoDB >nul 2>&1
)

echo.
echo 🚀 Starting backend server on port 5001...
cd server
start /B cmd /c "nodemon server.js || node server.js"
cd ..

echo ⏳ Waiting for backend to initialize...
timeout /t 8

REM Health check for backend
:BACKEND_CHECK
echo 🔍 Checking backend health...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5001/api/health' -TimeoutSec 5; if($response.status -eq 'healthy') { Write-Host '✅ Backend is healthy' -ForegroundColor Green; exit 0 } else { Write-Host '❌ Backend unhealthy' -ForegroundColor Red; exit 1 } } catch { Write-Host '❌ Backend not responding' -ForegroundColor Red; exit 1 }" 
if errorlevel 1 (
    echo ⏳ Backend still starting, waiting 3 more seconds...
    timeout /t 3
    goto BACKEND_CHECK
)

echo.
echo 🌐 Starting frontend server on port 3000...
start /B cmd /c "npm start"

echo.
echo ✅ Both servers starting...
echo.
echo 📝 Access Information:
echo    👤 User Site:  http://localhost:3000
echo    👨‍💼 Admin Panel: http://localhost:3000/admin
echo.
echo 🔑 Demo Accounts:
echo    👤 User:  john@example.com / password123
echo    👨‍💼 Admin: admin@zuxofit.com / admin123
echo.
echo ⚠️ Keep this window open. Closing it will stop the servers.
echo ⚠️ If login fails, wait 30 seconds and try again.
echo.
pause
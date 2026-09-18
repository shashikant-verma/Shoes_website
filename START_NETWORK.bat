@echo off
title KINETIC STRIDE - Network Setup
color 0A
echo.
echo =========================================
echo     KINETIC // STRIDE NETWORK SETUP
echo =========================================
echo.
echo This will start the website for:
echo - Your computer: http://localhost:3000
echo - Other PCs: http://192.168.29.21:3000
echo.
pause

REM Clean start - kill all Node processes
echo Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2

REM Start backend API server on port 5001
echo.
echo Starting Backend API Server (Port 5001)...
start "SoleVibe API" cmd /k "title SoleVibe API Server && cd server && node server.js"
timeout /t 5

REM Start frontend with network API configuration
echo.
echo Starting Frontend for Network Access...
echo API will connect to: http://192.168.29.21:5001/api
echo.

REM Set environment for network access
set REACT_APP_API_URL=http://192.168.29.21:5001/api

REM Start React development server
npm start

pause
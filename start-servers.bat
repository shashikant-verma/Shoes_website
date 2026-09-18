@echo off
echo.
echo ================================
echo    KINETIC // STRIDE SERVERS
echo ================================
echo.

REM Kill any existing Node processes to prevent conflicts
taskkill /F /IM node.exe 2>nul

echo Starting MongoDB...
REM MongoDB should already be running as a service

echo.
echo Starting Backend API Server (Port 5001)...
start "Backend Server" cmd /k "cd server && node server.js"

REM Wait for backend to start
timeout /t 5

echo.
echo Starting Frontend React App (Port 3000)...
REM Clear PORT variable so React uses default 3000
set PORT=
npm start

echo.
echo ================================
echo    SERVERS STARTED
echo ================================
echo Backend API: http://localhost:5001/api
echo Frontend:   http://localhost:3000
echo Health:     http://localhost:5001/api/health
echo ================================
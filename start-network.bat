@echo off
echo Starting SoleVibe Shoes Website (Network Access)
echo ================================================

REM Kill any existing Node processes
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Copy network environment file
copy .env.network .env.local >nul

REM Set network environment
set NODE_ENV=development

REM Start backend server
echo Starting backend server on port 5001...
start "Backend Server" cmd /c "cd server && node server.js"

REM Wait for backend to start
echo Waiting for backend server to start...
timeout /t 5 /nobreak >nul

REM Start frontend with network host
echo Starting frontend on port 3000 (network accessible)...
start "Frontend" cmd /c "set HOST=0.0.0.0 && npm start"

echo ================================================
echo Both servers are starting...
echo Backend: http://192.168.29.21:5001/api/health
echo Frontend: http://192.168.29.21:3000
echo ================================================
pause
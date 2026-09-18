@echo off
echo Starting SoleVibe Shoes Website (Local Development)
echo ================================================

REM Kill any existing Node processes
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Set local environment
set NODE_ENV=development

REM Start backend server
echo Starting backend server on port 5001...
start "Backend Server" cmd /c "cd server && node server.js"

REM Wait for backend to start
echo Waiting for backend server to start...
timeout /t 5 /nobreak >nul

REM Start frontend
echo Starting frontend on port 3000...
start "Frontend" cmd /c "npm start"

echo ================================================
echo Both servers are starting...
echo Backend: http://localhost:5001/api/health
echo Frontend: http://localhost:3000
echo ================================================
pause
@echo off
echo Starting SoleVibe for Network Access...
echo.

echo Starting Backend Server...
start /B cmd /c "cd server && node server.js"
timeout /t 3

echo Starting Frontend Server...
set PORT=3002
set REACT_APP_API_URL=http://192.168.29.21:5000/api
npm start

echo.
echo ===================================
echo Backend: http://192.168.29.21:5000
echo Frontend: http://192.168.29.21:3002
echo ===================================
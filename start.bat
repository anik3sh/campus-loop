@echo off
echo.
echo  Campus Loop - Starting...
echo.

echo Starting backend (port 5000)...
start "Campus Loop API" cmd /k "cd /d %~dp0server && node node_modules/tsx/dist/cli.mjs src/index.ts"

timeout /t 3 /nobreak >nul

echo Starting frontend (port 5173)...
start "Campus Loop App" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo  App:   http://localhost:5173
echo  API:   http://localhost:5000/api/health
echo.
echo  Login: aryan@student.in / pass123
echo  Admin: admin@campusloop.in / admin123
echo.

start http://localhost:5173
echo Done! Press any key to exit this window.
pause >nul

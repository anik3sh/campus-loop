@echo off
title Campus Loop - Phone Link
echo.
echo ===================================================
echo     Campus Loop - Generating Link for Phone
echo ===================================================
echo.
echo Connecting tunnel to http://localhost:5173 ...
echo.
echo Your phone link will appear below in 3 seconds.
echo Open that https://... link in your phone browser!
echo.
echo (Keep this window open while using on your phone)
echo ===================================================
echo.

if exist "%~dp0cloudflared.exe" (
  "%~dp0cloudflared.exe" tunnel --url http://localhost:5173
) else if exist "%~dp0..\cloudflared.exe" (
  "%~dp0..\cloudflared.exe" tunnel --url http://localhost:5173
) else (
  echo cloudflared.exe not found. Downloading...
  powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0..\cloudflared.exe' -UseBasicParsing"
  "%~dp0..\cloudflared.exe" tunnel --url http://localhost:5173
)
pause

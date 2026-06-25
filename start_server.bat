@echo off
title Harish K Raju Portfolio — Local Server
echo.
echo  ============================================
echo   Harish K Raju Portfolio -- Local Server
echo  ============================================
echo.
echo  Starting server on http://127.0.0.1:8080
echo  Your browser will open automatically.
echo  Close this window or Ctrl+C to stop.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause

@echo off
cd /d "%~dp0"
echo Starting Project Nexus...
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Launching Server...
start http://localhost:3000
node server.js
pause

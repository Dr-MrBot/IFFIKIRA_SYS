@echo off
setlocal enabledelayedexpansion

echo =================================================
echo        IFFIKIRA_SYS - UNIFIED STARTUP
echo =================================================
echo.

:: Check for .env
if not exist .env (
    echo [!] ERROR: .env file not found. 
    echo Please run IFFIKIRA_SETUP.bat first or create a .env file!
    pause
    exit /b
)

:: Run Backend Server
echo [*] Starting Node.js Backend...
start "IFFIKIRA_BACKEND" cmd /k "npm run dev || pause"

:: Run Python Bridge
echo [*] Starting Python Local Bridge on port 5000...
start "IFFIKIRA_BRIDGE" cmd /k "python local_bridge.py || pause"



@echo off
setlocal enabledelayedexpansion

echo #################################################
echo #         IFFIKIRA_SYS - WINDOWS SETUP          #
echo #################################################
echo.

:: 1. Check for .env file
if not exist .env (
    echo [!] .env file missing. Creating one now...
    echo GEMINI_API_KEY=PASTE_YOUR_API_KEY_HERE > .env
    echo NODE_ENV=development >> .env
    echo [OK] Created .env file. Open it in Notchpad and paste your Gemini API Key!
    pause
) else (
    echo [OK] .env file found.
)

:: 2. Install Node.js Dependencies
echo.
echo [1/3] Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [!] NPM Install failed. Make sure Node.js is installed!
    pause
    exit /b
)

:: 3. Install Python Dependencies
echo.
echo [2/3] Installing Python dependencies...
python -m pip install flask flask-cors pyautogui screen-brightness-control
if %ERRORLEVEL% NEQ 0 (
    echo [!] Python install failed. Make sure Python is installed and added to PATH!
    pause
    exit /b
)

:: 4. Start Instructions
echo.
echo [3/3] SETUP COMPLETE!
echo #################################################
echo.
echo To start IFFIKIRA:
echo 1. Open Terminal 1: npm run dev
echo 2. Open Terminal 2: python local_bridge.py
echo.
echo Visiting: http://localhost:3000
echo #################################################
pause

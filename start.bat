@echo off
cd /d "%~dp0"
chcp 65001 >nul 2>nul

echo [冶金配料] Starting...
echo.

echo [1/3] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python.
    pause
    exit /b 1
)

echo [2/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js not found. Please install Node.js.
    pause
    exit /b 1
)

echo [3/3] Starting app...
echo.

start /d "%~dp0" "冶金配料" cmd /k "npm run dev"

pause

@echo off
title Infinite Atelier Launcher
cd /d "%~dp0web"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH. Please install Node.js first.
    pause
    exit /b 1
)

if not exist "node_modules\vite\package.json" (
    echo [1/2] Installing dependencies, this may take a few minutes...
    call npm install --legacy-peer-deps --no-audit --no-fund
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check your network and retry.
        pause
        exit /b 1
    )
)

echo [2/2] Starting dev server at http://localhost:3000 ...
start "" cmd /c "ping 127.0.0.1 -n 7 >nul & start http://localhost:3000"
call npm run dev

pause

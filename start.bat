@echo off
setlocal
title Infinite Atelier Launcher
cd /d "%~dp0web"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH. Please install Node.js first.
    pause
    exit /b 1
)

set "NEEDS_INSTALL=0"
if not exist "node_modules\vite\package.json" set "NEEDS_INSTALL=1"
if not exist "node_modules\@rollup\rollup-win32-x64-msvc\package.json" set "NEEDS_INSTALL=1"
if not exist "node_modules\@tailwindcss\oxide-win32-x64-msvc\package.json" set "NEEDS_INSTALL=1"
if not exist "node_modules\@esbuild\win32-x64\package.json" set "NEEDS_INSTALL=1"
if not exist "node_modules\lightningcss-win32-x64-msvc\package.json" set "NEEDS_INSTALL=1"

if "%NEEDS_INSTALL%"=="0" (
    node -e "require('rollup'); require('@tailwindcss/oxide'); require('esbuild'); require('lightningcss')" >nul 2>nul
    if errorlevel 1 set "NEEDS_INSTALL=1"
)

if "%NEEDS_INSTALL%"=="1" (
    echo [1/2] Installing dependencies, this may take a few minutes...
    call npm install --legacy-peer-deps --include=optional --no-audit --no-fund
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check your network and retry.
        pause
        exit /b 1
    )

    node -e "require('rollup'); require('@tailwindcss/oxide'); require('esbuild'); require('lightningcss')" >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] A required Windows native module is still unavailable.
        echo Run this command in the web folder and retry:
        echo npm install --include=optional --legacy-peer-deps
        pause
        exit /b 1
    )
)

echo [2/2] Starting dev server at http://localhost:3000 ...
start "" cmd /c "ping 127.0.0.1 -n 7 >nul & start http://localhost:3000"
call npm run dev

pause

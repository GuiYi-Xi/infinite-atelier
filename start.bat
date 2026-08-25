@echo off
setlocal
title Infinite Atelier Launcher
cd /d "%~dp0web"

set "NODE_EXE="
set "NODE_DIR="
where node >nul 2>nul
if not errorlevel 1 set "NODE_EXE=node.exe"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
    set "NODE_DIR=%ProgramFiles%\nodejs"
)
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" (
    set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
    set "NODE_DIR=%LocalAppData%\Programs\nodejs"
)

if not defined NODE_EXE (
    echo [ERROR] Node.js is required to run Infinite Atelier.
    echo [ERROR] 未检测到 Node.js。请先安装 Node.js LTS：
    echo         https://nodejs.org/en/download
    echo.
    echo The download page will open now. After installation, close this window and run start.bat again.
    start "" "https://nodejs.org/en/download"
    pause
    exit /b 1
)

if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"
"%NODE_EXE%" --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was found but could not be started.
    echo Please reinstall Node.js LTS from https://nodejs.org/en/download
    pause
    exit /b 1
)
echo [INFO] Using Node.js: %NODE_EXE%

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

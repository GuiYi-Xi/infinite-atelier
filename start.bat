@echo off
setlocal
title Infinite Atelier Launcher

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-windows.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo Infinite Atelier did not start. See the message above.
    pause
)

exit /b %EXIT_CODE%

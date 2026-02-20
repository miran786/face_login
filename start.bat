@echo off
title Face ID Transaction - Starting...
color 0A

echo.
echo  ============================================
echo    Face ID Transaction Website - Quick Start
echo  ============================================
echo.

:: Check if Docker is available
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Docker not found. Please install Docker Desktop:
    echo      https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

:: Check if Node.js is available
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!] Node.js not found. Please install Node.js:
    echo      https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo  [1/4] Starting Backend (Docker)...
echo.
cd /d "%~dp0backend"
start "Face-Backend" cmd /c "docker compose up --build"

echo  [2/4] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo  [3/4] Installing frontend dependencies...
cd /d "%~dp0"
if not exist "node_modules" (
    call npm install
) else (
    echo        Already installed, skipping...
)

echo.
echo  [4/4] Starting Frontend...
echo.
echo  ============================================
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:5173
echo  ============================================
echo.
echo  Press Ctrl+C to stop the frontend.
echo  Close the "Face-Backend" window to stop the backend.
echo.

npm run dev

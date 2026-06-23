@echo off
setlocal EnableDelayedExpansion
title AI Interview Platform - Launcher
cd /d "%~dp0"

echo.
echo  ============================================
echo    AI Interview Platform - Starting...
echo  ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org
    pause
    exit /b 1
)

:: Create .env files if missing
if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul
if not exist "frontend\.env" copy "frontend\.env.example" "frontend\.env" >nul
if not exist "ai-service\.env" copy "ai-service\.env.example" "ai-service\.env" >nul

:: Install dependencies if needed
echo [1/6] Installing backend dependencies...
cd backend && call npm install && cd ..

if not exist "frontend\node_modules" (
    echo [2/6] Installing frontend dependencies...
    cd frontend && call npm install && cd ..
) else (
    echo [2/6] Frontend dependencies OK
)

echo [3/6] Installing AI service dependencies...
cd ai-service && pip install -r requirements.txt -q && cd ..

:: Start MongoDB
echo [4/6] Starting MongoDB...
where docker >nul 2>&1
if errorlevel 1 (
    echo [WARN] Docker not found. Backend needs MongoDB at localhost:27017
    echo        Install Docker Desktop OR set MONGODB_URI in backend\.env to MongoDB Atlas
) else (
    docker-compose up -d 2>nul
    if errorlevel 1 (
        echo [WARN] Docker compose failed. Is Docker Desktop running?
    ) else (
        echo        MongoDB container started
        timeout /t 3 /nobreak >nul
    )
)

:: Seed database (safe to re-run)
echo [5/6] Seeding database...
cd backend
call npm run seed 2>nul
cd ..

:: Start services
echo [6/6] Starting services...
echo.
start "AI Interview - Backend :5000" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul
start "AI Interview - AI Service :8000" cmd /k "cd /d "%~dp0ai-service" && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul
start "AI Interview - Frontend :5173" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  ============================================
echo    Services starting in separate windows:
echo.
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:5000/api/v1/health
echo    AI Service: http://localhost:8000/health
echo.
echo    Demo login:
echo    Email:    alice@example.com
echo    Password: Password123!
echo  ============================================
echo.
echo  Wait 10-15 seconds, then opening browser...
timeout /t 12 /nobreak >nul
start http://localhost:5173
echo.
pause

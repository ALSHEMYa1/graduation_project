@echo off
title SSA Services Launcher
echo ========================================
echo   تشغيل جميع الخدمات
echo ========================================
echo.

echo [1/3] Starting AI Service on port 5000...
start "SSA - AI Service" cmd /c "cd /d "%~dp0ai_service" && venv\Scripts\python.exe -m uvicorn main:app --port 5000"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Backend on port 8000...
start "SSA - Backend" cmd /c "cd /d "%~dp0backend_service" && ..\.venv\Scripts\python.exe -m uvicorn app:app --port 8000"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend on port 3000...
start "SSA - Frontend" cmd /c "cd /d "%~dp0frontend_service" && npm run dev"

echo.
echo ========================================
echo   All services started!
echo   AI:       http://localhost:5000
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause >nul

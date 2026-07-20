@echo off
cd /d "%~dp0frontend_service"
echo Starting Frontend on port 3000...
npm run dev
pause

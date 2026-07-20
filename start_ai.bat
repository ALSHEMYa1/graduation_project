@echo off
cd /d "%~dp0ai_service"
echo Starting AI Service on port 5000...
venv\Scripts\python.exe -m uvicorn main:app --port 5000
pause

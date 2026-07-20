@echo off
cd /d "%~dp0backend_service"
echo Starting Backend on port 8000...
..\.venv\Scripts\python.exe -m uvicorn app:app --port 8000
pause

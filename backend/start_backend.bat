@echo off
echo Starting Boiler Digital Twin Backend...
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
pause

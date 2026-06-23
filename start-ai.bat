@echo off
cd /d "%~dp0ai-service"
if not exist .env copy .env.example .env
pip install -r requirements.txt -q
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

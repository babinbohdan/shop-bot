@echo off
title 🌐 API SERVER :8000
cd /d C:\shop_bot
echo ===========================
echo   API SERVER  (port 8000)
echo ===========================
uvicorn api.main:app --host 0.0.0.0 --port 8000
pause

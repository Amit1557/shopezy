@echo off
title ShopEzy Backend Server
cd /d "%~dp0backend"
echo ========================================================
echo   Starting ShopEzy FastAPI Backend Server...
echo   URL: http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo ========================================================
python run.py
pause


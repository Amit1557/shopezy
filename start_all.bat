@echo off
title ShopEzy E-Commerce Reselling Platform
echo Starting Backend in a new window...
start "ShopEzy Backend Server" "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
echo Starting Frontend in a new window...
start "ShopEzy Frontend Server" "%~dp0start_frontend.bat"
echo ========================================================
echo   ShopEzy is now starting up!
echo   Customer Store: http://localhost:5173
echo   Admin Dashboard: http://localhost:5173/admin/login
echo   Backend API: http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause


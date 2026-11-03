@echo off
title ShopEzy Frontend Dev Server
cd /d "%~dp0frontend"
echo ========================================================
echo   Starting ShopEzy React + Vite Storefront...
echo   URL: http://localhost:5173
echo   Admin Panel: http://localhost:5173/admin/login
echo ========================================================
npm run dev
pause


@echo off
chcp 65001 >nul
echo ========================================
echo   课程论文智能写作与润色系统 - 前端启动
echo ========================================
echo.
echo [*] 正在启动前端开发服务器...
echo.

cd /d "%~dp0frontend\paper-writer-app"
npm run dev

pause

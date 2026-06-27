@echo off
chcp 65001 >nul
echo ========================================
echo   课程论文智能写作与润色系统
echo   正在一键启动前后端...
echo ========================================
echo.

REM 启动后端（新窗口）
echo [1/2] 启动后端 FastAPI 服务...
start "后端 - FastAPI" cmd /k "cd /d %~dp0backend && python main.py"

REM 稍等后端先起来
timeout /t 2 /nobreak >nul

REM 启动前端（新窗口）
echo [2/2] 启动前端 Vite 开发服务器...
start "前端 - Vite" cmd /k "cd /d %~dp0frontend\paper-writer-app && npm run dev"

echo.
echo ========================================
echo   启动完成！
echo   后端：http://localhost:8000
echo   前端：http://localhost:5173
echo ========================================
echo.
echo 关闭窗口时，请分别关闭"后端"和"前端"两个窗口。
pause



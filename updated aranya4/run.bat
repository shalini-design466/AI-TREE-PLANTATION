@echo off
title AranyaAI - single server (frontend + backend)
cd /d "%~dp0backend\aranyai_backend"

if not exist venv\Scripts\python.exe (
    echo Creating virtual environment - first run only...
    python -m venv venv
    if errorlevel 1 ( echo Python 3.10+ is required. Install it from https://www.python.org and try again. & pause & exit /b 1 )
)
call venv\Scripts\activate.bat
if not exist venv\.deps_installed (
    echo Installing requirements - first run only, this can take a few minutes...
    python -m pip install --upgrade pip >nul
    pip install -r requirements.txt
    if errorlevel 1 ( echo Install failed. & pause & exit /b 1 )
    echo ok> venv\.deps_installed
)

echo.
echo ==================================================================
echo   AranyaAI is starting. Open this link ^(Ctrl+Click in Windows Terminal^):
echo.
echo        http://127.0.0.1:8000
echo.
echo   Press CTRL+C in this window to stop the server.
echo ==================================================================
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://127.0.0.1:8000"
uvicorn main:app --host 127.0.0.1 --port 8000
pause

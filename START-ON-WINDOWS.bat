@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js 22 LTS, reopen this window, and try again.
  pause
  exit /b 1
)
echo Installing dependencies if needed...
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    echo Installation failed. Check your internet connection and npm setup.
    pause
    exit /b 1
  )
)
echo Starting CrayCycle...
echo Open the localhost URL printed below in Chrome.
call npm run dev
pause

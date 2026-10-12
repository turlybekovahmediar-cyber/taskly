@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [Taskly] Node.js is not installed. Download it from https://nodejs.org
  pause
  exit /b 1
)

if not exist "backend\.env" (
  echo [Taskly] File backend\.env not found. Copy backend\.env.example to backend\.env and set DATABASE_URL.
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo [Taskly] Installing frontend packages...
  call npm install --prefix frontend
)
if not exist "backend\node_modules" (
  echo [Taskly] Installing backend packages...
  call npm install --prefix backend
)

echo [Taskly] Building the site...
call npm run build --prefix frontend
if errorlevel 1 (
  echo [Taskly] Build failed, see the messages above.
  pause
  exit /b 1
)

echo [Taskly] Starting the server. Open http://localhost:3000 . Do not close this window.
start "" "http://localhost:3000"
call npm start --prefix backend
pause

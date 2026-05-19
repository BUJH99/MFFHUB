@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\" (
  echo [MFF Data Hub] Dependencies are not installed.
  echo Run INSTALL_DEPENDENCIES_WINDOWS.bat first.
  echo.
  pause
  exit /b 1
)

echo [MFF Data Hub] Starting development server...
call npm run dev
if errorlevel 1 (
  echo.
  echo [MFF Data Hub] Development server failed.
  pause
  exit /b 1
)

echo.
echo [MFF Data Hub] Development server stopped.
pause

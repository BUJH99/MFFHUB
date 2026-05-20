@echo off
setlocal
cd /d "%~dp0"

if "%MFF_DEV_HOST%"=="" set "MFF_DEV_HOST=127.0.0.1"
if "%MFF_DEV_PORT%"=="" set "MFF_DEV_PORT=3600"

if not exist "node_modules\" (
  echo [MFF Data Hub] Dependencies are not installed.
  echo Run INSTALL_DEPENDENCIES_WINDOWS.bat first.
  echo.
  pause
  exit /b 1
)

echo [MFF Data Hub] Starting development server...
echo [MFF Data Hub] URL: http://%MFF_DEV_HOST%:%MFF_DEV_PORT%
call npm run dev -w @mff-data-hub/web -- --hostname %MFF_DEV_HOST% -p %MFF_DEV_PORT%
if errorlevel 1 (
  echo.
  echo [MFF Data Hub] Development server failed.
  pause
  exit /b 1
)

echo.
echo [MFF Data Hub] Development server stopped.
pause

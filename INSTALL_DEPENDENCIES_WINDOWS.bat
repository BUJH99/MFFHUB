@echo off
setlocal
cd /d "%~dp0"

echo [MFF Data Hub] Installing dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo [MFF Data Hub] Dependency install failed.
  pause
  exit /b 1
)

echo.
echo [MFF Data Hub] Dependencies are ready.
echo You can now run START_DEV_WINDOWS.bat.
pause

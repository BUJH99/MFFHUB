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

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo [MFF Data Hub] ffmpeg was not found in PATH.
  echo Install ffmpeg before syncing new image assets.
  echo.
  pause
  exit /b 1
)

echo [MFF Data Hub] Syncing THANO$VIB$ data...
call npm run sync:thanosvibs
if errorlevel 1 (
  echo.
  echo [MFF Data Hub] THANO$VIB$ sync failed.
  pause
  exit /b 1
)

echo.
echo [MFF Data Hub] THANO$VIB$ sync completed.
pause

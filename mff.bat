@echo off
setlocal
cd /d "%~dp0"
call npm run hub -- %*
exit /b %ERRORLEVEL%

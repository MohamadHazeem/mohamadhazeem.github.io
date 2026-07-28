@echo off
rem ============================================================
rem  Mohamad Hazeem — Portfolio
rem  Double-click this file to run the site with the full
rem  experience (including the WebGL hero background).
rem ============================================================
cd /d "%~dp0"

set PY=python
where python >nul 2>nul
if errorlevel 1 set PY=py

start "Portfolio Server" /min %PY% -m http.server 4173 --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "http://localhost:4173"

echo.
echo  Portfolio is running at http://localhost:4173
echo  A minimized "Portfolio Server" window was opened -
echo  close that window when you are done.
echo.
pause

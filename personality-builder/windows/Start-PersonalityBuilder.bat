@echo off
setlocal
title Personality Builder Replica
cd /d "%~dp0.."

echo.
echo  Personality Builder Replica  -  Windows
echo  --------------------------------------
echo  Carpeta: %CD%
echo.

REM Prefer PowerShell HTTP server (no Python required)
where powershell >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  Iniciando con PowerShell...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-PersonalityBuilder.ps1"
  goto :eof
)

REM Fallback: Python if available
where py >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  Iniciando con Python ^(py^)...
  for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p=8765; while(Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue){$p++}; Write-Output $p"`) do set PORT=%%p
  if "%PORT%"=="" set PORT=8765
  start "" "http://127.0.0.1:%PORT%/"
  py -3 -m http.server %PORT%
  goto :eof
)

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  Iniciando con Python...
  set PORT=8765
  start "" "http://127.0.0.1:%PORT%/"
  python -m http.server %PORT%
  goto :eof
)

echo  No hay PowerShell/Python. Abriendo index.html en el navegador ^(modo archivo^).
start "" "%CD%\index.html"
echo.
pause

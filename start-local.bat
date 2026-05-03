@echo off
REM Holy Oly Local Development Launcher
REM Ejecuta el script PowerShell para iniciar backend y frontend

setlocal enabledelayedexpansion

REM Obtener directorio del script
set SCRIPT_DIR=%~dp0

REM Ejecutar PowerShell con el script
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '%SCRIPT_DIR%start-local.ps1'"

pause

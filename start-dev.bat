@echo off
REM Holy Oly - Desarrollo completo (Backend + Frontend + Wireframes)
title Holy Oly Dev

echo ================================
echo   HOLY OLY - DESARROLLO LOCAL
echo ================================
echo.

set ROOT=%~dp0

REM 1. Backend setup
echo [1/4] Configurando Backend...
cd /d "%ROOT%backend"
if not exist .venv (
    echo   Creando venv Python...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo   Instalando dependencias Python...
pip install -q -r requirements.txt

REM 2. Frontend setup
echo [2/4] Configurando Frontend...
cd /d "%ROOT%frontend"
if not exist node_modules (
    echo   Instalando paquetes npm...
    call npm install
)

REM 3. Iniciar Backend en nueva ventana
echo [3/4] Iniciando Backend en puerto 8080...
start "Holy Oly - Backend" cmd /k "cd /d %ROOT%backend && .venv\Scripts\activate.bat && uvicorn src.main:app --reload --host 0.0.0.0 --port 8080"

REM 4. Iniciar Frontend en nueva ventana
echo [4/4] Iniciando Frontend en puerto 5173...
start "Holy Oly - Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

REM 5. Abrir wireframes
timeout /t 3 /nobreak >nul
echo.
echo Abriendo pantallas wireframes...
start "" "%ROOT%wireframes\index.html"

echo.
echo ================================
echo   TODO LISTO!
echo ================================
echo.
echo   Backend:    http://localhost:8080
echo   Frontend:   http://localhost:5173
echo   Wireframes: Abierto en navegador
echo.
echo Cierra las ventanas Backend/Frontend para detener
echo.
pause

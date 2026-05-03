# Holy Oly Local Development Startup Script
# Ejecuta backend (FastAPI) y frontend (React/Vite) con un comando

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

Write-Host "🚀 Holy Oly - Local Development Setup" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Python
Write-Host "✓ Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python no encontrado. Instala Python 3.11+" -ForegroundColor Red
    exit 1
}

# 2. Verificar Node/npm
Write-Host "✓ Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  Node $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Instala Node 18+" -ForegroundColor Red
    exit 1
}

# 3. Setup Backend
Write-Host ""
Write-Host "📦 Configurando Backend..." -ForegroundColor Yellow
Set-Location $backendPath

if (-Not (Test-Path ".venv")) {
    Write-Host "  Creando venv..." -ForegroundColor Cyan
    python -m venv .venv
}

Write-Host "  Activando venv..." -ForegroundColor Cyan
& ".venv\Scripts\Activate.ps1"

Write-Host "  Instalando dependencias..." -ForegroundColor Cyan
pip install -q -r requirements.txt

# 4. Setup Frontend
Write-Host ""
Write-Host "📦 Configurando Frontend..." -ForegroundColor Yellow
Set-Location $frontendPath

if (-Not (Test-Path "node_modules")) {
    Write-Host "  Instalando npm packages..." -ForegroundColor Cyan
    npm install -q
}

# 5. Iniciar servicios en paralelo
Write-Host ""
Write-Host "🎯 Iniciando servicios..." -ForegroundColor Cyan
Write-Host ""

# Backend en background
Write-Host "  Backend → http://localhost:8080" -ForegroundColor Green
Set-Location $backendPath
Start-Process -NoNewWindow -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"& `.\.venv\Scripts\Activate.ps1`; uvicorn src.main:app --reload --host 0.0.0.0 --port 8080`""

# Frontend en otra terminal
Write-Host "  Frontend → http://localhost:5173" -ForegroundColor Green
Set-Location $frontendPath
Start-Process -NoNewWindow -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"npm run dev`""

Write-Host ""
Write-Host "✅ Servicios iniciados!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Wireframes: $scriptPath\wireframes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona CTRL+C en cualquier terminal para detener servicios" -ForegroundColor Yellow

# Abrir navegador automáticamente
Write-Host ""
Write-Host "🌐 Abriendo navegador..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✨ ¡Listo! Desarrolla en paz." -ForegroundColor Green
Read-Host "Presiona ENTER para mantener esta ventana abierta"

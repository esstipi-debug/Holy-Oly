# Holy Oly Local Development Startup Script

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"
$wireframesPath = Join-Path $scriptPath "wireframes" "index.html"

Write-Host "🚀 Holy Oly - Local Development" -ForegroundColor Cyan
Write-Host ""

# 1. Setup Backend
Write-Host "📦 Backend..." -ForegroundColor Yellow
Set-Location $backendPath
if (-Not (Test-Path ".venv")) {
    python -m venv .venv 2>$null
}
$env:PATH = ".\.venv\Scripts;$env:PATH"
pip install -q -r requirements.txt 2>$null

# 2. Setup Frontend
Write-Host "📦 Frontend..." -ForegroundColor Yellow
Set-Location $frontendPath
if (-Not (Test-Path "node_modules")) {
    npm install -q 2>$null
}

# 3. Iniciar Backend
Write-Host ""
Write-Host "▶ Iniciando Backend (puerto 8080)..." -ForegroundColor Green
Set-Location $backendPath
Start-Process -NoNewWindow powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$backendPath'; .\.venv\Scripts\activate.ps1; uvicorn src.main:app --reload --host 0.0.0.0 --port 8080`""

# 4. Iniciar Frontend
Write-Host "▶ Iniciando Frontend (puerto 5173)..." -ForegroundColor Green
Set-Location $frontendPath
Start-Process -NoNewWindow powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$frontendPath'; npm run dev`""

# 5. Abrir Wireframes (HTML)
Write-Host ""
Write-Host "📐 Abriendo Wireframes..." -ForegroundColor Green
Start-Sleep -Seconds 2
Invoke-Item $wireframesPath

Write-Host ""
Write-Host "✅ Todo iniciado:" -ForegroundColor Green
Write-Host "   • Backend API: http://localhost:8080" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • Wireframes: (abierto en navegador)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mantén las ventanas del terminal abiertas para continuar desarrollando" -ForegroundColor Yellow
Write-Host ""

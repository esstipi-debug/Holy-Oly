# Crear accesos directos en el escritorio para Holy Oly
# Ejecuta como Administrador

$desktopPath = [Environment]::GetFolderPath("Desktop")
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "📍 Creando accesos directos en el escritorio..." -ForegroundColor Cyan

# 1. Acceso directo para iniciar desarrollo
$startLink = Join-Path $desktopPath "🚀 Holy Oly Dev.lnk"
$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($startLink)
$shortcut.TargetPath = Join-Path $scriptDir "start-local.bat"
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Inicia Holy Oly: Backend API + Frontend"
$shortcut.IconLocation = "powershell.exe,0"
$shortcut.Save()
Write-Host "  ✓ 🚀 Holy Oly Dev.lnk" -ForegroundColor Green

# 2. Acceso directo a wireframes
$wireframesLink = Join-Path $desktopPath "📐 Wireframes Holy Oly.lnk"
$shortcut = $wshShell.CreateShortcut($wireframesLink)
$shortcut.TargetPath = Join-Path $scriptDir "wireframes"
$shortcut.Description = "Abre carpeta de wireframes y diseños"
$shortcut.IconLocation = "shell32.dll,3"
$shortcut.Save()
Write-Host "  ✓ 📐 Wireframes Holy Oly.lnk" -ForegroundColor Green

# 3. Acceso directo al repo
$repoLink = Join-Path $desktopPath "💻 Holy Oly Repo.lnk"
$shortcut = $wshShell.CreateShortcut($repoLink)
$shortcut.TargetPath = $scriptDir
$shortcut.Description = "Abre la carpeta del proyecto"
$shortcut.IconLocation = "shell32.dll,4"
$shortcut.Save()
Write-Host "  ✓ 💻 Holy Oly Repo.lnk" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Accesos directos creados en el escritorio:" -ForegroundColor Green
Write-Host "   🚀 Holy Oly Dev     → Inicia backend + frontend"
Write-Host "   📐 Wireframes       → Abre diseños y mockups"
Write-Host "   💻 Holy Oly Repo    → Abre carpeta del proyecto"
Write-Host ""
Write-Host "Ahora puedes hacer doble-click en cualquier acceso directo para empezar" -ForegroundColor Yellow

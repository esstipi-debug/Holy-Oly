# 🚀 Holy Oly - Desarrollo Local

Inicia backend (FastAPI) + frontend (React/Vite) con un solo comando.

## ⚡ Inicio Rápido

### Opción 1: Script automático (RECOMENDADO)

Haz doble-click en `start-local.bat`

```bash
start-local.bat
```

Esto automáticamente:
- Crea venv de Python
- Instala dependencias (pip + npm)
- Inicia backend en `http://localhost:8080`
- Inicia frontend en `http://localhost:5173`
- Abre navegador automáticamente

### Opción 2: Manual (desarrollo avanzado)

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8080
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📍 URLs

| Servicio | URL | Puerto |
|----------|-----|--------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:8080 | 8080 |
| API Docs | http://localhost:8080/docs | 8080 |
| Wireframes | `./wireframes` | - |

## 🎯 Accesos Directos en Escritorio

Ejecuta esto **una sola vez** como Administrador:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
.\setup-desktop-shortcuts.ps1
```

Esto crea 3 accesos directos en el escritorio:
- 🚀 **Holy Oly Dev** → Inicia desarrollo
- 📐 **Wireframes** → Abre diseños
- 💻 **Holy Oly Repo** → Abre proyecto

## 🔧 Requisitos

- **Python 3.11+**
- **Node.js 18+**
- **npm** (incluido con Node)

### Instalar requisitos (Windows)

```bash
# Python: https://www.python.org/downloads/
# Node.js: https://nodejs.org/

# O con winget:
winget install Python.Python.3.11
winget install OpenJS.NodeJS
```

## 📁 Estructura

```
Holy Oly/
├── backend/           # FastAPI API
│   ├── src/           # Código fuente
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/          # React + Vite
│   ├── src/           # Componentes React
│   └── package.json
├── wireframes/        # Diseños y mockups
├── start-local.bat    # 🚀 Ejecutable principal
└── start-local.ps1    # Script PowerShell
```

## 🐛 Troubleshooting

### "Python no encontrado"
```bash
# Verifica que Python está en PATH:
python --version

# Si no funciona, instala desde https://www.python.org/downloads/
```

### "npm command not found"
```bash
# Verifica Node.js:
node --version
npm --version

# Si no funciona, instala desde https://nodejs.org/
```

### "Port already in use"
Cambia los puertos en:
- Backend: `start-local.ps1` línea 55 (cambiar `--port 8080`)
- Frontend: `frontend/vite.config.ts` (agregar `server.port`)

### "Permission denied" (PowerShell)
```powershell
# Ejecuta como Administrador:
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
```

## 📊 Wireframes y Diseños

Acceso directo: `./wireframes/`

Contiene:
- Mockups de pantallas
- Diseños Figma/XD
- Especificaciones UI/UX

## 🚢 Deploy

Para deploy en Render:

```bash
git add .
git commit -m "feat: cambios locales"
git push origin main

# Render auto-deploya cuando merges a main
```

## 📝 Notas

- Backend hot-reload habilitado (cambios reflejan instantáneamente)
- Frontend hot-reload con Vite (muy rápido)
- Logs de ambos servicios en las terminales
- Presiona `CTRL+C` para detener servicios

---

**¿Problemas?** Revisa los logs en las terminales para errores específicos.

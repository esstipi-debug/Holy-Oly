# 🏋️ HolyOly — Smart Training Platform

**HolyOly** es una aplicación diseñada para administrar entrenamientos de **Halterofilia**. 

### 🎯 Propósito Principal
*   **Lado Coach:** Administrar múltiples atletas y sus sesiones de entrenamiento de manera eficiente.
*   **Lado Atleta:** Cuidar los niveles de fatiga y dimensionar el estrés del cuerpo para optimizar el rendimiento y evitar el burnout.

**Filosofía Core (Control de Daños):** Sabemos que nadie es perfecto y que la mayoría de los usuarios no son atletas profesionales. Quieren vivir una buena vida, equilibrada y disfrutarla. *Es por esto que los cuidamos*. Peak Qual no es un sistema punitivo ni culpa al atleta; su inteligencia artificial aplica un "control de daños" empático para recuperar al usuario y adaptar la prescripción cuando la vida (estrés, fiestas, cansancio) se entromete en el entrenamiento.

**Tagline:** *Smart training, zero burnout.*

---

## 🏋️ ¿Qué es la Halterofilia?

La **halterofilia** es el levantamiento olímpico de pesas: consiste en elevar el máximo peso posible con una barra y discos desde el suelo hasta por encima de la cabeza, con brazos extendidos, bajo reglas estrictas de la IWF (International Weightlifting Federation).

Es deporte olímpico desde 1896. Desarrolla fuerza, potencia, velocidad y coordinación. **No es powerlifting** (que se enfoca solo en squat, press banca y deadlift).

### Movimientos Principales
*   **Arrancada (Snatch):** Un solo movimiento fluido. Agarre ancho, tiro explosivo desde el suelo, drop rápido bajo la barra en squat overhead y extensión final. Es el movimiento más técnico (~80% del peso del dos tiempos).
*   **Dos tiempos (Clean & Jerk):** Se divide en dos fases.
    1.  **Cargada (Clean):** Agarre medio, subir barra a los hombros (rack position) en squat frontal y ponerse de pie.
    2.  **Envión (Jerk):** Impulso desde los hombros a overhead con un movimiento de dip y drive.

### Características del Entrenamiento
*   **Frecuencia:** Típicamente 3-5 días/semana.
*   **Foco:** Técnica, fuerza explosiva y movilidad.
*   **Prioridad:** Es fundamental contar con un coach para asegurar la técnica correcta y evitar lesiones.
*   **Esfuerzo:** Ambos movimientos priorizan el tren inferior (aprox. 70% del esfuerzo). Un error común es la falta de extensión completa de cadera en el tiro.

En competencia, cada atleta tiene 3 intentos por movimiento; se suma el mejor de cada uno para el total olímpico.

---

## 📊 Estado del Proyecto

| Métrica | Estado |
|---------|--------|
| **Fase** | 2 — Alta Fidelidad UI (Google Stitch) |
| **Pantallas** | Wireframes base Completos (21/27). Pantallas críticas UI desarrolladas en `stitch_holy_oly_saas/` |
| **Engines** | 21 especificados, listos para Fase 3 (Prisma/Node) |
| **Stack** | React + Vite + Tailwind (frontend) · Node.js + Express + Prisma (backend) |
| **BD** | PostgreSQL · ~60 modelos · 150+ queries |

---

## 🎯 Cómo Usar Este Repo

### Para nueva sesión / nuevo terminal:

```bash
# Clonar
git clone https://github.com/esstipi-debug/Holy-Oly.git
cd "Holy Oly 001"

# Ver memoria actual (contexto completo)
cat MEMORY.md

# Ver plan de trabajo
cat PLAN.md

# Abrir wireframes en navegador
cd wireframes && open index.html
```

### Estructura:
```
Holy Oly 001/
├── MEMORY.md                 ← Contexto actual (qué hicimos, dónde vamos)
├── PLAN.md                   ← Hoja de ruta detallada
├── INDEX.md                  ← Especificaciones de engines y modelos
├── wireframes/               ← HTML interactivos (21/27 completados)
│   ├── index.html           ← Navigator con status actual
│   ├── A1_A2_A3_auth.html   ← Auth flows (login, register, forgot pass)
│   ├── B1_dashboard_atleta.html
│   ├── B3_injury_shield.html
│   ├── B6_active_session.html
│   ├── B7_B8_victory_screen.html  ← 4 temas interactivos
│   ├── B9_social_card.html        ← Social card generator
│   ├── B10_performance_deep_dive.html
│   ├── B15_perfil_atleta.html
│   ├── C1_command_center_coach.html
│   ├── C4_athlete_deep_dive.html
│   ├── C5_C6_add_athlete_assign_macro.html
│   ├── D1_onboarding_atleta.html
│   └── D2_free_premium_transition.html
├── engines/                  ← Especificaciones de los 21 motores
├── exercises/                ← Base de 49 ejercicios + sustituciones
├── macrocycles/              ← 19 programas de 9 escuelas
└── ux/                       ← Documentos UX completos
```

---

## 🚀 Workflow de Desarrollo

### 1. **Antes de empezar sesión:**
```bash
git pull                    # Sincronizar memoria
cat MEMORY.md               # Leer dónde nos quedamos
cat PLAN.md                 # Ver próximos pasos
```

### 2. **Durante sesión:**
- Construir wireframes → Actualizar `wireframes/index.html`
- Tomar decisiones → Anotar en MEMORY.md
- Completar hitos → Commit incremental

### 3. **Al terminar sesión:**
```bash
# MEMORY.md se actualiza automáticamente con:
# - Pantallas completadas hoy
# - Próximas 3 pantallas a hacer
# - Decisiones y cambios de scope
# - Enlace a wireframes nuevos

git add .
git commit -m "Fase 1: 21/27 wireframes · [descripción]"
git push
```

---

## 🔧 Tech Stack Confirmado

| Capa | Tech | Notas |
|------|------|-------|
| Frontend | React 18 + Vite + Tailwind CSS | SPA, 369KB JS gzip |
| State | React Context API | Sin Redux por ahora |
| Backend | Node.js + Express | Monolítico async/await |
| ORM | Prisma (schema-first) | ~60 modelos |
| DB | PostgreSQL | 150+ query patterns |
| Auth | JWT + refresh rotation | bcryptjs, 3 roles |
| Jobs | Cron jobs | 4 schedules: 5m/1h/24h/semanal |
| Cache | Tablas DB (no Redis) | Readiness O(90)→O(1) |

---

## 📋 Los 21 Engines

**P1 (Fase 3 backend):**
- Stress Engine (Banister: Fitness-Fatigue-Readiness)
- Session Adaptation (Risk Score 0-100)
- Macrocycle Engine (19 programas)

**P2 (Fase 4):**
- Gamification, Belt System, Smart Streak, Warmup Engine, Privacy Engine, Readiness Cache

**P3 (Fase 5):**
- Balance, OLY Index, Lifestyle, Hormonal, Smart Coach, Píldoras, Golden Ratio, Leaderboard Cache

**P4 (Fase 5+):**
- Theme Engine, Social Engine, Pulse Engine, BW Milestone

---

## 💰 Modelo de Negocio B2B2C

| Rol | Plan | Precio | Features |
|-----|------|--------|----------|
| **Coach** | Premium | $29/mes | Equipos ilimitados, todos los engines, IA |
| **Atleta c/ Coach** | Freemium → Elite | Gratis + $12 | Engines activos, 45-day Elite Trial |
| **Atleta sin Coach** | Free | $0 | Registro + historial básico (estéril) |

**Trial:** 45 días Elite gratis (activado al ser invitado por coach)

---

## 🎨 Decisiones de Producto (Confirmadas 2026-04-15)

| # | Decisión | ✅ Elección |
|---|----------|-----------|
| D1 | Onboarding sin coach | Registro libre → vincular coach después |
| D2 | Macrociclo inicial | Coach asigna en el formulario de registro |
| D3 | Modelo pago | Coach siempre paga Premium · Atleta Freemium si tiene coach |
| D4 | Mensajería | ❌ Sin chat, sin video. Eliminado de flujos. |
| D5 | Nav atleta | Bottom nav: Dashboard / Sesión / Progreso / Perfil |

---

## 🎯 Próximas 6 Pantallas (Fase 1 final)

- **B4**: Session Summary (post-sesión wrap-up)
- **B5**: Warmup Generator (protocolo pre-sesión)
- **B11**: OLY Index (ranking competitivo normalizado)
- **B12/B13**: Pulse Hub + Cockpit (retos EMOM/AMRAP)
- **B14**: Píldoras / Stories (tips diarios contextuales)
- **C7/C8/C9**: Pulse Approval · Longevity Leaderboard · Coach Profile

---

## 📞 Contacto / FAQ

**¿Cómo ver wireframes?**
→ Abre `wireframes/index.html` en el navegador (todos son HTML + Tailwind, clickeables)

**¿Cómo contribuir?**
→ Crea una rama, haz cambios, abre PR. Wireframes son solo HTML estático, sin dependencias.

**¿Cuándo empieza el backend?**
→ Fase 3, después de validar ALL wireframes con stakeholders.

**¿Dónde está la BD?**
→ `INDEX.md` tiene el Prisma schema completo (60 modelos).

---

**Última actualización:** 2026-04-16 — Rama `main`  
**Creado por:** Claude Code · HolyOly Development

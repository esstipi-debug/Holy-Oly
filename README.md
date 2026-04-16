# 🏋️ HolyOly — Smart Training Platform

> **Plataforma SaaS de coaching inteligente para halterofilia olímpica**  
> Combinamos periodización científica (Banister), 19 motores computacionales y gamificación profunda.

**Tagline:** *Smart training, zero burnout.*

---

## 📊 Estado del Proyecto

| Métrica | Estado |
|---------|--------|
| **Fase** | 1 — UX/UI Wireframing |
| **Pantallas** | 22 / 27 completadas (81%) |
| **Engines** | 21 especificados, 0 implementados |
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

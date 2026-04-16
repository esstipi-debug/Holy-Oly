# HOLY OLY — Cerebro Central del Proyecto

**Última actualización:** 2026-04-15  
**Estado actual:** Fase 0 — Organización / Pre-diseño  
**Versión:** 1.0

---

## ¿Qué es HolyOly?

Plataforma SaaS de coaching inteligente para halterofilia olímpica.  
Combina periodización científica (modelo Banister), 19 motores computacionales, gamificación profunda y seguimiento por ciclo hormonal.  
**Tagline:** *Smart training, zero burnout.*

**Usuarios objetivo:**
- **Atletas** — Ejecutan sesiones adaptativas, siguen su readiness, ganan XP/cinturones.
- **Coaches** — Supervisan equipos, aprueban adaptaciones con 1-tap, analizan correlaciones Stress/Lifestyle.

---

## Stack Tecnológico Confirmado

| Capa | Tecnología | Notas |
|------|-----------|-------|
| **Frontend** | React + Vite + Tailwind CSS | SPA, 369KB JS gzipped |
| **State Management** | React Context API | Sin Redux por ahora |
| **Backend** | Node.js + Express | Monolítico, async/await |
| **ORM** | Prisma (schema-first) | ~60 modelos |
| **Database** | PostgreSQL | ~150 query patterns únicos |
| **Auth** | JWT (access + refresh rotation) | bcryptjs, roles: Athlete/Coach/Admin |
| **Jobs** | Cron jobs | 4 schedules: 5min/1h/24h/semanal |
| **Cache** | Tablas de pre-cálculo en DB | Readiness O(90)→O(1), Leaderboard O(nlogn)→O(1) |

---

## Los 21 Motores (Engines)

### Core
| # | Motor | Propósito | Prioridad Impl. |
|---|-------|-----------|-----------------|
| 1 | Stress Engine | Modelo Banister: fitness, fatigue, readiness | P1 |
| 2 | Session Adaptation | Risk Score (0-100) → sustituciones | P1 |
| 3 | Macrocycle Engine | 19 programas de 9 escuelas, 1,236 sesiones | P1 |

### Gamificación / Motivación
| # | Motor | Propósito | Prioridad Impl. |
|---|-------|-----------|-----------------|
| 4 | Gamification | XP, niveles, clubs (100-300kg total) | P2 |
| 5 | Belt System | 9 cinturones White→Gold (0-200k+ XP) | P2 |
| 6 | Smart Streak | Adherencia + comeback window (7 días) | P2 |
| 7 | BW Milestone | Logros relativos al peso corporal | P3 |

### Optimización de Entrenamiento
| # | Motor | Propósito | Prioridad Impl. |
|---|-------|-----------|-----------------|
| 8 | Warmup Engine | Protocolo pre-sesión readiness-aware | P2 |
| 9 | Pulse Engine | Retos de acondicionamiento (EMOM/For Time) | P3 |
| 10 | Balance Engine | Ratios FS/BS, Sn/CJ, Pull/Push | P3 |
| 11 | OLY Index | Ranking competitivo normalizado | P3 |

### Lifestyle & Recovery
| # | Motor | Propósito | Prioridad Impl. |
|---|-------|-----------|-----------------|
| 12 | Lifestyle Profile | Estrés diario (trabajo/sueño/transporte) | P3 |
| 13 | Hormonal Engine | Periodización ciclo menstrual (4 fases) | P3 |

### Insights & Social
| # | Motor | Propósito | Prioridad Impl. |
|---|-------|-----------|-----------------|
| 14 | Smart Coach | Categorización atletas + alertas batch | P3 |
| 15 | Píldoras | Tips diarios contextuales | P4 |
| 16 | Social Engine | Social cards IG/WhatsApp | P4 |
| 17 | Golden Ratio | Tracking proporciones de levantadas | P3 |

### UX & Infraestructura
| # | Motor | Propósito | Prioridad Impl. |
|---|-------|-----------|-----------------|
| 18 | Theme Engine | Light/Dark/Olimpic themes | P4 |
| 19 | Privacy Engine | Control acceso Coach/Atleta/Club/Admin | P2 |
| 20 | Readiness Cache | O(1) lookup pre-calculado | P2 |
| 21 | Leaderboard Cache | O(1) lookup pre-calculado | P3 |

---

## Base de Datos de Ejercicios

- **49 ejercicios** en 7 familias (Snatch, Clean & Jerk, Pulls, Squats, Press, Row, Accesorios)
- **Escala Complejidad Técnica:** 1-10 (Pendlay Row=1, Full Snatch=10)
- **Escala CNS Demand:** 1-10
- **48 cadenas de sustitución** (3 niveles: mild/moderate/heavy, 4 razones)
- **Zonas de riesgo:** Verde <25, Amarillo 26-50, Naranja 51-75, Rojo 76-100

---

## Macrociclos

- **19 programas** de 9 escuelas de halterofilia
- **~1,236 sesiones canónicas** en 254 semanas
- **Escuelas:** Cubana (5), Rusa (1), Colombiana (1), Polaca (2), Búlgara (1), China (1), Coreana (2), Ucraniana (2), Híbrido Moderno (4)
- **Generador:** Rule-based (estructura) + ML (selección de escuela óptima) + RAG (explicaciones)

---

## Flujos UX Documentados

| Flujo | Documento | Estado |
|-------|-----------|--------|
| Atleta — Ejecución de Sesión Adaptativa | `../ux holy oly atleta.txt` | Parcial |
| Coach — Command Center & Heatmap | `../ux holy oly coach.txt` | Parcial |
| Onboarding + Asignación de Macrociclo | `../ux holy oly coach.txt` (sección final) | Parcial |
| UX Completo | `../ux holy oly complete.txt` | Sin leer |

---

## Fases del Proyecto

```
FASE 0 — Organización           ← ESTAMOS AQUÍ
FASE 1 — Arquitectura & UX/UI
  1.1  Validar arquitectura de datos
  1.2  User Journeys completos
  1.3  Wireframes (Figma / HTML estático)
  1.4  Design system (colores, tipografía, componentes)
FASE 2 — Frontend (Web App)
  2.1  Setup React + Vite + Tailwind
  2.2  Componentes base + Design System
  2.3  Pantallas con mocks (sin API real)
  2.4  Frontend con API simulada (MSW o JSON)
FASE 3 — Backend Core
  3.1  Prisma schema + migrations
  3.2  Auth (JWT + roles)
  3.3  Engines P1: Stress, Session Adaptation, Macrocycle
  3.4  Endpoints REST + cron jobs base
FASE 4 — Integración Full-Stack
  4.1  Conectar frontend con backend real
  4.2  Engines P2: Gamification, Belt, Streak, Cache
  4.3  Testing E2E
FASE 5 — Engines Avanzados
  5.1  Engines P3 y P4 (Hormonal, Social, Golden Ratio, etc.)
  5.2  ML para selección de macrociclo
FASE 6 — App Nativa (React Native / Expo)
  6.1  Migración de componentes a RN
  6.2  Features nativas (notificaciones push, offline mode)
  6.3  App Store / Play Store deployment
```

---

## Decisiones de Arquitectura Clave

| Decisión | Elección | Razón |
|----------|---------|-------|
| Arquitectura backend | Monolítico (Express) | Simplicidad; split después si necesario |
| ORM | Prisma | Schema-first, migrations trackeadas |
| Auth | JWT + refresh rotation | Stateless, escala bien |
| Cache | Tablas DB (no Redis) | Suficiente para escala inicial |
| Mobile | Web primero → React Native | Validar producto antes de invertir en nativo |
| Video analysis | ❌ NO incluido | Decisión explícita del producto |
| Chat in-app | ❌ NO incluido | No hay mensajería interna en ninguna versión |

## Decisiones de Producto / UX (confirmadas 2026-04-15)

| # | Decisión | Elección |
|---|---------|---------|
| D1 | Onboarding sin coach | ✅ Registro libre + vincular coach después |
| D2 | Macrociclo inicial | ✅ Coach asigna en el mismo formulario de registro |
| D3 | Modelo de pago | ✅ Coach siempre paga Premium · Atleta solo Freemium si tiene coach asignado |
| D4 | Mensajería | ❌ Sin chat · Sin video · Eliminado de cualquier flujo |
| D5 | Navegación atleta | ✅ Bottom nav bar: Dashboard / Sesión / Progreso / Perfil |

### Sistema de Temas (Theme Engine 18) — actualizado

| Tema | Plan | Avatar Victory | Paleta | Estética |
|------|------|---------------|--------|---------|
| **Classic** | Free | Sin Victory Screen | Gris/slate | Funcional, sin gamificación |
| **Carbon Stealth** | Premium | Silueta vectorial | Carbono + Cian | Industrial, tecnológico |
| **Olympic Gold** | Premium | Silueta vectorial | Negro + Dorado | Prestigious, élite |
| **Cyber Neon** | Premium | Pixel art 16-bits | Magenta + Cian neón | Gaming, retro RPG |
| **Crimson Power** | Premium | Silueta vectorial | Negro + Rojo neón | Agresivo, fuerza pura |

**Regla:** El tema seleccionado determina el visual completo de la Victory Screen y la Social Card generada.

### Wise Score (antes Longevity Index / Maturity Score)
- Nombre oficial de la métrica de inteligencia deportiva: **Wise Score**
- Premia adaptaciones aceptadas, RPE preciso, adherencia al plan
- Tan visible como el OLY Index en el perfil del atleta

### Social Card (B9) — generación
- Fondo: foto de la galería del atleta (elegida por el usuario)
- Overlay oscuro + datos del logro encima
- Dos tipos: **PR Card** (dorado/poder) y **Smart Card** (cian/ciencia)
- Sin chat in-app · Sin video analysis

### Modelo de Negocio B2B2C (detalle)
- **Coach** → paga plan Premium → gestiona su equipo, accede a todos los engines
- **Atleta con coach** → Freemium (básico) con opción de upgrade personal
- **Atleta sin coach** → Solo puede registrarse, pero sin engines de adaptación activos
- **Trial** → 45 días Premium gratis para atletas nuevos invitados por coach

---

## Lo Que Falta (Gaps Identificados)

| Gap | Criticidad | Necesario para |
|-----|-----------|----------------|
| Prisma schema completo | ALTA | Fase 3 |
| Wireframes / Mockups | ALTA | Fase 1 |
| Design System (colores, tipografía) | ALTA | Fase 1-2 |
| User Stories formalizadas | MEDIA | Fase 1 |
| Diagrama ERD (Entity Relationship) | MEDIA | Fase 3 |
| API contract (endpoints + payloads) | MEDIA | Fase 3-4 |
| Estrategia de deployment | BAJA | Fase 4+ |
| Análisis competitivo | BAJA | Marketing |

---

## Control de Sesiones

| Sesión | Fecha | Lo que se hizo |
|--------|-------|----------------|
| 1 | 2026-04-15 | Catastro completo, creación de MEMORY.md, hoja de ruta definida |
| 2 | 2026-04-15 | 10 wireframes HTML completados · Victory Screen 4 temas interactiva · Social Card Generator con 4 tipos · Inventario 27 pantallas · Decisiones de producto confirmadas |

## Wireframes completados (Fase 1)

| Pantalla | Archivo | Estado |
|---------|---------|--------|
| B1 Dashboard Atleta | B1_dashboard_atleta.html | ✅ |
| B2 Pre-Check 5 sliders | B6_active_session.html | ✅ |
| B6 Sesión Activa + RPE | B6_active_session.html | ✅ |
| B7/B8 Victory Screen (4 temas × 2 modos) | B7_B8_victory_screen.html | ✅ |
| B9 Social Card Generator (4 tipos) | B9_social_card.html | ✅ |
| C1 Command Center Coach | C1_command_center_coach.html | ✅ |
| C2 Risk Intervention Modal | C1_command_center_coach.html | ✅ |
| C3 Adjustment Hub | C1_command_center_coach.html | ✅ |
| Index navegación | index.html | ✅ |

---

*Este archivo debe actualizarse al final de cada sesión de trabajo.*

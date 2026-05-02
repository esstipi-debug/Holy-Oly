# HOLY OLY — Cerebro Central del Proyecto

**Última actualización:** 2026-04-30
**Estado actual:** Fase 1 completada → Fase 2 iniciada
**Versión:** 2.0

---

## ¿Qué es HolyOly?

**HolyOly** es una aplicación diseñada para administrar entrenamientos de **Halterofilia**.

*   **Lado Coach:** Su función principal es administrar múltiples atletas y sus sesiones de entrenamiento de manera eficiente.
*   **Lado Atleta:** Su función principal es cuidar los niveles de fatiga y dimensionar el estrés del cuerpo para optimizar el rendimiento.

**Tagline:** *Smart training, zero burnout.*

---

## Stack Tecnológico Confirmado

| Capa | Tecnología | Notas |
|------|-----------|-------|
| **Frontend** | React + Vite + Tailwind CSS | SPA mobile-first (390px) |
| **State Management** | React Context API | Sin Redux por ahora |
| **Backend** | Python (FastAPI) | Estructura `backend/src/`, módulos RAG + ETL |
| **ORM** | Prisma (schema-first) | ~60 modelos, `pgvector` |
| **Database** | AlloyDB (PostgreSQL compatible) | IP `34.176.100.236` en `.env`, soporta `pgvector` |
| **IA / LLM** | Gemini 2.5 Flash Lite + Vertex AI | Unificación de factura y ecosistema Google |
| **Jobs** | Cloud Scheduler + Cloud Run | 4 schedules: 5min/1h/24h/semanal |
| **Nutrición** | Apple HealthKit / Android Health Connect | Única capa de integración nutricional |
| **Design** | Google Stitch (importación .md) | Wireframes HTML → export .md → Stitch |

---

## Los 22 Motores (Engines)

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
| 22 | IMR Engine | Intensity Maintenance Ratio + AI Insights | P2 |
| 23 | Skin Engine | Catálogo + inventory (3 skins base día 1) | P3 |

### UX & Infraestructura
| # | Motor | Propósito | Prioridad Impl. |
|---|-------|-----------|-----------------|
| 18 | Theme Engine | 5 temas (Classic + 4 Premium) | P2 |
| 19 | Privacy Engine | Control acceso Coach/Atleta/Club/Admin | P2 |
| 20 | Readiness Cache | O(1) lookup pre-calculado | P2 |
| 21 | Leaderboard Cache | O(1) lookup pre-calculado | P3 |
| 24 | Nutrition Bridge | HealthKit/Health Connect → DB sync | P3 |

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
FASE 0 — Organización           ✅ COMPLETADA
FASE 1 — Arquitectura & UX/UI   ✅ COMPLETADA (100%)
  1.1  Validar arquitectura de datos        ✅
  1.2  User Journeys completos              ✅
  1.3  Wireframes (27 pantallas HTML)       ✅
  1.4  Design system (colores, tipografía)  ✅
  1.5  STITCH_EXPORT.md para Google Stitch  ✅
  1.6  20 decisiones UX firmadas            ✅ (ARCHITECTURE_DECISIONS_PENDING.md)
FASE 2 — Frontend (Web App)     🔄 INICIADA (70%)
  2.1  Setup React + Vite + Tailwind        ⏳
  2.2  Componentes base + Design System     ⏳
  2.3  Pantallas con mocks (sin API real)   ⏳
  2.4  Frontend con API simulada (MSW)      ⏳
FASE 3 — Backend Core
  3.1  Schema + migrations                  ⏳
  3.2  Auth (JWT + roles)                   ⏳
  3.3  Engines P1: Stress, Session, Macro   ⏳
  3.4  Endpoints REST + cron jobs           ⏳
FASE 4 — Integración Full-Stack
  4.1  Conectar frontend con backend real   ⏳
  4.2  Engines P2: Gamification, Belt, etc  ⏳
  4.3  Testing E2E                          ⏳
FASE 5 — Engines Avanzados
  5.1  Engines P3 y P4                      ⏳
  5.2  ML para selección de macrociclo      ⏳
FASE 6 — App Nativa (React Native / Expo)
  6.1  Migración de componentes a RN        ⏳
  6.2  Features nativas (push, offline)     ⏳
  6.3  App Store / Play Store deployment    ⏳
```

---

## Decisiones de Arquitectura Clave

| Decisión | Elección | Razón |
|----------|---------|-------|
| Arquitectura backend | Python (FastAPI) | Ecosistema ML/IA, módulos RAG + ETL existentes |
| ORM | Prisma | Schema-first, migrations trackeadas |
| Auth | JWT + refresh rotation | Stateless, escala bien |
| Cache | Tablas DB (no Redis) | Suficiente para escala inicial |
| Mobile | Web primero → React Native | Validar producto antes de invertir en nativo |
| Video analysis | ❌ NO incluido | Decisión explícita del producto |
| Chat in-app | ❌ NO incluido | No hay mensajería interna en ninguna versión |
| Nutrición | HealthKit / Health Connect | Puente universal, evita APIs de terceros |
| Diseño | Google Stitch desde .md | Mejor parsing que HTML crudo |
| DB | AlloyDB (no Cloud SQL) | Mejor rendimiento pgvector |

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
| Design System implementado en código | ALTA | Fase 2 |
| User Stories formalizadas | MEDIA | Fase 1-2 |
| Diagrama ERD (Entity Relationship) | MEDIA | Fase 3 |
| API contract (endpoints + payloads) | MEDIA | Fase 3-4 |
| MSW mock server | MEDIA | Fase 2 |
| ETL universal dry-run | MEDIA | Fase 4 |
| Estrategia de deployment | BAJA | Fase 4+ |
| Análisis competitivo | BAJA | Marketing |

---

## Control de Sesiones

| Sesión | Fecha | Lo que se hizo |
|--------|-------|----------------|
| 1 | 2026-04-15 | Catastro completo, creación de MEMORY.md, hoja de ruta definida |
| 2 | 2026-04-15 | 10 wireframes HTML completados · Victory Screen 4 temas interactiva · Social Card Generator con 4 tipos · Inventario 27 pantallas · Decisiones de producto confirmadas |
| 3 | 2026-04-26 | 27 wireframes HTML auditados · STITCH_EXPORT.md generado · Nutrición vía Health/Health Connect confirmada · 20 decisiones UX firmadas · MEMORY.md actualizado |

## Wireframes completados (Fase 1 — 27 pantallas)

| Pantalla | Archivo | Estado |
|---------|---------|--------|
| A1 Login | A1_login_register.html | ✅ |
| A2 Registro + Invite Coach | A1_login_register.html | ✅ |
| A3 Forgot Password (3 estados) | A1_login_register.html | ✅ |
| B1 Dashboard Atleta | B1_dashboard_atleta.html | ✅ |
| B2 Pre-Check 5 sliders | B6_active_session.html | ✅ |
| B3 Injury Shield Modal | B3_injury_shield.html | ✅ |
| B4 Session Summary | B4_session_summary.html | ✅ |
| B5 Warmup Generator | B5_warmup.html | ✅ |
| B6 Sesión Activa + RPE | B6_active_session.html | ✅ |
| B7/B8 Victory Screen (4 temas × 2 modos) | B7_B8_victory_screen.html | ✅ |
| B9 Viral Card Generator | B9_social_card.html | ✅ |
| B10 Analytics (4 tabs) | B10_analytics.html | ✅ |
| B11 OLY Index | B11_oly_index.html | ✅ |
| B12/B13 Pulse Hub | B12_pulse.html | ✅ |
| B14 Píldoras/Stories | B14_stories.html | ✅ |
| B15 Perfil Atleta | B15_profile.html | ✅ |
| C1 Command Center Coach | C1_command_center.html | ✅ |
| C2 Risk Intervention Modal | C1_command_center.html | ✅ |
| C3 Adjustment Hub | C1_command_center.html | ✅ |
| C4 Athlete Deep Dive | C4_athlete_detail.html | ✅ |
| C5/C6 Add Athlete + Macrocycle | C5_add_athlete.html | ✅ |
| C7/C8/C9 Coach Tools | C7_coach_tools.html | ✅ |
| D1 Onboarding (4 pasos) | D1_onboarding.html | ✅ |
| D2 Trial → Premium | D2_trial_upgrade.html | ✅ |
| Index navegación | index.html | ✅ |

### Export para Google Stitch
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `STITCH_EXPORT.md` | 27 pantallas con layout, tokens, componentes, navegación | ✅ |

---

### Resumen de Sesión (2026-04-17)
- **Hito:** Definición y alineación de la **Viral Card** (antes Social Card).
- **Métrica Nueva:** Integración del **IMR** (Intensity Maintenance Ratio) en la visualización de resultados.
- **Alineación:** Validación de los 5 Ratios de Oro (Golden Ratios) para el gráfico poligonal de Halterofilia.
- **Documentación:** Creación de `VIRAL_CARD.md`.
- **Motor 22 Creado:** Formulación lógica e incorporación al sistema del `22_imr_engine.md` como puente gamificado y analítico entre el stress y los macrociclos, listo para inyección de agentes IA de Huberman Lab.

---

---

### 📌 Adenda 2026-04-30 — Nutrición + Fase 1 Completada

**Nutrición — Estrategia de Integración:**
- **Capa universal:** Apple HealthKit (iOS) + Google Health Connect (Android)
- **Apps compatibles:** MyFitnessPal, Cronometer, FatSecret, Lose It!, MacroFactor, Yazio
- **NO se conectan APIs directas de apps de terceros** — todo via Health/Health Connect
- **Datos leídos:** Calorías, proteínas, carbohidratos, grasas, agua, peso corporal, IMC
- **Frecuencia sync:** Cada 6h o manual desde perfil
- **Fallback:** Input manual si no hay app de nutrición instalada

**Fase 1 — Estado:**
- 27 wireframes HTML: ✅ 100%
- STITCH_EXPORT.md: ✅ Generado (24 secciones, 27 pantallas cubiertas)
- 20 decisiones UX/UI firmadas: ✅ (ARCHITECTURE_DECISIONS_PENDING.md)
- Design tokens definidos: ✅ (colores, tipografía, spacing, navegación)

**Pendientes inmediatos:**
- Phase 4 Step 1: `python -m ingestion.etl_universal --dry-run`
- Importar STITCH_EXPORT.md en Google Stitch
- Actualizar SIGUIENTE_SESION.md con progreso

**Git status:**
- Repo: `esstipi-debug/Holy-Oly.git` (rama `main`)
- 1 commit ahead de remote
- Múltiples unstaged/untracked (wireframes, memory, decisions)

---

### Resumen de Sesión (2026-04-18) — UX Afinamiento Bloque Coach

**Metodología:** Entrevista iterativa con 4 roles (PM crítico, UX senior, founder escéptico, analista negocio).

**Hito estratégico:** Decisión de **NO MVP**. Producto terminado completo antes de lanzar. Orden: UX afinado → UI alta fidelidad → Design System → Backend → Integración.

**Bloque Coach — Ronda 1 CERRADA (32 decisiones):**

- **Modelo negocio:** 45 días trial coach + atletas · $29 USD · Solo Chile (Lemon Squeezy + Flow) · Retention 2 años máximo · 3 días gracia post-cancelación + oferta anual -20%
- **C1 Radar:** 3 atletas alertas visibles · Resto como notificaciones · Paginación 5/pág · Búsqueda nombre + nivel/grupo · Trial status FUERA del radar
- **C1 Grupos:** Auto-clasificación por ratio peso corporal / carga movida (Sinclair simplificado)
- **C1 Updates:** Push inmediato urgencias + recálculo Banister cada hora · Fallback 7 días con flag "data estimada"
- **C2:** Renombrado **"IA" → "Recomendación Smart"** (marketing honesto)
- **C2 Scope:** Solo sesión actual, NO afecta cascada macrociclo
- **C3 Adjustment Hub:** Undo total + por atleta + por movimiento
- **C4 Deep Dive:** Rodillo 7/14/28 días (3 taps reinicia)
- **C5/C6:** Código anónimo auto-generado · Link pre-llenado · WhatsApp + email · Solo 1 coach por atleta
- **C7 Pulse:** Mantener si AirBike anaeróbico (confirmar scope)
- **C8 Longevity:** ELIMINADO
- **C9 Perfil:** Privado, solo sus atletas
- **Verificación coach:** Solo RUT/pasaporte
- **Moneda:** USD único global
- **Empty states:** Definidos Coach día 1 y día normal sin alertas

**Contradicciones resueltas:**
1. Retention data → 2 años máx
2. Update readiness → Push inmediato + recálculo hora
3. IA vs no-IA → "Recomendación Smart"

**Documentación creada:** `ux/COACH_FLOW_DECISIONS.md` (32 decisiones + 24 pendientes Ronda 2)

**Pendiente Ronda 2 Coach:** preguntas 33-56 (C4 tabs, C5/C6 campos, onboarding D0, billing, settings)

**Próximos bloques UX:** Bloque Atleta · Flujo viral · Consolidación Obsidian

---

### Adenda Sesión (2026-04-18) — Holy Oly Skin System

**Trigger:** Founder comparte imagen PES/eFootball como referencia. Plantea app entera construida alrededor del concepto FIFA-card.

**Evaluación crítica realizada:**
- ✅ Concepto card digital gamificada: APROBADO
- ❌ Impresión física metal: RECHAZADO (logística + margen)
- ❌ Sponsorships ad-tech: POSPUESTO (requiere 5k+ users)
- ❌ Marca blanca B2B gyms: POSPUESTO (TAM Chile insuficiente)
- ✅ Skins digitales ventas limitadas: APROBADO

**Decisiones cerradas:**
- Skin = capa cosmética digital sobre Victory Screen + Viral Card + Avatar
- Separación: **Tema ≠ Skin** (Theme = paleta app, Skin = edición limitada)
- Aesthetic propio inspirado PES pero NO copiado (riesgo legal Konami)
- Stat estrella: **IMR** (Engine 22), reemplaza "Snatch 96" genérico de PES
- Rareza 3 variantes: Plata / Oro / Holográfica según performance
- B9d "Definitiva" = base neutral, skins se aplican encima (no invalida)

**Documentación creada:** `ux/SKIN_SYSTEM.md` (propuesta completa + 7 decisiones pendientes)

**7 decisiones CERRADAS (2026-04-18):**
1. Tema vs Skin → **Separar capas** (B)
2. Mecánica escasez → **Opción 4 Híbrida** (hitos free + drops pagos + ediciones limitadas)
3. Precios → **$4.99 seasonal · $9.99 edición limitada · $14.99 colaboración oficial**
4. Alcance → **4 superficies** (Victory + Viral Card + Avatar + Badge dashboard)
5. Rareza → **3 variantes** Plata/Oro/Holográfica según performance
6. Timing → **Día 1 con 3 skins base**
7. Catálogo inicial → **Obsidian Classic (free) · Andes Electric ($4.99) · Olympic Legacy ($9.99, 500 unidades)**

**Nuevo engine previsto:** Engine 23 Skin Engine (gestión catálogo + inventory).
**Nueva pantalla prevista:** B16 Skin Store (wireframe pendiente).

**Referencia visual:** `assets/references/` creado. PES card referenciada como inspiración, debe guardarse manualmente el archivo.

---

### Adenda Sesión (2026-04-18) — AI Strategy (Vector DB + RAG + Distillation)

**Trigger:** Founder pregunta por viabilidad vector DB para RAG o destilación.

**Contradicción marcada:** decisión previa "no hay IA, renombrar Smart" vs consulta actual por RAG/IA. Resolución propuesta: **Opción A — Smart público + IA privada backend**. Marketing dice "Smart", backend usa IA real oculta.

**Decisiones estratégicas propuestas (pendiente confirmar):**
- Stack: Postgres + pgvector (cero infra adicional)
- Embeddings: OpenAI text-embedding-3-small ($0.02/1M tokens)
- LLM primario: Claude Sonnet 4.6 + prompt caching
- Logging exhaustivo desde día 1 (input/output/feedback)
- NO activar IA en producto hasta volumen >10k sesiones (mes 9-12)
- Distillation planificada año 2+ con dataset 50k+ ejemplos etiquetados

**Casos de uso RAG identificados:**
- Smart Coach Engine (14): contexto histórico para insights
- Session Adaptation Engine (02): híbrido reglas + data real
- Smart Insights futuro: chat coach con histórico
- Clasificador texto libre (check-ins diarios)
- Detector overreaching predictivo
- Generador Píldoras personalizadas

**Costos estimados:**
- V1 (preparación): $0/mes
- V2 (año 2 con 1k atletas): $150-350 USD/mes
- V3 (año 3 con distillation): $100-250 USD/mes (ahorro 60%)

**Documentación creada:** `ux/AI_STRATEGY.md` — roadmap 4 fases + schema Prisma + 9 decisiones pendientes

**Moat real identificado:** no es la IA, sino el dataset halterofilia altamente estructurado. En 12-18 meses, mejor dataset halterofilia del mercado.

---

---

### 📌 Adenda 2026-05-02 — Motor 25: Agentes Autónomos + Budget Autofinanciado

**Motor 25 — Agentic AI Ecosystem:**
5 agentes autónomos que trabajan mientras duermes:

| Agente | Función | Schedule | Auto-actua |
|--------|---------|----------|------------|
| **Response Agent** | Captura leads (email, webchat, IG, WhatsApp) + responde con voz de marca | 24/7 (webhook) | Sí (bajo riesgo) |
| **Test Agent** | Tests post-deploy: endpoints, DB, seguridad | On-demand (deploy) | Sí (auto-fix) |
| **Security Agent** | Escaneo diario de vulnerabilidades + semanal completo | 3am diario / 3am domingo | No (solo reporta) |
| **Growth Agent** | Engagement scoring, churn prediction, trial reminders, win-back emails, A/B tests | 2am-10am diario | Sí (emails) |
| **Content Agent** | Píldoras diarias, weekly coach digest, social posts | 9am diario / lunes 8am | No (draft) |

**Budget Autofinanciado (nuevo concepto):**
Los agentes EMPIEZAN con presupuesto mínimo y ganan más mientras generan valor.

**Tiers:**
| Tier | Credit | Tokens/dia | Emails/dia | Modelo Max | Label |
|------|--------|------------|------------|------------|-------|
| 0 | 0+ | 1,000 | 5 | Flash Lite | 😬 Broke |
| 1 | 5+ | 10,000 | 25 | Flash Lite | 🌱 Starter |
| 2 | 50+ | 50,000 | 100 | Flash | 📈 Growing |
| 3 | 200+ | 200,000 | 500 | 2.5 Flash | ⭐ Star |
| 4 | 1000+ | 1,000,000 | 2,000 | 2.5 Pro | 👑 Legend |

**Como ganan credits:**
| Accion | Credits | Agente que gana |
|--------|---------|-----------------|
| Lead capturado | +1.0 | Response |
| Lead respondido | +0.5 | Response |
| Trial convertido | +10.0 | Growth |
| Churn salvado | +5.0 | Growth |
| A/B test winner | +3.0 | Growth |
| Vulnerabilidad encontrada | +8.0 | Security |
| Deploy tests pass | +2.0 | Test |
| Email abierto | +0.1 | Growth |
| Email clicked | +0.3 | Growth |

**Como gastan:**
| Recurso | Costo | Por |
|---------|-------|-----|
| 1K tokens Flash Lite | 0.0001 credits | 1000 tokens |
| 1K tokens Flash | 0.0003 credits | 1000 tokens |
| 1K tokens Pro | 0.001 credits | 1000 tokens |
| 1 email enviado | 0.05 credits | email |
| 1 GitHub API call | 0.01 credits | call |

**Endpoints nuevos:**
- `GET /api/v1/agents/budget` → status de todos los agentes
- `GET /api/v1/agents/budget?agent=response_agent` → detalle de un agente
- `GET /api/v1/agents/status` → status general + scheduler jobs

**Archivos creados:**
- `backend/src/agents/budget.py` — BudgetManager, tiers, credits
- `backend/src/agents/growth_agent/__init__.py` — Implementacion completa (trial reminders, win-back, engagement, churn, A/B tests)
- `backend/src/agents/router.py` — Endpoints para agents + budget + research
- `backend/src/agents/response_agent/response_generator.py` — Budget-aware (checka antes de usar Gemini)
- `backend/src/agents/response_agent/email_handler.py` — Budget-aware (checka antes de enviar email)

**Costo estimado con 100 users:**
- Agents brokes (Tier 0): ~$0.10/mes
- Agents starters (Tier 1): ~$1.50/mes
- Agents growing (Tier 2): ~$5/mes
- Agents stars (Tier 3): ~$15/mes
- **Todos se pagan solos con las conversiones que generan**

---


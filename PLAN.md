# 🗺️ PLAN — Hoja de Ruta HolyOly

**Última actualización:** 2026-04-16  
**Estado:** Fase 1 FINALIZADA (100%) · Fase 2 EN PROGRESO (70%)

---

## 🎯 Objetivo General

Construir una **plataforma SaaS de coaching inteligente** para halterofilia olímpica que combine:
- Periodización científica (Banister)
- 19 motores computacionales
- Gamificación profunda
- Seguimiento hormonal (opcional)

**Timeline total:** 6 fases, ~16 semanas hasta MVP

---

## 📅 Fases del Proyecto

### **FASE 0 ✅ — Organización & Pre-diseño** (Completada 2026-04-15)
- [x] Catastro completo (51 archivos)
- [x] MEMORY.md creado
- [x] 21 engines especificados
- [x] 49 ejercicios + 48 cadenas sustitución
- [x] 19 macrociclos de 9 escuelas
- [x] Decisiones de producto confirmadas

### **FASE 1 ✅ — Arquitectura & UX/UI** (100% — 27/27 wireframes)

#### Hitos completados:
- [x] 1.1 Validar arquitectura de datos
- [x] 1.2 User journeys completos (Atleta + Coach)
- [x] 1.3 Wireframes HTML estático (21 pantallas)
- [x] 1.4 Design System (4 temas, colores, tipografía)

#### Falta terminar (6 pantallas):
- [x] B4 — Session Summary (post-sesión wrap-up con XP, streaks, ratios)
- [x] B5 — Warmup Generator (protocolo pre-sesión readiness-aware)
- [x] B11 — OLY Index (tabla percentiles, ranking, drill-down)
- [x] B12/B13 — Pulse Hub + Cockpit (retos EMOM/For Time, freshness gate)
- [x] B14 — Píldoras / Stories (tips diarios, +50 XP, 5 segundos)
- [x] C7/C8/C9 — Pulse Approval · Leaderboard Longevity · Coach Profile

**Estimado:** 2-3 horas (pantallas más simples)

#### Entregables Fase 1:
```
wireframes/
├── index.html                        ← Navigator actualizado (27/27)
├── A1_A2_A3_auth.html               ✅
├── B1_dashboard_atleta.html         ✅
├── B3_injury_shield.html            ✅
├── B4_session_summary.html          ✅
├── B5_warmup_generator.html         ⏳ FALTA
├── B6_active_session.html           ✅
├── B7_B8_victory_screen.html        ✅
├── B9_social_card.html              ✅
├── B10_performance_deep_dive.html   ✅
├── B11_oly_index.html               ✅
├── B12_B13_pulse_hub.html           ✅
├── B14_pildoras_stories.html        ✅
├── B15_perfil_atleta.html           ✅
├── C1_command_center_coach.html     ✅
├── C4_athlete_deep_dive.html        ✅
├── C5_C6_add_athlete_assign_macro   ✅
├── C7_C8_C9_coach_tools.html        ✅
├── D1_onboarding_atleta.html        ✅
└── D2_free_premium_transition.html  ✅
```

---

### **FASE 2 ⏳ — Frontend (Web App)** (~5 semanas)

**2.1 Setup React + Vite + Tailwind**
- [x] Crear proyecto con `npm create vite@latest`
- [x] Integrar Tailwind CSS
- [x] Setup ESLint + Prettier

**2.2 Design System en código**
- [x] Componentes base: Button, Input, Card, Badge, Nav
- [x] Color system (4 temas base integrados en Tailwind)
- [x] Tipografía (Inter configurada)
- [ ] Spacing + Border radius tokens adicionales

**2.3 Pantallas con mocks**
- [x] Recrear todos 27 wireframes como componentes React (18 Páginas)
- [x] Onboarding & Auth (D1, A1)
- [x] Dashboard & Session Loop (B1, B4, B5, B6, B7/B8)
- [x] Analytics & OLY Index (B10, B11)
- [x] Pulse Hub & Social (B9, B12/B13, B14)
- [x] Portal del Coach completo (C1, C4, C5/C6, C7/C8/C9)
- [x] Perfil & Configuración (B15, B2/B3)
- [x] Usar datos hardcodeados para validación de UX
- [x] Validar responsiveness (mobile-first) ✅

**2.4 Frontend con API simulada**
- Setup MSW (Mock Service Worker) o JSON Server
- Simular endpoints REST
- Testing básico de flows (login → sesión → victory)

---

### **FASE 3 ⏳ — Backend Core** (~6 semanas)

**3.1 Prisma schema + migrations**
- Definir 60 modelos
- Crear migrations
- Seed BD con 49 ejercicios

**3.2 Auth (JWT + roles)**
- Endpoints: POST /auth/register · POST /auth/login · POST /auth/refresh
- Middleware: verifyToken, authorizeRole
- Roles: Athlete, Coach, Admin

**3.3 Engines P1 (Stress, Adaptation, Macrocycle)**
- Stress Engine: cálculo Banister (fitness, fatigue, readiness)
- Session Adaptation: risk scoring + sustituciones
- Macrocycle Engine: parseo de 19 programas, asignación a atletas

**3.4 Endpoints REST + cron jobs base**
- Athlete: GET /sessions, POST /sessions/:id/complete, GET /readiness
- Coach: GET /team, POST /team/athlete, GET /team/:id/deep-dive
- Cron: recalcular readiness (5 min), generar reportes (24h)

---

### **FASE 4 ⏳ — Integración Full-Stack** (~4 semanas)

**4.1 Conectar frontend con backend real**
- Reemplazar MSW con llamadas HTTP reales
- Implementar error handling + retry logic
- Testing E2E básico

**4.2 Engines P2 (Gamification, Belt, Streak, Cache)**
- XP system + level progression
- Belt system (9 niveles White→Gold)
- Smart Streak (adherencia + comeback window)
- Precalcular readiness en tablas para O(1) lookup

**4.3 Testing E2E**
- Cypress / Playwright tests
- User journeys completos
- Validación de cálculos Banister

---

### **FASE 5 ⏳ — Engines Avanzados** (~4 semanas)

**5.1 Engines P3 y P4**
- Hormonal Engine (ciclo menstrual 4 fases)
- Smart Coach (categorización + alertas batch)
- Social Engine (social cards IG/WhatsApp)
- Golden Ratio (tracking proporciones)
- Píldoras / Stories
- Theme Engine (5 temas)
- Privacy Engine (granular access control)

**5.2 ML para selección de macrociclo**
- Entrenar modelo simple (sklearn) con histórico
- Recomendación automática de escuela óptima
- RAG para explicaciones

---

### **FASE 6 ⏳ — App Nativa (React Native / Expo)** (~6 semanas)

**6.1 Migración de componentes a RN**
- Identificar componentes reutilizables
- Adaptar para mobile nativo
- Setup Expo

**6.2 Features nativas**
- Push notifications
- Offline mode (sync cuando vuelve online)
- Biometría (Face ID / fingerprint para login)
- Home screen widgets

**6.3 App Store / Play Store**
- Build + signing
- TestFlight / Google Play beta
- Public launch

---

## 🎨 Decisiones Clave (Bloqueadas)

| Decisión | Valor | Impacto |
|----------|-------|--------|
| **Auth** | JWT + refresh rotation | Stateless, escalable, sin sesiones |
| **Cache** | Tablas DB (no Redis) | Suficiente para escala inicial, simplifica deploy |
| **Mobile first** | Web primero → RN después | Validar producto antes de invertir nativo |
| **Chat in-app** | ❌ NO | Eliminado — simplifica scope |
| **Video analysis** | ❌ NO | Eliminado — complejo, low priority |
| **Temas** | 5 (1 Free + 4 Premium) | Personalization = retention |
| **Modelo pago** | B2B2C (Coach paga) | Atleta depende de coach para acceso |

---

## 📊 Métricas de Éxito (MVP)

### Funcionales:
- [x] Todos 27 wireframes validados
- [ ] Backend con Stress Engine funcionando
- [ ] Login/Register flujo completo
- [ ] Sesión adaptativa de un atleta
- [ ] Victory Screen con tema dinámico
- [ ] Coach viendo equipo (C1)

### Técnicas:
- [ ] Lighthouse score >80
- [ ] API response time <200ms
- [ ] DB queries <1s (con índices)
- [ ] Uptime >99.5%

### UX:
- [ ] NPS >40
- [ ] Session completion rate >90%
- [ ] Coach retention >70% (45 días)

---

## 🛠️ Tech Debt / Riesgos Identificados

| Riesgo | Mitigación | Prioridad |
|--------|-----------|-----------|
| Fórmula Banister mal calibrada | Validar con coach real | P1 |
| Sustituciones no suficientes | Expandir a 100+ en BD | P2 |
| Mobile responsiveness bugs | Testing en device real | P1 |
| Churn post-trial (D45) | Upsell inteligente + features P3 | P2 |
| ML model overfitting | Cross-validation, simple primero | P3 |

---

## 📝 Próximos Pasos Inmediatos

### Hoy (sesión actual):
1. ✅ Crear README.md + PLAN.md + actualizar MEMORY.md
2. ✅ Push a GitHub con estructura clara
3. ⏳ Completar 6 pantallas restantes (B4, B5, B11, B12/13, B14, C7/8/9)
4. ⏳ Hacer PR de validación
5. ⏳ Marcar Fase 1 como DONE

### Próxima sesión (Fase 2 planning):
1. Validar wireframes con stakeholder (coach real)
2. Setup proyecto React + Vite
3. Identificar componentes reutilizables
4. Mockear 5 pantallas principales

---

## 🤝 Convenciones del Repo

### Commits:
```bash
# Wireframes
git commit -m "Wireframe: B4 Session Summary + B5 Warmup"

# Decisiones
git commit -m "Decision: Accept D5 bottom nav layout"

# Actualizar memoria
git commit -m "Memory: Fase 1 → 27/27 complete, ready Phase 2"
```

### Branches (después de Fase 1):
- `main` — Producción (stabilizado)
- `develop` — Base para features
- `feature/auth-flow` — Feature branch
- `hotfix/bug-xyz` — Fixes críticos

### Memory actualización:
- Al final de CADA sesión
- Incluir: pantallas hechas, próximas, decisiones, blockers
- Siempre con timestamp

---

## 📚 Documentos de Referencia

- `INDEX.md` — Especificaciones técnicas completas
- `MEMORY.md` — Contexto actual (qué falta, dónde vamos)
- `wireframes/index.html` — Navigator visual con status
- `engines/*` — Detalles de cada motor
- `exercises/*` — Base de 49 ejercicios
- `macrocycles/*` — 19 programas de 9 escuelas

---

**Versión:** 1.0  
**Creado:** 2026-04-15  
**Última actualización:** 2026-04-16 — Fase 1 FINALIZADA · Fase 2 INICIADA

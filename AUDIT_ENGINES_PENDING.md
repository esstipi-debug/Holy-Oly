# Roadmap engines pendientes vs spec original

Auditoría de los 24 engines documentados en `/engines/*.md` vs implementación real al commit **3dc810b** (2026-05-27).

**TL;DR:** 4 de 24 engines fully implementados · 8 parciales · **12 ausentes**. Engine 13 (Hormonal · Ciclo Menstrual) es uno de los ausentes y es la primera incógnita del usuario.

---

## Estado actual de los 24 engines

### ✅ Fully implementados (4)

| # | Engine | Backend | Frontend |
|---|---|---|---|
| 01 | Stress | `core/stress_engine.py` | StressContext, MetricHistoryModal |
| 02 | Session Adaptation | `core/session_adaptation_engine.py` | adaptation en VoltaDashboard |
| 03 | Macrocycle | `core/macrocycle_engine.py` | CoachMacroView, AssignMacrocycle |
| 18 | Theme | – | ThemeContext, ThemeGallery |

### 🟡 Parcialmente implementados (8)

| # | Engine | Falta | Esfuerzo p/ completar |
|---|---|---|---|
| 04 | Gamification | XP tracking real backend · quest engine | 6-8h |
| 05 | Belt | Logic backend del tier-up (hoy `prior_fitness` hack) | 2-3h |
| 08 | Warmup | Smart warmup generator (hoy estático) | 3-4h |
| 11 | OLY Index | Endpoint dedicado · normalización vs población | 2h |
| 14 | Smart Coach | Alertas automáticas, categorización atletas | 4-6h |
| 15 | Píldoras | Engine de recomendación · backend persistence | 3-4h |
| 16 | Social | Engine viral analytics (hoy SocialCard estático) | 2-3h |
| 24 | AI Brains RAG | rag_retriever existe · falta integración chat WISE | 4-5h |

### ❌ NO implementados (12)

| # | Engine | Spec | Esfuerzo MVP |
|---|---|---|---|
| 06 | Smart Streak (adherence + comebacks) | engines/06_smart_streak_engine.md | 3-4h |
| 07 | BW Milestone (logros body weight) | engines/07_bw_milestone_engine.md | 2-3h |
| 09 | Pulse (anaeróbico) | engines/09_pulse_engine.md (725 líneas) | 8-12h |
| 10 | Balance (FS/BS, Snatch/Clean ratios) | engines/10_balance_engine.md | 4-5h |
| 12 | Lifestyle (sleep/work/stress load factor) | engines/12_lifestyle_engine.md | 5-6h |
| **13** | **Hormonal · Ciclo menstrual** | **engines/13_hormonal_engine.md** | **6-8h** |
| 17 | Golden Ratio (PR proportions) | engines/17_golden_ratio_engine.md | 3-4h |
| 19 | Privacy | engines/19_privacy_engine.md | ✅ Hecho en commit `605c5df` |
| 20 | Readiness Cache | engines/20_readiness_cache_service.md | 2-3h (perf) |
| 21 | Leaderboard Cache | engines/21_leaderboard_cache_service.md | 2-3h (perf) |
| 22 | IMR (Intensity Maintenance Ratio) | engines/22_imr_engine.md | 4-5h |
| 23 | Skin | engines/23_skin_engine.md | 2-3h (cosmetic) |

---

## Engine 13 · Ciclo menstrual (el que vos viste faltar)

**Spec completa**: 4 fases hormonales con ajustes de carga, intensidad y XP.

| Fase | Días | Load adj | Intensity | Focus |
|---|---|---|---|---|
| Menstruación | 1-5 | 0.85× | -10% | Recovery + técnica |
| Folicular | 6-14 | 1.05× | +5% | Strength + power |
| Ovulación | 15-17 | 1.10× | +10% | Peak performance · PRs |
| Lútea | 18-28 | 0.90× | -5% | Maintenance + stability |

**Implementación MVP (~6-8h):**
1. **Backend (3h)**
   - Migration 014: `hormonal_cycle_logs` (user_id, cycle_start, cycle_length, notes) · `hormonal_phase_overrides`
   - `/v1/hormonal/log` POST · `/v1/hormonal/current-phase` GET
   - Integrar en `session_adaptation_engine.py` · mod factor por fase
2. **Frontend (3-4h)**
   - Toggle opt-in en Profile (per default OFF · privacy)
   - Calendar input para start date + cycle length
   - Card en Wellness con "Fase actual · Ovulación día 16 · +10% intensidad"
   - Badge sutil en VoltaDashboard cuando fase es relevante para WOD
3. **UX considerations**
   - Privacy: data sensible · cumple GDPR (ya soportado · Profile delete account elimina)
   - Solo female athletes opt-in · ningún flag de género obligatorio en signup
   - Override manual si la atleta percibe distinto

---

## Priorización por impact × esfuerzo

### 🔥 Sprint 1 · Alto impact + bajo esfuerzo (10-12h total)

| # | Engine | Por qué prioritario |
|---|---|---|
| 05 | Belt Engine backend | Fix gamificación crítica (premia acción equivocada hoy · ver AUDIT_GAMIFICATION_BUILDERCULT) |
| 06 | Smart Streak | Retention loop core · ya hay UI streaks pero sin engine real |
| 20+21 | Cache services | Mejora performance · base para escalar |
| 11 | OLY Index endpoint | Hoy calc inline · cleaner architecture |

### ⚡ Sprint 2 · Diferenciadores únicos (12-16h total)

| # | Engine | Por qué |
|---|---|---|
| **13** | **Hormonal · Ciclo** | **Diferenciador clave para mercado female · poca competencia tiene esto** |
| 09 | Pulse | Core HO (anaeróbico para olímpicos) · 725 líneas de spec lista |
| 10 | Balance | Anti-lesión · safety feature |
| 14 | Smart Coach | Alertas automáticas reducen carga coach manual |

### 💡 Sprint 3 · Polish + Engagement (8-10h total)

| # | Engine | Por qué |
|---|---|---|
| 07 | BW Milestone | Achievement loop |
| 12 | Lifestyle | Mejora precisión readiness |
| 15 | Píldoras engine | Engagement diario |
| 17 | Golden Ratio | Gamification depth |
| 22 | IMR | Coaching insight |

### 🎨 Sprint 4 · Optional / cosmético (4-6h)

| # | Engine | Por qué |
|---|---|---|
| 23 | Skin | Cosmético puro |
| 16 | Social engine | Métricas virales |
| 24 | AI Brains RAG full | Chat WISE más profundo |

---

## Recomendación práctica

**Stop · think:** ¿qué problema resuelve cada engine para el atleta/coach real?

1. **Engine 13 (Hormonal)** — Te lo señalaste. Es genuinamente diferenciador. Pero requiere data sensible + opt-in claro. Sprint 2.

2. **Engine 05 (Belt) y 06 (Streak)** — Ya tienen UI pero el motor está fake. Riesgo de "vanity gamification" del audit Buildercult. Sprint 1.

3. **Engines de cache (20, 21)** — Hoy no son necesarios (volumen bajo). Postergar hasta tener problemas de performance.

4. **Engine 09 (Pulse)** — Spec gigante (725 líneas). Bien · pero es 8-12h de trabajo. Hacer cuando haya foco dedicado.

5. **Engines cosmetic (23, 16)** — Skip hasta que el core esté sólido.

**Total stack:** Si querés cerrar el 80% del valor en ~30h de trabajo, hacer Sprint 1 + 2 (28h).

---

## Cómo arrancar Engine 13 (próximo paso concreto)

```bash
# 1. Migration
backend/migrations/014_hormonal_cycle.sql

# 2. Endpoints
backend/src/api/hormonal/__init__.py
backend/src/api/hormonal/hormonal.py

# 3. Service
backend/src/services/hormonal_phase.py  # determinePhase(today, cycle_start, cycle_length)

# 4. Integration
# session_adaptation_engine.py · agregar mod factor de fase

# 5. Frontend
frontend/src/pages/HormonalSetup.tsx  # opt-in + input
frontend/src/components/HormonalPhaseCard.tsx  # show current phase
# Integrar en Profile.tsx (toggle) y VoltaDashboard.tsx (card cuando hay data)
```

¿Empezamos con Engine 13 directamente, o priorizamos el Sprint 1 (Belt + Streak + cache)?

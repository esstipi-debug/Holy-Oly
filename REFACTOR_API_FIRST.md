# Refactor API-first · Inventario de migración

**Branch**: `feat/api-first-refactor` desde `mock-first-v1` (tag).
**Snapshot mock-first preservado**: branch `snapshot/mock-first-2026-05-27` + tag `mock-first-v1`.
**Objetivo**: eliminar mock data hardcoded del frontend · todo viene del backend · seed script pobla datos demo.

---

## Estado actual

- ✅ `backend/scripts/seed_demo.py` · pobla coach + 6 atletas + baselines + 30d wod_results + 90d cf_sessions
- ✅ `POST /v1/admin/seed-demo` endpoint (con `?reset=true` para limpiar antes)
- ⏳ Frontend sigue leyendo mocks · próximas fases

---

## Inventario mocks frontend (auditoría 2026-05-27)

### A · Archivos `frontend/src/data/` (9 files, ~95% mocks)

| Archivo | Items | Endpoint backend | Estado |
|---|---|---|---|
| `athletes.ts` | 6 atletas + 2 coaches | GET `/v1/coaches/athletes` | EXISTS pero distinto schema |
| `celebrations.ts` | 17 builders socialcards | client-side OK | — |
| `baseline.ts` | 28 tests baseline | GET `/v1/baseline/categories` | FALTA |
| `macrocycles.ts` | 32 programas | GET `/v1/macrocycles/available` | FALTA |
| `movements.ts` | 8 familias + progresses | GET `/v1/movements/{id}/progress` | FALTA |
| `quests.ts` | daily quests | GET `/v1/gamification/quests` | FALTA |
| `skillTree.ts` | skill tree tiers | GET `/v1/skill-tree` | FALTA |
| `levels.ts` | XP curves | client-side OK | — |
| `wisePhrases.ts` | 30 frases | GET `/v1/content/daily-insight` | FALTA |
| `wodResults.ts` | 8 benchmarks Fran/Helen/etc | GET `/v1/benchmarks/list` | FALTA |

### B · Constantes hardcoded en pantallas

| Pantalla | Constante | Items | Endpoint |
|---|---|---|---|
| `VoltaCoachDash.tsx:42` | ROSTER | 6 atletas | GET `/v1/coaches/{id}/athletes?include=stress,readiness` (parcial) |
| `VoltaCoachDash.tsx:50` | WEEK_WODS | 7 días | GET `/v1/macrocycle/{id}/week/{n}` FALTA |
| `VoltaCoachDash.tsx:60` | TODAY_OBJECTIVES | 4 obj | GET `/v1/wod/{id}/objectives` FALTA |
| `VoltaCoachDash.tsx:66` | INVENTORY | 5 items | GET `/v1/box/{id}/inventory` FALTA |
| `VoltaStats.tsx:18` | BENCHMARKS | 5 | GET `/v1/benchmarks/my-results` FALTA |
| `VoltaStats.tsx:23` | WOD_TYPES | 4 cat | calc desde `/v1/wod/history` FALTA |
| `VoltaActiveWod.tsx:24` | WOD | 1+3 moves | GET `/v1/wod/today` FALTA |
| `CoachMacroView.tsx` | ROSTER | 6 atletas | endpoint parcial |
| `PerformanceDeepDive.tsx` | WEEK_DETAILS | 7 días | FALTA |
| `PrewodShare.tsx` | TODAY_WOD | 1 WOD | FALTA |

### C · localStorage como "DB" (20+ keys)

Keys que **deberían** ir a backend:
- `baseline:results` → POST `/v1/baseline/result`
- `volta_wod:score_draft` → POST `/v1/wod/draft`
- `social:*` (17 keys) → POST `/v1/celebrations/prepare`
- `belt:last_celebrated_idx` → user.last_belt_celebration
- `active_session:*` (2) → POST `/v1/sessions/draft`
- `wod:results` → POST `/v1/wod/results/bulk-sync`
- `units:current` → user.units_preference
- `notifications:enabled` → user.notifications_enabled
- `product:current` → user.product
- `app:demo_mode` → user.is_demo

Keys que pueden quedar en localStorage (UI prefs):
- `skillTree:view`, `holyoly-theme`, `nav:currentView`

---

## Roadmap de migración (priorizado)

### Fase 1 · Quick wins (~3-4h · YA EN PROGRESO)
- [x] Tag snapshot mock-first
- [x] Seed script backend + endpoint admin
- [ ] Endpoint `GET /v1/athletes/me/profile` (bw_kg, gender, age, weight_class)
- [ ] Endpoint `GET /v1/coaches/me/athletes` con stress + readiness incluidos
- [ ] Migrar `AthleteContext` → API en lugar de `data/athletes.ts`

### Fase 2 · WOD core (~6-8h)
- [ ] Tabla `wods` (custom + benchmarks) + migration
- [ ] Endpoints: list benchmarks · GET wod/{id} · POST wod/log · GET wod/today
- [ ] Migrar `VoltaActiveWod`, `VoltaStats`, `LogWodResult`
- [ ] Eliminar `data/wodResults.ts`, `data/baseline.ts` constants

### Fase 3 · Macrocycle + Coach roster (~6-8h)
- [ ] Tabla `athlete_macrocycle` (asignación) + endpoints
- [ ] GET `/v1/macrocycles/available` · GET `/v1/macrocycle/{id}/week/{n}/wods`
- [ ] Migrar `VoltaCoachDash` ROSTER + WEEK_WODS
- [ ] Eliminar `data/macrocycles.ts`

### Fase 4 · Gamification real (~5-6h)
- [ ] Endpoint quests · skill tree · celebrations
- [ ] Migrar `data/quests.ts`, `skillTree.ts`, `wisePhrases.ts`
- [ ] localStorage `social:*` → backend prepare endpoint

### Fase 5 · Polish (~3-4h)
- [ ] Loading skeletons en cada pantalla
- [ ] Empty states honestos ("Completá tu primer WOD para ver stats")
- [ ] Eliminar TODO mock restante
- [ ] Tests E2E con user demo seedeado

**Total estimado**: 25-30h de trabajo (vs ~4 semanas que dijo audit · más realista con seed cubriendo el 60% de datos básicos)

---

## Cómo recuperar la versión mock-first

```bash
# Opción A · checkout simple
git checkout mock-first-v1

# Opción B · worktree separado (correr ambas versiones en paralelo)
git worktree add ../Holy-Oly-mock mock-first-v1
cd ../Holy-Oly-mock
# La app aquí usa mocks · útil para demos a clientes
```

---

## Decisiones tomadas

1. **Seed script vs delete mocks**: elegimos seed · permite demo + datos reales en una sola código base.
2. **Idempotente con UPSERT**: re-correr `seed-demo` sin `?reset=true` no duplica.
3. **Branch separada para mock-first**: backup garantizado. Tag inmutable + branch visible.
4. **Migración incremental por fases**: NO refactor big bang · cada fase entrega valor visible.

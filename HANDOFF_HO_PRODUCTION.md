# HANDOFF · Holy Oly · PRODUCCIÓN

> Estado de producción **verificado en vivo**, no copiado de docs viejos.
> Fecha: **2026-05-29** · Commit HEAD: **`1e8eb00`** (`feat(engine-13)`).
> Reemplaza a `HANDOFF.md` (stale · cerraba en `337fe5c`, 8 commits atrás).

---

## 0. Cómo leer este doc

- **§1 VERIFICADO EN VIVO** = lo curleé contra `holy-oly-3.onrender.com` hoy. Es verdad ahora.
- **§2 BLOQUEANTES** = solo dashboard Render, acción del Boss. No resolubles por código.
- **§5 VERIFICAR VOS MISMO** = curls listos para re-confirmar en cualquier sesión.

Regla: si una afirmación no está en §1, no está verificada en vivo — está inferida del código.

---

## 1. Snapshot producción · VERIFICADO EN VIVO (2026-05-29)

| Check | Resultado | Cómo |
|---|---|---|
| Backend `/health` | ✅ 200 · 0.29s warm | `curl /health` |
| DB Postgres | ✅ conectada · 22 users · 23 tablas | `/v1/admin/db-status` |
| Migraciones | ✅ **hasta 014** aplicadas en prod | tablas presentes (abajo) |
| Routes vivas | ✅ **147** | `/openapi.json` |
| Auth login | ✅ funciona · **OAuth2 form** (`username`+`password`, NO JSON `email`) | `/v1/auth/login` |
| Engine-13 ciclo menstrual | ✅ **deployado** · `/v1/hormonal/{setup,log,current,history}` | `/openapi.json` |
| WISE LLM | ⚠️ **Lite mode** (`level: "lite"`) · sin Mistral | `/v1/wise/ask` |
| MercadoPago | ⚠️ `payment_intents: 0` · sin tráfico real | `/v1/admin/db-status` |

**Tablas en prod (23):** `users` · `baseline_results` · `wod_results` · `push_subscriptions` · `coach_skill_focus` · `wellness_checkins` · `manual_sessions` · `coach_skill_evaluation` · `volta_competitor_profiles` · `custom_wods` · `cycle_tracking` · `cycle_log_entries` · `social_screenshots` · `payment_intents` · `wise_score_snapshots` · `cf_*` (8 tablas Volta).

**URLs vivas:**
- Frontend: `https://holy-oly.onrender.com`
- Backend: `https://holy-oly-3.onrender.com` (`/docs` OK)
- Repo: `https://github.com/esstipi-debug/Holy-Oly`

**Veredicto producción: 🟢 VERDE.** Backend live, DB sana, código al día (HEAD deployado), 14 migraciones corridas. Lo único degradado es WISE (Lite en vez de Mistral) y pagos (sin keys de producción) — ambos por env vars faltantes, no por bugs.

---

## 2. Bloqueantes activos · SOLO BOSS (dashboard Render)

Ninguno bloquea el core. Todos degradan una feature secundaria. Ver `.claire/bloqueantes_runbook.md` para pasos.

| # | Bloqueante | Evidencia hoy | Efecto | Tiempo |
|---|---|---|---|---|
| 1 | **`MISTRAL_API_KEY`** no seteada | WISE devuelve `level: "lite"` | Chat WISE usa templates, no LLM real | 3 min |
| 2 | **MP keys de producción** | `payment_intents: 0` · token sandbox `TEST-…` | Pagos solo en sandbox | 5 min |
| 3 | **`MP_PLAN_ID_*`** (4) | env vars no seteadas | Suscripciones no activan | 5 min |
| 4 | **VAPID keys** | no verificable vía API | Push notifications no envían | 5 min |
| 5 | Billing alerts Mistral ($5/$10/$25) | — | Riesgo de costo sin tope | 2 min |

**Pasos exactos** (env vars en servicio `holy-oly-3`):
1. `MISTRAL_API_KEY` → console.mistral.ai → nueva key → Render env. WISE pasa a Mistral al redeploy.
2. `MP_ACCESS_TOKEN` + `MP_PUBLIC_KEY` de producción → Render env.
3. `POST /v1/admin/mp/create-plans` (con `X-Admin-Token`) → setear los 4 `MP_PLAN_ID_*` que devuelve.
4. `python scripts/generate_vapid_keys.py` → setear `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (backend) + `VITE_VAPID_PUBLIC_KEY` (frontend).
5. Billing alerts en console.mistral.ai.

Costo estimado Mistral con fixes ya aplicados (rate limit + LRU cache): ~$6–21/mes a 1000 calls/día.

---

## 3. Qué shippeó desde el HANDOFF.md viejo (`337fe5c` → `1e8eb00`)

```
1e8eb00 feat(engine-13)  Ciclo menstrual · hormonal periodization MVP (full-stack)
8d91860 docs(roadmap)    audit 24 engines spec vs implementación real
bb702af fix(mobile)      safe-area en CTAs + scroll en tabs VoltaStats
3dc810b docs(audit)      gamificación HO/Volta vs 6 principios Buildercult
aab1e41 fix(mobile)      modales y footers respetan safe-area + bottom nav 76px
050b907 fix(volta)       celebration dinámica + alerts reales + WOD source único
605c5df feat(app-store)  privacy policy + terms + delete account + data export
312308d docs(handoff)    bump version
```

**Lo importante:**
- **Engine-13 (ciclo menstrual)** · full-stack: migration 014, `services/hormonal_phase.py`, router `/v1/hormonal/*`, integración en `session_adaptation_engine.py`, frontend `HormonalSetup.tsx` + `HormonalPhaseCard.tsx` + toggle en Profile. **Deployado y vivo.**
- **App-store compliance** (`605c5df`) · privacy policy + T&C + delete account + data export. Requisito Apple/Google review — antes era backlog, ahora hecho.
- **Mobile polish** · safe-area en CTAs/modales/footers + bottom nav 76px.

---

## 4. Engines · estado (doc fresco: `AUDIT_ENGINES_PENDING.md`)

Al commit actual: **6 de 24 fully** (audit decía 4 + se sumaron 13 Hormonal y 19 Privacy) · 8 parciales · 10 ausentes.

**Fully:** 01 Stress · 02 Session Adaptation · 03 Macrocycle · 18 Theme · 19 Privacy · 13 Hormonal.

**Sprint 1 recomendado (~10-12h · alto impact/bajo esfuerzo):**
| # | Engine | Por qué |
|---|---|---|
| 05 | Belt backend | Audit Buildercult: hoy premia acción equivocada (`prior_fitness` hack) |
| 06 | Smart Streak | Retention loop core · hay UI sin engine real |
| 20+21 | Cache services | Base para escalar |
| 11 | OLY Index endpoint | Hoy calc inline |

**Sprint 2 (diferenciadores):** 09 Pulse · 10 Balance · 14 Smart Coach · 12 Lifestyle.

---

## 5. Verificar producción vos mismo

```bash
# Health + DB (admin token: ver HANDOFF.md §3 o .claire/)
curl -s https://holy-oly-3.onrender.com/health
curl -s https://holy-oly-3.onrender.com/v1/admin/db-status -H "X-Admin-Token: <ADMIN_TOKEN>"

# Login (OJO: form-urlencoded, no JSON; creds sim en .claire/sim_users.json)
TOKEN=$(curl -s -X POST https://holy-oly-3.onrender.com/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=sim_ho_atleta_1@holyolysim.com" \
  --data-urlencode "password=SimTest123!" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# WISE mode (level: "lite" = sin Mistral · "mistral"/"gemini" = LLM real)
curl -s -X POST https://holy-oly-3.onrender.com/v1/wise/ask \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"question":"como mejoro mi snatch?"}'

# Engine-13 vivo
curl -s https://holy-oly-3.onrender.com/v1/hormonal/current -H "Authorization: Bearer $TOKEN"
```

---

## 6. Hallazgos de esta verificación (corregir en docs)

1. **Route path engine-13:** el audit y el plan dicen `/v1/hormonal/current-phase`. **Real = `/v1/hormonal/current`.** El path con `-phase` da 404.
2. **Login es OAuth2 form**, no JSON. `{"email":...}` → 422. Usar `username`+`password` form-urlencoded.
3. **Tokens sim seedeados (`.claire/sim_users.json`) están expirados.** Re-loguear con creds (password `SimTest123!`), no reusar `access_token` del JSON.
4. **WISE confirmado en Lite** — no asumir Mistral activo en ningún doc hasta verificar `level`.

---

## 7. Próximo paso recomendado

**Sprint 1 engines** (Belt backend + Smart Streak + cache + OLY index). Arregla el riesgo de "vanity gamification" del audit Buildercult y cierra el retention loop, sin depender de ninguna acción del Boss en el dashboard.

Alternativa de 0 fricción para el Boss: setear `MISTRAL_API_KEY` (3 min) saca a WISE de Lite y mejora la demo inmediatamente.

---

## 8. Archivos críticos

| Archivo | Por qué |
|---|---|
| `HANDOFF_HO_PRODUCTION.md` (este) | Estado prod verificado |
| `HANDOFF.md` | Historia detallada hasta `337fe5c` (admin token, decisiones de diseño) |
| `AUDIT_ENGINES_PENDING.md` | Roadmap 24 engines + sprints |
| `AUDIT_GAMIFICATION_BUILDERCULT.md` | Por qué Belt/Streak son prioridad |
| `.claire/bloqueantes_runbook.md` | Pasos env vars del Boss |
| `.claire/sim_users.json` | Creds QA (gitignored) |
| `backend/src/main.py` | 24 routers · 147 routes |
| `backend/src/services/hormonal_phase.py` | Engine-13 lógica de fase |
| `backend/src/core/*.py` | Stress · adaptation · macrocycle engines |

---

**Verificado end-to-end · 2026-05-29 · commit `1e8eb00`:** backend 🟢 · DB 🟢 · migraciones 🟢 (014) · engine-13 🟢 · WISE 🟡 Lite · pagos 🟡 sandbox.

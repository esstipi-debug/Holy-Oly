# HANDOFF · Holy Oly · arranque de sesión nueva

> **Leer esto + la auto-memoria (`MEMORY.md`) antes de tocar nada.** Verificado, no stale.
> Cierre: **2026-05-30** · deploy live `origin/main = 4e6ddce` (confirmado en el sitio).

---

## 0. ⛔ LO MÁS IMPORTANTE (no repetir los errores de esta sesión)

1. **Hay DOS líneas. `main` NO es la real.**
   - **`feat/api-first-refactor`** (local + origin) = la línea REAL: **+112 commits** sobre `main`,
     **nunca mergeada**. Tiene el **diseño con discos V2** (`pages/v2/AtletaHomeV2`, `CoachDashV2`,
     `plate-3d/plate-stack`, `styles/v2/*`), **engines reales** (`backend/src/services/*`:
     belt, streak, oly_index, smart_coach, lifestyle, macrocycle_db), roster real + NewAthlete
     persiste, weight tracking, Google auth, PWA. Ver memoria `canonical_branch.md`.
   - **`main`** = línea vieja (UI mock + data mock) + lo que agregó esta sesión.
   - **Antes de construir cualquier cosa de HO: comparar contra `feat/api-first-refactor`**
     (`git branch -a --contains <commit>`). Probablemente ya existe ahí. **DECISIÓN PENDIENTE del
     Boss: consolidar esa branch como main, o seguir en main.**

2. **DATA y DISEÑO REALES · cero invento sin OK** (memoria `real_data_only.md`, también en `AGENTS.md`):
   - Nada de mock/generado/`data/*` para datos del atleta sin aprobación. Falta lo real → PARAR y preguntar.
   - No reemplazar/borrar trabajo existente sin OK (complementar/re-skinear).
   - **Cerrar el ciclo = DEPLOY (commit + push a main), no solo preview local.** El Boss ve el sitio
     desplegado, no tu localhost. (Esta sesión laburé todo local y el Boss vio "nada cambió".)
   - Verificar contra código/backend antes de afirmar.

---

## 1. Estado deployado (verificado live · 2026-05-30)

- `origin/main = 4e6ddce`. Live `holy-oly.onrender.com` sirviendo el bundle nuevo (Saira + index-B2ugnH_2.js).
- Backend `holy-oly-3.onrender.com` vivo (health 200 antes en la sesión). DB 23 tablas, migraciones a 014.
- WISE en **Lite** (falta `MISTRAL_API_KEY`). Pagos sandbox. VAPID falta. (Bloqueantes del Boss · dashboard Render.)

## 2. Qué se hizo esta sesión (2026-05-30) — todo en `main` @ 4e6ddce

- **Home atleta HO limpiado**: removidos ranking semanal, píldoras, skill tree, oly index, racha, quests.
- **Explorador "sesión de hoy"** (`components/MacrocycleExplorer.tsx`) re-skineado al **diseño de discos
  Peak Qual** (tokens `.pq` scoped, Space Grotesk/JetBrains Mono): carta del día (movimientos · %RM · peso)
  + flechas ◀▶ día↔día + curva de intensidad + **iconos HOLY OLY** en los movimientos.
- **`components/PlateIcon.tsx`**: 24 iconos de disco HOLY OLY (4 pesos × ¾/flat × 3 tamaños), port FIEL
  del handoff Claude Design (`_design_tmp/discos/`, gitignored). Tokens en `styles/peakqual/`.
- **Fixes deployados antes**: PhoneLayout full-bleed móvil (`478a163`), demo error-leak en cards (`edf89a8`).
- **Docs**: `AUDIT_DATA_INTEGRITY.md` (mapa de fuentes de datos), este handoff, regla dura en `AGENTS.md`.
- Memoria nueva: `canonical_branch.md`, `real_data_only.md`.

## 3. Integridad de datos (resumen · ver `AUDIT_DATA_INTEGRITY.md`)

4 capas desconectadas: backend real (subutilizado) · mock `data/*` · localStorage · generado.
- **Se pierde data**: Onboarding no guarda · sesiones HO solo en localStorage · belt/plan local.
- **Mock/generado donde hay real**: `AthleteContext` lee `data/athletes` (usuario real = ceros) ·
  roster coach mock · explorador usa plan **generado** (no el engine real) · stats mock.
- **IDs rotos**: macro mock `russian_classic` ≠ engine `bulgaro-6d`; atleta `ath_001` ≠ UUID; demo sin token.
- **Backend roto**: `/v1/alerts/me` 500 · `/v1/coach/dashboard-kpis` 500.
- Raíz: sin fuente única de verdad = el **spine** (lo resuelve mayormente `feat/api-first-refactor`).

## 4. Pendientes / decisiones para el Boss

| # | Pendiente | Nota |
|---|---|---|
| 1 | **Consolidar `feat/api-first-refactor`** (la línea real) o seguir en main | LA decisión grande |
| 2 | **Dos "sesión de hoy"** en el home (explorador nuevo + sección pre-existente "Arrancada 95kg") | unificar? |
| 3 | Wire del **spine** (perfil/maxes/roster/sesiones reales) — o adoptar la refactor que ya lo tiene | data real |
| 4 | `MacrocicloMask.tsx` quedó **sin uso** (se fusionó en el explorador) | borrar o reusar |
| 5 | Bloqueantes Render del Boss: `MISTRAL_API_KEY`, MP prod, VAPID | dashboard |
| 6 | El explorador usa **plan generado** (no engine real) — discos/curva ok, pero data no es la real | spine |

## 5. Cómo arrancar la próxima ventana

```
Leé HANDOFF_HO_PRODUCTION.md + la auto-memoria (regla data/diseño reales + branch canónica).
Deploy live: origin/main = 4e6ddce. App: holy-oly.onrender.com · backend holy-oly-3.onrender.com.
OJO: la línea REAL es feat/api-first-refactor (+112, sin mergear) — NO main. Comparar antes de construir.
Branch de trabajo de esta sesión: claude/musing-cannon-ba8d69 (= main + el trabajo de hoy, ya pusheado).
Primer paso: que el Boss decida consolidación de branch (#1) o la tarea puntual.
```

## 6. Archivos clave de esta sesión
- `frontend/src/components/MacrocycleExplorer.tsx` · explorador con discos (la pantalla del Boss)
- `frontend/src/components/PlateIcon.tsx` · iconos de disco HOLY OLY
- `frontend/src/styles/peakqual/{tokens,macrocycle}.css` · diseño Peak Qual scoped `.pq`
- `frontend/src/pages/AtletaHome.tsx` · home limpiado
- `AUDIT_DATA_INTEGRITY.md` · auditoría de datos
- `_design_tmp/discos/` · handoff de iconos del Boss (gitignored · NO commitear)

# HANDOFF · Punto de partida para nuevo chat

> Este documento es el **input completo** para un chat nuevo. Lee esto primero, después los docs referenciados, y arrancá la siguiente tarea.

## Quién soy y qué estoy construyendo

**Producto:** Holy Oly + Volta — plataforma smart training mobile-first.
- **Holy Oly (HO):** halterofilia olímpica. Atleta sigue macrociclos (Búlgaro, Cubano, Coreano, etc), registra sets/reps/%1RM, coach asigna planes y monitorea roster.
- **Volta:** CrossFit. Atleta hace WODs (AMRAP/EMOM/For Time), coach del box programa, gestiona inventario, evalúa macro.

4 cuadrantes: `{HO, Volta} × {Atleta, Coach}` con UI específica para cada uno.

## Estado actual de la app (resumen 30s)

| Capa | Estado |
|------|--------|
| **Frontend** | ✅ Live en `https://holy-oly.onrender.com` (Render auto-deploy desde main) |
| **Backend** | ❌ `https://holy-oly-api.onrender.com` devuelve 404 — caído desde hace tiempo |
| **DB** | ❌ Postgres definido en render.yaml pero migraciones nunca aplicadas |
| **Auth** | ❌ Cae a demo mode (mock user en localStorage) porque backend no responde |
| **Persistencia** | ❌ Todo en localStorage del browser |
| **Funcionalidad UI** | ✅ Todas las pantallas implementadas con mock data realista |

**Bottom line:** la app se ve y se siente production-ready pero **nada persiste**. Es un prototipo completo, no un producto operativo.

## Documentos clave (leer en este orden)

1. **`SPEC_FUNCIONAL.md`** — manual íntegro de cómo debe funcionar cada pantalla, cada botón. 647 líneas. Es la fuente de verdad.
2. **`VERIFY_MANUAL.md`** — matriz rápida role × tab × pantalla esperada.
3. **`ESTADO_OPERATIVO.md`** — diagnóstico honesto del estado vs producción.
4. **`PLAN_TRABAJO.md`** — Gantt de 6 fases para llegar a operativa.
5. **`SPEC_QUADRANTS.md`** — primer spec por cuadrante (más viejo, hay overlap con SPEC_FUNCIONAL).
6. **`AUDIT_LOGICA_DEPORTE.md`** — cross-contamination HO ↔ Volta identificada y resuelta.
7. **`GAMIFICATION_BLUEPRINT.md`** — análisis de 20 repos de gamification mapeados al producto.

## Stack técnico

```
frontend/
├── React 19 + TypeScript + Vite + Tailwind CSS v4
├── framer-motion (animaciones)
├── Context API (Auth, Athlete, Product, Role, Navigation, Theme)
├── Tipografía Inter (Google Fonts)
└── Sin router · Custom NavigationContext hash-based

backend/
├── FastAPI Python
├── asyncpg pool (users_repo.py) con fallback MOCK_USERS
├── Migraciones SQL en backend/migrations/
└── Render service Docker

infra/
├── Render (frontend static site + backend Docker + Postgres)
├── render.yaml define los 3 servicios
└── GitHub Actions workflow para auto-deploy backend (roto · RENDER_DEPLOY_HOOK_URL vacío)
```

## Lo que SE HIZO en chats anteriores (12 PRs mergeados a main)

### PR #1 (no existe, asumimos main inicial)
Estado base del proyecto.

### PR #2 — `89bae80` — feat: GitHub OAuth + frontend audit
- Audit visual completo de 20+ pantallas
- Theme migration: 134 hardcoded Tailwind → CSS vars
- Role-based navigation
- Dynamic data (dates, names, caffeine decay)
- GitHub OAuth (después removido en PR #6)

### PR #3 — `630f775` — fix(build): TS errors estrictos
3 errores `tsc -b` que `tsc --noEmit` local no captura.

### PR #4 — `04695cd` — fix(audit): 2 bugs visuales overlap
ActiveSession footer + VoltaCoachInventory WISE FAB.

### PR #5 — `aaa258c` — fix(coach+naming) Profile + Clean & Jerk + sets×reps
- Profile coach diferenciado del atleta (sin AchievementsGrid)
- "Dos Tiempos" → "Clean & Jerk" globalmente
- ActiveSession header con sets×reps prominente

### PR #6 — `d4b0a00` — chore: remove GitHub OAuth
Removido por decisión del usuario (no debe estar en la app).

### PR #7 — `9d0ac91` — feat: HO Coach Stats coach-specific
Nueva pantalla `CoachStatsHO` con métricas del club (tonelaje, PRs colectivos, adherencia, top performers).

### PR #8 — `a118b5a` — docs: SPEC_FUNCIONAL.md
Manual íntegro 647 líneas.

### PR #9 — `2429d58` — feat: skill tree 95 movimientos + vista árbol SVG
Integración del diseño "Árbol de Habilidades CrossFit". 95 skills en 4 subjects con prereqs, vistas Lista + Árbol SVG, BottomSheet detalle.

### PR #10 — `dccda98` — docs: ESTADO_OPERATIVO + PLAN_TRABAJO
Diagnóstico + Gantt 6 fases.

### PR #11 — `b8fd943` — fix: navegación skill tree
Back button + tier sidebar + jump scroll.

### PR #12 — `fb3ace8` — fix(skill-tree): 2-tap interaction
1er tap → ilumina rama. 2do tap o FAB → abre modal.

### PR #13 (current branch, sin mergear todavía)
- Quick fix `SocialCard`: removidos botones Compartir + Guardar Galería, full-screen para screenshot

## Pantallas del proyecto (36+ implementadas)

Ver `SPEC_FUNCIONAL.md` para detalle de cada una. Resumen:

| Cuadrante | Tabs | Pantallas principales |
|-----------|------|----------------------|
| HO Atleta | 4 (home/train/stats/profile) | HOME, WARMUP, SESSION, SUMMARY, VICTORY, PERFORMANCE, INDEX, SCHEDULE, PULSE, PILLS, SOCIAL, PROFILE, ONBOARDING, PREMIUM |
| HO Coach | 3 (atletas/stats/profile) | COACH_DASH, COACH_STATS, ATHLETE_DETAIL, ASSIGN_MACRO, NEW_ATHLETE, PROFILE |
| Volta Atleta | 5 (inicio/wod/stats/logros/profile) | VOLTA_HOME, VOLTA_PREWOD, VoltaWarmup, VoltaActiveWod, VoltaWodSummary, PROGRESSION (skill tree), SOCIAL, PROFILE |
| Volta Coach | 5 (inicio/wod/stats/box/profile) | VOLTA_COACH, VOLTA_COACH_WOD, VOLTA_COACH_MACRO, VOLTA_COACH_INVENTORY, PROFILE |

## Próxima conversación: prioridades

### 🔥 NUEVO: Pantallas virales (Volta atleta · Logros)

**Pedido del usuario textual:**
> "el objetivo de esta pantalla es para que los atletas celebren y compartan sus logros y progresos. Para ello debemos dejar en claro que aspectos podemos celebrar y cómo los mostramos, quizás tengan más de un estilo de visualización. La idea central de esta sección es que los atletas tomen screenshot de estas pantallas, por lo que es crucial medir si esto pasa. Así podemos llevar un registro de qué es lo que funciona mejor. Esta lógica de las pantallas alimenta una forma de autopromoción, para evitar pagar por marketing, la viralidad de las pantallas."

**Lo que ya hice (PR #13):**
- SocialCard full-screen sin botones
- Branding "HOLY OLY · SMART TRAINING" + fecha + hashtag

**Lo que falta (siguiente tarea):**

1. **Catálogo de logros celebrables** — Definir qué cosas valen la pena celebrar:
   - PR nuevo (Snatch, C&J, Squat, Pull-up, etc)
   - Primer muscle-up / HSPU / DU (skill milestones del Skill Tree)
   - Racha de N días sin saltar
   - Tier-up (Cinturón Azul → Púrpura, Iniciado → Comprometido)
   - WOD benchmark completado (Fran, Murph, Helen)
   - Total Olímpico nuevo (Snatch + C&J)
   - 100 sesiones / 365 sesiones (consistency milestones)
   - Aniversario en la plataforma
   - "Top 10% del club" en algún WOD del día

2. **Múltiples estilos de visualización** — 3-5 variantes con look distinto:
   - **Minimalist**: tipografía gigante + 1 número, branding chico (actual)
   - **Stadium**: foto/gradient deportivo de fondo + glow + medalla
   - **Stat sheet**: como ficha técnica de boxeo con cuerpo + maxes
   - **Trophy**: emoji 3D grande, podium con confetti
   - **Progress**: before/after — Snatch hace 6 meses vs hoy
   - Selector arriba "Estilo: ◀ Stadium ▶" para que el atleta elija el que más le guste

3. **Tracking de screenshots** — métrica crítica:
   - Usar `document.visibilitychange` + `Page Visibility API` para detectar cuando user sale momentáneamente (toma screenshot)
   - iOS: detectar via `UIScreenCapturedDidChangeNotification` (necesita native bridge)
   - Web alternativo: detectar `Screen Capture API` events
   - Heurística: tiempo prolongado en pantalla SOCIAL (>5s) + abandono → probable screenshot
   - Enviar event al backend: `POST /v1/social/screenshot { card_variant, achievement_type, dwell_time_ms }`

4. **A/B testing entre estilos**:
   - Asignar variante por usuario (random consistente)
   - Trackear cuál variante recibe más screenshots
   - Dashboard backend para ver: qué estilo + qué tipo de logro = más virality

5. **Auto-trigger de SOCIAL cuando ocurre evento celebrable**:
   - PR logged → toast "🎉 Nuevo PR! ¿Compartilo en redes?" → tap → ir a SOCIAL pre-configurada con ese PR
   - Después de Victory screen post-WOD → opción "Crear postal para redes"

**Esfuerzo estimado:** 3-4 días para hacer esto bien.

### Después del viral framework, prioridades por orden

| Prioridad | Tarea | Esfuerzo | Bloqueado por |
|-----------|-------|----------|---------------|
| 🔴 1 | **Backend Render up** (diagnosticar 404) | 1-2h | Acceso dashboard Render del usuario |
| 🔴 2 | **Aplicar migraciones** Postgres | 30min | #1 |
| 🔴 3 | **Auth real funciona** (register + login persistente) | 1h | #2 |
| 🟡 4 | Persistencia core (sesiones, PRs, macros) | 5-7 días | #3 |
| 🟡 5 | Engagement engine (achievements + quests con triggers reales) | 3-5 días | #4 |
| 🟢 6 | Cerrar stubs restantes (Pulse modal, Schedule reprogramar, etc) | 2 días | independiente |
| 🟢 7 | Integraciones (Wearables HRV, Push, Stripe Premium, Video) | 8-12 días | #3 |

## Stubs pendientes (botones sin acción)

Ver `SPEC_FUNCIONAL.md` sección 9 para lista completa. Resumen:
- `PULSE` "UNIRSE AL PULSE" (no abre modal de reto)
- `SCHEDULE` "SOLICITAR REPROGRAMACIÓN"
- `VoltaCoachWod` "Borrador" + "Publicar al box"
- `VoltaCoachTools` "Marcar deload" + "Exportar review"
- `PREMIUM` "Elegir Elite" no inicia checkout
- `MovementProgression` ya OK (BottomSheet implementado)
- `Profile coach HO` "Inventario" no tiene destino
- `+ Agregar` cafeína pre-WOD
- WiseAssistant chat con LLM real (hoy es pattern matching local)

## Acceso al repo

- **GitHub:** `esstipi-debug/Holy-Oly`
- **Branch principal:** `main`
- **Worktree actual:** `claude/worktrees/busy-robinson-d4eaa0`
- **PRs mergeados:** 12 (numerados #2 al #12)
- **PRs pendientes:** próximo será #13 con SocialCard fix

## Render

- **Dashboard:** https://dashboard.render.com (usuario tiene credenciales)
- **Frontend:** `holy-oly` static site, auto-deploy desde main, ✅ live
- **Backend:** `holy-oly-api` Docker service, ❌ 404 (causa desconocida)
- **DB:** `holy-oly-postgres` Render Postgres, conexión auto-inyectada al backend
- **Domain custom:** no, sigue en `*.onrender.com`

## Decisiones de diseño establecidas

- **Holy Oly = halterofilia. Volta = CrossFit.** Productos separados, no mezclar.
- **Roles separados.** Coach NO entrena en la app. Atleta NO gestiona roster.
- **GitHub OAuth ELIMINADO** (usuario lo pidió expresamente).
- **"Clean & Jerk" NO "Dos Tiempos"** (notación internacional).
- **Inter como tipografía principal.**
- **CSS vars del theme** (no hardcoded colores en JSX).
- **Achievements son atleta-only** (coach no tiene grid de logros propios).
- **Skill Tree con 95 movs** del diseño handoff del usuario.
- **Persistencia localStorage** mientras no haya backend.

## Componentes globales reusables

| Componente | Propósito |
|------------|-----------|
| `<Button variant size loading>` | Botón con motion + loading spinner |
| `<BottomSheet open onClose title>` | Modal slide-up animado |
| `<Toast>` + `useToast()` | Notificaciones globales |
| `<Skeleton>` | Loading placeholder shimmer |
| `<WiseAssistant context bottomOffset>` | FAB chat AI (stub local) |
| `<AchievementsGrid product state>` | Grid de logros (solo atleta) |
| `<QuestsSection product progress weekOfYear>` | Quests semanales |
| `motion/<AnimatedPage>` | Wrapper page-level fade+slide |
| `motion/<Stagger>` | Children con cascada |
| `motion/<Tappable>` | Botón con whileTap/whileHover |

## Convenciones de código

- CSS classes globales en `frontend/src/styles/index.css`:
  - `.type-*` (typography canon)
  - `.anim-*` (animations)
  - `.btn-press` (active scale 0.94)
  - `.stagger > *` (children staggered)
- Storage keys con prefijo: `nav:currentView`, `role:current`, `product:current`, `skillTree:progress`, `skillTree:view`, `devNav:open`, `units:current`, `notifications:enabled`
- File naming: PascalCase (`MovementProgression.tsx`), camelCase para utils

## Workflow de commit/PR

1. Branch desde main: `git checkout -b fix/algo` o `feat/algo` o `docs/algo`
2. Commit con mensaje en español usando heredoc
3. Push: `git push -u origin <branch>`
4. Crear PR con `gh pr create --title ... --body ...`
5. Merge: `gh pr merge --squash` (si CI verde y sin conflictos)
6. Si hay conflicto con main: `git fetch origin main && git merge origin/main --no-edit`, resolver `--ours` para nuestros cambios, `git add` + commit + push

## Cosas que NO funcionan bien hoy

- `gh auth login` necesita ser corrido manualmente por el usuario (es interactivo)
- Render deploy hook workflow en GitHub está roto (secret vacío) → no afecta porque Render auto-deploya desde main por su cuenta
- Preview screenshots con SVG complejo (skill tree árbol) timeout — usar DOM inspection vía `preview_eval`
- Algunos `tsc --noEmit` local pasa pero `tsc -b` (que usa Render) falla por más strict mode

## Cómo arrancar el chat nuevo

Mensaje sugerido para el siguiente chat:

```
Leé HANDOFF.md primero. Después actualizá lo que sigue:

1. La pantalla SOCIAL (Volta atleta tab Logros) ahora es full-screen
   sin botones. Mi próximo objetivo es expandirla con:
   - Catálogo de "logros celebrables"
   - Múltiples estilos de visualización (3-5 variantes)
   - Tracking de screenshots
   - A/B testing entre estilos
   - Auto-trigger cuando ocurre evento celebrable

Empezá implementando el catálogo + 3 estilos visuales rotativos con
selector. El tracking de screenshots y A/B lo dejamos para después.

Si te falta contexto, leé SPEC_FUNCIONAL.md sección "Volta Atleta · SOCIAL".
```

---

**Fecha del handoff:** 2026-05-25
**Última PR mergeada:** #12 (fb3ace8)
**Próxima PR:** #13 (SocialCard quick fix en este branch)

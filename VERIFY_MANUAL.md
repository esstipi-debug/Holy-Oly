# Manual de Verificación · Role × Screen

Matriz para chequear sistemáticamente que cada combinación rol+producto vea contenido correcto.

## Cómo usar

1. Levantar app (local o https://holy-oly.onrender.com)
2. Para cada cuadrante (HO Atleta / HO Coach / Volta Atleta / Volta Coach):
   - Seleccionar Producto + Rol en el switcher arriba del teléfono
   - Clickear cada tab del bottom nav
   - Verificar contra esta matriz
3. Reportar discrepancias

---

## Matriz HO (Holy Oly · Halterofilia)

### HO Atleta (4 tabs)

| Tab | Icono | View que renderiza | Debería mostrar | Estado |
|-----|-------|---------------------|-----------------|--------|
| Inicio | 🏠 | `HOME` → `AtletaHome` | Saludo + readiness ring + sesión del día + cinturón XP | ✅ |
| Entrenar | 💪 | `WARMUP` → `WarmupGenerator` | Calentamiento Snatch técnico con tabs Mobility/Specific/Ramp | ✅ |
| Stats | 📊 | `PERFORMANCE` → `PerformanceDeepDive` | Volume Load, intensidad bars clickables, PRs Snatch/C&J | ✅ |
| Perfil | 👤 | `PROFILE` → `Profile` (atleta) | Avatar + suscripción + Logros 9/30 + settings atleta | ✅ |

### HO Coach (3 tabs · sin "Entrenar")

| Tab | Icono | View que renderiza | Debería mostrar | Estado |
|-----|-------|---------------------|-----------------|--------|
| Atletas | 👥 | `COACH_DASH` → `CommandCenter` | Roster (5/5), stats Total/Activos/Fatiga/Lesión, lista atletas con CTAs | ✅ |
| Stats | 📊 | `PERFORMANCE` → `PerformanceDeepDive` | ❌ MUESTRA PANTALLA DE ATLETA (OLY Index personal, Snatch personal) | 🔴 BUG |
| Perfil | 👤 | `PROFILE` → `Profile` (coach) | Stats roster, settings coach (Mi Box / Inventario) | ✅ Fixed en PR #5 |

**Bug:** tab Stats del coach HO debería mostrar **performance del club** (tonelaje agregado, PRs colectivos, top performers), no las stats personales del coach.

---

## Matriz Volta (CrossFit)

### Volta Atleta (5 tabs)

| Tab | Icono | View | Debería mostrar | Estado |
|-----|-------|------|-----------------|--------|
| Inicio | 🏠 | `VOLTA_HOME` → `VoltaDashboard` | CF Index, wellness, WOD del día, quests | ✅ |
| WOD | ⚡ | `VOLTA_PREWOD` → `VoltaPreWod` | Check HRV/sueño + mood + cafeína + alert intensity | ✅ |
| Stats | 📊 | `PROGRESSION` → `MovementProgression` | Skill Tree (23 skills, prereqs, drills) | ✅ |
| Logros | 🏅 | `SOCIAL` → `SocialCard` | Card de PR social compartible | ✅ |
| Perfil | 👤 | `PROFILE` → `Profile` (atleta) | Logros 9/30 + settings atleta | ✅ |

### Volta Coach (5 tabs)

| Tab | Icono | View | Debería mostrar | Estado |
|-----|-------|------|-----------------|--------|
| Inicio | 🏠 | `VOLTA_COACH` → `VoltaCoachDash` | Box Command: stats del box, macro activo, WOD de la semana | ✅ |
| WOD | ⚡ | `VOLTA_COACH_WOD` → `VoltaCoachWod` | Planificador WOD: AMRAP/EMOM/For Time builder | ✅ |
| Stats | 📊 | `VOLTA_COACH_MACRO` → `VoltaCoachTools` (tab macro) | Eval Macro: 8-semanas timeline, criterios, deload | ✅ |
| Box | 📦 | `VOLTA_COACH_INVENTORY` → `VoltaCoachTools` (tab inventario) | Inventario equipo: barras/plates/gymnastics editables | ✅ |
| Perfil | 👤 | `PROFILE` → `Profile` (coach) | Stats roster + settings coach | ✅ |

---

## Pantallas adicionales (acceso secundario)

### Sólo Atleta (`ATHLETE_ONLY` en App.tsx)
- `WARMUP`, `SESSION`, `SUMMARY`, `VICTORY` — flow de entrenamiento
- `PULSE`, `PILLS`, `INDEX`, `SCHEDULE` — herramientas atleta HO
- `ONBOARDING`, `PREMIUM` — onboarding y suscripción
- `VOLTA_PREWOD` — check pre-WOD Volta
- `SOCIAL` — share card

→ Si coach intenta navegar a alguna de estas → redirect a su home (COACH_DASH / VOLTA_COACH).

### Sólo Coach (`COACH_ONLY` en App.tsx)
- `COACH_DASH`, `ATHLETE_DETAIL`, `ASSIGN_MACRO`, `NEW_ATHLETE`
- `VOLTA_COACH`, `VOLTA_COACH_WOD`, `VOLTA_COACH_TOOLS`, `VOLTA_COACH_MACRO`, `VOLTA_COACH_INVENTORY`

→ Si atleta intenta navegar → redirect a su home (HOME / VOLTA_HOME).

### Compartidas (ambos roles)
- `PERFORMANCE` — ⚠ actualmente es atleta-only en contenido pero accesible por coach
- `PROFILE` — ahora role-aware (PR #5)
- `ATHLETE_DETAIL` (coach mira a un atleta)

---

## Bugs identificados en este audit

| # | Pantalla | Síntoma | Severidad |
|---|----------|---------|-----------|
| 1 | HO Coach → tab Stats | Renderiza `PerformanceDeepDive` (vista atleta) en vez de stats del club | 🔴 Alta |
| 2 | HO Coach → URL `#performance` directa | Misma raíz que el #1 | 🔴 Alta |
| 3 | HO Coach → URL `#index` directa | OLY Index personal del coach (no aplica) | 🟡 Media |
| 4 | HO Coach → URL `#schedule` directa | Planificación del atleta (no aplica) | 🟡 Media |
| 5 | HO Coach → URL `#pulse` directa | Wellness del atleta (no aplica) | 🟡 Media |

(Bugs 3-5 ya están parcialmente cubiertos: están en `ATHLETE_ONLY`, redirigen al coach a `COACH_DASH`. ✅)

(Bug 1-2: `PERFORMANCE` NO está en `ATHLETE_ONLY`, por eso permite acceso pero muestra contenido inadecuado.)

---

## Checklist rápido (para futuras verificaciones)

Al agregar/modificar pantallas, verificar:

- [ ] ¿La view tiene contenido específico al rol?
- [ ] Si es atleta-only → agregarla a `ATHLETE_ONLY[]` en App.tsx
- [ ] Si es coach-only → agregarla a `COACH_ONLY[]` en App.tsx
- [ ] Si es compartida → el componente debe leer `useRole()` y branchear contenido
- [ ] Tab del nav apunta a la view correcta según rol (chequear `handleNavChange` en App.tsx)
- [ ] Probar las 4 combinaciones rol×producto antes de mergear

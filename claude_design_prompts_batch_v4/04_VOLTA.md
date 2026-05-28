# Batch v4 · Bloque 4 · Volta (atleta + coach) · 10 prompts

> Volta = CrossFit · diferencia visual: acento cyan + lightning iconography · BPM-feeling.

---

## Sub-bloque 4A · Volta Atleta (6 prompts)

---

### Prompt 30 · VoltaDashboard (home Volta)

```
Diseña VOLTA DASHBOARD mobile-first · home del atleta Volta (CrossFit).

DIFERENCIA vs Holy Oly home: foco en WOD del día · benchmarks · doble sesión.

ESTRUCTURA:

ZONA A · HEADER VOLTA (sticky)
- Tag VOLTA + lightning ⚡
- Avatar atleta + nivel (RX/Scaled/Intermediate)
- Toggle producto top right (HO/VOL)

ZONA B · WOD DEL DÍA HERO (card big)
- Nombre WOD (FRAN · Hero WOD · Custom box)
- Tipo (AMRAP · For Time · EMOM · Chipper)
- Movimientos lista compacta
- Tiempo estimado + nivel dificultad
- CTA primary "Pre-WOD readiness" → VoltaPreWod

ZONA C · DOBLE SESIÓN BANNER (si aplica)
- "Segunda sesión hoy · 18:00"
- Sub: "Strength · Back Squat 5x5"
- Toggle "Empezar ahora" o "Más tarde"

ZONA D · READINESS WIDGET
- Ring readiness con score + recommendation
- "Vas en RX hoy · CNS 78 · sueño 7h"

ZONA E · BENCHMARKS HEROES (bento 2x2)
- FRAN time PR
- GRACE time
- HELEN time
- MURPH split (si tracked)
- Tap → drawer histórico

ZONA F · LAST 7 SESSIONS (mini cards horizontal)
- Cada sesión: tipo · tiempo · RX/Scaled · feedback emoji

ZONA G · QUESTS SEMANA (footer)
- "Quest: 4 sesiones esta semana · 2/4"
- "Quest: PR Helen · check después de WOD"

OUTPUT:
- VoltaDashboardV3.tsx
- API: GET /v1/volta/dashboard/me
```

---

### Prompt 31 · VoltaPreWod (readiness)

```
Diseña VOLTA PRE-WOD readiness mobile-first · pantalla antes de
empezar WOD para confirmar/ajustar prescripción.

ESTRUCTURA:

ZONA A · HEADER + WOD INFO
- "Pre-WOD · FRAN"
- Tipo · duración estimada

ZONA B · READINESS CHECK FAST (3 sliders rápidos)
- Sueño anoche (1-10)
- Stress general (1-10)
- Energía sensación (1-10)
- Auto-save al cambiar

ZONA C · CNS ESTIMADO RESULT
- Score grande tabular
- Recommendation chip: "RX completo" o "Scaled -20%" o "Skip y deload"

ZONA D · AJUSTE PRESCRIPCIÓN (si recommend scaled)
- Sliders para reducir reps/peso
- Preview WOD ajustado vs original
- Botón "Aceptar ajuste IA" o "Mantener RX igual"

ZONA E · WARMUP ENTRY
- "Mayhem warmup recomendado · 3 fases"
- Botón "Empezar warmup" → VoltaWarmup
- Skip "Ya hice warmup · al WOD"

OUTPUT:
- VoltaPreWodV3.tsx
- API:
  · GET /v1/volta/wod/today
  · POST /v1/volta/readiness
```

---

### Prompt 32 · VoltaWarmup (Mayhem 3 fases)

```
Diseña VOLTA WARMUP mobile-first · sistema Mayhem Athletics 3 fases.

CONTEXT: warmup específico CrossFit antes de WOD · 12-15 min.

ESTRUCTURA:

ZONA A · HEADER + PROGRESS
- "Mayhem Ready · {WOD name}"
- 3 dots progreso fases
- Skip warmup link discreto

ZONA B · FASE ACTUAL HERO
- "FASE 1 · GENERAL" (verde) o "FASE 2 · ESPECÍFICO" (amber) o "FASE 3 · MOVEMENT PREP" (red)
- Duración fase + timer countdown
- Ejercicios fase actual lista

ZONA C · EJERCICIO ACTUAL FOCUS
- Movimiento grande + reps/duración
- Video loop 3s GIF muscle
- "Próximo · {next exercise}"

ZONA D · FASE CONTROLS
- "Saltar fase" botón discreto
- "Repetir fase" botón
- Auto-advance al timer 0

ZONA E · MOVEMENT PREP ESPECÍFICO (Fase 3)
- Si WOD tiene Snatch · prep Sn especial
- Si tiene Burpees · prep cardio inicial
- Movimientos relevantes al WOD inminente

ZONA F · TIMER GLOBAL FOOTER
- Tiempo total transcurrido
- "Listo para WOD" cuando termina · navega ActiveWod

OUTPUT:
- VoltaWarmupV3.tsx
- API: GET /v1/volta/warmup/generate?wodId=...
```

---

### Prompt 33 · VoltaActiveWod (timer + reps live)

```
Diseña VOLTA ACTIVE WOD mobile-first · pantalla MÁS CRÍTICA Volta
durante WOD en vivo.

OBJETIVO: timer grande + tracking reps + tipo WOD (AMRAP/For Time/EMOM/Chipper).

ESTRUCTURA varía según tipo:

═══════ AMRAP MODE ═══════
ZONA A · TIMER COUNTDOWN GIGANTE
- "AMRAP 20 min" header
- Tiempo restante grande tabular HUGE
- Background color cambia: cyan → amber → red según tiempo

ZONA B · ROUND COUNTER + MOVIMIENTOS
- "Round 3 / ?" tabular
- Lista movimientos round actual con tap-count
- Movimiento focus: rep count buttons + - grandes

ZONA C · BOTÓN TAP-CIRCLE (tomar lap/round)
- Círculo grande centro · tap para +1 round
- Visual feedback haptic + ripple

═══════ FOR TIME MODE ═══════
ZONA A · STOPWATCH GIGANTE
- Cuenta hacia arriba
- Cap superior visible

ZONA B · MOVIMIENTOS LISTA (chipper style)
- Cada movimiento con reps count
- Tap movimiento → +1 rep
- Cuando termina movimiento · check verde

ZONA C · BOTÓN "FINISH WOD"
- Bottom · grande · rojo destacado
- Tap → registra time + navigate Summary

═══════ EMOM MODE ═══════
ZONA A · TIMER MINUTO ACTUAL
- Countdown 60s del minuto actual
- Progress ring 360º
- Minuto # tabular

ZONA B · MOVIMIENTO MINUTO ACTUAL
- "MIN 5 · 10 Burpees + 15 Air Squats"
- Tap-count opcional

ZONA C · TIMELINE MINUTOS COMPLETADOS
- Dots grid 20 min con estado: ✓ completado · ✗ failed · ⊙ current

═══════ CHIPPER MODE ═══════
ZONA A · STOPWATCH
ZONA B · LISTA MOVIMIENTOS LARGA
- Cada con reps count
- Visual progress fill por movimiento

INTERACCIONES UNIVERSAL:
- Haptic feedback grande en tap rounds
- Sound design opcional (beep cada round)
- Pausa con doble-tap (modal confirm)
- Auto-detect inactividad >30s · "estás OK?"

ESTADOS:
- Pre-start: 3-2-1 countdown grande
- WOD active: full timer mode
- WOD complete: confetti + navigate Summary
- Pause: scrim + Continue/Cancel

OUTPUT:
- VoltaActiveWodV3.tsx
- Props: { wodId, type: 'amrap'|'fortime'|'emom'|'chipper' }
- API:
  · POST /v1/volta/wods/{id}/start
  · POST /v1/volta/wods/{id}/rep (cada tap)
  · POST /v1/volta/wods/{id}/finish

REFERENCIAS:
- Wodify Pulse · WOD timer
- BTWB · benchmark logger
- CS2 HUD · timer monoespaciado tactical
```

---

### Prompt 34 · VoltaWodSummary

```
Diseña VOLTA WOD SUMMARY mobile-first · resumen post-WOD.

ESTRUCTURA:

ZONA A · HERO RESULT
- "FRAN · 4:23"
- "RX completo" o "Scaled"
- Comparativa con previous best: "+0:32 vs 16-abr" (mejora · rojo si empeoró)

ZONA B · STATS DETALLE
- Reps por movimiento
- Rounds/laps si AMRAP
- Tiempo total · split por round si applicable

ZONA C · FEEDBACK
- Emoji selector cómo te sentiste
- Notas opcional para coach

ZONA D · LEADERBOARD POSITION
- "Posición 7 / 23 de tu cohort hoy"
- Tap → Leaderboard

ZONA E · ACCIONES
- Share SocialCard
- Ver chart progresión
- Log notes
- Home

OUTPUT:
- VoltaWodSummaryV3.tsx
- API: POST /v1/volta/wods/{id}/result
```

---

### Prompt 35 · VoltaStats

```
Diseña VOLTA STATS mobile-first · dashboard analítico atleta CrossFit.

ESTRUCTURA:

ZONA A · HEADER + PERIOD
- "Mis Stats · Volta"
- Period chips: 7d · 30d · 3m · 6m · 12m

ZONA B · BENCHMARKS HERO (bento 3x2)
- FRAN · GRACE · HELEN · MURPH · DIANE · KAREN
- Cada celda: PR time + delta + trend mini

ZONA C · 7 DOMINIOS COVERAGE (radar)
- Aerobic · Strength · Gymnastics · Olympic Lift · Stamina · Power · Mobility
- Radar/spider chart con valores 0-100
- Highlights weakest domain

ZONA D · VOLUMEN TIMING
- Min trained per week · 12 sem
- Stacked: MetCon · Strength · Gymnastic · Olympic
- Cap recomendado

ZONA E · STRENGTH GAINS
- Back Squat · Deadlift · Strict Press · Power Clean
- Mini cards con 1RM trend

ZONA F · HEATMAP CALENDAR 365d
- Intensidad sesión por día
- Click → drawer detalle

ZONA G · INSIGHTS IA
- "Weakest: Gymnastics · sugerimos handstand work 2x/sem"
- "Strong gain: Olympic lift +15% en 3 meses"

OUTPUT:
- VoltaStatsV3.tsx
- API: GET /v1/volta/stats/me?period=...
- Reutiliza Heatmap365 existente
```

---

## Sub-bloque 4B · Volta Coach (4 prompts)

---

### Prompt 36 · VoltaCoachDash

```
Diseña VOLTA COACH DASH mobile-first · dashboard coach de box CrossFit.

STYLE: Strava-clean coach mode.

ESTRUCTURA:

ZONA A · HEADER COACH
- Avatar + box name + período toggle

ZONA B · WOD DEL DÍA STATUS
- Publicación: "WOD lunes 27 may · enviado a 23 atletas"
- Stats: "12 completaron · avg time 8:42"

ZONA C · ROSTER + ALERTAS (similar HO coach pero adaptado)
- Tabla densa con atletas Volta
- Cols: avatar · nombre · nivel (RX/Scaled) · adherencia · last WOD · status

ZONA D · BOX METRICS
- Total atletas activos
- WODs publicados este mes
- Top 3 atletas (variable: tonelaje · adherencia · benchmark)

ZONA E · CALENDARIO PROGRAMACIÓN
- Semana current
- Cada día con WOD asignado
- Drag-drop reagendar

OUTPUT:
- VoltaCoachDashV3.tsx
- API: GET /v1/volta/coach/dashboard
```

---

### Prompt 37 · VoltaCoachWod (builder)

```
Diseña VOLTA COACH WOD BUILDER mobile-first · constructor de WOD
para coach programar día/semana.

CRITICAL: usa el bedrock CompTrain Master patterns.

ESTRUCTURA:

ZONA A · HEADER
- "Nuevo WOD · {date}"
- Save draft botón

ZONA B · TIPO WOD SELECTOR
- 4 chips big: AMRAP · For Time · EMOM · Chipper
- Click → reveals config specific

ZONA C · CONFIG WOD (varía tipo)
AMRAP:
- Duración minutos
- Cap opcional
For Time:
- Time cap
- Reps esquema
EMOM:
- Minutos totales
- Reps por minuto
Chipper:
- Lista movements en orden

ZONA D · MOVIMIENTO PICKER
- Search bar
- Filter dominios
- Cada movimiento: nombre + standard reps + alternativas scaling
- Add to WOD botón

ZONA E · PREVIEW WOD CARD
- Visualization tipo card final
- Lo que verá el atleta

ZONA F · ASIGNACIÓN
- Select all atletas o subset
- Schedule fecha + hora
- Notification toggle "Notificar al publicar"

ZONA G · CTA SAVE
- "Borrador" gris
- "Publicar al box" verde lime

OUTPUT:
- VoltaCoachWodV3.tsx
- API: POST /v1/volta/coach/wods
```

---

### Prompt 38 · VoltaCoachMacro

```
Diseña VOLTA COACH MACRO mobile-first · vista de macrociclos Volta
desde perspectiva coach (asignar/monitorear).

ESTRUCTURA:

ZONA A · HEADER + TABS
- "Macrocyclos Volta"
- Tabs: Activos · Próximos · Históricos · Plantillas

ZONA B · LISTA MACROCYCLES ACTIVOS
- Cada uno con:
  · Nombre + duración
  · Atletas asignados (avatares)
  · Semana actual / total
  · % completion promedio
  · Status semáforo

ZONA C · TAP MACRO → DETALLE
- Semanas con sesiones tipo
- Atletas progresando vs lagging
- Acciones bulk: ajustar carga · pausar · skip semana

ZONA D · CRÉAR NUEVO MACRO
- Plantilla quick (Open prep · Capacity · Strength · etc.)
- Custom builder avanzado

ZONA E · ASIGNAR (CTA principal · activa Week Picker)
- Cuando coach selecciona atletas + macro · abre WEEK PICKER
- MISMO patrón que prompt 26 (HO AssignMacrocycle)
- Semana a dedo · razón opcional · per-atleta overrides
- Caso típico Volta: atleta vuelve post-Open · arranca en peaking del próximo bloque

OUTPUT:
- VoltaCoachMacroV3.tsx
- API:
  · GET /v1/volta/coach/macrocycles
  · POST /v1/volta/coach/assign-macrocycle {
      athleteIds, macroId, startWeek, startDate, reason?, perAthleteOverrides?
    }
- IMPORTANTE: reutilizar WeekPicker component del prompt 26
```

---

### Prompt 39 · VoltaCoachInventory

```
Diseña VOLTA COACH INVENTORY mobile-first · gestión equipo del box.

ESTRUCTURA:

ZONA A · HEADER + SEARCH
- "Inventario · {box name}"
- Search + filter chips: Todos · Barbells · Plates · Cardio · Accessories · Out of order

ZONA B · ALERTAS INVENTARIO (top collapsible)
- Items en rojo o mantenimiento
- "3 discos rotos · 2 barras necesitan recambio"

ZONA C · BENTO GRID 2 COLS DENSAS
- Cards 140x120 c/u
- Icon + nombre item
- Cantidad disponible/total + progress bar color
- Tap → drawer detalle (marca · año · condición · uso)

ZONA D · FAB (+) ADD EQUIPO
- Modal form: tipo · marca · cantidad · foto opcional

ZONA E · BULK ACTIONS
- Select multiple → "Marcar mantenimiento" / "Export CSV"

OUTPUT:
- VoltaCoachInventoryV3.tsx
- API: GET /v1/coach/inventory · POST · PATCH
```

---

## Notas bloque Volta

- **Diferenciador visual:** lightning iconography · cyan dominante · más BPM-feeling vs HO (que es más reverencial)
- **Componentes nuevos esperados:**
  - WodTimerLive (AMRAP/EMOM/etc.)
  - TapCounter (rounds/reps)
  - BenchmarkCard
  - InventoryItemCard
- **Validar:** flow Volta atleta · home → preWod → warmup → activeWod → summary

# SPEC FUNCIONAL · Holy Oly + Volta

**Documento maestro.** Define qué debe hacer cada cuadrante de la app, cada pantalla, cada botón. Sirve para auditar bugs y diseñar features nuevas sin romper consistencia.

> Reglas:
> 1. Si esta spec dice X y la app hace Y → bug.
> 2. Si querés agregar feature → primero actualizá esta spec, después implementá.
> 3. Cualquier botón sin destino claro en este doc → bug por definición.

---

## 0. Conceptos fundamentales

| | Holy Oly (HO) | Volta |
|---|---|---|
| Deporte | **Halterofilia olímpica** | **CrossFit** |
| Movimientos base | Arrancada (Snatch), Clean & Jerk, sentadillas | Pull-up, HSPU, Box Jump, AMRAP/EMOM, benchmarks |
| Unidad de sesión | Bloques × series × reps × %1RM | WOD (AMRAP / EMOM / For Time) |
| Métrica principal | Total olímpico, OLY Index | CF Index, Wise Score |
| Niveles | Cinturones (Blanco→Negro, 5 tiers) | Tiers (Iniciado→Leyenda, 5 tiers) |
| Macrociclos | 21 sistemas (Búlgaro, Coreano, Cubano, etc) | CF Open Prep, CF Conditioning, CF Strength, HYROX |

Roles transversales:
- **Atleta** — entrena, registra, ve sus stats, gana XP
- **Coach** — gestiona roster, asigna planes, evalúa adherencia (NO entrena en la app)

Selector arriba del teléfono: `[HO|VOL]` + `[ATL|COACH]` → 4 cuadrantes.

---

## 1. HOLY OLY · ATLETA

**Persona:** halterófilo siguiendo un macrociclo. Quiere ver qué entrenar hoy, registrar carga + RPE, ver progreso 1RM.

### Nav bottom (4 tabs)

| Tab | Icono | View | Pantalla |
|-----|-------|------|----------|
| Inicio | 🏠 | `HOME` | AtletaHome |
| Entrenar | 💪 | `WARMUP` | WarmupGenerator (entry del flow) |
| Stats | 📊 | `PERFORMANCE` | PerformanceDeepDive |
| Perfil | 👤 | `PROFILE` | Profile (modo atleta) |

### 1.1 HOME · AtletaHome

**Muestra:** saludo, fecha, cinturón actual, avatar, readiness ring, píldoras del día, OLY Index, racha, XP/cinturón progress, macrociclo activo, sesión del día.

**Botones:**
| Botón | Acción |
|-------|--------|
| Avatar arriba derecha | → `PROFILE` |
| Píldora "Mentalidad/Recuperación/Técnica/Nutrición" | → `PILLS` (filtro por categoría) |
| Card OLY Index | → `INDEX` |
| Card RACHA | (decorativo · sin acción) |
| Card XP / cinturón progress | (decorativo · sin acción) |
| Botón "Iniciar entrenamiento" del card sesión hoy | → `WARMUP` |
| Botón "Ver mi performance" | → `PERFORMANCE` |
| Card Pulse / wellness | → `PULSE` |

### 1.2 WARMUP · WarmupGenerator

**Flow #1 del entrenamiento.** Calentamiento técnico halterofilia.

**Muestra:** tabs Mobility/Specific/Ramp, lista de ejercicios con reps, instrucciones del coach.

**Botones:**
| Botón | Acción |
|-------|--------|
| OMITIR (arriba derecha) | → `SESSION` (skip warmup) |
| Tabs MOBILITY / SPECIFIC / RAMP | Cambia fase visible |
| FINALIZAR CALENTAMIENTO → | → `SESSION` |

### 1.3 SESSION · ActiveSession

**Flow #2 del entrenamiento.** Sesión activa olímpica.

**Muestra header:** Nombre ejercicio + `sets×reps` grande + badge %1RM + bloque/serie counter + CRONO + mini-botones ← Ant / Fin.

**Muestra body:** Progress dots, coach note, **Ramp-up técnico** (4 sets pre-trabajo barra vacía → 40% → 55% → 70%), Series de trabajo (PESO/REPS inputs + FALLO/COMPLETAR SERIE), historial de sets.

**Botones:**
| Botón | Acción |
|-------|--------|
| ← Ant (header mini) | Ejercicio anterior dentro del bloque |
| Fin (header mini, rojo) | → `VICTORY` (terminar sesión sin completar) |
| Cada ramp-up set | Toggle done ✓ (verde) |
| FALLO (rojo) | Loggea set fallido + agrega al historial. Disabled hasta warmup completo |
| COMPLETAR SERIE (verde) | Loggea set OK + agrega al historial. Disabled hasta warmup completo |
| Siguiente ejercicio → (gold, footer sticky, solo cuando todos los sets completos) | → siguiente ejercicio del bloque o `VICTORY` si es el último |

### 1.4 VICTORY · VictoryScreen

**Post-WOD.** Celebración.

**Muestra:** Trofeo, "Sesión completada", recompensa élite, XP ganada, tonelaje total, nivel + progress, racha + multiplicador.

**Botones:**
| Botón | Acción |
|-------|--------|
| COMPARTIR VICTORIA 📱 | → `SOCIAL` |
| Volver al Dashboard | → `HOME` |

### 1.5 PERFORMANCE · PerformanceDeepDive

**Stats personales del atleta.**

**Muestra:** Range toggle W/M/Y, Volume Load card con info ⓘ, chart Intensidad clickable (barras → BottomSheet con detalle del día), cards SNATCH/C&J clickables (→ BottomSheet con histórico PRs).

**Botones:**
| Botón | Acción |
|-------|--------|
| Toggle W/M/Y | Cambia rango temporal |
| Botón ⓘ Volume Load | Abre BottomSheet con explicación |
| Cada barra del chart intensidad | Abre BottomSheet con sesiones del día |
| Card SNATCH | BottomSheet con histórico de PRs Snatch |
| Card C&J | BottomSheet con histórico de PRs C&J |
| Link "Ver explicación Ratio S/C" (dentro SNATCH sheet) | Abre BottomSheet de Ratio |

### 1.6 INDEX · OlyIndex

**Score global del atleta.**

**Muestra:** Score 7.4 grande dorado, badge TOP X%, ranking + nivel, Análisis de Rendimiento (Fuerza/Eficiencia/Consistencia), Leaderboard del club.

**Botones:**
| Botón | Acción |
|-------|--------|
| Header "ⓘ ¿Cómo se calcula?" | BottomSheet info OLY Index global |
| Score Card | BottomSheet info |
| Cada métrica de Análisis | BottomSheet info específico |
| Cada card del leaderboard | BottomSheet con perfil del atleta (Maxes + Total) |

### 1.7 SCHEDULE · SessionSchedule

**Plan semanal.**

**Muestra:** "Semana X · MACROCICLO", strip de días con día actual highlighted, próximas sesiones.

**Botones:**
| Botón | Acción |
|-------|--------|
| Card de una sesión | → `WARMUP` |
| SOLICITAR REPROGRAMACIÓN | (TODO: abrir modal de chat con coach) |

### 1.8 PULSE · PulseHub

**Wellness + retos sociales (halterofilia).**

**Muestra:** "PULSE HUB", atletas online, retos del club ("MAX SNATCH DEL DÍA"), actividad reciente.

**Botones:**
| Botón | Acción |
|-------|--------|
| UNIRSE AL PULSE | → `SESSION` (placeholder · debería ser modal de reto) |

### 1.9 PILLS · KnowledgePills

**Píldoras de conocimiento estilo Stories.**

**Muestra:** Progress bars top, imagen hero, badge "PÍLDORA N/N", título + body, card recompensa.

**Botones:**
| Botón | Acción |
|-------|--------|
| Tap izquierdo invisible | Píldora anterior |
| Tap derecho invisible | Píldora siguiente |
| SIGUIENTE TIP → / FINALIZAR · RECLAMAR XP → | Avanza o → `HOME` |
| CERRAR PÍLDORA | → `HOME` |

### 1.10 SOCIAL · SocialCard

**Card compartible.**

**Muestra:** "Nuevo récord personal" + peso + lift + nombre + club + Holy Score.

**Botones:**
| Botón | Acción |
|-------|--------|
| COMPARTIR / INSTAGRAM | (TODO: invocar Web Share API) |
| GUARDAR EN GALERÍA | (TODO: download canvas) |

### 1.11 PROFILE · Profile (modo atleta)

**Settings + logros.**

**Muestra:** Avatar + nombre + "Suscripción HOLY PRO", grid 2 cards (Logros 9/30 / Pagos), AchievementsGrid 30 logros, Settings.

**Botones:**
| Botón | Acción |
|-------|--------|
| Card Logros | → `SOCIAL` |
| Card Pagos | → `PREMIUM` |
| Cada badge del AchievementsGrid | (decorativo · hover muestra tooltip) |
| Setting "Datos Biométricos" | → `ONBOARDING` |
| Setting "Equipo Disponible" | Abre panel inline info |
| Setting "Mi Entrenador" | Abre panel inline con info coach |
| Setting "Unidades KG/LBS" | Toggle (persiste localStorage) |
| Setting "Notificaciones" | Toggle (persiste localStorage) |
| Setting "Temas" | Abre ThemeGallery (subview) |
| CERRAR SESIÓN | logout + → `LOGIN` |

### 1.12 ONBOARDING / PREMIUM

**ONBOARDING:** form datos biométricos (3 pasos). Botón `CONTINUAR →` avanza paso o → `PREMIUM` al final.
**PREMIUM:** 3 tiers FREE/PRO/ELITE + matriz comparativa. Botón "Elegir Elite" → `HOME` (stub).

---

## 2. HOLY OLY · COACH

**Persona:** coach con roster de 5-30 atletas. Asigna macrociclos, monitorea adherencia, da feedback. NO entrena en la app.

### Nav bottom (3 tabs · sin Entrenar)

| Tab | Icono | View | Pantalla |
|-----|-------|------|----------|
| Atletas | 👥 | `COACH_DASH` | CommandCenter |
| Stats | 📊 | `COACH_STATS` | CoachStatsHO |
| Perfil | 👤 | `PROFILE` | Profile (modo coach) |

### 2.1 COACH_DASH · CommandCenter

**Roster en tiempo real.**

**Muestra:** "Command Center" + stats (Total/Activos/Fatiga/Lesión), filtro tabs, lista de atletas con avatar + nombre + score readiness + quick actions condicionales (Sugerir descanso/Ajustar macro).

**Botones:**
| Botón | Acción |
|-------|--------|
| Card de atleta | selectAthlete + → `ATHLETE_DETAIL` |
| Quick action "Sugerir descanso" (solo si FATIGUED/INJURED) | → `ATHLETE_DETAIL` |
| Quick action "Ajustar macro" (solo si FATIGUED/INJURED) | selectAthlete + → `ASSIGN_MACRO` |
| ASIGNAR MACRO (footer) | → `ASSIGN_MACRO` (sin atleta seleccionado) |
| + NUEVO ATLETA (footer) | → `NEW_ATHLETE` |

### 2.2 COACH_STATS · CoachStatsHO (nueva)

**Métricas del club.**

**Muestra:** Tonelaje semanal + PRs colectivos (cards con info ⓘ), Adherencia del club con color, Top 3 performers por OLY Index, alert atletas con lesión.

**Botones:**
| Botón | Acción |
|-------|--------|
| Card Tonelaje/PRs/Adherencia | BottomSheet con info técnica |
| Card de top performer | selectAthlete + → `ATHLETE_DETAIL` |
| VER ROSTER COMPLETO → | → `COACH_DASH` |

### 2.3 ATHLETE_DETAIL · AthleteDeepDive

**Perfil del atleta seleccionado.**

**Muestra:** Badge lesión activa, club, avatar, nombre, macro asignado, edad/peso/categoría, Fatiga (Banister) + Readiness, Macrociclo activo, Carga semanal chart (clickable barras), RMs registradas.

**Botones:**
| Botón | Acción |
|-------|--------|
| ← (header) | → `COACH_DASH` |
| Card RMs "Ver todo →" | → `PERFORMANCE` (vista atleta) |
| CAMBIAR MACRO (footer) | → `ASSIGN_MACRO` |
| ENVIAR FEEDBACK (footer) | Abre modal bottom-sheet con textarea para mensaje al atleta |

### 2.4 ASSIGN_MACRO · AssignMacrocycle

**Catálogo de macrociclos.**

**Muestra:** Card del atleta seleccionado, filtros por familia (TODOS/Búlgaro/Coreano/etc), grid de macrociclos filtrados por producto (21 para HO).

**Botones:**
| Botón | Acción |
|-------|--------|
| Filter chips por familia | Filtra grid |
| Card de macro | Selecciona (visual outline) |
| Confirmar · {macro} (footer sticky) | → `ATHLETE_DETAIL` (assignment hipotético) |

### 2.5 NEW_ATHLETE · NewAthlete

**Form para crear atleta.**

**Muestra:** Form fields (nombre, email, edad, género toggle M/F, categoría peso IWF, peso corporal).

**Botones:**
| Botón | Acción |
|-------|--------|
| ← (header) | → `COACH_DASH` |
| Crear atleta (CTA) | addAthlete + selectAthlete + → `ASSIGN_MACRO` |

### 2.6 PROFILE · Profile (modo coach)

**Settings coach-specific.**

**Muestra:** Avatar + nombre + "HOLY OLY · COACH", grid 2 cards (Atletas en roster / Activos esta semana), Settings coach (Mi Box, Atletas Asignados, Inventario, KG/LBS, Notif, Temas).

**Botones:**
| Botón | Acción |
|-------|--------|
| Card "Atletas" / "Activos" | → `COACH_DASH` |
| Setting "Mi Box / Club" | Abre panel inline info |
| Setting "Atletas Asignados" | → `COACH_DASH` |
| Setting "Inventario" | (HO no aplica · TODO: pantalla nueva o info inline) |
| Toggles + Temas + Logout | Igual que atleta |

---

## 3. VOLTA · ATLETA

**Persona:** atleta CrossFit del box. Hace 4-5 WODs/semana, mide HRV pre-WOD, registra score.

### Nav bottom (5 tabs)

| Tab | Icono | View | Pantalla |
|-----|-------|------|----------|
| Inicio | 🏠 | `VOLTA_HOME` | VoltaDashboard |
| WOD | ⚡ | `VOLTA_PREWOD` | VoltaPreWod |
| Stats | 📊 | `PROGRESSION` | MovementProgression (Skill Tree) |
| Logros | 🏅 | `SOCIAL` | SocialCard |
| Perfil | 👤 | `PROFILE` | Profile (modo atleta) |

### 3.1 VOLTA_HOME · VoltaDashboard

**Home Volta.**

**Muestra:** saludo, name, status pills (HRV/sueño/cafeína), CF Index card 72 + V-Form + RACHA, Wellness hoy (HRV/Sueño/Cafeína bars), Quests semanales + mensual, Wise Score 84, WOD de hoy.

**Botones:**
| Botón | Acción |
|-------|--------|
| Card CF Index | BottomSheet "CF Index global" |
| Cada componente CF Index Desglose (Strength/Engine/Gymnastics/Benchmark/Consistency) | BottomSheet info técnica |
| Tip "💡 Engine es tu punto débil" | BottomSheet info Engine |
| Iniciar WOD (gold del card WOD del día) | → `VOLTA_PREWOD` |
| Ver detalle (del WOD del día) | → `VOLTA_PREWOD` |

### 3.2 VOLTA_PREWOD · VoltaPreWod

**Check pre-WOD: HRV/sueño/mood.**

**Muestra:** Header "Check pre-WOD" + nombre del WOD, HRV/Sueño/V-Form cards con valores actuales + badges, alert si HRV bajo, mood selector (Energía + Musculatura), cafeína card, Wise score incentivo.

**Botones:**
| Botón | Acción |
|-------|--------|
| Cada emoji del mood selector | Set valor activo |
| + Agregar (cafeína) | (TODO: modal log nuevo intake) |
| ⚡ Iniciar WOD (modificado) +30 Wise | → `WARMUP` (que renderiza `VoltaWarmup` por product) |
| 😴 Cambiar a movilidad / descanso +50 Wise | → `PROGRESSION` |
| Ver WOD sin cambios · sin pts | → `VOLTA_HOME` |

### 3.3 WARMUP · VoltaWarmup (no `WarmupGenerator`)

**Cuando product=volta, la route WARMUP renderiza esta pantalla CrossFit (no la halterofilia).**

**Muestra:** Header "Pre-WOD · CROSSFIT" + "Calentamiento" + contador 0/10 movs, tabs MOBILITY/ACTIVACIÓN/RAMP-UP, lista de movs con check toggleable, progress bar global.

**Botones:**
| Botón | Acción |
|-------|--------|
| OMITIR (header) | → `SESSION` |
| Tabs fase | Cambia movs visibles |
| Cada mov | Toggle check ✓ |
| Empezar WOD → (CTA) | → `SESSION` |

### 3.4 SESSION · VoltaActiveWod (no `ActiveSession`)

**Cuando product=volta, route SESSION renderiza esta pantalla CrossFit (timer AMRAP/EMOM).**

**Muestra:** Header "AMRAP · CROSSFIT" + nombre, toggle Rx/Scaled/Beginner, lista movs (5 Power Clean / 10 Pull-ups / 15 Box Jumps), Timer countdown grande color-coded, contadores +RONDA / +REP.

**Botones:**
| Botón | Acción |
|-------|--------|
| Toggle Rx/Scaled/Beginner | Selecciona escala (disabled durante timer) |
| ▶ INICIAR TIMER | Arranca cronómetro |
| ⏸ PAUSAR | Pausa cronómetro |
| + RONDA | Suma 1 ronda + resetea extra reps |
| + REP | Suma 1 rep extra |
| Terminar / ✓ Ver resumen | → `SUMMARY` (que renderiza `VoltaWodSummary`) |

### 3.5 SUMMARY · VoltaWodSummary (no `SessionSummaryPreview`)

**Cuando product=volta, route SUMMARY renderiza esta pantalla CrossFit.**

**Muestra:** "WOD COMPLETADO" + AMRAP 20 + badge RX, score grande (7+18), 228 reps · 20:00, badge PR personal vs último, ranking del box (#X de N · Top Y%), vs último intento.

**Botones:**
| Botón | Acción |
|-------|--------|
| COMPARTIR EN EL BOX | → `VOLTA_HOME` (stub · debería ser share) |
| VOLVER AL INICIO | → `VOLTA_HOME` |

### 3.6 PROGRESSION · MovementProgression (Skill Tree)

**Árbol de habilidades CrossFit con prereqs.**

**Muestra:** "CrossFit · Skill Tree" + "Mi progresión" + counter X/23 skills + progress bar multicolor, tabs por subject (Todos / Gymnastics / Halterofilia / Conditioning), skills agrupados por tier (T1 Foundation → T5 Elite), cada card con estado (locked 🔒 / in-progress / accomplished ✓).

**Botones:**
| Botón | Acción |
|-------|--------|
| Tab subject | Filtra grid |
| Card skill | (TODO: BottomSheet con detalle del movimiento + video) |

### 3.7 SOCIAL (compartido con HO atleta)

Igual que sección 1.10.

### 3.8 PROFILE (modo atleta Volta)

Igual que 1.11 pero achievements son los 30 de Volta (Murph, Fran, Helen, muscle-ups, etc).

---

## 4. VOLTA · COACH

**Persona:** head coach de un box CrossFit. Programa WOD diario, monitorea atletas, gestiona inventario, evalúa macro del box.

### Nav bottom (5 tabs)

| Tab | Icono | View | Pantalla |
|-----|-------|------|----------|
| Inicio | 🏠 | `VOLTA_COACH` | VoltaCoachDash |
| WOD | ⚡ | `VOLTA_COACH_WOD` | VoltaCoachWod |
| Stats | 📊 | `VOLTA_COACH_MACRO` | VoltaCoachTools (tab macro) |
| Box | 📦 | `VOLTA_COACH_INVENTORY` | VoltaCoachTools (tab inventario) |
| Perfil | 👤 | `PROFILE` | Profile (modo coach) |

### 4.1 VOLTA_COACH · VoltaCoachDash

**Box Command.**

**Muestra:** Header "COACH · CROSSFIT" + "Box Command" + total atletas, stats (CRÍTICO/WATCH/OK), card Macrociclo Activo con progress, WOD de la semana (7 días color-coded), atletas online ahora, inventario summary, quick actions grid.

**Botones:**
| Botón | Acción |
|-------|--------|
| "Editar →" (header macrociclo) | → `VOLTA_COACH_MACRO` |
| "Plan completo →" (header WOD semana) | → `VOLTA_COACH_WOD` |
| Cada día del WOD de la semana | → `VOLTA_COACH_WOD` |
| Card de atleta del status (CRITICO/WATCH/OK) | → `ATHLETE_DETAIL` |
| "Ver todo →" (header inventario) | → `VOLTA_COACH_INVENTORY` |
| Quick action "Crear WOD" | → `VOLTA_COACH_WOD` |
| Quick action "Tools" | → `VOLTA_COACH_TOOLS` |
| Quick action "Eval Macro" | → `VOLTA_COACH_MACRO` |
| Quick action "Inventario" | → `VOLTA_COACH_INVENTORY` |

### 4.2 VOLTA_COACH_WOD · VoltaCoachWod

**Planificador de WOD.**

**Muestra:** Tipo (AMRAP/EMOM/For Time/Strength), duración, escala default Rx/Scaled/Beginner, lista de movimientos con + Agregar / × delete, preview "lo que verá el atleta".

**Botones:**
| Botón | Acción |
|-------|--------|
| Tipo WOD chips | Cambia type |
| Escala chips | Cambia default scale |
| + Agregar (movimientos) | (TODO: modal para agregar mov) |
| × en cada mov | Elimina mov |
| Borrador (footer) | → `VOLTA_COACH` (stub) |
| Publicar al box (cyan) | → `VOLTA_COACH` (stub · debería persistir) |

### 4.3 VOLTA_COACH_MACRO · VoltaCoachTools (tab Macro)

**Evaluación del macrociclo activo.**

**Muestra:** Header "COACH · TOOLBOX" + "Eval Macro", tabs (Progresión/Templates/Masiva), card "Macrociclo Activo" con verdict (EN TRACK/AJUSTAR/CRÍTICO), week timeline 8 semanas, 6 criterios (Adherencia / PRs Acum / Lesiones / Carga Rel / V-Form Rojo / HRV Crítico) cada uno con valor + target.

**Botones:**
| Botón | Acción |
|-------|--------|
| Tabs Progresión/Templates/Masiva | Cambia tab |
| CAMBIAR DE MACROCICLO (21 sistemas) | → `ASSIGN_MACRO` |
| Marcar deload | (stub) |
| Exportar review | (stub) |

### 4.4 VOLTA_COACH_INVENTORY · VoltaCoachTools (tab Inventario)

**Inventario del box editable.**

**Muestra:** Header igual, "EQUIPAMIENTO DEL BOX · 13 ITEMS", barra Disponibilidad %, items agrupados por categoría (BARRAS / PLATES / GYMNASTICS / CARDIO / ACCESORIOS), cada item con DISP -/+ y TOTAL -/+, + Agregar item.

**Botones:**
| Botón | Acción |
|-------|--------|
| × en cada item | Elimina item |
| − / + en DISP | Decrementa/incrementa disponibles (clamp 0..total) |
| − / + en TOTAL | Decrementa/incrementa total (clamp 0..∞) |
| + Agregar item (header sección) | Abre form inline |

### 4.5 PROFILE (modo coach Volta)

Igual que 2.6 pero con "VOLTA · COACH" subtítulo. Setting "Inventario" navega a `VOLTA_COACH_INVENTORY`.

---

## 5. Flows transversales

### 5.1 Login / Register / Logout

| View | Botones |
|------|---------|
| `LOGIN` | Entrar (email/pwd) · Crear cuenta nueva → `REGISTER` · Entrar en modo Demo |
| `REGISTER` | Registrar (post-success → home según rol+producto) · Volver a Login → `LOGIN` |
| Logout (en `PROFILE`) | logout + → `LOGIN` |

### 5.2 Switch Producto / Rol

Switcher arriba del teléfono (HO/VOL + ATL/COACH).
- Al cambiar producto o rol → navega al home apropiado: `VOLTA_COACH`, `VOLTA_HOME`, `COACH_DASH`, `HOME`.

### 5.3 Role guards (auto-redirect)

| Si rol=coach y view ∈ ATHLETE_ONLY | → home del producto (`COACH_DASH` o `VOLTA_COACH`) |
| Si rol=atleta y view ∈ COACH_ONLY | → home del producto (`HOME` o `VOLTA_HOME`) |

ATHLETE_ONLY: `WARMUP`, `SESSION`, `SUMMARY`, `VICTORY`, `PULSE`, `PILLS`, `INDEX`, `SCHEDULE`, `ONBOARDING`, `PREMIUM`, `VOLTA_PREWOD`, `SOCIAL`, `PERFORMANCE`.

COACH_ONLY: `COACH_DASH`, `COACH_STATS`, `ATHLETE_DETAIL`, `ASSIGN_MACRO`, `NEW_ATHLETE`, `VOLTA_COACH`, `VOLTA_COACH_WOD`, `VOLTA_COACH_TOOLS`, `VOLTA_COACH_MACRO`, `VOLTA_COACH_INVENTORY`.

### 5.4 Auth guard

Sin sesión → forzar `LOGIN` (excepto views públicas: `LOGIN`, `REGISTER`).

### 5.5 Back button

Se muestra automáticamente excepto en views home (`HOME`, `COACH_DASH`, `COACH_STATS`, `VOLTA_HOME`, `VOLTA_COACH`, `LOGIN`, `REGISTER`).

---

## 6. Componentes globales

### 6.1 WiseAssistant (FAB)

Botón flotante "WISE" en bottom-right de varias pantallas. Default `bottom: 96px`. Acepta prop `bottomOffset` para subirlo en pantallas con sticky CTAs.

**Pantallas donde aparece:**
- VoltaDashboard, VoltaPreWod, VoltaCoachDash, VoltaCoachWod (bottomOffset=170), VoltaCoachTools (bottomOffset=200), MovementProgression.

**Al clickear:** abre panel chat lateral (stub responses por keyword matching).

### 6.2 BottomSheet

Modal slide-up con backdrop blur. Usado para:
- Info popovers (Performance, OlyIndex, VoltaDashboard CF Index, CoachStatsHO)
- Drill-down (sesión del día, histórico PRs, perfil atleta del leaderboard)
- Confirmaciones (ENVIAR FEEDBACK en AthleteDeepDive)

### 6.3 Toast

Notificación inferior animada (success/error/info/warning · auto-dismiss 2.5s). Disponible vía `useToast()` hook.

### 6.4 AchievementsGrid (solo atleta)

Grid 4-col con 30 logros del producto activo. Color por difficulty (bronze/silver/gold/platinum). Locked greyed out.

### 6.5 QuestsSection (solo atleta)

Lista de 4 quests semanales + 1 mensual destacado. Cada quest con icono + nombre + progress bar + +XP reward.

---

## 7. Reglas de diseño

### 7.1 Tipografía canónica (clases en index.css)

| Clase | Uso |
|-------|-----|
| `.type-display` 32px/900 | Solo números hero (score CF Index 72, OLY 7.4) |
| `.type-heading-xl` 24px/900 | Títulos de pantalla principales |
| `.type-heading-md` 18px/800 | Subsecciones |
| `.type-heading-sm` 14px/800 | Cards con jerarquía |
| `.type-body-strong` 13px/700 | Texto importante |
| `.type-body` 13px/500 | Body default |
| `.type-caption` 10px/700 uppercase | Labels de secciones |
| `.type-label` 11px/600 | Form labels |
| `.type-mono` | Números (tabular-nums) |

### 7.2 Colores semánticos

| Estado | Color |
|--------|-------|
| Primary HO | `#22C55E` (verde) |
| Primary Volta | `#00E5FF` (cyan) |
| Gold (HO highlight, premium, gold tier) | `#F59E0B` |
| Warning | `#FFB300` (ámbar) |
| Danger / Critical | `#EF4444` / `#FF3D00` (rojos) |
| Success / OK | `#22C55E` / `#00E676` (verdes) |
| Text | `var(--text)` (theme-aware) |
| Text secondary | `var(--text-secondary)` |
| Surface (cards) | `var(--surface)` |
| Bg | `var(--bg)` |

### 7.3 Spacing + radius

- Card padding: 14-18px
- Border-radius: 12-18px (cards), 8-10px (chips), 20-26px (hero cards)
- Padding entre secciones: 16-20px
- PaddingBottom de página: 80-110px (para no colisionar con nav 76px)

### 7.4 Animaciones

- `.anim-fade-in` 0.25s ease — mount de pantalla
- `.anim-fade-up` 0.35s cubic-bezier — entrada de elementos
- `.anim-scale-in` 0.25s — celebración (Victory)
- `.stagger > *` 60ms delay incremental
- `.btn-press` scale 0.94 on active

---

## 8. Cómo usar este documento

### Para auditar un bug

1. Identificar cuadrante (rol × producto) + pantalla afectada
2. Buscar la sección correspondiente acá
3. Comparar comportamiento esperado vs actual
4. Si la app difiere → bug
5. Si esta spec no cubre el caso → spec incompleta, actualizarla primero

### Para agregar feature

1. Definir cuadrante target
2. Identificar pantalla (o si requiere nueva)
3. Actualizar spec acá ANTES de codear: agregar la pantalla con sus botones y destinos
4. Implementar siguiendo la spec
5. Verificar con el [VERIFY_MANUAL.md](VERIFY_MANUAL.md)

### Para refactor

1. Si refactor cambia comportamiento → actualizar spec
2. Si solo cambia implementación → no tocar spec

---

## 9. Pendientes conocidos (gaps en la app actual)

| Pantalla | Pendiente |
|----------|-----------|
| PULSE → "UNIRSE AL PULSE" | Va a SESSION (stub) — debería abrir modal reto |
| SCHEDULE → "SOLICITAR REPROGRAMACIÓN" | Botón no funcional (TODO modal) |
| SOCIAL → "COMPARTIR INSTAGRAM" + "GUARDAR EN GALERÍA" | Stubs (TODO Web Share API + canvas download) |
| VoltaCoachWod → "Borrador" + "Publicar al box" | Stubs (TODO persistir) |
| VoltaCoachTools → "Marcar deload" + "Exportar review" | Stubs |
| MovementProgression → card skill | No abre detalle (TODO BottomSheet con drills + video) |
| Profile coach HO → "Inventario" | No tiene pantalla destino (HO no tiene inventario · TODO decidir si crearla o quitar el setting) |
| PREMIUM → "Elegir Elite" | Stub → HOME (TODO checkout real) |
| WiseAssistant chat | Respuestas son pattern matching local (TODO conectar backend) |

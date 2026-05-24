# Spec: 4 Cuadrantes (Producto × Rol)

Define qué pantallas/features debe tener cada combinación. Sirve como verdad
contra la cual auditamos la implementación.

---

## 1) HOLY OLY · ATLETA (halterófilo)

**Persona**: levantador olímpico/powerlifter siguiendo un macrociclo (Búlgaro, Cubano, Ruso, etc).
**Goal**: ejecutar el plan del día, registrar carga + RPE, ver progreso de 1RMs.

### Nav bottom: 5 tabs
- 🏠 Home · 💪 Entrenar · 📊 Stats · 🏆 Logros · 👤 Perfil

### Pantallas core
| # | Pantalla | View | Estado |
|---|----------|------|--------|
| 1 | Home — sesión del día + readiness | `HOME` | ✓ |
| 2 | Warmup generator | `WARMUP` | ✓ |
| 3 | Active session — set/rep/load tracker | `SESSION` | ✓ |
| 4 | Session summary post-WOD | `SUMMARY` | ✓ |
| 5 | Victory + XP/Wise points | `VICTORY` | ✓ |
| 6 | Performance — gráficos 1RM trends | `PERFORMANCE` | ✓ |
| 7 | Oly Index — score global atleta | `INDEX` | ✓ |
| 8 | Schedule semanal | `SCHEDULE` | ✓ |
| 9 | Pulse — wellness/HRV/sueño | `PULSE` | ✓ |
| 10 | Knowledge pills — tips educativos | `PILLS` | ✓ |
| 11 | Social card | `SOCIAL` | ✓ |
| 12 | Perfil + settings | `PROFILE` | ✓ |
| 13 | Onboarding biométrico | `ONBOARDING` | ✓ |
| 14 | Premium upgrade | `PREMIUM` | ✓ |

### Features que faltan (sospecha)
- [ ] Registro PR/1RM manual (botón "registré 150kg en snatch")
- [ ] Histórico de sesiones pasadas (calendario clickeable)
- [ ] Vista del macrociclo activo (qué semana, qué bloque)
- [ ] Notas del coach por sesión
- [ ] Video upload para review técnica (Premium)

---

## 2) HOLY OLY · COACH (entrenador de halterofilia)

**Persona**: coach con 5-30 atletas, asigna macrociclos, revisa ejecución.
**Goal**: ver salud del roster, asignar/modificar planes, dar feedback.

### Nav bottom: 4 tabs
- 🏠 Atletas · 📊 Stats · 👤 Perfil
- (no tab "Entrenar" — coach no entrena)

### Pantallas core
| # | Pantalla | View | Estado |
|---|----------|------|--------|
| 1 | Command Center — dashboard roster | `COACH_DASH` | ✓ |
| 2 | Athlete Deep Dive — perfil de 1 atleta | `ATHLETE_DETAIL` | ✓ |
| 3 | Asignar macrociclo | `ASSIGN_MACRO` | ✓ |
| 4 | Crear nuevo atleta | `NEW_ATHLETE` | ✓ |
| 5 | Perfil coach + settings | `PROFILE` | ⚠ — compartido con atleta |
| 6 | Performance deep dive (por atleta) | `PERFORMANCE` | ⚠ — no role-scoped |

### Features que faltan
- [ ] Vista "Hoy" — sesiones agendadas para todos los atletas
- [ ] Alertas — atleta no entrenó X días, HRV crítico
- [ ] Inbox mensajes con atletas
- [ ] Library — biblioteca de ejercicios + videos demo
- [ ] Calendar — vista mes con todas las sesiones del roster
- [ ] Bulk actions — asignar mismo deload a todo el grupo

---

## 3) VOLTA · ATLETA (crossfitero)

**Persona**: atleta de CrossFit en box, hace WOD diario, mide HRV/sueño.
**Goal**: ver WOD del día, check pre-WOD (HRV gate), registrar score, leaderboard del box.

### Nav bottom: 5 tabs
- 🏠 Inicio · ⚡ WOD · 📊 Stats · 🏆 Logros · 👤 Perfil

### Pantallas core
| # | Pantalla | View | Estado |
|---|----------|------|--------|
| 1 | Volta Dashboard — home con WOD + readiness | `VOLTA_HOME` | ✓ |
| 2 | Pre-WOD check (HRV/sueño/mood) | `VOLTA_PREWOD` | ✓ |
| 3 | Warmup (compartido HO) | `WARMUP` | ✓ |
| 4 | Active session (compartido HO) | `SESSION` | ⚠ — no específico de CrossFit |
| 5 | Session summary | `SUMMARY` | ✓ |
| 6 | Victory + Wise points | `VICTORY` | ✓ |
| 7 | Progresión movimientos (muscle-up, HSPU, DU) | `PROGRESSION` | ✓ |
| 8 | Social card | `SOCIAL` | ✓ — sirve como leaderboard? |
| 9 | Perfil | `PROFILE` | ✓ |

### Features que faltan
- [ ] Leaderboard del box — ranking del WOD del día
- [ ] Benchmark WODs (Fran, Murph, Helen) con histórico personal
- [ ] PR tracker (no solo barras: pull-ups, double-unders, row 2k)
- [ ] AMRAP/EMOM timer integrado en SESSION
- [ ] Class booking — reservar clase del día (si aplica)
- [ ] Modificaciones (scaling RX/Intermediate/Scaled)

---

## 4) VOLTA · COACH (head coach del box)

**Persona**: coach de CrossFit, programa el WOD del día para todo el box.
**Goal**: programar WOD, ver quién viene a cada clase, gestionar inventario, eval macrociclo del box.

### Nav bottom: 5 tabs
- 🏠 Inicio · ⚡ WOD · 📅 Macro · 🏋️ Box · 👤 Perfil

### Pantallas core
| # | Pantalla | View | Estado |
|---|----------|------|--------|
| 1 | Volta Coach Dash — overview del box | `VOLTA_COACH` | ✓ |
| 2 | Volta Coach WOD — programar/editar WOD del día | `VOLTA_COACH_WOD` | ✓ |
| 3 | Eval Macrociclo del box | `VOLTA_COACH_MACRO` | ✓ |
| 4 | Inventario equipo | `VOLTA_COACH_INVENTORY` | ✓ |
| 5 | Athlete Deep Dive | `ATHLETE_DETAIL` | ✓ |
| 6 | Asignar macro | `ASSIGN_MACRO` | ⚠ — coach de box asigna por grupo, no individual |
| 7 | Perfil | `PROFILE` | ✓ |

### Features que faltan
- [ ] Clases del día — quién viene, capacidad, hora
- [ ] Programación semanal — preview de los próximos 7 WODs
- [ ] Whiteboard — scores del día en vivo
- [ ] Comunicación masiva (anuncios al box)
- [ ] Métricas del box — asistencia, retención, PRs/mes
- [ ] Templates de WOD (guardar patterns reutilizables)
- [ ] Coach asistentes (gestión multi-coach del box)

---

## Reglas transversales (todos los cuadrantes)

### Nav
- Home view del cuadrante no debe mostrar botón "Back"
- Tabs del nav inferior deben coincidir con `NAV_MAP` según producto+rol
- Switch producto/rol debe llevar al home correcto, no a 404 ni dead-end

### Theme
- Todos los pixels deben usar `var(--bg)`, `var(--text)`, `var(--primary)`, etc.
- Cero hardcoded `text-white`, `bg-slate-*`, `#ffffff` en JSX

### Data
- Cero hardcoded names ("Marco Torres", "MACROCICLO BÚLGARO")
- Cero hardcoded dates ("Hoy 10:00 AM" si no es realmente hoy)
- Cero hardcoded reward values ("+30 XP" debe venir del backend o config)

### Auth
- Pantallas marcadas como `ATHLETE_ONLY` redirigen coach → home coach
- Pantallas marcadas como `COACH_ONLY` redirigen atleta → home atleta
- Sin sesión → forzar a `LOGIN`

### CTAs
- Todo botón debe navegar a una pantalla válida o ejecutar acción visible
- Cero botones decorativos (`onClick={}` vacío)
- Cero CTAs que vuelven a la misma pantalla (loop)

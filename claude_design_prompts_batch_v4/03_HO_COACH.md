# Batch v4 · Bloque 3 · HO Coach (6 prompts)

> Estilo Coach = **Strava-clean** · NO neón excesivo · datos densos · sobrio.
> Mantener tokens del contexto compartido pero reducir glow/saturación.

---

### Prompt 24 · CommandCenter · Coach HO Dashboard

```
Diseña COMMAND CENTER mobile-first · dashboard del COACH de halterofilia
gestionando 5-50 atletas.

VISUAL STYLE COACH: Strava-clean · sobrio · datos densos · grayscale + 1 acento.

ESTRUCTURA EN 6 ZONAS:

ZONA A · HEADER COACH (sticky 96px)
- Avatar coach + nombre + nombre box
- Toggle día/semana/mes (period switcher)
- Quick actions: + nuevo atleta · 📊 ver stats · ⚙️

ZONA B · KPIS GLOBALES (bento 2x2)
- Total atletas activos / total · % adherencia
- Sesiones esta semana / planeadas
- Atletas en zona YELLOW/RED (alertas)
- Próximos meets · countdown días

ZONA C · ALERTAS PRIORITARIAS (lista compact)
- Solo atletas requiriendo atención
- Cada alerta:
  · Avatar + nombre
  · Severity dot (yellow/red)
  · Trigger: "CNS bajo 3 días · sueño <5h"
  · Acción sugerida + botón "Resolver"

ZONA D · ROSTER TABLA DENSA
- Tabla tipo Notion · 50 atletas legible
- Cols: Avatar · Nombre · Tier · Último entreno · Adherencia 7d · OLY · Status semáforo
- Sort por cualquier col
- Filter chips top: Todos · Activos · Pausados · Lesión · Nuevo
- Tap fila → drawer atleta full

ZONA E · MACROCYCLES ACTIVOS (cards horizontal)
- Cards mini · qué atletas están en qué macrociclo
- Tap → CoachMacroView

ZONA F · CALENDARIO SEMANAL
- Vista semana actual con sesiones programadas color por tipo
- Drag sesión = reagendar

INTERACCIONES:
- Pull-to-refresh
- Drag drop atletas entre macrocycles
- Bulk select para acciones masivas

OUTPUT:
- CommandCenterV3.tsx
- APIs:
  · GET /v1/coach/dashboard
  · GET /v1/coach/roster
- Reutiliza CoachDashV2 base (ya existente)
```

---

### Prompt 25 · AthleteDeepDive

```
Diseña ATHLETE DEEP DIVE mobile-first · vista coach de un atleta
específico · todo el historial + insights IA.

USO: coach tap atleta del roster → esta pantalla.

ESTRUCTURA:

ZONA A · HEADER ATLETA
- Avatar grande + nombre + tier + edad
- Stats inline: cinturón actual · macrociclo activo · semana
- Botones: 💬 chat · 📅 ver agenda · ⚙️ editar plan

ZONA B · OVERVIEW METRICS (4 mini cards)
- OLY Index actual
- Sesiones últimos 30d
- Tonelaje mensual
- Adherencia %

ZONA C · PRs HISTORY (timeline horizontal)
- Cada PR como hito visual
- Tap → detalle sesión PR

ZONA D · WELLNESS TRENDS (multi-line chart)
- Toggle métricas: CNS · sueño · stress · soreness
- Last 90d
- Highlights eventos relevantes

ZONA E · INSIGHTS IA COACH-VIEW
- "Este atleta responde bien a volumen alto"
- "Plateau en C&J · sugerir cambio ratio FS"
- "Sueño bajo correlaciona con sesiones noche"

ZONA F · COMMUNICATION LOG
- Últimos mensajes chat coach-atleta
- Notas private del coach

ZONA G · BULK ACTIONS BOTTOM
- "Asignar nuevo macrociclo"
- "Ajustar plan actual"
- "Pausar entrenamiento" (con razón)

OUTPUT:
- AthleteDeepDiveV3.tsx
- Props: { athleteId: string } via URL/state
- API: GET /v1/coach/athletes/{id}/deep-dive
```

---

### Prompt 26 · AssignMacrocycle con Gantt timeline + Week Picker

```
Diseña ASSIGN MACROCYCLE mobile-first · coach asigna macrociclo
a atletas usando vista Gantt visual + WEEK PICKER libre.

CRITICAL FEATURE · WEEK PICKER (no estaba en versión legacy):
El coach DEBE poder elegir DESDE QUÉ SEMANA del macrociclo arrancar
el atleta · NO siempre semana 1. Razón: el atleta puede venir de
otro programa con base ya consolidada · empezar en semana 1 sería
regresión innecesaria. También permite recovery scenarios (atleta
volvió de lesión · arranca en deload).

ESTRUCTURA:

ZONA A · HEADER + ACTION
- "Asignar macrociclo"
- Multi-select atletas chip top (avatares apilados)
- "Cambiar selección" botón

ZONA B · CATALOG MINI (panel izq · scroll vertical · drawer en mobile)
- Lista compact 23 macrocycles
- Filter familia
- Tap macro → preview centro + activa zonas D+E+F

ZONA C · GANTT TIMELINE (panel centro/der · scrolleable horizontal)
- Eje X: semanas (0 a X · todas las del macro)
- Eje Y: atletas seleccionados (filas)
- Cada fila muestra macro asignado como barra coloreada
- Mesos visibles con bands color por bloque
- Hover/tap barra → detalle macro + opciones

ZONA D · WEEK PICKER · CRITICAL FEATURE (highlighted)
Después de seleccionar macro · aparece WEEK SELECTOR prominent:

  ┌─────────────────────────────────────────────────┐
  │ ¿Desde qué semana arranca este atleta?         │
  │                                                  │
  │  [ S1 ][ S2 ][ S3 ][ S4 ][ S5 ]...[ S16 ]      │
  │   ↑ default                                      │
  │                                                  │
  │  Razón (opcional):                              │
  │  ○ Empezar desde el principio (default)         │
  │  ○ Atleta viene de otro programa similar        │
  │  ○ Recovery post-lesión · empezar en deload     │
  │  ○ Peaking · saltar a fase final                │
  │  ○ Otro (textarea libre)                        │
  └─────────────────────────────────────────────────┘

Visual:
- Slider/chips horizontal con TODAS las semanas (16 si Ruso, 12 si Cubano, etc.)
- Cada chip muestra: número semana + IMR% + tipo (vol/int/etc.)
- Selected: glow neón producto + más grande
- Highlights bandas mesociclo color background

Bulk vs individual:
- Toggle "Misma semana para todos" (default ON)
- Si OFF · permite por atleta seleccionar diferente startWeek
- Tabla mini: atleta | startWeek | sesiones que verá

CONTEXTO inteligente (asistencia IA al coach):
- Si atleta tiene historial · sugerencia automática:
  · "Andrés viene de hacer Cubano 12 sem · sugerimos arrancar en S5 (intensidad similar)"
  · "Camila lleva 3 sem inactiva · arrancar en S4 (deload)"
- Botón "Usar sugerencia" o ignorar

ZONA E · COMPATIBILITY SCORE (después de Week Picker)
- Para cada atleta seleccionado · score 0-100 considerando:
  · Macro seleccionado
  · Semana de inicio elegida
  · Histórico atleta · 1RMs actuales · CNS baseline
- Score < 60 · warning con razón
- Score > 80 · check verde

ZONA F · CONFLICT DETECTOR
- Detecta overlaps con macros activos
- Sugiere fechas inicio óptimas considerando semana elegida
- "Si arranca S5 con duración 12 sem restantes · termina 8-sep"
- Banner si atleta tiene PR test programado durante el macro

ZONA G · PREVIEW SESIONES INICIALES
- Después de seleccionar semana · muestra las primeras 4 sesiones del atleta
- Para que coach valide que la entrada tiene sentido
- Cada sesión: día · tipo · movimientos · % 1RM

ZONA H · CTA STICKY BOTTOM
- "Asignar a X atletas · empezar S5 · lunes 16-jun"
- Si bulk OFF · texto cambia "X atletas · semanas variadas"
- Loading: spinner + "Generando planes..."
- Success: toast + navigate CommandCenter

ESTADOS ESPECIALES:
- Atleta sin 1RM registrado: warning · "Calibrá test inicial antes de S>4"
- Atleta lesión activa: bloquea selección · ofrece BaselineAssessment
- Macro sin compatibility test data: usar default S1

OUTPUT:
- AssignMacrocycleV3.tsx
- API:
  · GET /v1/macrocycles?product=holy-oly
  · GET /v1/macrocycles/{id}/weeks (para mostrar las semanas con IMR/tipo)
  · GET /v1/coach/athletes/{id}/macro-suggestion?macroId={id}
  · POST /v1/coach/assign-macrocycle {
      athleteIds: string[],
      macroId: string,
      startWeek: number,        // ← FEATURE CLAVE
      startDate: string,
      reason?: 'previous_program' | 'recovery' | 'peaking' | 'other',
      reasonNote?: string,
      perAthleteOverrides?: { athleteId: string, startWeek: number }[]
    }
- Mock: 10 atletas + 5 macros · render Gantt + WeekPicker funcional

TONO COPY:
✅ "¿Desde qué semana arranca este atleta?"
✅ "Andrés viene de programa similar · sugerimos S5"
❌ "Selecciona el offset del macrociclo" (jerga técnica)
❌ "Skip al peaking phase" (anglicismos innecesarios)

REFERENCIAS VISUALES:
- Asana timeline view
- Monday.com Gantt
- TeamGantt mobile · adaptado
- Spotify Playlist · selector posición canción específica (para week picker)
- Headspace Course · selector "empezá donde quieras"
```

---

### Prompt 27 · NewAthlete (form alta)

```
Diseña NEW ATHLETE form mobile-first · coach agrega nuevo atleta a su roster.

ESTRUCTURA:

ZONA A · HEADER
- "Nuevo atleta"
- Back chevron

ZONA B · MÉTODO ALTA
- 2 cards big:
  · "Invitación email" · genera código · envía link
  · "Crear cuenta directa" · coach llena todos los datos
- Tap card → flow correspondiente

ZONA C · FORM (si "Crear directa")
- Datos básicos (nombre · email · fecha nac · género)
- Tier inicial (auto-detected o manual)
- Asignar macrociclo opcional
- Generar password temporal (auto)
- Toggle "Enviar credenciales por email"

ZONA D · BULK IMPORT (opcional bottom)
- "Importar desde CSV" link discreto
- Plantilla descargable

ZONA E · CTA
- "Crear atleta" o "Enviar invitación"
- Success: toast + navigate AthleteDeepDive nuevo

OUTPUT:
- NewAthleteV3.tsx
- API: POST /v1/coach/athletes
```

---

### Prompt 28 · CoachViralTools

```
Diseña COACH VIRAL TOOLS mobile-first · herramientas para coach
generar contenido social del box.

CONCEPTO: coach quiere mostrar logros del box en redes para captar leads.

ESTRUCTURA:

ZONA A · HEADER + TABS
- "Herramientas virales"
- Tabs: Recap semana · Showcase atletas · Reviews coach · Stats box

TAB 1 · RECAP SEMANA
- Auto-generates card resumen semana box
- Total tonelaje · PRs alcanzados · atletas más constantes
- Botón "Generar card" → SocialCard tipo coach

TAB 2 · SHOWCASE ATLETAS
- Lista atletas con logros recientes
- Tap atleta → genera card su logro
- Send para approval (opt-in atleta antes de share)

TAB 3 · REVIEWS COACH
- Coach reseña técnica de atleta con video
- Anota en video frame-by-frame
- Genera card video + voiceover

TAB 4 · STATS BOX
- Dashboard del box en formato shareable
- "200 atletas · 12 coaches · 50 macrocycles activos"

ZONA BOTTOM · ANALYTICS
- "Tus cards generaron 1.2k impresiones esta semana"
- "12 leads via referral · 3 conversiones premium"

OUTPUT:
- CoachViralToolsV3.tsx
- API: GET /v1/coach/viral-stats
```

---

### Prompt 29 · PrewodShare

```
Diseña PREWOD SHARE mobile-first · screen donde atleta comparte
su PRE-WOD prep (intención + readiness + cafeína).

CONTEXT: Volta principalmente · pre-wod ritual social.

ESTRUCTURA:

ZONA A · HEADER
- "Mi pre-WOD · {date}"

ZONA B · READINESS RING + MOOD
- Big ring score readiness
- 5 emojis estado: 😫 😐 😊 💪 🔥

ZONA C · INTENCIÓN
- Input "Mi objetivo hoy: ___"
- Sugerencias chips ("Conservador · RPE 6" · "RX completo" · "Probar PR")

ZONA D · CAFEÍNA / SUPLEMENTOS
- Quick log: cafeína (mg) · creatina · pre-workout
- Histórico hoy

ZONA E · COMPARTIR
- "Compartir con coach" toggle
- "Card pública IG" botón
- "Solo guardar privado" default

OUTPUT:
- PrewodShareV3.tsx
- API: POST /v1/sessions/{id}/prewod
```

---

## Notas bloque coach

- **Diferenciador visual:** menos saturación · datos densos · letterspacing wider en headers · cards más cuadradas vs atleta
- **Componentes nuevos esperados:**
  - GanttTimeline (reutilizable)
  - RosterTable
  - AlertCard
- **Tono coach:** profesional · NO infantil · datos crudos sin maquillar

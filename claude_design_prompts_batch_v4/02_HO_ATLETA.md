# Batch v4 · Bloque 2 · HO Atleta · 18 prompts

Stats + Sesión + Wellness + Social. Pegar `00_CONTEXTO_COMPARTIDO.md` antes de cada prompt.

---

## Sub-bloque 2A · Stats & Profile (5 prompts)

---

### Prompt 6 · OLY Index detail

```
Diseña OLY INDEX detail screen mobile-first.

CONCEPTO: OLY Index es score 0-10 que mide "calidad atleta olímpico"
considerando 4 dimensiones: Fuerza · Técnica · Movilidad · Consistencia.

ESTRUCTURA:

ZONA A · HERO (hero card 280px)
- Score grande tabular "8.4" (verde si >7, amber 5-7, red <5)
- Sub "/10" pequeño
- Delta vs mes pasado: "↑ +0.6 vs abril"
- Ring progress 360º con color score
- Background gradiente score-color sutil

ZONA B · BREAKDOWN 4 DIMENSIONES (bento 2x2)
- Cada celda 160x160:
  · Fuerza · score X/10 + sparkline 90d
  · Técnica · score X/10 + sparkline
  · Movilidad · score X/10 + sparkline
  · Consistencia · score X/10 + sparkline
- Tap celda → detalle dimension

ZONA C · COMPARATIVA (cards horizontal scroll)
- Card 1 "Top 23% del club"
- Card 2 "Cat. tuya: 78 atletas globales"
- Card 3 "Próximo nivel: 8.7 (Top 15%)"

ZONA D · HISTÓRICO 12 MESES (chart)
- Line chart score por mes
- Highlights eventos (PR Snatch, lesión, etc.)
- Tooltip por punto

ZONA E · ACCIONES RECOMENDADAS (3 cards)
- Card 1: "Tu técnica bajó 0.3 · revisar video últimas sesiones"
- Card 2: "Movilidad gana puntos rápido · 15 min daily"
- Card 3: "Vas para Top 10% si consistencia >9"

OUTPUT:
- OlyIndexV3.tsx
- API: GET /v1/oly-index/me?period=12m
- Mock: 12 puntos histórico + 4 dimensiones + comparativas
- Reutiliza componentes existentes Chart, MetricHistoryModal
```

---

### Prompt 7 · HoStats · Halterofilia stats

```
Diseña HO STATS screen mobile-first · dashboard analítico completo
para atleta de halterofilia olímpica.

OBJETIVO: ver todos los PRs · trends · ratios de un golpe de vista.

ESTRUCTURA EN 6 ZONAS:

ZONA A · HEADER + PERIOD SWITCHER (sticky)
- Título "Mis Stats · Holy Oly"
- Chips: 7d · 30d · 3m · 6m · 12m · ALL
- Selected glow neón

ZONA B · 4 HERO PR CARDS (bento 2x2)
- Snatch · 1RM kg + Plate3D mini + delta vs 30d
- Clean & Jerk · idem
- Front Squat · idem
- Back Squat · idem
- Tap → drawer histórico PRs

ZONA C · RATIOS GOLDEN (card destacada)
- "Ratios olímpicos" header
- Sn/C&J = X% (ideal 80-83%) · semáforo
- FS/BS = Y% (ideal 85-92%) · semáforo
- Sn/BS = Z%
- Tooltip explica cada ratio

ZONA D · VOLUMEN MENSUAL (chart stacked bar)
- 12 meses eje X
- Stacked bar por movimiento: Sn azul · C&J rojo · Accesorios gris
- Tonelaje total inline
- ACWR ring 0-2 verde/amber/red

ZONA E · ADHERENCIA 365 DÍAS (heatmap)
- Calendar año tipo GitHub
- Cada día: tonelaje relativo (color intensity)
- Click día → tooltip "Sesión completada · 12.840 kg"

ZONA F · RECORDS BREAKDOWN (lista)
- PR history vertical scroll
- "Snatch 92kg · 2026-04-15 · semana 5 macrociclo Ruso"
- Filtrable por movimiento

INTERACCIONES:
- Pull-to-refresh re-fetch
- Tap PR card → drawer histórico + chart progresión
- Long-press chart bar → tooltip detalle mes

OUTPUT:
- HoStatsV3.tsx
- API: GET /v1/holyoly/stats/me?period=...
- Mock: 4 PRs + ratios + 12m volumen + 365d adherencia
- Componentes: Plate3D, Heatmap365, Chart existentes
```

---

### Prompt 8 · PerformanceDeepDive

```
Diseña PERFORMANCE DEEP DIVE mobile-first · análisis profundo de
una sesión específica o ventana de tiempo.

USO: atleta abre desde "Tap para ver más" de un PR o ventana mes.

ESTRUCTURA:

ZONA A · HEADER CONTEXTO
- "Análisis de sesión" o "Análisis 7d/30d"
- Date range picker inline
- Botón back

ZONA B · SCORE COMPUESTO HERO
- "Performance Score" big number /100
- 5 sub-scores radar chart:
  · Volumen · Intensidad · Técnica · Recovery · Adherencia

ZONA C · CHART INTERACTIVO PRINCIPAL
- Multi-line chart con toggles:
  · Tonelaje
  · RPE promedio
  · CNS Score
  · Sueño
  · Stress
- Eje tiempo bottom
- Tooltip hover muestra todos los valores

ZONA D · INSIGHTS IA (3-4 cards)
- "Tu RPE divergió +1.2 esta semana · CNS bajo"
- "Mejor sesión: martes · tonelaje + técnica óptima"
- "Sugerencia: deload jueves antes de PR test"
- Cada insight con explicación expandible

ZONA E · COMPARATIVA PREVIO
- "vs última ventana similar"
- Tabla densa: ahora/antes/delta% por métrica

OUTPUT:
- PerformanceDeepDiveV3.tsx
- API: GET /v1/performance/deep-dive?from=...&to=...
- Mock: 30 días sintéticos con métricas
```

---

### Prompt 9 · MovementProgression

```
Diseña MOVEMENT PROGRESSION mobile-first · progresión por movimiento
específico (Snatch · C&J · Squats · Pulls).

USO: atleta selecciona movimiento del SkillTree o stats.

ESTRUCTURA:

ZONA A · HEADER MOVIMIENTO
- Nombre grande "SNATCH"
- Sub "Movimiento olímpico clásico"
- Tier disco actual (PlateBadge)
- Próximo tier criteria

ZONA B · 1RM HISTORY (chart line)
- 1RM por sesión últimas 12 semanas
- Marker tiers crossed (verde → amarillo, etc.)
- Tooltip por punto: fecha · kg · contexto

ZONA C · TÉCNICA SCORE
- 5 criterios skill:
  · Recibida overhead
  · Setup posición
  · Primer tirón
  · Segundo tirón
  · Estabilidad
- Cada criterio 1-10 + barra + nota coach

ZONA D · VIDEOS REVIEW (Premium)
- Grid 2x2 thumbnails últimos 4 videos
- Tap → reproductor con anotaciones IA
- CTA si Free "Upgrade a PRO para video review"

ZONA E · PRÓXIMOS HITOS
- Lista de PRs realísticos próximas 4 sem
- Conditions IA: "Si mantenés 4 sesiones/sem y RPE <8, posible 95kg en 6 sem"

OUTPUT:
- MovementProgressionV3.tsx
- Props: { movementId: string } via URL
- API: GET /v1/movements/{id}/progression/me
```

---

### Prompt 10 · Profile (atleta + coach · 3 secciones críticas)

```
Diseña PROFILE screen mobile-first.

CRITICAL: 3 secciones nuevas que faltan en Profile actual:
1. Hormonal opt-in (atleta femenino)
2. Privacy settings (datos compartidos)
3. Delete account (destructive)

STRUCTURE:

ZONA A · HEADER PERFIL
- Avatar grande + name
- Tier badge (PlateBadge atleta o cinturón legacy)
- Email + producto
- Botón edit (upload avatar)

ZONA B · STATS RESUMIDAS (4 mini cards)
- Sesiones totales
- XP acumulado
- Macrociclos completados
- Días en la plataforma

ZONA C · SETTINGS MENU (lista accordion)
SECCIÓN "Tu cuerpo":
- Biometría (peso · altura)
- Equipo disponible
- Unidades (kg/lbs · °C/°F)

SECCIÓN "Tu entrenamiento":
- Mi coach (cambiar/desvincular)
- Macrociclo activo
- Productos (HO/Volta switch)

SECCIÓN "Hormonal" (solo si female opt-in):
- Toggle "Activar tracking ciclo"
- Cycle start date picker
- Cycle length (28d default · slider 21-35)
- Privacy notice
- "Ver fase actual" link

SECCIÓN "Notificaciones":
- Push enabled toggle
- Categorías: WOD asignado · Coach msg · Belt up · Alert YELLOW/RED
- Quiet hours

SECCIÓN "Privacidad":
- "Mis datos" link → modal con qué guardamos
- "Compartir datos anónimos para investigación" toggle (default OFF)
- "Aparecer en leaderboards públicos" toggle
- "Exportar todos mis datos" botón (download JSON · GDPR)

SECCIÓN "Temas":
- 5 chips temas (default + custom)
- ThemeGallery component existente

SECCIÓN "Cuenta":
- Email change
- Password change
- Logout (rojo)
- DELETE ACCOUNT (destructive · rojo brillante · separado abajo)
  · Tap → modal confirmación 2-step
  · "Esto borra todo · escribí DELETE para confirmar"
  · Input + botón final rojo

ZONA D · FOOTER LEGAL
- App version
- Privacidad · Términos · Soporte

INTERACCIONES:
- Tap sección → expand inline
- Save changes inline · toast confirmación
- DELETE flow: 2 steps + confirm input

ACCESIBILIDAD:
- DELETE button visible · NO escondido
- Confirmaciones claras antes de irreversibles

OUTPUT:
- ProfileV3.tsx
- APIs:
  · GET /v1/users/me
  · PATCH /v1/users/me
  · DELETE /v1/users/me (con confirmación token)
- Reutiliza ThemeGallery, HormonalPhaseCard
```

---

## Sub-bloque 2B · Sesión Holy Oly (5 prompts)

---

### Prompt 11 · SessionSchedule (calendario)

```
Diseña SESSION SCHEDULE screen mobile-first · calendario de
sesiones próximas + histórico atleta.

ESTRUCTURA:

ZONA A · TABS (sticky top)
- "Próximas" · "Histórico" · "Calendario"

ZONA B · VISTA DEFAULT "PRÓXIMAS"
- Lista vertical sesiones programadas
- Cada card:
  · Fecha + día semana
  · Tipo sesión (chip color tactical · VOL/INT/MED/etc.)
  · Movimientos principales
  · Duración est + tonelaje est
  · Botón "Empezar" si hoy/mañana · "Solicitar reprogramación" después

ZONA C · VISTA "CALENDARIO"
- Calendar mensual con dots por día (tipo sesión)
- Tap día → drawer detalle sesión

ZONA D · VISTA "HISTÓRICO"
- Lista cronológica completed sessions
- RPE registrado · tonelaje real · feedback

CTA bottom sticky:
- "Solicitar cambio al coach" → opens chat preset

OUTPUT:
- SessionScheduleV3.tsx
- API: GET /v1/sessions/me?from=...
```

---

### Prompt 12 · WarmupGenerator

```
Diseña WARMUP GENERATOR screen mobile-first · genera calentamiento
inteligente pre-sesión.

ESTRUCTURA:

ZONA A · HEADER CONTEXT
- "Calentamiento · {sesión nombre}"
- Movimiento principal de la sesión

ZONA B · 3 FASES VISUAL TIMELINE
- Fase 1 · Movilidad (5-7 min)
- Fase 2 · Activación (3-5 min)
- Fase 3 · Específica (5-8 min)
- Cada fase con duración + skip si experimentado

ZONA C · EJERCICIOS LISTA POR FASE (expandible)
- Cada ejercicio:
  · Nombre
  · Reps/duración
  · Video micro (3s loop GIF)
  · Check tappable cuando completado
- Tape next exercise destacado neón

ZONA D · TIMER FOOTER
- Total time + current phase progress
- Botón "Saltar fase" + "Empezar sesión"

INTERACCIONES:
- Auto-advance al completar exercise (con confirmación visual)
- Modo "leer" sin timer si solo querés ver
- Audio coach opcional

OUTPUT:
- WarmupGeneratorV3.tsx
- API: GET /v1/warmup/generate?sessionId=...
- Mock: 3 fases con 4-6 exercises cada
```

---

### Prompt 13 · ActiveSession (timer + sets + RPE)

```
Diseña ACTIVE SESSION screen mobile-first · pantalla MÁS CRÍTICA
del atleta durante entrenamiento.

OBJETIVO: gestionar series + reps + peso + RPE durante sesión real
sin distracciones · UI grande para usar entre series.

ESTRUCTURA:

ZONA A · HEADER MINIMAL (40px)
- Sesión nombre + slot actual
- Tiempo total sesión arriba der
- Botón "X" pausar (modal confirmación)

ZONA B · EXERCISE CARD HERO (centro · 50vh)
- Movimiento nombre HUGE (Snatch · Clean & Jerk · etc.)
- Set actual / total (ej "Serie 3 / 5")
- Peso prescrito grande tabular kg
- Reps target
- Plate3D stack mostrando carga visual

ZONA C · TIMER REST (entre series · countdown grande)
- Cuando completas set: cuenta atrás auto-start
- "Descanso · 2:30" tabular gigante
- Botón "Saltar descanso"
- Botón "Listo · siguiente serie"

ZONA D · RPE INPUT (post set)
- Slider 1-10 visual + valor central
- Botones rápidos: 6 · 7 · 8 · 9 · 10
- Auto-save al cambiar serie

ZONA E · PROGRESS BAR BOTTOM
- Series completadas (5 dots progresivos)
- Total slots restantes
- "Sesión 2/4 · slot Clean&Jerk"

INTERACCIONES:
- Swipe up = "Set completado"
- Swipe down = "Set fallado" (con nota)
- Long-press peso = "Ajustar carga inline"
- Doble-tap timer = pausa/resume
- Modo nocturno auto en gym dim light (sensor brightness)

ESTADOS:
- Session start: 3-2-1 countdown
- Slot complete: confetti minimal + transición next
- Session done: navigate SUMMARY
- Pause: scrim + "Continuar" + "Cancelar sesión"

ACCESIBILIDAD CRÍTICA:
- TODO MUY GRANDE (usar entre series con poca atención)
- Contraste max · 18-22pt min
- Vibración táctil iOS al cambiar set

OUTPUT:
- ActiveSessionV3.tsx
- API:
  · POST /v1/sessions/{id}/sets (cada set)
  · PATCH /v1/sessions/{id}/complete
- Mock: 4 slots × 5 series

REFERENCIAS:
- Strong app · timer entre series
- Jefit · session view
- WHOOP · workout timer (minimalismo extremo)
```

---

### Prompt 14 · SessionSummaryPreview

```
Diseña SESSION SUMMARY mobile-first · resumen post-entreno con
métricas + feedback opcional.

ESTRUCTURA:

ZONA A · HERO
- "Sesión completada" + checkmark verde grande
- Duración total
- Sesión nombre

ZONA B · STATS GRID (bento 2x3)
- Tonelaje total kg
- Series completadas / total
- RPE promedio
- Peso máximo levantado
- Tiempo descanso promedio
- Adherencia plan %

ZONA C · COMPARATIVA SESIÓN PREVIA
- Mini cards delta vs última sesión similar
- "+340 kg vs Mar 25" verde
- "RPE -0.4 mejor recuperado"

ZONA D · FEEDBACK INPUT (opcional)
- 3 emojis grandes selectable: 😫 😐 💪
- "Cómo te sentís?" sub
- Input texto opcional "Notas para tu coach"

ZONA E · CTA
- "Compartir card social" (opens SocialCard)
- "Ver detalle deep dive" (opens PerformanceDeepDive)
- "Volver a Home"

OUTPUT:
- SessionSummaryPreviewV3.tsx
- API: POST /v1/sessions/{id}/feedback
- Auto-navigate desde ActiveSession on complete
```

---

### Prompt 15 · VictoryScreen (PR celebration)

```
Diseña VICTORY SCREEN fullscreen mobile-first · celebración PR
o milestone significativo.

USO: trigger automático cuando atleta hace PR · cinturón up · 100 sesiones.

STRUCTURE FULLSCREEN INMERSIVE:

ZONA A · CONFETTI BACKGROUND (animado)
- 50-100 partículas colores producto
- Drift gravitacional natural
- Reduce-motion: estáticas

ZONA B · CENTRAL ANNOUNCEMENT
- Tag "PERSONAL RECORD" o "BELT UP" o "MILESTONE"
- Movimiento icon (Plate3D para PR halterofilia)
- Valor grande tabular "92 kg"
- Sub "+4 kg vs anterior"
- Atleta nombre

ZONA C · CONTEXTO (sub-card)
- "Snatch · martes 27 may 17:45"
- "Sesión 7 macrociclo Ruso Clásico"
- "RPE registrado: 9 · Velocity drop: 8%"

ZONA D · CTA GROUP (bottom)
- CTA principal "GUARDAR Y COMPARTIR" (genera SocialCard)
- CTA secundario "Solo guardar" cierra
- Link "No mostrar VictoryScreen en futuros PRs"

ANIMACIONES:
- Entry: zoom-in number desde center + glow expand
- Loop sutil: number pulsing
- Confetti continuo · pausa al tap

OUTPUT:
- VictoryScreenV3.tsx
- Props: { type: 'pr'|'belt'|'milestone', data: {...}, onClose }
- Persistence: marca como "celebrated" en localStorage para no repetir
```

---

## Sub-bloque 2C · Wellness (4 prompts)

---

### Prompt 16 · HormonalSetup

```
Diseña HORMONAL SETUP screen mobile-first · opt-in tracking
ciclo menstrual con sensibilidad apropiada.

PRINCIPIO: privacy-first · opt-in explícito · datos sensibles GDPR.

ESTRUCTURA:

ZONA A · HEADER EDUCATIVO
- "Tracking de ciclo menstrual"
- Sub explicativo: "Personalizamos tu plan según tu fase hormonal · 100% privado · podés desactivar cuando quieras"
- Link "Por qué importa?" → modal con paper científico simple

ZONA B · TOGGLE PRINCIPAL
- Switch grande "Activar tracking"
- Default OFF
- Si OFF, oculta secciones siguientes

ZONA C · DATOS DEL CICLO (si activado)
- Date picker "Inicio último período"
- Slider "Duración promedio ciclo" (21-35 días · default 28)
- Slider "Duración menstruación" (3-7 días · default 5)

ZONA D · PREFERENCIAS
- Toggle "Ajustar carga según fase" (default ON si activated)
- Toggle "Notificar próximo período"
- Toggle "Notificar ventana óvulo (PRs potenciales)"

ZONA E · PRIVACY DASHBOARD
- "Quién ve estos datos:"
  · Solo vos · siempre
  · Tu coach SÍ/NO (toggle)
  · Investigación anónima SÍ/NO (toggle)
- Botón "Borrar todos mis datos hormonales" (rojo · 2-step confirm)

ZONA F · VISUALIZACIÓN PREVIEW
- Si datos ingresados: card preview "Fase actual: Ovulación día 16 · +10% intensidad recomendada"

INTERACCIONES:
- Save inline al cambiar cualquier valor
- Toast bottom confirmación
- Si deactivate · modal "Esto borra tu histórico · estás seguro?"

OUTPUT:
- HormonalSetupV3.tsx
- API:
  · POST /v1/hormonal/log
  · GET /v1/hormonal/current-phase
  · DELETE /v1/hormonal/me
```

---

### Prompt 17 · BaselineAssessment

```
Diseña BASELINE ASSESSMENT mobile-first · 1-time test inicial para
atletas nuevos · calibra plan personalizado.

USO: trigger después de Onboarding si no completado.

ESTRUCTURA:

ZONA A · HEADER
- "Test inicial · 20-30 min"
- Progress dots (5-7 secciones)

SECCIÓN 1 · 1RM TESTS
- Snatch · ingreso manual o test in-app
- C&J · idem
- Front Squat · idem
- Back Squat · idem
- Si "no tengo · quiero hacer test" → modal protocolo test

SECCIÓN 2 · MOVILIDAD CHECK
- Overhead squat depth · self-assess foto opcional
- Shoulder mobility · range estimado
- Hip mobility · range estimado

SECCIÓN 3 · HISTORIAL
- Años entrenando
- Lesiones previas (multi-select)
- Cirugías relevantes

SECCIÓN 4 · LIFESTYLE
- Sueño promedio (slider)
- Stress level (1-10)
- Trabajo físico/sedentario

SECCIÓN 5 · OBJETIVOS
- Performance · composición · salud · competir
- Timeline (3m · 6m · 12m · sin presión)

ZONA FINAL · RESULTADO
- "Tu perfil inicial OLY Index: 6.2"
- "Plan sugerido: Cubano Clásico 12s (intermedio)"
- CTA "Aceptar plan" o "Ver otros"

OUTPUT:
- BaselineAssessmentV3.tsx
- API: POST /v1/baseline/me
```

---

### Prompt 18 · KnowledgePills

```
Diseña KNOWLEDGE PILLS screen mobile-first · catálogo de píldoras
educativas tipo TikTok / Reels educational.

CONTEXT: Píldoras = micro-contenido (60s max) sobre técnica · ciencia ·
nutrición · recuperación. Atleta consume daily.

ESTRUCTURA:

ZONA A · HEADER + CATEGORIES (sticky)
- Título "Píldoras de hoy"
- Chips: Todas · Técnica · Recuperación · Nutrición · Mentalidad · Ciencia

ZONA B · FEATURED HERO (top card)
- Píldora del día · imagen + 1-line hook
- "Por qué tu Snatch falla en el pull alto · 47s"
- Tap → fullscreen video player

ZONA C · GRID VERTICAL (2 cols)
- Cards 180x240
- Thumbnail + título + duración + categoría chip + cita (Huberman, etc.)
- Tap → fullscreen player

ZONA D · PLAYER FULLSCREEN MODAL
- Video vertical 9:16
- Title overlay top
- Bottom: like · save · share · "Próxima"
- Swipe up = próxima, down = anterior

ZONA E · TAB "MIS GUARDADAS"
- Lista de saved pills
- Filter por categoría

OUTPUT:
- KnowledgePillsV3.tsx
- API: GET /v1/pills?category=...
- Player: HTML5 video con controls custom
```

---

### Prompt 19 · BeltCeremony refresh

```
Diseña BELT CEREMONY refresh mobile-first · upgrade visual del
fullscreen ceremonial existente.

CONTEXT: Atleta sube tier (disco color). Triggered cuando supera
criterios + verifica coach. Pantalla screenshot-worthy para Instagram.

NOTA: System usa DISCOS (verde/amarillo/azul/rojo) no cinturones.
Pero la pantalla se llama "BeltCeremony" por legacy. NO cambies el nombre
solo el visual.

STRUCTURE FULLSCREEN:

ZONA A · BACKGROUND EFECTOS
- Gradiente color próximo tier
- Partículas color tier orbitan + explotan
- Reduce-motion: gradiente estático

ZONA B · CENTRAL (5 SEGMENTOS ANIMADOS)
1 · "TIER UP" tag mono pequeño + fade-in
2 · Plate3D animado grande (96px → 240px scale)
   · Glow tier color
3 · Texto "INICIANTE → INTERMEDIO" (tier old → new)
4 · Nombre atleta + tag motivacional (variable según tier)
5 · Stats unlocked nuevos (3 cards mini · ej "Acceso macrociclos avanzados")

ZONA C · CTAs BOTTOM
- "GUARDAR Y COMPARTIR" → genera SocialCard
- "Solo guardar" cierra
- "No celebrar futuras subidas" link discreto

ANIMACIONES:
- Segments aparecen secuencial 0.8s c/u
- Plate3D rotación 3D-perspective
- Particle storm pico minuto 0:03

PERSISTENCIA:
- Marca tier como "celebrated" localStorage
- No retriggea si vuelves a la app

OUTPUT:
- BeltCeremonyV3.tsx
- Reutilizar plate-3d custom element con animate
- Sound design opcional (mute por default)
```

---

## Sub-bloque 2D · Social (4 prompts)

---

### Prompt 20 · SocialCard

```
Diseña SOCIAL CARD generator mobile-first · genera imagen
shareable post-PR o post-sesión.

OBJETIVO: viral loop · atleta comparte logro en IG / WhatsApp.

ESTRUCTURA:

ZONA A · PREVIEW CARD (centro · 9:16 ratio)
- Card editable con elementos:
  · Avatar + nombre atleta
  · Disco/tier badge (Plate3D)
  · Logro grande: "92 kg Snatch · NEW PR · +4 kg"
  · Stats secundarios (RPE · velocity · semana)
  · Branding Peak Qual sutil bottom
  · QR code mini referral (opt-in)

ZONA B · CUSTOMIZATION CONTROLS (bottom sheet collapsible)
- Template chooser (3-5 estilos)
- Color theme (auto desde producto)
- Toggle datos visibles (chips: nombre · stats · branding)
- Texto custom opcional (1 línea)

ZONA C · ACCIONES
- "Compartir IG Stories" → image + sticker
- "Compartir WhatsApp"
- "Guardar en galería" → device download
- "Copiar imagen al portapapeles"

OUTPUT:
- SocialCardV3.tsx
- Render: canvas API o html2canvas para export PNG 1080x1920
- Props: { athlete, achievement, type }
```

---

### Prompt 21 · SocialCardsGallery

```
Diseña SOCIAL CARDS GALLERY mobile-first · histórico de cards
generadas por el atleta.

ESTRUCTURA:

ZONA A · HEADER
- "Mis cards compartidas"
- Filter: tipo logro · período

ZONA B · GRID 2 COLS
- Cards mini preview clickable
- Indicador "compartido en X plataformas"

ZONA C · DETALLE TAP
- Fullscreen card + actions (re-share · download · delete)

ZONA D · ANALYTICS (Premium · si conectado)
- "Tu card del 15 abril tuvo 234 vistas"
- "12 personas se registraron via tu referral"

OUTPUT:
- SocialCardsGalleryV3.tsx
- API: GET /v1/social-cards/me
```

---

### Prompt 22 · Leaderboard

```
Diseña LEADERBOARD mobile-first · ranking COHORT-BASED (NO global).

PRINCIPIO BUILDERCULT: no rankings globales, segmentos por nivel/género/age/box.
Sino genera comparación tóxica.

ESTRUCTURA:

ZONA A · COHORT SWITCHER (sticky top)
- 4 tabs: Mi box · Mi tier · Mi categoría · Mi macrociclo
- Cada tab muestra ranking de cohort distinta · NO global

ZONA B · MI POSICIÓN HERO (top after tabs)
- "Estás en posición 7 / 23 de tu cohort"
- Delta vs semana pasada
- Próximo a superar / por superarte

ZONA C · TOP 10 LISTA
- Avatar + nombre + tier + métrica relevant
- Si soy yo: highlighted glow neón
- Tap atleta → mini perfil público (datos opt-in)

ZONA D · MI ENTORNO (3 above + 3 below si no top 10)
- "Cerca de vos"
- Misma estructura compact

ZONA E · MÉTRICA SWITCHER
- Cambiar criterio ranking: OLY Index · tonelaje · PRs · adherencia · streak
- Chips arriba

NO MOSTRAR:
- Ranking global (mata motivación atletas amateurs)
- Comparación con elite si vos sos principiante

OUTPUT:
- LeaderboardV3.tsx
- API: GET /v1/leaderboard?cohort=...&metric=...
```

---

### Prompt 23 · PulseHub (anaeróbico)

```
Diseña PULSE HUB mobile-first · sección de entrenos anaeróbicos
para halterofilia (sprints, complexes, etc.).

CONTEXT: complemento a olímpicos clásicos para potencia/capacidad.

ESTRUCTURA:

ZONA A · HEADER
- "Pulse · entreno anaeróbico"
- Sub "Complementa tu halterofilia"

ZONA B · DAILY PULSE (hero card)
- Reto del día tipo "WOD anaeróbico"
- Estructura tipica: 4 rounds · 20s work · 40s rest
- Movimientos seleccionados (Sn Power, OHS, Burpees, etc.)
- Timer integrado · "Empezar AHORA"

ZONA C · CATÁLOGO CHALLENGES
- Grid 2x N de retos disponibles
- Cada uno: dificultad · duración · target

ZONA D · TU HISTORIAL PULSE
- Last 7 days · scores
- Best time challenge tipo
- Compare con cohort (opt-in)

OUTPUT:
- PulseHubV3.tsx
- API: GET /v1/pulse/challenges
- Spec: ver engines/09_pulse_engine.md (725 líneas) para reglas detalladas
```

---

## Notas finales del bloque

- **Orden sugerido:** 6→10 (stats) · 11→15 (sesión) · 16→19 (wellness) · 20→23 (social)
- **Componentes reutilizables nuevos esperados:**
  - SkillBadge component
  - StatRing component
  - Cohort selector
  - VideoPlayer fullscreen
- **Validación post-porte:** flow real demo · Home → tap card → entrar a cada una

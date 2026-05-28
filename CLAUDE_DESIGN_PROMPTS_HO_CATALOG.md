# Claude Design · Holy Oly · Catálogo + Detalle Macrociclos

> **Contexto compartido** (pegar al inicio de cada prompt):
>
> **Producto:** Holy Oly · Halterofilia Olímpica · vertical de PeakQual
> **Audiencia primaria:** Coach selecciona macrociclo para asignar · Atleta consulta el suyo
> **Catálogo real:** 23 macrociclos · familias Búlgaro · Coreano · Chino · Cubano · Polaco · Ruso · Ucraniano · Colombiano · Híbrido · USA
> **Cada macro tiene:** family · duration · frequency · intensity 1-5 · volume 1-5 · color · bestFor · 4 mesocycles típicos · IMR% (intensidad media relativa) curve · day-types (VOL/MED/INT/ACT/TEC/REC)
> **Visual style:** FIFA Modo Leyenda + Bento + Tactical HUD · dark mode · neón acentos · tabular nums
> **Componentes existentes a reutilizar:** PlateBadge, Plate3D, PlateStack, MetricHistoryModal, Chart
> **Mock data:** `frontend/src/data/macrocycles.ts` (23 items) + `macrocycles/RAW_SOURCES/*.txt` (planes detallados)
> **Output:** TSX completo · React 19 + Tailwind 4 + shadcn/ui

---

## Prompt G · CATÁLOGO MACROCICLOS HO (browser/comparador)

```
Diseña una pantalla mobile-first CATÁLOGO de los 23 MACROCICLOS de Holy Oly,
pensada para que COACH explore, COMPARE, y ATLETA entienda qué es cada escuela.

OBJETIVO UX: convertir un dato denso (escuela rusa vs búlgara vs cubana) en
visual masticable · "scrollear como Netflix de macrociclos".

═══════════════════════════════════════════
ESTRUCTURA EN 5 ZONAS
═══════════════════════════════════════════

ZONA A · HEADER FILTROS (sticky 92px)
- Título: "Macrociclos · Halterofilia"
- Chip family multi-select horizontal scroll:
  [Todos · Ruso · Búlgaro · Cubano · Coreano · Chino · Polaco · Ucraniano · Híbrido]
  Cada chip con color identitario de la escuela
- Sliders inline (collapsible "Más filtros"):
  · Intensidad min/max (slider 1-5)
  · Volumen min/max (slider 1-5)
  · Duración (4/8/12/16/24 semanas chips)
  · Frecuencia (3-6 d/sem chips)
- Search bar discreto
- Contador resultado: "Mostrando 8 de 23"

ZONA B · HERO COMPARATIVO (sólo si 2-3 macros seleccionados)
- Toggle "Comparar" arriba (si ON, multi-select activo)
- Cards lado a lado horizontal scroll (snap)
- Cada hero card 280x340:
  · Banner top color familia
  · Nombre macro grande + family badge
  · 4 mini-rings: Intensidad · Volumen · Duración · Frecuencia
  · CTA "Ver detalle" o "Asignar" (según rol)

ZONA C · GRID NETFLIX-STYLE (default)
- Bento grid 2 cols mobile / 3 cols tablet
- Cada card 100% width col, ~200px alto:

  [HORIZONTAL CARD]
  ┌─────────────────────────────────────┐
  │ ▓▓▓ BANNER COLOR ESCUELA (40px)     │
  │ Ruso Clásico 16s          [RUSO]   │
  ├─────────────────────────────────────┤
  │ 📊 5d/sem · 16 sem · 500-650 reps  │
  │                                     │
  │ Intensidad  ▓▓▓▓░  4/5             │
  │ Volumen     ▓▓▓▓▓  5/5             │
  │ Recovery    ▓▓░░░  2/5             │
  │                                     │
  │ "Variabilidad · waviness · GPP"    │
  │                                     │
  │ Best for: Atletas pacientes que    │
  │ valoran fundamentos                 │
  └─────────────────────────────────────┘

- Hover/long-press → preview animado (mini timeline mesocycles)
- Tap → navega a detalle (prompt H)
- Badge "✓ ASIGNADO" si el atleta ya lo tiene activo
- Badge "🎖️ COMPLETADO" con count si ya lo hizo antes

ZONA D · SECCIÓN "RECOMENDADOS PARA TI" (top del grid, antes de filtros activos)
- Solo si Antigravity tiene historial atleta
- 3 cards horizontal scroll
- Razón explícita por card: "Recomendado · tu última fase fue intensidad alta, este balancea con volumen"

ZONA E · EDUCATIVO COLAPSABLE FOOTER
- Acordeón "¿Qué diferencia una escuela de otra?"
- Cuando expande: tabla comparativa rápida:

  | Escuela | Filosofía  | Sweet spot       |
  |---------|------------|-------------------|
  | Ruso    | Volumen + waviness | Base sólida 6-12m
  | Búlgaro | Daily max  | Avanzado · SNC adaptado
  | Cubano  | Técnica + clásica  | Principiante a intermedio
  | Coreano | Disciplina + tirones | Atleta full-time
  | Chino   | Pulls + culturismo | Corrección debilidades
  | Polaco  | Block periodization | Competidor enfocado

═══════════════════════════════════════════
INTERACCIONES CLAVE
═══════════════════════════════════════════

- Tap card → detalle (página H)
- Long-press card → mini drawer "Asignar a..." (solo coach)
- Pull-to-refresh re-fetch catálogo
- Swipe horizontal en hero cards
- Toggle vista "Grid" ↔ "Lista compacta" (top-right)

═══════════════════════════════════════════
ESTADOS
═══════════════════════════════════════════

- Empty filter: ilustración + "No hay macrociclos con esos filtros · reset"
- Loading: 6 skeleton cards
- Atleta sin acceso premium: cards con lock overlay + CTA "Desbloquear con Pro"

═══════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════

- Archivo: `pages/v2/HolyOlyMacrocycleCatalogV2.tsx`
- API: GET /v1/macrocycles?product=holy-oly&filters=...
- Mock fallback: importar `MACROCYCLES` de `data/macrocycles.ts`
- CSS: tailwind tokens v2 + variables --color-school-ruso, --color-school-bulgaro, etc.
- Reutilizar: <Chart> para rings, <Badge>, <Card> base

TONO COPY: directo · sin marketing · datos crudos · educativo.
Ejemplo: ❌ "¡El mejor para ti!" → ✅ "Recomendado por baseline actual"
```

---

## Prompt H · DETALLE MACROCICLO HO (deep dive · educativo + ejecutable)

```
Diseña una pantalla mobile-first DETALLE COMPLETO de UN MACROCICLO Holy Oly
(ej. "Ruso Clásico 16 semanas"). Mostrar TODO el plan + filosofía + sesiones día por día.

OBJETIVO UX: que un atleta nuevo entienda en 60 segundos QUÉ es el método ruso,
qué le va a pedir, y cómo se ve una semana real. Coach lo usa para sustentar la asignación.

═══════════════════════════════════════════
ESTRUCTURA EN 7 ZONAS VERTICALES
═══════════════════════════════════════════

ZONA 1 · HERO HEADER (340px alto, parallax)
- Fondo: gradiente diagonal color escuela (rojo bandera URSS sutil para Ruso, etc.)
- Top-left: back chevron + "Catálogo"
- Top-right: kebab menu (Asignar · Compartir · Imprimir PDF)
- Título grande tabular: "RUSO CLÁSICO"
- Subtitle: "16 semanas · 5 días/semana · Escuela Soviética"
- Badge family color en esquina
- Mini stats fila:
  · Intensidad 4/5 · Volumen 5/5 · Recovery 2/5 · Dificultad 4/5
- CTA primario sticky: "Asignar este macrociclo" (verde lima, full width)
  (sólo coach; atleta ve "Solicitar a mi coach")

ZONA 2 · FILOSOFÍA DEL MÉTODO (card educativa)
- Headline: "¿Qué hace único al método Ruso?"
- 3 cards horizontal scroll (snap), cada una 280x180:

  Card 1 · "Waviness" (Ondulación)
  - Mini gráfico señal sinusoidal animado
  - "Las cargas suben y bajan dentro de la misma semana.
     Día pesado · ligero · mediano. Permite estímulo sin acumular fatiga lineal."

  Card 2 · GPP Extensa
  - Icono pirámide invertida
  - "Preparación general amplia antes de especificidad.
     Variantes no-clásicas (Hang, Muscle, Power) para base técnica."

  Card 3 · Estructura 3:1
  - Mini timeline 4 barras (3 verde + 1 amarilla)
  - "Tres semanas de carga progresiva + una de descarga.
     Probado en programas de halterofilia soviética desde los 70s."

ZONA 3 · VISUALIZADOR DE INTENSIDAD/VOLUMEN (gráfico hero · clave)
- Dual line chart 16 semanas eje X
- Línea 1 (rojo) · IMR% por semana · sube/baja según mesociclo
- Línea 2 (azul) · Volumen reps semanales · subida hasta semana 11, taper
- Bandas de fondo coloreadas por mesociclo:
  · Mes 1 (S1-4): GPP/Técnica (verde claro)
  · Mes 2 (S5-8): Fuerza/Acumulación (amarillo)
  · Mes 3 (S9-12): SPP/Intensificación (naranja)
  · Mes 4 (S13-16): Peaking/Test (rojo)
- Hover semana → tooltip detalle (IMR%, reps totales, focus de la semana)
- Línea vertical "Hoy estás aquí" si el atleta está cursándolo
- Legend collapsible

ZONA 4 · MESOCICLOS · ACORDEÓN VERTICAL (4 bloques apilados)
- Cada mesociclo card 100% width:

  [ACCORDION ITEM]
  ┌─────────────────────────────────────────────┐
  │ 🔵  MES 1 · PREPARACIÓN GENERAL (S1-S4)    │
  │     IMR 65-70% · Volumen alto · ▼          │
  ├─────────────────────────────────────────────┤
  │ Objetivo: Acondicionamiento + técnica       │
  │ Foco: variantes Muscle/Hang/Power + squat   │
  │                                              │
  │ Por semana ▼                                 │
  │  S1 · Introducción · IMR 65% · 320 reps     │
  │  S2 · Acumulación  · IMR 68% · 380 reps     │
  │  S3 · Choque       · IMR 70% · 420 reps     │
  │  S4 · Descarga     · IMR 60% · 180 reps     │
  │                                              │
  │ ┌─ Ver semana 1 día por día → tap ─────┐   │
  └─────────────────────────────────────────────┘

- Color izq según mesociclo (azul/verde/naranja/rojo)
- Expansion animada smooth

ZONA 5 · VISTA SEMANA TIPO (drawer al tap "Ver semana")
Drawer bottom 90vh con:
- Tabs días lun-vie horizontal
- Para cada día:

  ┌─────────────────────────────────────┐
  │ LUNES · TIPO VOL (Volumen)          │
  │ Duración est: 95 min                │
  ├─────────────────────────────────────┤
  │ SLOT 1 · ARRANQUE                   │
  │  Muscle Snatch · 4x4 @ 50%          │
  │  → 50% de tu 1RM (92kg) = 46kg     │
  │  → Stack visual: 1🟢 1🟡 1🔵       │
  ├─────────────────────────────────────┤
  │ SLOT 2 · ENVIÓN                     │
  │  Muscle Clean · 4x4 @ 50%           │
  │  → 50% de tu 1RM C&J (115kg) = 57kg│
  │  → Stack: 2🟢 1🟡 1🔵              │
  ├─────────────────────────────────────┤
  │ SLOT 3 · FUERZA/ACC                 │
  │  Back Squat · 5x6 @ 65%             │
  │  → ~120kg                            │
  ├─────────────────────────────────────┤
  │ Tonelaje día estimado: 4.250 kg    │
  │ RPE objetivo: 6-7                   │
  └─────────────────────────────────────┘

- Day-type badge color (VOL azul · MED amarillo · INT rojo · ACT verde · TEC violeta · REC gris)
- Para cada ejercicio: Plate3D mini reutilizado mostrando stack real
- Toggle "Mostrar en kg/lbs"
- CTA bottom: "Empezar esta sesión" → navega a VoltaActiveWod-equivalente

ZONA 6 · DAY-TYPE LEYENDA + GLOSARIO
- Grid 3x2 explicando cada tipo de día:
  · VOL (volumen) · MED (mediano) · INT (intensidad) · ACT (activación) · TEC (técnica) · REC (recuperación)
- Tap cada uno → tooltip con definición + cuándo se usa

ZONA 7 · COMPARATIVOS + CONTEXTO HISTÓRICO (footer rico)
- 3 mini-cards:

  Card "Atletas que lo completaron"
  - Avatar grid (max 8) + "+47" si más
  - "Promedio: PR +6.2 kg en Snatch tras 16s"
  - Link "Ver testimonios"

  Card "Origen histórico"
  - "Codificado por Alexei Medvedev y refinado por la escuela soviética.
     Base de prácticamente todos los sistemas modernos de halterofilia."
  - Link "Leer más" (modal con paper/PDF)

  Card "Macrociclos similares"
  - 2-3 cards mini · "Coreano 5D" "Polaco 5D" (alternativas)
  - Tap → catálogo filtrado

═══════════════════════════════════════════
INTERACCIONES
═══════════════════════════════════════════

- Hero CTA sticky on scroll
- Acordeón mesociclo: solo uno abierto a la vez
- Drawer semana día por día: swipe horizontal entre días
- Tap ejercicio dentro de drawer → mini modal "Por qué este ejercicio en este día"
  (explicación IA · educativo)
- Share: genera PDF con plan completo (16 semanas)
- Long-press cualquier semana en gráfico → "Marcar como objetivo de prueba"

═══════════════════════════════════════════
ESTADOS ESPECIALES
═══════════════════════════════════════════

- Atleta sin 1RM registrado:
  · Banner top "Registra tu 1RM Snatch y C&J para ver pesos reales"
  · Pesos mostrados como % en vez de kg
  · CTA "Hacer test inicial"

- Macrociclo activo (atleta cursándolo):
  · Hero muestra "Semana 7 de 16 · 44% completado"
  · Gráfico zona 3 marca "Hoy aquí"
  · Drawer semana abre por defecto en semana actual

- Macrociclo completado (histórico):
  · Badge "🎖️ Completaste este macrociclo · 2025-Q3"
  · CTA cambia a "Volver a asignar" o "Ver mi PR alcanzado"

- Vista coach (rol differ):
  · CTA "Asignar a..." abre lista atletas con compatibility score
  · Sección extra "Tus atletas haciendo este macro" con progreso

═══════════════════════════════════════════
ACCESIBILIDAD
═══════════════════════════════════════════

- Gráfico zona 3 con tabla equivalente sr-only
- Plate3D con aria-label describiendo composición discos
- Acordeón keyboard-navigable (Enter/Space expand)
- Drawer trap-focus al abrir, escape para cerrar
- Color NO único portador (siempre íconos + texto)
- Contraste AA min sobre fondos dark

═══════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════

- Archivo: `pages/v2/HolyOlyMacrocycleDetailV2.tsx`
- Props: { macrocycleId: string } (lee de URL hash)
- APIs:
  · GET /v1/macrocycles/{id} (catálogo)
  · GET /v1/macrocycles/{id}/sessions (plan completo 16s desde RAW_SOURCES parseado)
  · GET /v1/users/me/1rm (para calcular kg reales)
  · POST /v1/coach/assign-macrocycle { athleteId, macroId }
- Mock fallback: parsear `macrocycles/RAW_SOURCES/RUSO 5D.txt` y exponer en `data/macrocycleDetails.ts`
- Reutilizar: <Plate3D>, <PlateStack>, <Chart>, <Badge>, <MetricHistoryModal>
- Tailwind tokens v2 · familia colors: --color-school-ruso (#DC2626), etc.

═══════════════════════════════════════════
TONO COPY (CRÍTICO)
═══════════════════════════════════════════

EDUCATIVO + RESPETUOSO + DENSIDAD INFORMATIVA:
✅ "Mes 2 acumula fuerza máxima en sentadillas y tirones para transferir a clásicos en Mes 3"
✅ "Día VOL prioriza volumen sub-máximo · RPE objetivo 6-7"
✅ "Tu coach puede ajustar -10% si CNS < 70"

EVITAR:
❌ "¡El mejor macrociclo del mundo!"
❌ "Vas a sufrir pero valdrá la pena"
❌ Marketing · hype · paternalismo

REFERENCIAS VISUALES:
- Strava → climb segments con detalle gradient + elevation profile
- Spotify álbum → lista canciones con duración + structure visual
- Notion database → tabla densa pero legible
- Football Manager → tactical board con fases
```

---

## Notas implementación

- **Datos reales disponibles:** `macrocycles/RAW_SOURCES/*.txt` tiene los 23 planes completos con sesiones día por día. Backend debe parsear estos archivos en `data/macrocycleDetails.ts` para servir el plan.
- **Gráfico IMR/Volumen:** datos reales extraíbles de los headers de cada `.txt` ("IMR 65%", "500-650 reps", etc.) — armar parser regex simple.
- **Pesos absolutos:** depende de 1RM del atleta · si no hay 1RM, mostrar solo %.
- **Compartir PDF:** usar `react-pdf` o backend Python con WeasyPrint (ya en stack).

## Prioridad

1. **Prompt G** (catálogo) primero · es entrada · 1 sola pantalla bonita
2. **Prompt H** (detalle) después · más complejo · 7 zonas · vale la pena hacerlo bien

Tiempo estimado iteración Claude Design: 1.5h G + 2.5h H = **4h total**.

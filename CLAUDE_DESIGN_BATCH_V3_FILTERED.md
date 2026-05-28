# Claude Design · Batch v3 · Filtrado (de 14 → 6 reales)

> **Auditoría:** 2026-05-27 · revisión `frontend/src/pages/` + `components/`
> **Resultado:** De las 14 originales, **8 ya existen** o son redundantes · solo **6 nuevas** requieren prompt full screen.
> **3 se integran** como modal/drawer/sección (no pantalla nueva).
> **3 mergean** con flujos existentes.

---

## Tabla resumen

| # | Original | Estado | Acción |
|---|---|---|---|
| 1 | AthleteCard component aislado | 🟡 Ya hay 3 versiones (`AthleteCardFIFA`, `AthleteCardV2`, `AthleteCardSimple`) | **DECIDIR cuál default · NO pedir nueva** |
| 2 | Control de Daños screen | 🟢 `DeviationsCard` ya existe como componente | **Integrar como MODAL desde AtletaHome** |
| 3 | BeltCeremony fullscreen | 🟢 `BeltCeremony.tsx` existe (291 LOC, funcional) | **Mejora visual opcional · NO bloquea** |
| 4 | Alert Detail screen | ❌ NO existe | **Integrar como DRAWER bottom-sheet, no pantalla** |
| 5 | OLY Index detail | 🟡 `OlyIndex.tsx` existe (322 LOC) | **Auditar visual · posible refresh, no rehacer** |
| 6 | Profile mobile (Hormonal+Privacy+Delete) | 🟢 `Profile.tsx` existe (440 LOC) | **Añadir SECCIONES dentro · no pantalla nueva** |
| 7 | VoltaActiveWod | 🟢 `VoltaActiveWod.tsx` existe (260 LOC) | **Auditar · refresh visual si mock-only** |
| 8 | VoltaWarmup | 🟢 `VoltaWarmup.tsx` existe (204 LOC) | **Auditar · refresh si Mayhem 3-fases falta** |
| 9 | VoltaPreWod readiness | 🟢 `VoltaPreWod.tsx` existe (330 LOC) | **Auditar · likely OK** |
| 10 | HoStats halterofilia | 🟢 `HoStats.tsx` existe (401 LOC) | **Auditar · likely OK** |
| 11 | Onboarding wizard | 🟡 `Onboarding.tsx` existe pero básico (104 LOC) | **REHACER · prompt nuevo** |
| 12 | PreMium paywall | 🟢 `PreMium.tsx` existe (270 LOC, MP integrado) | **Polish visual opcional · NO bloquea** |
| 13 | Macrocycle assign coach (Gantt) | 🟡 `AssignMacrocycle.tsx` existe (553 LOC) | **Auditar · si no tiene Gantt, prompt parcial** |
| 14 | Inventario box coach | ❌ NO existe | **Pedir prompt nuevo (es coach, no atleta)** |

---

## Lo que NO necesita prompt Claude Design

### 1. AthleteCard (3 versiones existen)
**Decisión pendiente Boss:** ¿default `Simple` o `FIFA`?
- `AthleteCardSimple.tsx` → minimalista, 1 stat hero
- `AthleteCardFIFA.tsx` → full stats card jugador
- `AthleteCardV2.tsx` → híbrido actual
**Acción:** A/B test interno · no pedir 4ta versión.

### 2. Control de Daños → MODAL
**No es pantalla.** Componente `DeviationsCard.tsx` ya existe. Trigger:
- AtletaHome detecta `session_skipped` o `auto_deload`
- Banner suave aparece arriba del feed
- Tap → modal full-height con explicación IA + tono empático
**Prompt mini necesario:** solo el modal (incluir abajo).

### 3. BeltCeremony
Ya implementado fullscreen con glow + particles + persistencia localStorage. Si Boss quiere upgrade visual, prompt incremental.

### 4. PreMium
Funcional con MP integrado. Solo polish opcional.

### 5. VoltaActiveWod / VoltaWarmup / VoltaPreWod / HoStats / OlyIndex
**Recomendación:** correr Lighthouse + screenshot manual de cada una. Si visualmente OK con tokens v2, NO rehacer. Sólo pedir prompt si Boss confirma que están feas.

### 6. Profile · Hormonal opt-in + Privacy + Delete account
**No es pantalla nueva.** Son 3 SECCIONES dentro de `Profile.tsx`:
- Hormonal opt-in → toggle en sección "Datos Biométricos"
- Privacy → link a `PrivacyPolicy.tsx` (ya existe) + toggle "Compartir datos anónimos"
- Delete account → botón destructivo al final, con confirmación 2-step
**Acción:** Edit directo en `Profile.tsx` · no Claude Design.

---

## Lo que SÍ necesita prompt Claude Design (6 reales)

### Prompt A · **Volta Macrocycle Atleta** ✅ entregado en `CLAUDE_DESIGN_PROMPTS_MACROCYCLE.md`

### Prompt B · **Holy Oly Macrocycle Atleta** ✅ entregado en `CLAUDE_DESIGN_PROMPTS_MACROCYCLE.md`

### Prompt C · Onboarding Wizard (REHACER · actual es muy básico)
### Prompt D · Alert Detail (como bottom-sheet drawer, NO fullscreen)
### Prompt E · Control de Daños (modal desde DeviationsCard)
### Prompt F · Inventario Box Coach (nueva, no existe)

> **Macrocycle assign coach** (#13): primero abrir `AssignMacrocycle.tsx` · ver si tiene Gantt o solo formulario. Si solo formulario, prompt G adicional para timeline Gantt.

---

## Prompts C · D · E · F (mini-prompts integrados)

### Prompt C · Onboarding Wizard (4 steps, mobile-first)

```
Diseña un ONBOARDING WIZARD de 4 pasos para nuevo atleta PeakQual.
Mobile-first, fullscreen, swipeable horizontal entre steps.

CONTEXTO: usuario recién registrado, NO sabe qué producto usar (Holy Oly o Volta).

STEP 1 · BIENVENIDA + ELECCIÓN PRODUCTO
- Logo PeakQual top
- Headline: "¿Qué te trae acá?"
- 3 cards verticales tap-to-select:
  · "Levantar más pesado" → Holy Oly (icono disco rojo)
  · "Mejorar mi WOD" → Volta (icono kettlebell)
  · "Aún no sé" → Mixed (icono lightbulb)
- Indica que se puede cambiar después

STEP 2 · PERFIL BÁSICO
- Nombre, fecha nacimiento, género (con opción "prefiero no decir")
- Si género femenino: toggle "Quiero tracking hormonal" (opt-in explícito, con tooltip privacy)
- Altura, peso (con switch kg/lbs)

STEP 3 · NIVEL EXPERIENCIA
- 4 niveles tap-card: Principiante · Intermedio · Avanzado · RX/Élite
- Cada card con descripción 1-line + tiempo estimado entrenando
- Si Holy Oly elegido: pregunta extra "¿1RM Snatch actual?" (opcional, slider)
- Si Volta elegido: pregunta extra "¿Fran time?" (opcional)

STEP 4 · OBJETIVO + COACH
- 3 objetivos chips multi-select: Performance · Composición corporal · Salud general
- Toggle "¿Tienes coach?" → si sí, input código coach (6 dígitos)
- CTA: "Empezar mi journey" (verde lima neón, full width)

NAVEGACIÓN:
- Bottom: dots progreso 4 pasos
- Botón "Atrás" (chevron) top-left desde step 2+
- Skip permitido en steps 3-4 (con confirmación "Puedes completar después en Perfil")
- Swipe horizontal entre pasos

ESTADOS:
- Validación inline por campo (rojo sutil border + helper text)
- Submit final: loading state + transición a AtletaHome

OUTPUT:
- JSX en `OnboardingV2.tsx`
- Tokens v2, dark mode, tactical HUD aesthetic
- Mock data inline
- API: POST /v1/users/onboarding (payload completo)

TONO COPY: amistoso pero NO infantil. Sin emojis abusivos.
```

### Prompt D · Alert Detail · BOTTOM SHEET DRAWER

```
Diseña un BOTTOM SHEET DRAWER (NO pantalla fullscreen) para mostrar
DETALLE DE ALERTA cuando atleta tappa una alerta en su feed.

CONTEXTO: alertas son los triggers YELLOW/RED del sistema
(CNS bajo, ACWR alto, sueño bajo, soreness localizado, etc.).

FORMATO:
- Drawer bottom 75% viewport height
- Drag handle top (gesture: swipe down to close)
- Backdrop tap-to-close

CONTENIDO:
- Severity badge top (YELLOW pulse / RED solid)
- Título grande: "Carga aguda alta · ACWR 1.42"
- Sub: timestamp + "Detectado por Antigravity"

ZONA EXPLICACIÓN (key feature · respeta misión Peak Qual):
- "Qué pasó" · 2-3 líneas tono coach
- "Por qué importa" · explicación científica accesible
- "Qué hacemos" · acción auto del sistema (deload, skip session, etc.)
- "Cuándo vuelve a normal" · estimación con condiciones

ZONA MÉTRICAS RELACIONADAS (mini grid 2x2):
- Métrica afectada actual + ring
- Histórico 7 días sparkline
- Threshold de cada zona (verde/amarillo/rojo)
- Acción recomendada chip

ACCIONES BOTTOM:
- CTA primario: "Entendí, seguir plan ajustado" (cierra drawer)
- CTA secundario: "Hablar con coach" (abre chat)
- Link discreto: "Reportar falso positivo"

ESTADOS:
- Alerta resuelta: badge verde + timestamp resolución
- Alerta en curso: animación sutil pulse en severity

OUTPUT:
- JSX en `components/AlertDetailDrawer.tsx`
- Props: { alert: Alert, onClose: () => void, onActionClick: (action) => void }
- Tailwind + framer-motion para drawer animation
- Mock inline `mockAlert`
```

### Prompt E · Control de Daños · MODAL (no fullscreen)

```
Diseña un MODAL CENTERED (NO pantalla fullscreen) que aparece cuando
el sistema EJECUTA un ajuste auto (skip sesión / deload forzado / -10% volumen)
por trigger RED, y el atleta entra a su Home.

PRINCIPIO RECTOR: "control de daños sin culpa".
Tono = coach que respeta, NO terapeuta paternalista, NO IA fría.

ESTRUCTURA MODAL:
- Tamaño: ~85vw x ~70vh max
- NO close en esquina (usuario debe leer · ack explícito)
- Backdrop fuerte

HEADER:
- Icono shield sutil verde (NO rojo, no alarma)
- Título: "Esta semana ajustamos tu plan"
- Sub: "Antigravity detectó algo · te explico"

CUERPO (cards apilables, scrolleable interno):

Card 1 · Qué pasó (factual)
- Bullets con timestamp:
  · "Lun 02:00 · sueño <5h registrado"
  · "Mar 02:00 · sueño <5h"
  · "Mié 02:00 · sueño <5h"

Card 2 · Qué hicimos (acción)
- "Saltamos tu sesión pesada del jueves"
- "Bajamos -10% volumen en accesorios"
- Visual diff: plan original vs plan ajustado (mini bar chart)

Card 3 · Por qué (educativo, 2-3 líneas)
- "Tu CNS necesita ~6h de sueño para recuperar entre sesiones de fuerza máxima.
   Forzar hubiera aumentado riesgo de lesión 2.3x según tu ACWR actual."
- Link discreto: "Ver paper completo" (modal anidado opcional)

Card 4 · Cómo seguimos (forward)
- "Tu plan retoma normalidad cuando 3 noches consecutivas duermas >6h"
- "Tu coach ya fue notificado"

ACCIONES:
- CTA primario: "Gracias, sigamos" (full width, calmo, verde sage)
- CTA secundario: "Quiero hablar con coach"
- Link discreto: "Esto fue un error · revertir"

PROHIBIDO EN COPY:
- ❌ "Lo siento" · "Te falló" · "Mal hecho"
- ❌ Exclamaciones · emojis tristes
- ❌ Justificar de más

PERMITIDO:
- ✅ Factual + neutral + cierre forward-looking
- ✅ Datos crudos sin maquillar
- ✅ Reconocer que la IA puede equivocarse

OUTPUT:
- JSX en `components/ControlDaniosModal.tsx`
- Props: { incident: AutoAdjustmentIncident, onAck, onContactCoach, onRevert }
- Reutilizar `DeviationsCard` existente para Card 1
- Trigger desde AtletaHomeV2 cuando `user.pendingAutoAdjustments.length > 0`
```

### Prompt F · Inventario Box · Coach View

```
Diseña una pantalla mobile-first para COACH que gestiona INVENTARIO
del box (barras, discos, cajones, kettlebells, rowers, etc.).

USO REAL: coach abre antes de programar WOD para asegurar disponibilidad.

ESTRUCTURA:

HEADER (sticky):
- Avatar coach + nombre box "CrossFit Santiago"
- Search bar inline
- Filter chips: Todos · Barbells · Plates · Cardio · Accessories · Out of order

BENTO GRID (2 columnas, cards densas ~140x120):
Cada equipo card:
- Icono SVG + nombre ("Barra olímpica 20kg")
- Cantidad disponible / total: "8 / 10" (verde si >75%, amber si 25-75%, rojo si <25%)
- Mini progress bar
- Tap → drawer detalle con:
  · Marca, año compra, condición (Nuevo/Bueno/Reparar/Roto)
  · Historial uso último mes
  · Botón "Marcar fuera de servicio"
  · Foto opcional (upload)

FAB BOTTOM-RIGHT:
- "+" → modal "Agregar equipo" (form: tipo, marca, cantidad, foto)

SECCIÓN ESPECIAL "ALERTAS DE INVENTARIO" (top, collapsible):
- Si hay items en rojo o por mantenimiento: lista compacta
- Ejemplo: "3 discos rojos rotos · 2 barras necesitan recambio bujes"

ACCIONES MASIVAS (toolbar al seleccionar):
- Seleccionar varios items → "Marcar mantenimiento", "Exportar CSV"

ESTADOS:
- Empty: ilustración + "Aún no agregaste equipo · empezá con tus barras"
- Loading: skeleton bento

OUTPUT:
- JSX en `pages/v2/CoachInventoryV2.tsx`
- API endpoints comentados:
  · GET /v1/coach/inventory
  · POST /v1/coach/inventory
  · PATCH /v1/coach/inventory/{id}
- Mock data inline (10 items variados)
- Reutiliza componentes existentes shadcn

NOTA UX: coach está apurado · todo a 1-tap · sin modals confirmación innecesarios.
```

---

## Plan ejecución sugerido

1. **Boss decide:** AthleteCard default (Simple vs FIFA) · 5 min
2. **Yo audito:** screenshot manual de las 5 pantallas "🟢 auditar" (ActiveWod, Warmup, PreWod, HoStats, OlyIndex, OlyIndex, AssignMacrocycle) · 30 min con Lighthouse después
3. **Claude Design:** correr prompts A + B (Macrociclos) primero · prompts C-F después
4. **Edits directos:** Profile.tsx (3 secciones nuevas) · 1h sin Claude Design

**Total prompts a Claude Design: 6** (no 14).
**Tiempo estimado iteración con Boss: ~3-4h** (vs ~14h con los 14 originales).

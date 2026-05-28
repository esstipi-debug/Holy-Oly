# Coach HO · Diseño (spec)

> Fecha: 2026-05-28 · Producto: Holy Oly (halterofilia) · Branch: `feat/api-first-refactor`
> Estado: diseño aprobado en brainstorming · pendiente de plan de implementación.
> Este doc describe **qué** debe ser Coach HO y **por qué**. El **cómo** (pasos) sale después con writing-plans.

---

## 1. Objetivo

**Coach HO = comandar el box de halterofilia leyendo el estado real de cada atleta y periodizando para que rindan sin lesionarse.**

El coach maneja un roster de atletas. Su trabajo: entrenar a varios con **macrociclos periodizados por escuela** (ruso, búlgaro, coreano…) **sin quemarlos**, usando el engine (readiness · fatiga · CNS) y el **IMR** (Intensidad Media Relativa) para decidir a quién bajarle la carga, a quién empujar y a quién parar.

El diferencial frente a una planilla: el **engine de readiness/burnout** + el **IMR vs fase** + los **macrociclos como plantillas vivas** + los **discos** como lenguaje de carga.

### Loop diario del coach
1. **Triage** — ¿quién está crítico / watch / ok hoy?
2. **Bandeja** — cambios y problemas reportados por atletas, pendientes de revisar.
3. **Acción** — entrar al atleta, leer sus gráficos, ajustar/confirmar su entrenamiento.
4. **Periodizar** — asignar/gestionar macrociclo (escuela + semana de arranque).

### Superficies (tabs del coach)
- **Atletas** (Coach Dash) — centro de comando diario.
- **Stats** (Coach Stats) — agregado del club.
- **Perfil** — ajustes del coach.

Desde el dash entra a: **deep dive** del atleta · **asignar macro** · **nuevo atleta** · **ver macrociclo** · herramientas.

---

## 2. Principios de diseño

1. **Sistema de carta propio (no "FIFA").** Se deja de referenciar marca ajena. El **disco olímpico es el logo y el tier** (white→green→yellow→blue→red = "común→leyenda"). El nombre formal del sistema queda **parqueado**; por ahora el disco es la identidad.
2. **Escanear vs analizar.** La **carta** es para escaneo rápido + identidad (roster, vista del atleta). El **análisis** (IMR, gráficos, loop de aprobar/modificar) va en **data cruda + gráficos**, no en chrome de carta.
3. **El coach no se gamifica — el atleta sí.** En la carta del coach el número grande es **accionable (Readiness hoy)**, no un OVR de vanidad. El OVR/tier quedan como identidad secundaria.
4. **Modelo ágil.** El atleta **auto-aplica** sus cambios (no espera aprobación). El coach **revisa post-hoc**: confirma / revierte al plan / re-modifica. El atleta nunca se traba; el coach mantiene oversight.
5. **Insight sobre cada número/gráfico.** Cada métrica y gráfico trae **lectura automática en lenguaje claro** (1 línea inline + tap→drawer). No popup modal (tapa el contexto). Esto cubre el "cómo debe explicarlo".

---

## 3. Subsistema 1 · El motor (loop sesión/macro)

Es la **quilla**: define el dato del que cuelgan IMR, notificaciones y vistas.

### 3.1 Entidades
- **Ejercicio** (unidad atómica): `movimiento · sets · reps · %1RM o peso · tonelaje · IMR_ejercicio`.
- **Sesión**: contenedor de ejercicios de un día. Tiene estado agregado, IMR de sesión (agregado), y quién la tocó. La vista por defecto es a nivel sesión; se expande a ejercicio (granularidad flexible — "las tres": dato granular, presentación a nivel sesión y/o ejercicio).
- **Macro-plantilla**: por semana define **fase** (GPP/fuerza/SPP/peaking) + **IMR esperado (banda)** + sesiones planificadas. **Genera** las sesiones del atleta; **no las congela** — son editables.
- **1RM** (por lift): viene del Baseline. Es el **denominador del IMR**.

### 3.2 Estados
**Ciclo de vida de sesión/ejercicio:**
```
planificada → en curso → { completada · modificada · fallada · cancelada }
```
**Capa de revisión del coach (ortogonal):**
```
pendiente-revisión · confirmada · revertida
```
Toda sesión tocada por el atleta (≠ completada-como-plan) entra en `pendiente-revisión` y dispara notificación.

### 3.3 Opciones del atleta (auto-aplican)
Sobre cada sesión/ejercicio: **completar · modificar** (carga/reps/swap, a nivel ejercicio) **· fallar · cancelar · pedir cambio** (nota al coach). Cada acción marca la sesión y **notifica al coach**.

### 3.4 Acciones del coach (revisión post-hoc + planificación)
- Sobre la bandeja: **confirmar** (ratificar el cambio del atleta) · **revertir al plan** · **re-modificar** · **crear sesión**.
- Planificar: **asignar/cambiar macro** (con week picker — desde qué semana arranca).

### 3.5 Notificaciones (la 🔔, hoy muerta)
Cola de trabajo del coach. Se dispara por:
- Cambio del atleta (modificó/falló/canceló una sesión).
- Pedido de cambio del atleta.
- **1RM > 30 días sin actualizar** (ver §5).
- Atleta en triage crítico (lesión / readiness bajo / sin input).

---

## 4. Subsistema 2 · La lectura del coach (gráficos)

Viven en la **ficha del atleta** (deep dive). Todos sirven una pregunta: *¿la carga va con la fase, y cómo está el atleta?*

Cada gráfico = **chart + lectura automática** (1 línea inline coloreada por severidad + tap→drawer con detalle + acción opcional que entra al loop).

### 4.1 Los 4 gráficos (todos must-have)

**① IMR vs banda de fase** (el estrella)
- Línea del IMR real por semana + banda esperada de la fase, sombreada.
- Tap→drawer: desglose por lift (snatch IMR ≠ squat IMR, 1RM distinto).
- *Insight ej.:* "Sem 2 · básico · IMR 78% vs esperado <75% → **sobrecarga**, bajá volumen ~10%."

**② Wellness / readiness en el tiempo**
- Sparklines de readiness · sueño · soreness · ánimo (7-8 semanas). Base: `WeeklyAnalysisCharts` (curar).
- *Insight ej.:* "Sueño −3 noches → readiness −1.2. Ojo con la carga."

**③ ACWR · riesgo de lesión**
- Gauge agudo:crónico (0.8–1.3 = zona segura). Base: ring existente.
- *Insight ej.:* "ACWR 1.35 → zona de riesgo, considerá deload."

**④ Plan vs real (desvíos)**
- Barras plan vs real por semana/sesión; marca lo que el atleta cambió/falló/canceló. Ata al loop (§3). Base: `DeviationsCard`.
- *Insight ej.:* "3 sesiones modificadas + 1 fallada esta semana → revisá."

### 4.2 Scope
- **Por-atleta** → en el deep dive (este spec).
- **Agregado del club** → Coach Stats (fuera de alcance acá; usa los mismos datos).

---

## 5. IMR · cálculo y riesgo

**Fórmula:** `IMR = (peso medio / 1RM) × 100`, donde `peso medio = tonelaje total / repeticiones totales`.

- Se calcula **por ejercicio** (cada lift contra su propio 1RM) y se **agrega** a sesión / semana / ciclo.
- Se **interpreta contra la fase** del macro (mismo número, distinto veredicto).

**Bandas de referencia** (configurables por plantilla; defaults):

| IMR | Intensidad | Fase típica |
|-----|-----------|-------------|
| < 65% | baja | prep. general · técnica · volumen |
| 65–75% | media | básica · fuerza general |
| 75–85% | alta | precompetitiva · fuerza máxima |
| > 85% | muy alta | competitiva · intensificación |

**Mapa fase → banda esperada** (default, ajustable por macro):
- GPP / básico → ~60–72%
- Fuerza → ~70–80%
- SPP / precompetitivo → ~78–88%
- Peaking / competitivo → ~85–95%

**Riesgo crítico:** si el **1RM está desactualizado**, todo el IMR queda distorsionado y el coach decide mal.
**Mitigación:**
- Alerta automática (notificación) cuando un lift no tiene test de 1RM en **> 30 días**.
- Soporte de 1RM **estimado** (test indirecto de 3RM → fórmula) por lift, marcado como estimado.
- 1RM **por lift** (snatch, C&J, sentadillas son distintos).

---

## 6. Qué existe hoy vs qué falta

**Ya existe (reusar/curar):**
- `CoachDashV2` — triage · alertas · macro hero · roster cards (ya con métricas de engine RDY/SUE/CNS/REC/MOT/CRG) · FAB.
- `AthleteDeepDive` (ATHLETE_DETAIL) — header · readiness/fatiga · carga semanal · sección Entrenamiento · `DeviationsCard` · `WeeklyAnalysisCharts` · RMs · lesiones.
- `AthleteTrainingView` — CustomWodAssigner · ManualSessionAssigner · SessionHistoryList · SkillEval · SkillFocus.
- `AssignMacrocycle` — picker + WISE + week picker + "Ver detalle".
- `Chart` (bars · ring · heatmap14 · radar) · engine Banister (`useRosterStress`/`useAthleteStress`).

**Falta construir (gaps del modelo):**
- **Detalle de sesión por ejercicio** (tonelaje + reps por lift) — hoy `AthleteSession.load` es un solo número; sin esto no hay IMR real.
- **Banda de IMR esperado por semana** en la macro-plantilla (hoy las fases se derivan por cuartil, no hay banda explícita).
- **Máquina de estados de sesión** + opciones del atleta + revisión del coach (el loop §3).
- **Bandeja de notificaciones** del coach (cola + acciones).
- **Motor de insight/comentario** (genera la lectura de 1 línea por número/gráfico).
- **Gráfico IMR vs banda** (nuevo) · upgrade de wellness/ACWR/desvíos a la convención de insight.

---

## 7. Decisiones del Boss (registro)

- **Aprobación = ágil** (atleta auto-aplica; coach revisa post-hoc).
- **Granularidad = flexible** (dato por ejercicio, vistas a nivel sesión y ejercicio — "las tres").
- **Gráficos del coach = los 4** (IMR vs fase · wellness · ACWR · plan vs real).
- **Carta:** disco = logo/tier; nombre del sistema parqueado; lidera Readiness, no OVR.
- **Insight:** inline + drawer (no popup modal).

---

## 8. Fuera de alcance (este spec)

- Persistencia real / backend (el demo corre offline con mock; el token demo da 401 → fallback).
- UI del lado **atleta** del loop (este spec se centra en el coach; las opciones del atleta se especifican en su propio spec).
- Coach Stats (agregado de club).
- Volta (otro producto).
- Nombre/branding del sistema de carta.

---

## 9. Riesgos / preguntas abiertas

- **1RM desactualizado** distorsiona IMR (mitigado en §5, pero requiere disciplina de testeo).
- ¿El "pedir cambio" del atleta necesita respuesta del coach (loop cerrado) o es solo aviso? — asumido: aviso + el coach actúa cuando quiere (consistente con modelo ágil).
- ¿IMR esperado por fase es global o configurable por escuela/macro? — asumido: default global, override por plantilla.
- Granularidad de la notificación (por evento vs digest) — a definir en implementación.

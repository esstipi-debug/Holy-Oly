# Walkthrough · Coach HO (halterofilia)

> Pendiente #2. Recorrido botón/sección de la superficie Coach Holy Oly: qué hace / qué muestra / a dónde navega.
> Fecha: 2026-05-29 · branch `feat/api-first-refactor`. Entrar: `?demo=1` → "Modo demo · QA" → 📋 Coach HO.

Vistas coach (COACH_ONLY): `COACH_DASH` · `ATHLETE_DETAIL` · `ASSIGN_MACRO` · `COACH_STATS` · `COACH_MACRO_VIEW` · `COACH_VIRAL_TOOLS` · `NEW_ATHLETE`. Bottom-nav (PhoneLayout): Atletas (home=COACH_DASH) · Stats (COACH_STATS) · Perfil.

---

## 1 · CoachDashV2 (home del coach)

| Sección | Qué muestra | Botones / acciones |
|---|---|---|
| **Header** | Box + nombre coach + nº atletas | 🔔 campana → abre **NotificationsSheet** (bandeja, badge con pendientes) · ⚙️ ajustes → **sin handler (dead-end)** 🚩 |
| **Triage** | 3 buckets CRÍTICO/WATCH/OK con contador (derivado del readiness+lesión real) | tap card → filtra el roster por estado |
| **Alertas** | atletas en rojo (lesión/readiness bajo/sin check-in) | "RESOLVER →" → abre el deep-dive del atleta |
| **Macrociclo hero** | macro dominante del roster + fase + progreso | "ASIGNAR" → `ASSIGN_MACRO` |
| **Roster** | 1 card por atleta: RDY (hoy), OVR, disco-tier; 6 métricas (RDY/SUE/CNS/REC/MOT/CRG) | tap card → deep-dive · "?" → **MetricsInfoSheet** (explica cada métrica) |
| **Week WODs** | 7 días (Lun-Dom) con tipo + intensidad, marca "hoy" | (lectura) — derivado del plan del macro dominante |
| **Inventory** | ocupación del box hoy (barras/plataformas/bumpers/racks/accesorios) % | (lectura) — derivado del roster que entrena hoy |
| **FAB ⋯** (flotante) | menú | Nuevo atleta → `NEW_ATHLETE` · Asignar → `ASSIGN_MACRO` · Ver macrociclo → `COACH_MACRO_VIEW` · Stats → `COACH_STATS` |

## 2 · AthleteDeepDive (`ATHLETE_DETAIL` — tap atleta)

Header (avatar, nombre, programa, chip lesión/activo, edad·categoría·peso, disco de readiness) → luego, en orden:
1. **Fatiga (Banister)** + **Readiness** (0-10, consistencia, CNS).
2. **Readiness insight** (1 línea ✦ por severidad).
3. **Macrociclo activo** (foco, sem/total, día, barra) · "Cambiar días →" → **TransitionSheet** (macro afín + week-picker, competition-aware).
4. **Competencias objetivo** (Wave 3) · "＋ Agregar" → AddCompetitionSheet · insight de pico · "Planificar hacia esta comp" → `ASSIGN_MACRO`.
5. **Peso · categoría** (Wave 3b) · actual vs límite + tendencia + make-weight (kg a bajar · días al meet) · "＋ Registrar".
6. **Carga semanal** (ATL/CTL 7d).
7. **ACWR** (gauge + insight).
8. **IMR vs banda de fase** (gráfico ① del spec coach).
9. **Entrenamiento** (AthleteTrainingView: mapa 30 días + week strip; paneles CrossFit gateados a Volta, NO en HO).
10. **Desvíos del macrociclo** (plan vs real; en demo: "Sin datos en vivo").
11. **Análisis semanal** (mini-charts; en demo: "Sin datos en vivo").
12. **RM registradas** (snatch/clean/jerk/back/front squat + cambio + fecha) · "Ver todo →" → `PERFORMANCE`.
13. **Lesiones activas** (si hay).
14. **Footer:** "Cambiar macro" → `ASSIGN_MACRO` · "Enviar feedback" → modal textarea.

## 3 · AssignMacrocycle (`ASSIGN_MACRO`)

- **Atleta destino** (avatar + macro actual).
- **WISE** (top-3 sugerencias del backend; en demo 401 → "Sin sugerencias · ver listado"). Expandir card → "Asignar este macro".
- **Filtros** Escuela + Foco · **Listado** de 24 macros (familia, duración, frecuencia, intensidad/volumen, disco) · "Ver detalle →" abre HolyOlyDetailV2.
- **Confirmar · {macro}** → **Week Picker** (semana de arranque coloreada por fase + razón; **competition-aware**: pre-selecciona S* y muestra hint 🏆 si el atleta tiene comp). Asignar → persiste (Wave 1) + vuelve al deep-dive.

## 4 · CoachStatsHO (`COACH_STATS` — tab Stats)

Performance del club: **Tonelaje semanal** · **PRs de la semana** · **Adherencia** (barra) — cada uno con "?" → info. **Desvíos**. **Top performers** (3 por OLY Index → tap abre atleta). **Atención** (lesiones). CTAs: "Generar contenido viral" → `COACH_VIRAL_TOOLS` · "Ver roster" → `COACH_DASH`.

## 5 · CoachMacroView (`COACH_MACRO_VIEW` — FAB "Ver macrociclo")

Timeline del macro (semanas por fase + markers 🔻/🏆/⭐) · fase actual · distribución del roster · alertas · pulse. CTAs: "Cambiar programa" → `ASSIGN_MACRO`.
🚩 **Usa data MOCK** (roster ficticio: Marco Torres, Lucía Ramos… NO el roster real) y "Marcar deload"/"Exportar review" son **stubs (`alert()`)**. Es la única pantalla coach que NO se realineó al roster real en ola 1.

## 6 · CoachViralTools (`COACH_VIRAL_TOOLS`)

Generador de cards 9:16 para screenshot. 3 templates: 🏆 Atleta del mes (selector de atleta) · 📊 Recap semanal · 💬 Motivacional. Controles: cambiar frase/cita, cambiar template. "La imagen ES el share" (screenshot nativo).

## 7 · NewAthlete (`NEW_ATHLETE` — FAB "Nuevo atleta")

Form: nombre, email, edad, género (M/F, resetea categoría), categoría de peso (chips por género), peso corporal. "Crear + asignar macro" → `addAthlete()` + `selectAthlete()` + `ASSIGN_MACRO`. (Nota: `addAthlete` no persiste en sessionStorage — el atleta nuevo se pierde al reload; los maxes se cargan en el primer entrenamiento.)

## 8 · Sheets

- **NotificationsSheet** (🔔): bandeja derivada de señales reales (sesión no hecha con nota, lesión, 1RM viejo). Por item: Revisar → / Confirmar / Revertir (persiste en sessionStorage).
- **MetricsInfoSheet** ("?"): explica RDY/SUE/CNS/REC/MOT/CRG (qué es / fuente / cálculo). No son ratings inventados — salen del engine + check-in.

---

## 🚩 Para decidir con el Boss

1. **⚙️ Ajustes (header CoachDash):** botón sin handler → dead-end. ¿Lo cableamos (a qué) o lo ocultamos?
2. **CoachMacroView:** usa roster MOCK + 2 botones stub (`alert()`). ¿Lo realineamos al roster real (como el resto) o se deja/oculta? (Hoy se llega vía FAB "Ver macrociclo".)
3. **NewAthlete:** el atleta creado no persiste (reload lo pierde). ¿Sumamos persistencia (como Wave 1/3) o queda así para el demo?

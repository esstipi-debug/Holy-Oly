# 🏗️ Architecture Decisions — UX/UI Blockers

> **Propósito:** Preguntas que UX/UI debe responder ANTES de diseñar schema DB y servicios.
> **Regla:** No se escribe código backend hasta que estas decisiones estén firmadas.
> **Fecha:** 2026-04-22
> **Estado:** ✅ 20/20 decisiones FIRMADAS

---

## Cómo usar este documento

Cada pregunta tiene:
- **Contexto** — por qué importa
- **Opciones** — alternativas concretas
- **Impacto técnico** — qué cambia según respuesta
- **Recomendación** — sugerencia del arquitecto (no vinculante)
- **Decisión** — [ ] pendiente / ✅ firmada con fecha

---

## BLOQUE A — Autoridad y edición

### A1. ¿Coach puede modificar sesión individual del atleta o solo plantilla global?

**Contexto:** Si coach edita sesión de un atleta específico, se crea divergencia del macrociclo base. Si edita plantilla, afecta a todos los atletas asignados.

**Opciones:**
- **A1.a** — Solo plantilla global (simple, cambio masivo)
- **A1.b** — Solo sesión individual (granular, sin side-effects)
- **A1.c** — Ambos con UI diferenciada (flexible, más complejo)

**Impacto técnico:**
- A1.a → no necesitas tabla `athlete_session_override`
- A1.b → necesitas override por sesión, historial de cambios
- A1.c → ambos + UI que muestre "heredado vs personalizado"

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** A1.c
**Razón:** Coaches quieren ajustar individuo sin romper grupo, pero también editar plantilla global.
**Firmado por:** Stipi (product)

---

### A2. ¿Atleta puede editar su propia sesión (ej. cambiar peso)?

**Opciones:**
- **A2.a** — No, solo log post-sesión con desviación
- **A2.b** — Sí, pre-sesión puede modificar
- **A2.c** — Sí pero con flag "coach notified"

**Impacto:**
- A2.a → `planned_weight` inmutable, `actual_weight` en log
- A2.b → 2 campos editables + versioning
- A2.c → trigger notificación al coach + audit log

**Recomendación:** A2.c. Realismo (atleta ajusta en gym) + transparencia coach.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** A2.c
**Razón:** Atleta puede ajustar en gym, coach recibe notificación para transparencia.
**Firmado por:** Stipi (product)

---

### A3. ¿Quién puede detener/abortar un macrociclo?

**Opciones:**
- Solo coach
- Coach + atleta (con razón obligatoria)
- Sistema automático (si RED zone persistente)

**Impacto:** Define permisos endpoint `DELETE /assignment/:id` y trigger conditions.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** A3.a (Solo coach)
**Razón:** Coach tiene control total del programa.
**Firmado por:** Stipi (product)

---

## BLOQUE B — Visibilidad

### B1. ¿Atleta ve plan completo o solo día actual?

**Opciones:**
- **B1.a** — Solo hoy (menos abrumador, fomenta confianza)
- **B1.b** — Semana completa
- **B1.c** — Macrociclo completo (12 semanas visibles)

**Impacto:**
- B1.a → endpoint `/today` único, UI simple
- B1.c → endpoint `/macrocycle/:id/full`, UI calendar/timeline

**Recomendación:** B1.b. Semana da contexto sin spoilers de peaking.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** B1.a (Solo hoy)
**Razón:** Menos abrumador, fomenta confianza.
**Firmado por:** Stipi (product)

---

### B2. ¿Atleta ve sus propias métricas (CNS, ACWR, fatiga)?

**Opciones:**
- Todas
- Solo CNS (score simple)
- Ninguna (solo coach)
- Progresivo por nivel (beginner ve menos)

**Impacto:**
- Todas → UI dashboard completo atleta
- Ninguna → coach-only, atleta solo ve "recomendación"

**Referencia:** `ux/ROLES_VISIBILITY.md` ya define parcialmente. Validar si aplica.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** B2.a (Todas)
**Razón:** Atleta tiene acceso a todas sus métricas.
**Firmado por:** Stipi (product)

---

### B3. ¿Coach ve RPE/peso de atletas de OTROS coaches?

**Opciones:**
- No (multi-tenancy estricto)
- Sí en vista agregada anonimizada
- Sí si ambos coaches aprueban (equipo compartido)

**Impacto masivo:**
- No → FK `coach_id` en cada query, row-level security
- Sí → tabla `coach_team` + permisos granulares

**Recomendación:** No (MVP). Evitar complejidad hasta validar product-market fit.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** B3.a (No - multi-tenancy estricto)
**Razón:** Privacidad de datos entre coaches.
**Firmado por:** Stipi (product)

---

## BLOQUE C — Advertencias y warnings

### C1. ¿Warnings se dismisean o persisten hasta resolución?

**Opciones:**
- **C1.a** — Dismissable (toast que desaparece)
- **C1.b** — Persistente hasta trigger desaparezca
- **C1.c** — Persistente + requiere acción explícita del coach

**Impacto:**
- C1.a → no necesitas tabla `athlete_warning`, solo evento efímero
- C1.b → tabla con `resolved_at` nullable
- C1.c → tabla + endpoint `/warning/:id/acknowledge`

**Recomendación:** C1.b con opción dismiss por usuario.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** C1.c (Persistente + requiere acknowledge coach)
**Razón:** Coach debe confirmar warning visto.
**Firmado por:** Stipi (product)

---

### C2. ¿Atleta puede dismissear warning RED o solo coach?

**Opciones:**
- Atleta puede (ownership)
- Solo coach (control)
- Atleta dismissea pero coach recibe notificación

**Impacto:** Define UX flow y permissions model.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** C2.c (Atleta dismiss pero coach recibe notificación)
**Razón:** Ownership atleta + transparencia.
**Firmado por:** Stipi (product)

---

### C3. ¿Cuántos warnings simultáneos máximo en UI?

**Opciones:**
- 1 (más urgente, resto en "view all")
- 3 top priority
- Todos scrollable

**Impacto:** UX ranking algorithm + endpoint pagination.

**Recomendación:** 3 con badge "+N más".

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** C3.b (3 top priority)
**Razón:** UX limpio con badge "+N más".
**Firmado por:** Stipi (product)

---

## BLOQUE D — Historial y auditoría

### D1. ¿Historial de sesiones es inmutable o editable?

**Opciones:**
- **D1.a** — Inmutable (log-once)
- **D1.b** — Editable 24h después ejecución
- **D1.c** — Editable siempre con versioning

**Impacto:**
- D1.a → simple, sin versioning
- D1.b → `edited_at` field + timeout check
- D1.c → tabla `session_log_version` con append-only

**Recomendación:** D1.b. Atleta puede corregir typo (puso 80kg en vez de 90kg) sin manipular historia lejana.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** D1.c (Editable siempre con versioning)
**Razón:** Completa trazabilidad de cambios.
**Firmado por:** Stipi (product)

---

### D2. ¿Ajustes (adjustments) son visibles al atleta retroactivamente?

**Opciones:**
- Sí, timeline completa "tu semana fue ajustada X veces por Y"
- Solo el último ajuste
- No (solo coach ve log)

**Impacto:** Endpoint `/athlete/:id/adjustments` + UI timeline.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** D2.a (Sí, timeline completa)
**Razón:** Atleta ve historial de ajustes del coach.
**Firmado por:** Stipi (product)

---

### D3. ¿Cuánto tiempo se retiene el historial?

**Opciones:**
- 1 año
- 3 años
- Indefinido
- Por suscripción (free=90d, pro=indefinido)

**Impacto:** GDPR/LOPD + storage cost + archival strategy.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** D3.b (3 años)
**Razón:** Retención razonable para tracking a largo plazo.
**Firmado por:** Stipi (product)

---

## BLOQUE E — Modo sesión activa

### E1. ¿Sesión activa es "wizard paso a paso" o "lista scrolleable"?

**Opciones:**
- **E1.a** — Wizard (1 ejercicio visible, next)
- **E1.b** — Lista completa con checkboxes
- **E1.c** — Híbrido (lista + focus en actual)

**Impacto UX:**
- E1.a → endpoint stream, estado `current_exercise_index` persistente
- E1.b → GET one-shot sesión entera

**Recomendación:** E1.c (como Strong app).

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** E1.c (Híbrido - lista + focus en actual)
**Razón:** Como Strong app, mejor UX.
**Firmado por:** Stipi (product)

---

### E2. ¿Se guarda progreso si atleta abandona sesión a medias?

**Opciones:**
- Sí, retoma donde quedó
- Sí pero invalida si > 4h
- No, abandonar = reset

**Impacto:** Estado persistente en DB vs localStorage cliente.

**Recomendación:** Sí con timeout 4h.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** E2.a (Sí, retoma donde quedó)
**Razón:** Comodidad atleta.
**Firmado por:** Stipi (product)

---

### E3. ¿Sistema pregunta RPE después de cada set o solo al final del ejercicio?

**Opciones:**
- Cada set (granular)
- Último set del ejercicio
- Promedio al final sesión

**Impacto:** Datos fatiga intra-sesión vs burden cognitivo atleta.

**Recomendación:** Último set (balance).

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** E3.b (Último set del ejercicio)
**Razón:** Balance entre granularidad y carga cognitiva.
**Firmado por:** Stipi (product)

---

## BLOQUE F — Multi-tenancy y escala

### F1. ¿Coach solo puede tener N atletas o ilimitado?

**Opciones:**
- Ilimitado
- Tier-based (free=3, pro=20, elite=ilimitado)
- Hard cap 50

**Impacto:** Billing logic + query performance + UX paginación.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** F1.a (Ilimitado)
**Razón:** Sin cap en atletas.
**Firmado por:** Stipi (product)

---

### F2. ¿Soporte multi-coach por atleta?

**Ej:** Atleta tiene coach strength + coach conditioning + fisio.

**Opciones:**
- No (1:1 coach-atleta)
- Sí con roles (strength/conditioning/recovery)
- Sí sin distinción

**Impacto:** Tabla `athlete_coach` con role enum vs FK simple.

**Recomendación:** Sí con roles (fase 2).

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** F2.a (No - 1:1 coach-atleta)
**Razón:** MVP simple.
**Firmado por:** Stipi (product)

---

### F3. ¿Atleta puede cambiar de coach y llevarse historial?

**Opciones:**
- Sí, historial portable
- No, historial pertenece al coach
- Sí, previo consentimiento coach

**Impacto:** Data ownership model + GDPR implicaciones.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** F3.c (Sí, previo consentimiento coach)
**Razón:** Portabilidad con consentimiento.
**Firmado por:** Stipi (product)

---

## BLOQUE G — Integraciones externas

### G1. ¿Sync con wearables (Whoop, Oura, Apple Health)?

**Opciones:**
- MVP sin wearables
- Solo Apple Health + Google Fit (APIs abiertas)
- Full integration (Whoop, Oura, Garmin)

**Impacto:** Scheduler jobs + OAuth flows + data ingestion pipeline.

**Recomendación:** MVP = input manual. Fase 2 = Apple/Google Fit.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** G1.a (MVP sin wearables, pero se viene)
**Razón:** MVP input manual, wearables fase 2.
**Firmado por:** Stipi (product)

---

### G2. ¿Export de datos (CSV/PDF) disponible?

**Opciones:**
- No MVP
- CSV para coach
- PDF reports + CSV
- API pública (webhook)

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** G2.a (No MVP)
**Razón:** Export fase 2.
**Firmado por:** Stipi (product)

---

## BLOQUE H — LLM y empatía

### H1. ¿Mensaje empático (Gemini) se genera real-time o pre-computed?

**Opciones:**
- **H1.a** — Real-time (cada warning → LLM call)
- **H1.b** — Templates con placeholders (sin LLM)
- **H1.c** — Híbrido (templates warnings comunes + LLM edge cases)

**Impacto costo:**
- H1.a → ~$0.002 × N warnings/día
- H1.b → $0
- H1.c → 80% coverage templates + 20% LLM

**Recomendación:** H1.c.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** H1.c (Híbrido - templates + LLM edge cases)
**Razón:** Costo controlado 80/20.
**Firmado por:** Stipi (product)

---

### H2. ¿Atleta puede conversar con el "AI coach" libremente?

**Opciones:**
- No (solo warnings pre-generados)
- Sí con rate limit (5 queries/día)
- Sí ilimitado (premium feature)

**Impacto:** Billing + endpoint `/chat` + context management.

**Decisión:** ✅ FIRMADA 2026-04-22
**Opción elegida:** H2.c (Rate varies by plan)
**Razón:** Free tier con límite, Premium ilimitado.
**Firmado por:** Stipi (product)

---

## Resumen de bloqueadores críticos

**Top 5 decisiones que desbloquean 80% del schema:**

| # | Pregunta | Afecta tablas |
|---|---|---|
| 1 | A1 — Edición sesión individual | `athlete_session_override` |
| 2 | B3 — Multi-tenancy coach | `coach_team`, row-level security |
| 3 | C1 — Persistencia warnings | `athlete_warning` |
| 4 | D1 — Inmutabilidad log | `session_log_version` |
| 5 | F2 — Multi-coach por atleta | `athlete_coach` junction |

**Sin estas 5 → no se empieza schema.**

---

## Proceso de firma

1. Product owner (Stipi) revisa doc
2. Marca decisión por pregunta (A/B/C)
3. Diseñador UX valida que decisión es renderizable
4. Arquitecto (Antigravity) valida viabilidad técnica
5. Documento firmado → commit con nombre `arch: freeze decisions v1`
6. Schema SQL se genera a partir de decisiones firmadas

---

## Template de firma (por decisión)

```markdown
### A1. ✅ FIRMADA 2026-MM-DD
**Opción elegida:** A1.b
**Razón:** Coaches reales necesitan granularidad individual.
**Firmado por:** Stipi (product) + UX (María) + Antigravity (tech)
```

---

**Ruta:** `C:\Users\Gamer\Desktop\Holy Oly 001\ARCHITECTURE_DECISIONS_PENDING.md`

**Next step:** Stipi responde bloques A-H. Hasta entonces, freeze backend development en macrocycle domain.

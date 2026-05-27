# Auditoría de gamificación HO/Volta vs principios Buildercult

Fecha: 2026-05-26 · Base: post Buildercult IG (6 principios) · Repo commit 312308d

## TL;DR

5 componentes gamificados activos: **Leaderboard · BeltCeremony · Heatmap365 · AchievementsGrid (60 logros) · Streaks**. Score general: **7/10**. Lo más fuerte: cohorts ya implementados (Leaderboard por club/box, no global). Lo más débil: 60 achievements + streaks + tiers + leaderboard + PRs apilados = riesgo principio 5 (gamification overload). Y algunos badges tipo "Sobreviví al Búlgaro" premian vanity, no comportamiento.

---

## Componentes auditados

### 1. Leaderboard.tsx · ✅ Fuerte

**Implementación actual:**
- Scope: club (HO) o box (Volta) · NO global
- 14 atletas mock + el usuario · ~15 personas total
- Filtros temporales: semana · mes · all-time
- 5 métricas por producto (Snatch/C&J/Tonelaje/Racha/OLY Index en HO · Fran/Helen/Murph/CF Index/WODs Rx en Volta)
- Si fuera del top 10: muestra "subí X puestos para entrar"

**Vs Buildercult:**
- ✅ Principio 3 (winnable): cohort de ~15 personas, gap real visible
- ✅ Principio 4 (cohorts): por club/box (gente cerca + nivel similar)
- ✅ Principio 1 (behavior loop): cada métrica premia training real, no vanity
- ⚠ Principio 5 (overload): 5 métricas × 3 períodos = 15 leaderboards · podría simplificarse

**Recomendación:** mantener. Considerar collapsar a 3 métricas core (la 4-5 son redundantes con PRs).

---

### 2. BeltCeremony.tsx · ⚠ Mixto

**Implementación actual:**
- 7 cinturones (Blanco → Maestro) basados en `prior_fitness` 0-100
- Pantalla fullscreen ceremonial con partículas + glow · diseñada "screenshot-worthy"
- Trigger automático cuando `beltIdx > lastCelebratedBeltIdx`

**Vs Buildercult:**
- ✅ Principio 6 (no es segundo trabajo): celebración pasiva, no requiere acción
- ⚠ Principio 2 (badge que premia acción correcta?): hoy se asigna por `prior_fitness` (input del onboarding) · NO por entrenamiento sostenido. Riesgo: alguien que dice "soy fit 80/100" en onboarding obtiene cinturón púrpura sin haber entrenado en la app.
- ⚠ Principio 3 (winnable): el camino al próximo cinturón no es visible · no hay "+15 sessions para subir a azul"

**Recomendación PRIORITARIA:**
1. Vincular beltIdx a métrica de entrenamiento real (sessions completadas + tier alcanzado · ej. fórmula `min(sessions/50, tier-1)`).
2. En AtletaHome mostrar "Faltan X sesiones para cinturón Y" como progress bar visible.

---

### 3. Heatmap365.tsx · ✅ Fuerte

**Implementación actual:**
- Grid 53×7 estilo GitHub contributions · año completo
- Niveles 0-4 por RPE de sesión
- Stats al pie: mejor racha · racha actual · % adherencia

**Vs Buildercult:**
- ✅ Principio 4 (vs uno mismo): self-comparison pura · no rankea contra otros
- ✅ Principio 1 (behavior loop): premia frecuencia, que es la acción correcta
- ✅ Principio 5 (no fricción): pasivo · solo refleja lo que ya hiciste

**Recomendación:** mantener tal cual. Es el componente más alineado con Buildercult.

---

### 4. AchievementsGrid · 60 logros · ⚠ Overload

**Implementación actual:**
- 30 logros HO + 30 logros Volta · categorías: consistency · pr · milestone · social · mastery · wellness
- 4 difficulty tiers con XP rewards (bronze 100 → platinum 1000)
- Triggers tipados: session_count · pr_count · streak_days · wod_completed · level_reached · wellness_logged · leaderboard_top · custom

**Vs Buildercult:**
- ⚠ Principio 5 (overload crítico): 60 logros + 4 tiers de difficulty + XP rewards + apilado sobre Leaderboard + BeltCeremony + streaks. Demasiada mecánica.
- ⚠ Principio 2 (premiar acción correcta?): mix bueno · pero algunos tipo "Sobreviví al Búlgaro" o "Escuela Cubana" son vanity/curiosidad, no comportamiento que mueva resultados. `volta-girls-all` (completar los 6 Girls) sí premia comportamiento.
- ❌ Principio 6 (segundo trabajo): 60 achievements es **mucho** · usuario empieza a gestionar la lista en vez de entrenar.
- ❌ XP rewards no se ven usados en otro lado del código · ¿para qué los acumula?

**Recomendación PRIORITARIA:**
1. **Auditar uso real:** revisar telemetría · cuántos achievements se desbloquean / usuario promedio? Si <10, hay sobre-oferta.
2. **Reducir a 15-20 por producto** · priorizar: consistency (10/50/100 sesiones), tier-up, primer PR por levantamiento, primer benchmark WOD core (Fran/Murph), top 10% box.
3. **Eliminar XP rewards** si no se usan en otra mecánica · agregan ruido.
4. **Quitar achievements "vanity-history"** como "Sobreviví al Búlgaro" que premian curiosidad, no progreso.

---

### 5. Streaks · ⚠ Atención

**Implementación actual:**
- `streakDays` en AthleteState · trigger `streak_days` en achievements
- Stat "Racha" en Leaderboard (5ta métrica HO)
- Stat en CoachViralTools (cards compartibles)
- "Mejor racha · Racha actual" en Heatmap365
- Logros 7/30/100 días en ambos productos
- Mock atleta tiene `streakDays: 12`

**Vs Buildercult:**
- ✅ Principio 1 (behavior loop): premia consistencia, que es la acción correcta
- ⚠ Principio 6 (segundo trabajo): si "rompe racha" se vuelve un castigo psicológico que genera ansiedad · clásico anti-pattern Duolingo
- ⚠ Principio 5 (overload): streak está en 4 lugares · Leaderboard, Heatmap, achievements, viral cards · ¿necesita estar en los 4?

**Recomendación:**
1. **Definir "qué cuenta como mantener racha"** explícitamente: ¿días con sesión completada? ¿días con check-in wellness? ¿día de descanso programado SÍ mantiene racha?
2. **Limitar visibilidad:** mostrar racha solo en Heatmap (self-comparison · principio 4). Sacarla del Leaderboard porque convierte ansiedad en competencia social ("Marco tiene 47 días, vos 12").
3. **Permitir "freeze tokens"** o gracia de 1 día (anti-pattern reducido).

---

## Resumen findings priorizados

| # | Componente | Severidad | Recomendación |
|---|---|---|---|
| 1 | **AchievementsGrid** | 🔴 ALTA | Reducir de 60 a 15-20 logros · eliminar vanity-history · quitar XP si no se usa |
| 2 | **BeltCeremony** | 🔴 ALTA | Vincular a sesiones reales en vez de `prior_fitness` · agregar progress bar al próximo cinturón |
| 3 | **Streaks** | 🟡 MEDIA | Definir qué cuenta · sacar del Leaderboard · agregar freeze tokens |
| 4 | **Leaderboard** | 🟢 BAJA | Considerar reducir a 3 métricas core (de 5) |
| 5 | **Heatmap365** | ✅ OK | Sin cambios · es el mejor alineado |

---

## Lo que ya está bien (no tocar)

1. **Cohorts implementados de fábrica** (Leaderboard por club/box, no global) → principio 4 ✅
2. **Heatmap self-vs-past** → principio 4 ✅
3. **Métricas premian training real** (no vanity en Leaderboard) → principio 1 ✅
4. **Triggers tipados** (`Trigger` discriminated union) facilita reducir/refactorizar achievements sin reescribir engine

---

## Hipótesis para validar con telemetría

Antes de aplicar cualquier cambio destructivo:
1. ¿Cuántos achievements desbloquea el atleta promedio en 60 días?
2. ¿Qué % de usuarios mira el Leaderboard >1 vez/semana?
3. ¿La racha (streak) correlaciona con retention o con churn (ansiedad → drop)?
4. ¿BeltCeremony se share-ea? (es "screenshot-worthy" según el comentario del code)

Sin esa data, las recomendaciones son hipótesis informadas, no decisiones cerradas.

---

## Action items concretos (si se decide actuar)

**Sprint 1 · 2-3h (impact alto, low risk):**
- [ ] BeltCeremony: cambiar fórmula `beltIdx = Math.floor(fitness/15)` por `beltIdx = min(floor(sessions_completed/50), tier-1)` ([BeltCeremony.tsx:58-59](frontend/src/pages/BeltCeremony.tsx:58))
- [ ] AtletaHome: agregar card "Faltan X para cinturón Y" con progress bar visible
- [ ] Streaks: sacar racha del Leaderboard metric tabs ([Leaderboard.tsx:97-102](frontend/src/pages/Leaderboard.tsx:97))

**Sprint 2 · 3-4h (refactor achievements):**
- [ ] Marcar 40 achievements como "deprecated" en data/achievements.ts pero NO borrar (preserva history)
- [ ] Filtrar `ACHIEVEMENTS_BY_PRODUCT` a top 15-20 priorizados
- [ ] Eliminar `xpReward` o conectarlo a sistema real (level-up coin store, etc.)

**Sprint 3 · 1-2h (streaks anti-anxiety):**
- [ ] Implementar "freeze tokens" (3 al mes) que no rompen racha
- [ ] Definir días de descanso programado como "racha mantenida"

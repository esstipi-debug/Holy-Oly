---
tags: [ux, roles, visibility, coach, athlete]
type: specification
status: active
updated: 2026-04-18
---

# 👁️ Roles & Visibility Matrix — Coach vs Atleta

**Fecha:** 2026-04-18
**Fuente:** Consolidación de [[COACH_FLOW_DECISIONS]] + [[SKIN_SYSTEM]] + [[../MEMORY]] + wireframes existentes
**Propósito:** Clarificar qué ve cada rol, qué puede editar, qué permanece privado.

---

## 🧭 Estructura navegación

### COACH (Premium · $29 USD/mes · Solo Chile)

Bottom nav — 4 tabs:

| Tab | Pantalla | Propósito |
|---|---|---|
| 🎯 Radar | [[../wireframes/C1_command_center_coach\|C1 Command Center]] | Quién ajustar hoy |
| 👥 Equipo | Lista atletas | Gestión completa equipo |
| ⚡ Ajustes | C3 Adjustment Hub | Bulk approve recomendaciones Smart |
| 👤 Perfil | C9 Coach Profile | Settings + billing + stats propios |

### ATLETA

Tres estados de cuenta:

- **Free sin coach:** Herramienta estéril (D2)
- **Elite Trial 45 días:** Todo desbloqueado (activado por coach)
- **Elite Premium $12 USD/mes:** Features completas

Bottom nav — 4 tabs:

| Tab | Pantalla | Propósito |
|---|---|---|
| 🏠 Dashboard | [[../wireframes/B1_dashboard_atleta\|B1]] | Readiness + sesión del día |
| 💪 Sesión | [[../wireframes/B6_active_session\|B6 Active]] | Log sesión en vivo |
| 📈 Progreso | [[../wireframes/B10_performance_deep_dive\|B10]] / [[../wireframes/B11_oly_index\|B11]] | Deep dive performance + OLY Index |
| 👤 Perfil | [[../wireframes/B15_perfil_atleta\|B15]] | Settings + temas + skins |

---

## 📊 Qué ve el COACH

### Dashboard Radar (C1)
- ✅ 3 atletas alertas visibles máximo
- ✅ Resto pendientes como notificaciones push (aparecen al apagar fuegos)
- ✅ Búsqueda por nombre + filtro nivel/grupo
- ✅ Dot color readiness (rojo/amarillo/verde/gris)
- ✅ Status chip (Overreaching / Peaking / Maturity / Ausente)
- ❌ **NO ve:** quién paga, quién es trial, billing de atletas

### Lista Equipo (45 atletas)
- ✅ Grupos auto-clasificados (ratio peso corporal / carga movida — Sinclair simplificado)
- ✅ Stats básicos por atleta: readiness, última sesión, streak
- ✅ Click → [[../wireframes/C4_athlete_deep_dive|C4 Athlete Deep Dive 360°]]

### Athlete Deep Dive (C4)
- ✅ Rodillo 7 / 14 / 28 días (3 taps reinicia)
- ✅ Tabs propuestas (pendiente aprobar Ronda 2):
  - Resumen (readiness hoy + últimas 7 sesiones + PRs recientes)
  - Performance (Snatch + C&J progresión, OLY Index)
  - Stress (gráfico Banister 28d)
  - Adherencia (completadas, canceladas, ajustadas, streak)
  - Notas privadas del coach
- ✅ Historial Banister fitness/fatigue/readiness
- ✅ PRs, tendencias, Golden Ratios
- ✅ Cambiar macrociclo desde aquí (pendiente confirmar Ronda 2)

### Adjustment Hub (C3)
- ✅ Recomendaciones **Smart** (NO "IA" — marketing honesto)
- ✅ "Aprobar todas" con undo total + por atleta + por movimiento
- ✅ Solo afecta sesión actual, NO cascada macrociclo
- ❌ Sistema NO aprende (no hay IA real)
- ✅ Coach puede desactivar recomendaciones (setting)

### Agregar Atleta (C5/C6)
- ✅ Crea atleta → **código anónimo auto-generado**
- ✅ Asigna macrociclo (19 programas de 9 escuelas)
- ✅ Envía invitación WhatsApp + email con link pre-llenado
- ✅ Solo coach puede modificar macrociclo

### Perfil Coach (C9)
- ✅ **Privado** — solo sus atletas invitados lo ven
- ✅ Muestra: cantidad atletas entrenados · años entrenando · macrociclos usados · tasa progreso por grupo (básico/medio/avanzado) · competencias asistidas
- ✅ Settings (notificaciones, eliminar cuenta, gestión suscripción)
- ✅ Billing Flow/Lemon Squeezy

### Coach NO ve nunca
- ❌ Ciclo menstrual atleta (Privacy Engine 19)
- ❌ Detalle de pagos del atleta (solo sabe si es Elite/Free)
- ❌ Temas/skins comprados por atleta
- ❌ Data >2 años (retention limit)
- ❌ Chat/mensajería (eliminado D4)

---

## 📊 Qué ve el ATLETA

### Dashboard (B1)
- ✅ Readiness score del día (ring glowing Space Grotesk)
- ✅ Racha actual (Smart Streak)
- ✅ Belt progress (XP actual/next)
- ✅ OLY Index ranking + percentil
- ✅ "Sesión del día" con CTA "Iniciar"
- ✅ Píldoras/Stories horizontales
- ⚠️ **Pendiente Ronda 2:** reducir 5 KPIs simultáneos → 2 principales

### Onboarding (D1)
- ✅ 4 pasos registro
- ✅ Vinculación coach vía código (pre-llenado si invitación)
- ✅ Macrociclo asignado por coach al crear cuenta

### Active Session (B6)
- ✅ Timer tactical (Space Grotesk)
- ✅ Block actual: sets / reps / peso / % 1RM
- ✅ Log cada serie
- ✅ RPE check-in post-bloque
- ✅ PR Flash si rompe récord (Holy Gold glow)

### Session Summary (B4)
- ✅ XP ganado (+350 ejemplo)
- ✅ Streak +1
- ✅ Golden Ratio calculado
- ✅ IMR de la sesión
- ✅ Botón "Compartir Smart Card" → [[../wireframes/B9_social_card|B9 Viral Card]]
- ✅ **Skin aplicada según performance:**
  - Plata (sesión completada)
  - Oro (IMR top + sin fallos)
  - Holográfica (PR roto con skin activa)

### Victory Screen (B7/B8)
- ✅ Mensaje identidad ("Hoy ganaste la batalla contra tu ego")
- ✅ 4 temas rotativos (Smart Victory / Overcome / Conquest / Longevity)
- ✅ Overlay skin si activa

### Viral Card (B9)
- ✅ Layout Holy Oly Card System ([[SKIN_SYSTEM]])
- ✅ Stat estrella: IMR (Engine 22)
- ✅ Radar hexagonal 6 stats
- ✅ Stats 0-99 calculadas por Iron Brain
- ✅ Avatar pixel art 16-bits
- ✅ Bandera país + gym logo (si aplica)
- ✅ Edición + número si skin limitada (ej: #347/500)

### Performance Deep Dive (B10)
- ✅ Golden Ratio Radar
- ✅ Banister Readiness histórico
- ✅ PRs por movimiento
- ✅ Comparación vs propio histórico (no vs otros)

### OLY Index (B11)
- ✅ Ranking normalizado
- ✅ Percentil
- ✅ Drill-down por edad / peso / categoría

### Pulse Hub (B12/B13)
- ✅ Retos EMOM / For Time / AMRAP
- ✅ Freshness gate (solo si readiness alto)

### Píldoras (B14)
- ✅ Stories 5 segundos
- ✅ +50 XP por leer

### Perfil Atleta (B15)
- ✅ Datos personales
- ✅ Selector tema (4 temas Premium)
- ✅ **Skin Store (B16)** — comprar skins, ver "Mi colección"
- ✅ Privacy settings (quién ve qué)
- ✅ Gestión suscripción Elite
- ✅ Desvincular coach (botón discreto)

### Estados por plan

| Estado | Acceso |
|---|---|
| **Free sin coach** | Herramienta estéril (D2). Registro + historial básico. Sin engines. Sin temas. Sin skins. Sin Victory completa. CTA upgrade permanente. |
| **Elite Trial 45d** | Todo desbloqueado + countdown "Día de la Gran Pérdida". |
| **Elite Premium $12** | Features completas + 4 temas + skins comprables. |

### Atleta NO ve nunca
- ❌ Notas privadas del coach sobre él
- ❌ Readiness de otros atletas
- ❌ Otras atletas del mismo coach (salvo leaderboard interno opt-in)
- ❌ Billing del coach
- ❌ Recomendaciones Smart pendientes (solo ve la aplicada, no las rechazadas)
- ❌ Data >2 años (retention)

---

## 🔒 Matriz de visibilidad cruzada

| Dato | Coach lo ve | Atleta lo ve | Quién edita |
|---|---|---|---|
| Readiness atleta | ✅ siempre | ✅ propio solo | Sistema |
| Ciclo menstrual | ❌ nunca | ✅ opt-in privado | Atleta |
| Historial PRs | ✅ sus atletas | ✅ propio | Sistema |
| Notas coach | ✅ privadas | ❌ nunca | Coach |
| Pagos | ❌ | ✅ propio | Sistema |
| Temas/skins atleta | ❌ | ✅ propio | Atleta |
| OLY Index | ✅ sus atletas | ✅ anónimo global | Sistema |
| Lesiones reportadas | ✅ sus atletas | ✅ propio | Atleta |
| Macrociclo | ✅ edita | ❌ no edita, solo ve | Coach |
| Código atleta anónimo | ✅ | ✅ | Sistema auto |
| Datos salud (peso, altura, 1RM) | ✅ | ✅ propio | Atleta edita |
| Avatar skin en Viral Card | ✅ lo ve al compartir | ✅ propio | Atleta |

---

## ⚠️ Ambigüedades pendientes

1. **Atleta sin coach vinculado (día 1 post-registro):**
   - ¿Ve dashboard Free limitado o pantalla "Necesitas coach para activar"?
   - **Propuesta:** Dashboard "estéril" (D2) con CTA coach.

2. **Coach mirando C4 atleta con skin activa:**
   - ¿Ve la skin aplicada o versión base?
   - **Propuesta:** Ve versión base. La skin es personal y visible al atleta + quien recibe el share de Viral Card.

3. **Atleta con 2 coaches (durante transición):**
   - Pop-up aceptación. ¿Coach anterior recibe notificación?
   - **Propuesta:** Coach anterior recibe notificación push al desvincular. Pierde acceso a C4 del atleta, pero conserva histórico de interacciones hasta que retention lo purgue.

4. **Coach ve leaderboard interno equipo:**
   - C8 Longevity Leaderboard eliminado. ¿Hay otro leaderboard interno (PRs del mes por ejemplo)?
   - **Propuesta:** Agregar a Ronda 2 atleta — ¿el coach ve ranking interno de sus atletas?

---

## 📋 Pendientes relacionados con roles

- Definir empty state atleta sin coach (entre D1 completion y vinculación)
- Confirmar qué ve el coach durante sesión activa del atleta en vivo
- Notificaciones que recibe cada rol (ver Ronda 2 pregunta #56)
- Mecánica de compartir Viral Card a tu coach (diferente a compartir pública)

---

## 🔗 Docs relacionados

- [[COACH_FLOW_DECISIONS]] — 32 decisiones coach
- [[SKIN_SYSTEM]] — 7 decisiones skin
- [[../MEMORY]] — Histórico sesiones
- [[../PLAN]] — Roadmap fases
- [[../README]] — Overview producto

---

**Última actualización:** 2026-04-18
**Responsable:** Claude Code session + Stipi
**Siguiente paso:** Resolver 4 ambigüedades pendientes + Ronda 2 coach preguntas 33-56

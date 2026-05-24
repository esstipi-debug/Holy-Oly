# Gamification Blueprint · Holy Oly + Volta

Mapeo de 20 repos GitHub → patterns → features concretas para HO/Volta.

---

## 1. Qué ya tiene la app hoy

| Feature | Pantalla | Estado |
|---------|----------|--------|
| **XP por sesión** | VictoryScreen, AtletaHome | ✓ Implementado (valores hardcoded) |
| **Niveles (cinturones)** | AtletaHome ("Cinturón Púrpura → Marrón") | ✓ Visual, sin lógica de transición |
| **Racha de días** | AtletaHome, VoltaDashboard | ✓ Display, sin reglas |
| **Wise Score** | VoltaDashboard (84/100) | ✓ Visual, sin algoritmo |
| **Leaderboard del club** | OlyIndex ("#2 / 5") | ✓ Estático |
| **Achievements (badges)** | Profile ("Logros 12 Desbloqueados") | ⚠ No hay catálogo |
| **Skill tree (movimientos)** | MovementProgression (Volta) | ✓ Display, sin unlocks |
| **Progresión por % 1RM** | ActiveSession | ✓ HO específico |
| **PR tracker** | AthleteDeepDive RMs | ✓ Mock data |

---

## 2. Repos top → patterns aplicables

### A. Para el core gamification engine (XP/levels/badges)

#### `cjmellor/level-up` (Laravel)
**Pattern:** XP table → niveles configurables → achievements + leaderboard.
**Aplicación HO/Volta:**
- Tabla `levels: { id, name, min_xp, max_xp, color, icon }` ya implícita en cinturones (Blanco → Púrpura → Marrón → Negro)
- Falta: lógica de transición visible. Ahora dice "91.800/112.500 XP" pero no qué pasa al llegar.

#### `mulhoon/score.js` (JS lib)
**Pattern:** API minimalista para scores, niveles, checkpoints, badges.
**Aplicación:** sirve como spec de nuestro `data/gamification.ts` (ver §5). No usar la lib directa pero copiar su API.

#### `qcod/laravel-gamify` y `gstt/laravel-achievements`
**Pattern:** points config + badges con condiciones declarativas (e.g. "completar 10 WODs Rx").
**Aplicación:** sistema de achievements declarativo en JSON/TS para HO y Volta separados.

#### `NationalSecurityAgency/skills-service` (SkillTree)
**Pattern:** árbol de skills con prerrequisitos, XP por skill, dependencias entre nodos.
**Aplicación CRÍTICA para Volta:** Movement Progression hoy es lista lineal. Debería ser árbol:
```
Pull-up
  ↓
Kipping Pull-up
  ↓                ↓
C2B Pull-up    Muscle-up (requiere también Ring Dip)
```

### B. Para hábitos / engagement diario

#### `dohsimpson/HabitTrove` (Next.js)
**Pattern:** habit tracker + rewards + "tesoros" (gemas/monedas virtuales).
**Aplicación HO/Volta:** sistema de **micro-hábitos diarios** (≠ sesión):
- "Loggeaste tu sueño 7 días seguidos" → +50 XP
- "Tomaste agua 2L hoy" → +10 XP
- "Hiciste check pre-WOD" → +5 XP por uso

#### `Ayagikei/LifeUp`
**Pattern:** to-dos como quests RPG con recompensas.
**Aplicación:** vista "Quests semanales" tipo battle pass:
- Completar 3 WODs en la semana → +200 XP
- Lograr 1 PR → +500 XP
- 0 sesiones perdidas en 2 semanas → badge "Consistency"

#### `ccpk1/ChoreOps` (Home Assistant)
**Pattern:** asignar chores con XP, leaderboards de familia.
**Aplicación coach:** vista "Quests del box" — coach asigna challenges al grupo.

### C. Para coding/learning (transferible a movement)

#### `unhappychoice/gittype` (CLI typing game)
**Pattern:** convertir el "trabajo real" (código) en game.
**Aplicación:** convertir el WOD del día en juego con scoring extendido (no solo time):
- Speed bonus
- Form bonus (auto-detect via video?)
- Consistency bonus (pacing)

### D. Para learning gamificado (≈ Knowledge Pills)

#### `alyssaxuu/carden` (Flashcards con SRS)
**Pattern:** spaced repetition + gamification.
**Aplicación HO:** las Knowledge Pills hoy son lineales. Convertirlas a SRS:
- Pills sobre técnica → cards
- Test cada N días
- "Mastery score" por área (Snatch técnica, Recuperación, Nutrición)

#### `thepeacemonk/Onigiri` (Anki UI dashboard)
**Pattern:** dashboard de estudio gamificado.
**Aplicación:** vista "Conocimiento" con maestría por área (visual tipo radar).

### E. Para gestión de logros backend

#### `ActiDoo/gamification-engine` (Python rule engine)
**Pattern:** motor de reglas — declarás eventos y condiciones, el engine emite achievements.
**Aplicación backend:** integrar como módulo cuando levantamos AlloyDB.
```python
@achievement('first_pr')
@on_event('pr_logged')
def first_pr(user, event):
    if user.pr_count == 1:
        return Award(xp=500, badge='PR_001')
```

#### `mattjegan/django-gamification`, `joaomdmoura/gioco` (Ruby)
**Patrones similares** — patterns aplicables aunque no usemos el código.

### F. Específico de fitness/skill

#### Ninguno 100% del list es fitness, pero...
**HabitTrove + SkillTree + LifeUp combinados** ≈ lo que necesita Volta/HO atleta.

---

## 3. Mapeo a gaps de la app

| Gap actual | Repo inspiración | Esfuerzo |
|------------|------------------|----------|
| Cinturones sin lógica de transición | level-up, score.js | 2h |
| Achievements sin catálogo declarativo | qcod/gamify, achievements | 3h |
| Skill tree lineal (Volta) | NSA SkillTree | 4h |
| Sin quests semanales | LifeUp | 3h |
| Sin hábitos diarios | HabitTrove | 4h |
| Knowledge Pills lineales sin SRS | carden, Onigiri | 5h |
| Sin engine de reglas backend | ActiDoo, django-gamification | 6-8h (cuando haya DB) |

---

## 4. Features priorizadas para Holy Oly + Volta

### Quick win 1 · Catálogo de achievements declarativo (3h)
Archivo `frontend/src/data/achievements.ts`:
- 30-50 logros para HO + 30 para Volta
- Filtros: producto, categoría, dificultad
- Display en Profile con grid + progress

### Quick win 2 · Sistema de niveles real (2h)
Archivo `frontend/src/data/levels.ts`:
- 5 cinturones HO: Blanco / Azul / Púrpura / Marrón / Negro (con min/max XP)
- 5 tiers Volta: Iniciado / Comprometido / Atleta / Élite / Leyenda
- Cálculo automático de tier y % al siguiente

### Quick win 3 · Quests semanales (3h)
Pantalla nueva o sección en Home:
- 3-5 quests rotativos por semana
- Por completar: badge + XP boost
- Visible en Atleta home con barra de progreso

### Medium · Skill tree real para Volta (4h)
Refactor de `MovementProgression.tsx`:
- Visualización de árbol con SVG (lines entre nodes)
- Unlock requirements explícitos
- Click en node → modal con video, técnica, drills

### Medium · Hábitos diarios (4h)
Sección nueva "Mi día" en Home:
- Check pre-WOD ✓ → +5 XP
- Loggear sueño ✓ → +10 XP
- 2L agua ✓ → +10 XP
- Foam roll 10min ✓ → +5 XP

---

## 5. Data model propuesto

```typescript
// frontend/src/data/gamification.ts

export type Product = 'holy-oly' | 'volta';

export interface Level {
  id: string;
  name: string;        // "Cinturón Púrpura"
  product: Product;
  tier: number;        // 1-5
  minXp: number;
  maxXp: number;
  color: string;
  icon: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  product: Product | 'both';
  category: 'consistency' | 'pr' | 'milestone' | 'social' | 'mastery';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  icon: string;
  // Condición declarativa
  trigger: AchievementTrigger;
}

export type AchievementTrigger =
  | { type: 'session_count'; value: number; scale?: 'rx' | 'scaled' | 'beginner' }
  | { type: 'pr_count'; lift?: string; value: number }
  | { type: 'streak_days'; value: number }
  | { type: 'wod_completed'; wodId?: string }   // ej. completar "Murph"
  | { type: 'level_reached'; levelId: string }
  | { type: 'custom'; code: string };          // escape hatch

export interface Quest {
  id: string;
  name: string;
  description: string;
  product: Product;
  duration: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  trigger: AchievementTrigger;
  expiresAt?: string;  // ISO date
}

export interface DailyHabit {
  id: string;
  name: string;
  icon: string;
  xpReward: number;
  category: 'wellness' | 'training' | 'recovery';
}

// Skill tree (Volta gymnastics, HO complejos)
export interface SkillNode {
  id: string;
  name: string;
  family: string;         // 'gymnastics' | 'olympic' | 'monostructural'
  level: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[]; // ids de otros nodes
  unlockCriteria: string;  // human-readable
  drills: string[];
  videoUrl?: string;
}
```

---

## 6. Próximos pasos sugeridos

### Opción A · Implementar Quick Wins 1+2+3 (8h total)
- `data/levels.ts` con cinturones reales
- `data/achievements.ts` con 60 logros
- `data/quests.ts` con quests semanales
- Componentes en Profile + AtletaHome / VoltaDashboard
- Sin backend — todo derivado de athlete state local

### Opción B · Solo Skill Tree Volta (4h)
- Refactor MovementProgression a árbol visual SVG
- Más impactante visualmente
- Resuelve gap específico de Volta

### Opción C · Backend gamification engine
- Espera a tener AlloyDB
- Usar patrón de `ActiDoo/gamification-engine` (Python rule engine)
- Eventos → reglas → awards persistentes

---

## Decisión

¿Vamos por A (paquete completo de quick wins), B (skill tree), o ambos en paralelo?

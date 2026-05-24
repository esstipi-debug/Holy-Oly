/**
 * Catálogo de logros (achievements) declarativos.
 *
 * Inspirado en patterns de qcod/laravel-gamify y gstt/laravel-achievements.
 * Cada achievement tiene un trigger evaluable contra el estado del atleta.
 *
 * 30 logros HO (halterofilia) + 30 logros Volta (CrossFit) = 60 total.
 */

import type { Product } from './levels';

export type Difficulty = 'bronze' | 'silver' | 'gold' | 'platinum';
export type Category = 'consistency' | 'pr' | 'milestone' | 'social' | 'mastery' | 'wellness';

export type Trigger =
  | { type: 'session_count'; value: number; scale?: 'rx' | 'scaled' | 'beginner' }
  | { type: 'pr_count'; lift?: string; value: number }
  | { type: 'streak_days'; value: number }
  | { type: 'wod_completed'; wodId: string }
  | { type: 'level_reached'; tier: 1 | 2 | 3 | 4 | 5 }
  | { type: 'wellness_logged'; metric: 'sleep' | 'hrv' | 'mood' | 'caffeine'; days: number }
  | { type: 'leaderboard_top'; percentile: number }
  | { type: 'custom'; description: string };

export interface Achievement {
  id: string;
  name: string;
  description: string;
  product: Product | 'both';
  category: Category;
  difficulty: Difficulty;
  xpReward: number;
  icon: string;
  trigger: Trigger;
}

const DIFFICULTY_XP: Record<Difficulty, number> = {
  bronze: 100,
  silver: 250,
  gold: 500,
  platinum: 1000,
};

// ====================================
// HOLY OLY (halterofilia) — 30 logros
// ====================================

export const HO_ACHIEVEMENTS: Achievement[] = [
  // Consistency
  { id: 'ho-first-session', name: 'Primer levantamiento', description: 'Completá tu primera sesión', product: 'holy-oly', category: 'milestone', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🏋️', trigger: { type: 'session_count', value: 1 } },
  { id: 'ho-10-sessions', name: 'Decena', description: 'Completá 10 sesiones', product: 'holy-oly', category: 'consistency', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '✊', trigger: { type: 'session_count', value: 10 } },
  { id: 'ho-50-sessions', name: 'Medio centenar', description: 'Completá 50 sesiones', product: 'holy-oly', category: 'consistency', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '💪', trigger: { type: 'session_count', value: 50 } },
  { id: 'ho-100-sessions', name: 'Centurión', description: 'Completá 100 sesiones', product: 'holy-oly', category: 'consistency', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🛡️', trigger: { type: 'session_count', value: 100 } },
  { id: 'ho-365-sessions', name: 'Atleta del año', description: 'Completá 365 sesiones', product: 'holy-oly', category: 'consistency', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '👑', trigger: { type: 'session_count', value: 365 } },
  // Streaks
  { id: 'ho-streak-7', name: 'Una semana firme', description: '7 días de racha', product: 'holy-oly', category: 'consistency', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🔥', trigger: { type: 'streak_days', value: 7 } },
  { id: 'ho-streak-30', name: 'Un mes ininterrumpido', description: '30 días de racha', product: 'holy-oly', category: 'consistency', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🚀', trigger: { type: 'streak_days', value: 30 } },
  { id: 'ho-streak-100', name: 'Vida atleta', description: '100 días de racha', product: 'holy-oly', category: 'consistency', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '⭐', trigger: { type: 'streak_days', value: 100 } },
  // PRs Olympic
  { id: 'ho-pr-snatch-1', name: 'Primer PR Arrancada', description: 'Tu primer PR en Snatch', product: 'holy-oly', category: 'pr', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🥇', trigger: { type: 'pr_count', lift: 'snatch', value: 1 } },
  { id: 'ho-pr-snatch-5', name: 'Subiendo en Arrancada', description: '5 PRs en Snatch', product: 'holy-oly', category: 'pr', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '🎯', trigger: { type: 'pr_count', lift: 'snatch', value: 5 } },
  { id: 'ho-pr-cj-1', name: 'Primer PR Envión', description: 'Tu primer PR en C&J', product: 'holy-oly', category: 'pr', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🥇', trigger: { type: 'pr_count', lift: 'clean_jerk', value: 1 } },
  { id: 'ho-pr-cj-5', name: 'Cargas serias', description: '5 PRs en C&J', product: 'holy-oly', category: 'pr', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '🎯', trigger: { type: 'pr_count', lift: 'clean_jerk', value: 5 } },
  { id: 'ho-pr-total-10', name: 'Diez PRs totales', description: '10 PRs sumando todos los levantamientos', product: 'holy-oly', category: 'pr', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🏆', trigger: { type: 'pr_count', value: 10 } },
  { id: 'ho-pr-total-25', name: 'Veinticinco PRs', description: '25 PRs totales', product: 'holy-oly', category: 'pr', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '💎', trigger: { type: 'pr_count', value: 25 } },
  // Mastery (cinturones)
  { id: 'ho-azul-reached', name: 'Cinturón Azul', description: 'Alcanzaste cinturón azul', product: 'holy-oly', category: 'mastery', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🟦', trigger: { type: 'level_reached', tier: 2 } },
  { id: 'ho-purpura-reached', name: 'Cinturón Púrpura', description: 'Alcanzaste cinturón púrpura', product: 'holy-oly', category: 'mastery', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '🟪', trigger: { type: 'level_reached', tier: 3 } },
  { id: 'ho-marron-reached', name: 'Cinturón Marrón', description: 'Alcanzaste cinturón marrón', product: 'holy-oly', category: 'mastery', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🟫', trigger: { type: 'level_reached', tier: 4 } },
  { id: 'ho-negro-reached', name: 'Cinturón Negro', description: 'Alcanzaste cinturón negro', product: 'holy-oly', category: 'mastery', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '⬛', trigger: { type: 'level_reached', tier: 5 } },
  // Wellness
  { id: 'ho-sleep-7', name: 'Descansado', description: 'Loggeaste sueño 7 días', product: 'holy-oly', category: 'wellness', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '😴', trigger: { type: 'wellness_logged', metric: 'sleep', days: 7 } },
  { id: 'ho-hrv-30', name: 'Conectado al cuerpo', description: 'Loggeaste HRV 30 días', product: 'holy-oly', category: 'wellness', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '❤️', trigger: { type: 'wellness_logged', metric: 'hrv', days: 30 } },
  // Social
  { id: 'ho-leaderboard-top10', name: 'Top 10 del club', description: 'Top 10% del club', product: 'holy-oly', category: 'social', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🥇', trigger: { type: 'leaderboard_top', percentile: 10 } },
  { id: 'ho-leaderboard-top3', name: 'Podio del club', description: 'Top 3% del club', product: 'holy-oly', category: 'social', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '🏅', trigger: { type: 'leaderboard_top', percentile: 3 } },
  // Macro-specific
  { id: 'ho-bulgaro-complete', name: 'Sobreviví al Búlgaro', description: 'Completá un macrociclo Búlgaro 12 semanas', product: 'holy-oly', category: 'milestone', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🐻', trigger: { type: 'custom', description: 'Completar macrociclo Búlgaro' } },
  { id: 'ho-cubano-complete', name: 'Escuela Cubana', description: 'Completá un macrociclo Cubano', product: 'holy-oly', category: 'milestone', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '🇨🇺', trigger: { type: 'custom', description: 'Completar macrociclo Cubano' } },
  { id: 'ho-3-macros', name: 'Politécnico', description: 'Completá 3 macrociclos diferentes', product: 'holy-oly', category: 'mastery', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🎓', trigger: { type: 'custom', description: 'Completar 3 macros diferentes' } },
  // Knowledge
  { id: 'ho-pills-10', name: 'Estudiante aplicado', description: 'Leíste 10 píldoras de conocimiento', product: 'holy-oly', category: 'mastery', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '📚', trigger: { type: 'custom', description: '10 pills leídas' } },
  { id: 'ho-pills-50', name: 'Sabio del lifting', description: 'Leíste 50 píldoras', product: 'holy-oly', category: 'mastery', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🧠', trigger: { type: 'custom', description: '50 pills leídas' } },
  // Body composition
  { id: 'ho-weight-class-up', name: 'Cambio de categoría', description: 'Subiste a una nueva categoría de peso', product: 'holy-oly', category: 'milestone', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '⚖️', trigger: { type: 'custom', description: 'Subir categoría de peso' } },
  // Competition
  { id: 'ho-first-competition', name: 'Debut competitivo', description: 'Participaste en tu primera competencia', product: 'holy-oly', category: 'milestone', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🎖️', trigger: { type: 'custom', description: 'Primera competencia' } },
  { id: 'ho-double-bw-cj', name: 'Doble peso corporal en C&J', description: 'Cargá 2×BW en Clean & Jerk', product: 'holy-oly', category: 'pr', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '💎', trigger: { type: 'custom', description: '2×BW C&J' } },
];

// ====================================
// VOLTA (CrossFit) — 30 logros
// ====================================

export const VOLTA_ACHIEVEMENTS: Achievement[] = [
  // Milestones
  { id: 'volta-first-wod', name: 'Primer WOD', description: 'Completá tu primer WOD', product: 'volta', category: 'milestone', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '⚡', trigger: { type: 'session_count', value: 1 } },
  { id: 'volta-10-wods', name: '10 WODs', description: 'Completá 10 WODs', product: 'volta', category: 'consistency', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🔥', trigger: { type: 'session_count', value: 10 } },
  { id: 'volta-50-wods', name: '50 WODs', description: 'Completá 50 WODs', product: 'volta', category: 'consistency', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '💪', trigger: { type: 'session_count', value: 50 } },
  { id: 'volta-100-wods', name: 'Centurión Volta', description: 'Completá 100 WODs', product: 'volta', category: 'consistency', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🛡️', trigger: { type: 'session_count', value: 100 } },
  { id: 'volta-365-wods', name: 'Año Volta', description: 'Completá 365 WODs', product: 'volta', category: 'consistency', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '👑', trigger: { type: 'session_count', value: 365 } },
  // Rx scaling
  { id: 'volta-first-rx', name: 'Primero Rx', description: 'Completá tu primer WOD Rx', product: 'volta', category: 'milestone', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '✅', trigger: { type: 'session_count', value: 1, scale: 'rx' } },
  { id: 'volta-25-rx', name: '25 Rx', description: 'Completá 25 WODs Rx', product: 'volta', category: 'consistency', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🎯', trigger: { type: 'session_count', value: 25, scale: 'rx' } },
  // Streaks
  { id: 'volta-streak-7', name: 'Semana on fire', description: '7 días de racha', product: 'volta', category: 'consistency', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🔥', trigger: { type: 'streak_days', value: 7 } },
  { id: 'volta-streak-30', name: 'Mes ininterrumpido', description: '30 días de racha', product: 'volta', category: 'consistency', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🚀', trigger: { type: 'streak_days', value: 30 } },
  { id: 'volta-streak-100', name: 'Vida Volta', description: '100 días de racha', product: 'volta', category: 'consistency', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '⭐', trigger: { type: 'streak_days', value: 100 } },
  // Benchmark WODs
  { id: 'volta-fran', name: 'Fran', description: 'Completá el WOD Fran', product: 'volta', category: 'milestone', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '🥖', trigger: { type: 'wod_completed', wodId: 'fran' } },
  { id: 'volta-helen', name: 'Helen', description: 'Completá el WOD Helen', product: 'volta', category: 'milestone', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '🎽', trigger: { type: 'wod_completed', wodId: 'helen' } },
  { id: 'volta-cindy', name: 'Cindy', description: 'Completá el WOD Cindy', product: 'volta', category: 'milestone', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '⏱️', trigger: { type: 'wod_completed', wodId: 'cindy' } },
  { id: 'volta-grace', name: 'Grace', description: 'Completá el WOD Grace', product: 'volta', category: 'milestone', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '👸', trigger: { type: 'wod_completed', wodId: 'grace' } },
  { id: 'volta-murph', name: 'Murph', description: 'Completá el WOD Murph', product: 'volta', category: 'milestone', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🪖', trigger: { type: 'wod_completed', wodId: 'murph' } },
  { id: 'volta-girls-all', name: 'The Girls', description: 'Completá los 6 benchmark "Girls"', product: 'volta', category: 'milestone', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '👯', trigger: { type: 'custom', description: 'Completar todos los Girls' } },
  // Skill milestones
  { id: 'volta-first-pullup', name: 'Primer pull-up strict', description: 'Tu primer pull-up sin asistencia', product: 'volta', category: 'pr', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '💪', trigger: { type: 'custom', description: 'Primer pull-up strict' } },
  { id: 'volta-first-muscleup', name: 'Primer muscle-up', description: 'Tu primer muscle-up', product: 'volta', category: 'pr', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🦾', trigger: { type: 'custom', description: 'Primer MU' } },
  { id: 'volta-first-hspu', name: 'Primer HSPU', description: 'Tu primer Hand-Stand Push-Up', product: 'volta', category: 'pr', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🤸', trigger: { type: 'custom', description: 'Primer HSPU' } },
  { id: 'volta-double-under-50', name: '50 DU unbroken', description: '50 double-unders sin parar', product: 'volta', category: 'pr', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '⏭️', trigger: { type: 'custom', description: '50 DU unbroken' } },
  // Levels
  { id: 'volta-comprometido-reached', name: 'Tier Comprometido', description: 'Alcanzaste tier Comprometido', product: 'volta', category: 'mastery', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '⚡', trigger: { type: 'level_reached', tier: 2 } },
  { id: 'volta-atleta-reached', name: 'Tier Atleta', description: 'Alcanzaste tier Atleta', product: 'volta', category: 'mastery', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '💪', trigger: { type: 'level_reached', tier: 3 } },
  { id: 'volta-elite-reached', name: 'Tier Élite', description: 'Alcanzaste tier Élite', product: 'volta', category: 'mastery', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🔥', trigger: { type: 'level_reached', tier: 4 } },
  { id: 'volta-leyenda-reached', name: 'Tier Leyenda', description: 'Alcanzaste tier Leyenda', product: 'volta', category: 'mastery', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '👑', trigger: { type: 'level_reached', tier: 5 } },
  // Wellness
  { id: 'volta-prewod-7', name: 'Self-aware', description: 'Pre-WOD check 7 días seguidos', product: 'volta', category: 'wellness', difficulty: 'bronze', xpReward: DIFFICULTY_XP.bronze, icon: '🩺', trigger: { type: 'wellness_logged', metric: 'hrv', days: 7 } },
  { id: 'volta-hrv-respect', name: 'Respeto al HRV', description: 'Modificaste WOD por HRV bajo 5 veces', product: 'volta', category: 'wellness', difficulty: 'silver', xpReward: DIFFICULTY_XP.silver, icon: '🧘', trigger: { type: 'custom', description: '5 WODs modificados por HRV' } },
  // Social
  { id: 'volta-box-top10', name: 'Top 10% del box', description: 'Top 10% del box en algún WOD', product: 'volta', category: 'social', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🥇', trigger: { type: 'leaderboard_top', percentile: 10 } },
  { id: 'volta-box-top1', name: 'Rey del box', description: '#1 del box en algún WOD del día', product: 'volta', category: 'social', difficulty: 'platinum', xpReward: DIFFICULTY_XP.platinum, icon: '👑', trigger: { type: 'leaderboard_top', percentile: 1 } },
  // CF Open
  { id: 'volta-open-participant', name: 'CF Open', description: 'Participaste en el CrossFit Open', product: 'volta', category: 'milestone', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '🏆', trigger: { type: 'custom', description: 'CF Open' } },
  { id: 'volta-3-macros', name: 'Periodizado', description: 'Completá 3 macrociclos CrossFit', product: 'volta', category: 'mastery', difficulty: 'gold', xpReward: DIFFICULTY_XP.gold, icon: '📅', trigger: { type: 'custom', description: '3 macros CF' } },
];

export const ACHIEVEMENTS: Achievement[] = [...HO_ACHIEVEMENTS, ...VOLTA_ACHIEVEMENTS];

export const ACHIEVEMENTS_BY_PRODUCT: Record<Product, Achievement[]> = {
  'holy-oly': HO_ACHIEVEMENTS,
  'volta': VOLTA_ACHIEVEMENTS,
};

/**
 * Mock state evaluator. En prod este state vendría del backend.
 */
export interface AthleteState {
  sessionCount: number;
  rxSessionCount: number;
  prCount: number;
  prByLift: Record<string, number>;  // ej. { snatch: 3, clean_jerk: 2 }
  streakDays: number;
  currentTier: 1 | 2 | 3 | 4 | 5;
  wellnessDays: Record<'sleep' | 'hrv' | 'mood' | 'caffeine', number>;
  leaderboardPercentile: number;     // ej. 10 = top 10%
  wodsCompleted: string[];           // ['fran', 'murph', ...]
}

export function isUnlocked(achievement: Achievement, state: AthleteState): boolean {
  const t = achievement.trigger;
  switch (t.type) {
    case 'session_count':
      return t.scale === 'rx'
        ? state.rxSessionCount >= t.value
        : state.sessionCount >= t.value;
    case 'pr_count':
      return t.lift
        ? (state.prByLift[t.lift] ?? 0) >= t.value
        : state.prCount >= t.value;
    case 'streak_days':
      return state.streakDays >= t.value;
    case 'wod_completed':
      return state.wodsCompleted.includes(t.wodId);
    case 'level_reached':
      return state.currentTier >= t.tier;
    case 'wellness_logged':
      return (state.wellnessDays[t.metric] ?? 0) >= t.days;
    case 'leaderboard_top':
      return state.leaderboardPercentile <= t.percentile;
    case 'custom':
      return false; // Requiere evaluación específica del lado backend
  }
}

export function unlockedCount(state: AthleteState, product: Product): number {
  return ACHIEVEMENTS_BY_PRODUCT[product].filter(a => isUnlocked(a, state)).length;
}

export function totalCount(product: Product): number {
  return ACHIEVEMENTS_BY_PRODUCT[product].length;
}

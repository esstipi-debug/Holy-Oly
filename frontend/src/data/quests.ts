/**
 * Quests semanales rotativas — inspirado en LifeUp + HabitTrove.
 *
 * Cada quest es un objetivo realizable en una semana con un reward XP.
 * El feed que ve el atleta es un subset rotativo según la semana del año.
 */

import type { Product } from './levels';

export type QuestDuration = 'daily' | 'weekly' | 'monthly';

export interface Quest {
  id: string;
  name: string;
  description: string;
  product: Product | 'both';
  duration: QuestDuration;
  xpReward: number;
  icon: string;
  /** Target numérico para evaluar progreso. */
  target: number;
  unit: string; // "sesiones" / "días" / "minutos"
}

export const QUESTS: Quest[] = [
  // ─── Weekly · Holy Oly ───────────────────────────
  { id: 'ho-w-3-sessions', name: '3 sesiones esta semana', description: 'Completá 3 sesiones de halterofilia', product: 'holy-oly', duration: 'weekly', xpReward: 200, icon: '🏋️', target: 3, unit: 'sesiones' },
  { id: 'ho-w-1-pr', name: '1 PR esta semana', description: 'Logra al menos 1 PR en cualquier levantamiento', product: 'holy-oly', duration: 'weekly', xpReward: 500, icon: '🏆', target: 1, unit: 'PR' },
  { id: 'ho-w-tonelaje-15k', name: '15.000 kg de tonelaje', description: 'Acumulá 15k kg de tonelaje semanal', product: 'holy-oly', duration: 'weekly', xpReward: 300, icon: '⚙️', target: 15000, unit: 'kg' },
  { id: 'ho-w-no-skip', name: 'Sin saltar entrenos', description: '0 sesiones saltadas en la semana', product: 'holy-oly', duration: 'weekly', xpReward: 250, icon: '✅', target: 0, unit: 'saltos' },
  { id: 'ho-w-mobility-3', name: 'Movilidad 3 días', description: 'Rutina de movilidad 3 días en la semana', product: 'holy-oly', duration: 'weekly', xpReward: 150, icon: '🧘', target: 3, unit: 'días' },

  // ─── Weekly · Volta ───────────────────────────
  { id: 'volta-w-4-wods', name: '4 WODs esta semana', description: 'Completá 4 WODs', product: 'volta', duration: 'weekly', xpReward: 250, icon: '⚡', target: 4, unit: 'WODs' },
  { id: 'volta-w-2-rx', name: '2 WODs Rx', description: 'Completá 2 WODs en escala Rx', product: 'volta', duration: 'weekly', xpReward: 400, icon: '✅', target: 2, unit: 'WODs Rx' },
  { id: 'volta-w-pr-skill', name: '1 PR de skill', description: 'Mejorá tu PR en algún movimiento (pull-up, DU, MU)', product: 'volta', duration: 'weekly', xpReward: 500, icon: '🎯', target: 1, unit: 'PR' },
  { id: 'volta-w-benchmark', name: '1 benchmark WOD', description: 'Atacá un benchmark (Fran, Helen, Cindy…)', product: 'volta', duration: 'weekly', xpReward: 350, icon: '🪖', target: 1, unit: 'benchmark' },
  { id: 'volta-w-team-wod', name: '1 team WOD', description: 'Participá en un team WOD del box', product: 'volta', duration: 'weekly', xpReward: 200, icon: '👥', target: 1, unit: 'team' },

  // ─── Both (wellness genérico) ───────────────────────────
  { id: 'b-w-sleep-7', name: 'Loggear sueño 7 días', description: 'Registrá tu sueño todos los días de la semana', product: 'both', duration: 'weekly', xpReward: 100, icon: '😴', target: 7, unit: 'días' },
  { id: 'b-w-hrv-7', name: 'HRV 7 días', description: 'Tomate HRV todos los días', product: 'both', duration: 'weekly', xpReward: 100, icon: '❤️', target: 7, unit: 'días' },
  { id: 'b-w-water', name: 'Hidratación', description: '2L de agua mínimo 5 días', product: 'both', duration: 'weekly', xpReward: 75, icon: '💧', target: 5, unit: 'días' },
  { id: 'b-w-foam-roll', name: 'Foam roll 4 días', description: 'Sesión de foam roll 4 días', product: 'both', duration: 'weekly', xpReward: 75, icon: '🌀', target: 4, unit: 'días' },
  { id: 'b-w-pre-check', name: 'Check pre-WOD 4×', description: 'Hacé el check pre-WOD antes de cada sesión', product: 'both', duration: 'weekly', xpReward: 100, icon: '🩺', target: 4, unit: 'checks' },

  // ─── Monthly ───────────────────────────
  { id: 'ho-m-cinturon', name: 'Próximo cinturón', description: 'Avanzá al próximo cinturón este mes', product: 'holy-oly', duration: 'monthly', xpReward: 1500, icon: '🥋', target: 1, unit: 'tier' },
  { id: 'volta-m-tier', name: 'Próximo tier', description: 'Avanzá al próximo tier este mes', product: 'volta', duration: 'monthly', xpReward: 1500, icon: '⭐', target: 1, unit: 'tier' },
];

/**
 * Selecciona las quests activas de la semana para un producto.
 * Rota usando semana del año + producto como seed para variedad.
 */
export function getActiveQuests(product: Product, weekOfYear: number, count = 4): Quest[] {
  const candidates = QUESTS.filter(q =>
    (q.product === product || q.product === 'both') && q.duration === 'weekly'
  );
  // Rotación pseudo-aleatoria estable por semana
  const seed = weekOfYear * (product === 'volta' ? 7 : 3);
  const shuffled = [...candidates].sort((a, b) => {
    const ha = (a.id.charCodeAt(0) + seed) % candidates.length;
    const hb = (b.id.charCodeAt(0) + seed) % candidates.length;
    return ha - hb;
  });
  return shuffled.slice(0, count);
}

/**
 * Quest mensual activa (siempre la misma del producto para que el atleta la pueda planificar).
 */
export function getMonthlyQuest(product: Product): Quest | undefined {
  return QUESTS.find(q => q.product === product && q.duration === 'monthly');
}

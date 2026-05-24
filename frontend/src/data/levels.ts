/**
 * Niveles (cinturones HO / tiers Volta).
 *
 * Cada producto tiene 5 niveles. La progresión XP es exponencial suave
 * para premiar continuidad pero no castigar a principiantes.
 */

export type Product = 'holy-oly' | 'volta';

export interface Level {
  id: string;
  name: string;       // "Cinturón Púrpura" / "Élite"
  product: Product;
  tier: 1 | 2 | 3 | 4 | 5;
  minXp: number;
  maxXp: number;      // exclusivo (siguiente tier empieza acá)
  color: string;      // hex
  icon: string;       // emoji visual
  perks: string[];    // qué desbloquea (visual)
}

// XP thresholds (sum vs cumulative; usamos cumulative para simplicidad UI)
// Tier 1: 0 - 5k
// Tier 2: 5k - 25k
// Tier 3: 25k - 75k
// Tier 4: 75k - 200k
// Tier 5: 200k+

export const HO_LEVELS: Level[] = [
  {
    id: 'ho-blanco',
    name: 'Cinturón Blanco',
    product: 'holy-oly',
    tier: 1,
    minXp: 0,
    maxXp: 5_000,
    color: '#E5E7EB',
    icon: '⬜',
    perks: ['Acceso a calentamiento generativo', 'Tracking básico de 1RM'],
  },
  {
    id: 'ho-azul',
    name: 'Cinturón Azul',
    product: 'holy-oly',
    tier: 2,
    minXp: 5_000,
    maxXp: 25_000,
    color: '#3B82F6',
    icon: '🟦',
    perks: ['Knowledge Pills desbloqueadas', 'Análisis de tonelaje semanal'],
  },
  {
    id: 'ho-purpura',
    name: 'Cinturón Púrpura',
    product: 'holy-oly',
    tier: 3,
    minXp: 25_000,
    maxXp: 75_000,
    color: '#A855F7',
    icon: '🟪',
    perks: ['OLY Index activo', 'Comparativa vs club', 'Sugerencias de coach IA'],
  },
  {
    id: 'ho-marron',
    name: 'Cinturón Marrón',
    product: 'holy-oly',
    tier: 4,
    minXp: 75_000,
    maxXp: 200_000,
    color: '#92400E',
    icon: '🟫',
    perks: ['Acceso a macrociclos avanzados', 'Coach asignado', 'Injury Shield'],
  },
  {
    id: 'ho-negro',
    name: 'Cinturón Negro',
    product: 'holy-oly',
    tier: 5,
    minXp: 200_000,
    maxXp: Infinity,
    color: '#0F172A',
    icon: '⬛',
    perks: ['Acceso vitalicio', 'Mentorías 1:1', 'Programa de embajadores'],
  },
];

export const VOLTA_LEVELS: Level[] = [
  {
    id: 'volta-iniciado',
    name: 'Iniciado',
    product: 'volta',
    tier: 1,
    minXp: 0,
    maxXp: 5_000,
    color: '#0EA5E9',
    icon: '🌱',
    perks: ['Pre-WOD check', 'WODs escalados automáticos'],
  },
  {
    id: 'volta-comprometido',
    name: 'Comprometido',
    product: 'volta',
    tier: 2,
    minXp: 5_000,
    maxXp: 25_000,
    color: '#00E5FF',
    icon: '⚡',
    perks: ['CF Index activo', 'Skill tree desbloqueado', 'Leaderboard del box'],
  },
  {
    id: 'volta-atleta',
    name: 'Atleta',
    product: 'volta',
    tier: 3,
    minXp: 25_000,
    maxXp: 75_000,
    color: '#10B981',
    icon: '💪',
    perks: ['Benchmark WODs', 'PRs trackeados', 'Comparativa con box'],
  },
  {
    id: 'volta-elite',
    name: 'Élite',
    product: 'volta',
    tier: 4,
    minXp: 75_000,
    maxXp: 200_000,
    color: '#F59E0B',
    icon: '🔥',
    perks: ['Macrocycle CF Open Prep', 'Coach asignado', 'Wise Score completo'],
  },
  {
    id: 'volta-leyenda',
    name: 'Leyenda',
    product: 'volta',
    tier: 5,
    minXp: 200_000,
    maxXp: Infinity,
    color: '#EF4444',
    icon: '👑',
    perks: ['Programación 1:1', 'Acceso a competiciones', 'Embajador del box'],
  },
];

export const LEVELS_BY_PRODUCT: Record<Product, Level[]> = {
  'holy-oly': HO_LEVELS,
  'volta': VOLTA_LEVELS,
};

/**
 * Devuelve el nivel actual y el siguiente según XP acumulada y producto.
 */
export function getLevelByXp(xp: number, product: Product): {
  current: Level;
  next: Level | null;
  progress: number;       // 0..1 al siguiente
  xpToNext: number;
} {
  const levels = LEVELS_BY_PRODUCT[product];
  const current = levels.find(l => xp >= l.minXp && xp < l.maxXp) ?? levels[levels.length - 1];
  const nextIdx = levels.indexOf(current) + 1;
  const next = nextIdx < levels.length ? levels[nextIdx] : null;

  const range = current.maxXp === Infinity ? 1 : current.maxXp - current.minXp;
  const progress = current.maxXp === Infinity ? 1 : Math.min(1, (xp - current.minXp) / range);
  const xpToNext = next ? next.minXp - xp : 0;

  return { current, next, progress, xpToNext };
}

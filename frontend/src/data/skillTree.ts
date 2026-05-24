/**
 * Skill Tree para Volta (CrossFit).
 *
 * Modelo basado en SkillTree de NSA (skilltreeplatform.dev):
 * - Project: contenedor top-level (Volta CrossFit)
 * - Subject: grupo de skills relacionados (Gymnastics, Olympic, Conditioning)
 * - Skill: movimiento individual con occurrences (reps necesarias) y prerequisites
 *
 * Cada skill se desbloquea cuando todos sus prerequisites están "accomplished"
 * (≥ occurrences logradas).
 */

export type SubjectId = 'gymnastics' | 'olympic' | 'conditioning';

export interface Subject {
  id: SubjectId;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  subject: SubjectId;
  tier: 1 | 2 | 3 | 4 | 5;       // Nivel visual (foundation → elite)
  /** IDs de skills que deben estar accomplished antes que este. */
  prerequisites: string[];
  /** Reps/eventos para considerar accomplished. */
  occurrences: number;
  /** Unidad de medida ("reps", "segundos", "kg"). */
  unit: string;
  description: string;
  drills?: string[];              // Ejercicios sugeridos para progresar
  xpReward: number;
}

export const SUBJECTS: Subject[] = [
  {
    id: 'gymnastics',
    name: 'Gymnastics',
    color: '#A855F7',
    icon: '🤸',
    description: 'Movimientos de peso corporal · pull-ups, HSPU, muscle-ups',
  },
  {
    id: 'olympic',
    name: 'Halterofilia',
    color: '#F59E0B',
    icon: '🏋️',
    description: 'Levantamientos olímpicos · snatch, clean, jerk',
  },
  {
    id: 'conditioning',
    name: 'Conditioning',
    color: '#00E5FF',
    icon: '⚡',
    description: 'Capacidad metabólica · row, ski, double-unders',
  },
];

export const SKILLS: Skill[] = [
  // ─── Gymnastics path ──────────────────────────────────
  {
    id: 'jumping-pullup',
    name: 'Jumping Pull-up',
    subject: 'gymnastics', tier: 1,
    prerequisites: [],
    occurrences: 20, unit: 'reps',
    description: 'Pull-up asistido con salto inicial',
    xpReward: 50,
  },
  {
    id: 'strict-pullup',
    name: 'Strict Pull-up',
    subject: 'gymnastics', tier: 2,
    prerequisites: ['jumping-pullup'],
    occurrences: 5, unit: 'reps strict',
    description: 'Pull-up estricto sin kipping',
    drills: ['Dead hang 30s', 'Scapular pulls 3×10', 'Negativas 3s'],
    xpReward: 200,
  },
  {
    id: 'kipping-pullup',
    name: 'Kipping Pull-up',
    subject: 'gymnastics', tier: 2,
    prerequisites: ['jumping-pullup'],
    occurrences: 15, unit: 'reps unbroken',
    description: 'Pull-up con kipping para WODs',
    drills: ['Hollow rocks', 'Kip swing drill'],
    xpReward: 200,
  },
  {
    id: 'c2b-pullup',
    name: 'Chest-to-Bar',
    subject: 'gymnastics', tier: 3,
    prerequisites: ['kipping-pullup'],
    occurrences: 10, unit: 'reps unbroken',
    description: 'Pull-up llevando pecho a la barra',
    xpReward: 350,
  },
  {
    id: 'bar-muscleup',
    name: 'Bar Muscle-up',
    subject: 'gymnastics', tier: 4,
    prerequisites: ['c2b-pullup', 'strict-pullup'],
    occurrences: 3, unit: 'reps',
    description: 'Transición pull-up a dip en barra',
    drills: ['Banded transitions', 'Hip pop drill'],
    xpReward: 600,
  },
  {
    id: 'ring-dip',
    name: 'Ring Dip',
    subject: 'gymnastics', tier: 2,
    prerequisites: [],
    occurrences: 8, unit: 'reps',
    description: 'Dip estricto en anillas',
    xpReward: 200,
  },
  {
    id: 'ring-muscleup',
    name: 'Ring Muscle-up',
    subject: 'gymnastics', tier: 5,
    prerequisites: ['bar-muscleup', 'ring-dip'],
    occurrences: 1, unit: 'rep',
    description: 'Pull-up + dip en anillas, transición completa',
    xpReward: 1000,
  },
  {
    id: 'pike-pushup',
    name: 'Pike Push-up',
    subject: 'gymnastics', tier: 1,
    prerequisites: [],
    occurrences: 15, unit: 'reps',
    description: 'Push-up con cadera elevada (pre-HSPU)',
    xpReward: 50,
  },
  {
    id: 'wall-walk',
    name: 'Wall Walk',
    subject: 'gymnastics', tier: 2,
    prerequisites: ['pike-pushup'],
    occurrences: 5, unit: 'reps',
    description: 'Subida controlada en pared, manos al muro',
    xpReward: 150,
  },
  {
    id: 'kipping-hspu',
    name: 'Kipping HSPU',
    subject: 'gymnastics', tier: 3,
    prerequisites: ['wall-walk'],
    occurrences: 5, unit: 'reps',
    description: 'Hand-stand push-up con kip',
    xpReward: 400,
  },
  {
    id: 'strict-hspu',
    name: 'Strict HSPU',
    subject: 'gymnastics', tier: 4,
    prerequisites: ['kipping-hspu'],
    occurrences: 3, unit: 'reps',
    description: 'HSPU sin kipping',
    xpReward: 700,
  },

  // ─── Conditioning path ────────────────────────────────
  {
    id: 'single-under-100',
    name: 'Single Under 100',
    subject: 'conditioning', tier: 1,
    prerequisites: [],
    occurrences: 100, unit: 'unbroken',
    description: '100 singles seguidos',
    xpReward: 50,
  },
  {
    id: 'double-under-10',
    name: 'Double Under 10',
    subject: 'conditioning', tier: 2,
    prerequisites: ['single-under-100'],
    occurrences: 10, unit: 'unbroken',
    description: 'Primeros 10 DU seguidos',
    drills: ['Penguin taps', 'Single-single-double pattern'],
    xpReward: 200,
  },
  {
    id: 'double-under-50',
    name: 'Double Under 50',
    subject: 'conditioning', tier: 3,
    prerequisites: ['double-under-10'],
    occurrences: 50, unit: 'unbroken',
    description: '50 DU seguidos sin parar',
    xpReward: 400,
  },
  {
    id: 'double-under-100',
    name: 'Double Under 100',
    subject: 'conditioning', tier: 4,
    prerequisites: ['double-under-50'],
    occurrences: 100, unit: 'unbroken',
    description: '100 DU seguidos · benchmark CF',
    xpReward: 800,
  },
  {
    id: 'row-2k',
    name: 'Row 2k sub-8',
    subject: 'conditioning', tier: 3,
    prerequisites: [],
    occurrences: 1, unit: 'tiempo',
    description: '2k en remo en menos de 8 min',
    xpReward: 400,
  },
  {
    id: 'row-2k-elite',
    name: 'Row 2k sub-7',
    subject: 'conditioning', tier: 5,
    prerequisites: ['row-2k'],
    occurrences: 1, unit: 'tiempo',
    description: '2k en remo en menos de 7 min · nivel élite',
    xpReward: 1000,
  },

  // ─── Olympic path ─────────────────────────────────────
  {
    id: 'front-squat',
    name: 'Front Squat (BW)',
    subject: 'olympic', tier: 1,
    prerequisites: [],
    occurrences: 1, unit: 'rep @ BW',
    description: 'Front squat con tu peso corporal',
    xpReward: 100,
  },
  {
    id: 'power-clean',
    name: 'Power Clean (50% BW)',
    subject: 'olympic', tier: 2,
    prerequisites: [],
    occurrences: 5, unit: 'reps',
    description: 'Power clean técnico al 50% BW',
    xpReward: 200,
  },
  {
    id: 'squat-clean',
    name: 'Squat Clean (75% BW)',
    subject: 'olympic', tier: 3,
    prerequisites: ['front-squat', 'power-clean'],
    occurrences: 3, unit: 'reps',
    description: 'Clean completo con squat recibido',
    xpReward: 400,
  },
  {
    id: 'snatch',
    name: 'Snatch (50% BW)',
    subject: 'olympic', tier: 3,
    prerequisites: ['power-clean'],
    occurrences: 3, unit: 'reps',
    description: 'Arrancada técnica',
    drills: ['Snatch grip deadlift', 'Snatch balance', 'OHS'],
    xpReward: 400,
  },
  {
    id: 'clean-jerk-bw',
    name: 'C&J 1×BW',
    subject: 'olympic', tier: 4,
    prerequisites: ['squat-clean'],
    occurrences: 1, unit: 'rep',
    description: 'Clean & Jerk a 1× peso corporal',
    xpReward: 700,
  },
  {
    id: 'clean-jerk-2bw',
    name: 'C&J 2×BW',
    subject: 'olympic', tier: 5,
    prerequisites: ['clean-jerk-bw'],
    occurrences: 1, unit: 'rep',
    description: 'Clean & Jerk a 2× peso corporal · élite',
    xpReward: 1500,
  },
];

/** Estado del atleta — qué progreso lleva en cada skill. */
export interface SkillProgress {
  [skillId: string]: number; // occurrences actuales
}

export function isSkillAccomplished(skill: Skill, progress: SkillProgress): boolean {
  return (progress[skill.id] ?? 0) >= skill.occurrences;
}

export function isSkillUnlocked(skill: Skill, progress: SkillProgress): boolean {
  if (skill.prerequisites.length === 0) return true;
  return skill.prerequisites.every(prereqId => {
    const prereq = SKILLS.find(s => s.id === prereqId);
    return prereq ? isSkillAccomplished(prereq, progress) : false;
  });
}

export function getSkillPercent(skill: Skill, progress: SkillProgress): number {
  if (!isSkillUnlocked(skill, progress)) return 0;
  return Math.min(1, (progress[skill.id] ?? 0) / skill.occurrences);
}

export function countAccomplished(subject?: SubjectId, progress: SkillProgress = {}): { done: number; total: number } {
  const list = subject ? SKILLS.filter(s => s.subject === subject) : SKILLS;
  return {
    done: list.filter(s => isSkillAccomplished(s, progress)).length,
    total: list.length,
  };
}

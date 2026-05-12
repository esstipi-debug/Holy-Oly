/**
 * Catálogo de macrociclos disponibles para asignar a atletas.
 *
 * Fuente: macrocycles/RAW_SOURCES/ — parámetros extraídos de los archivos originales.
 * intensity/volume en escala 1-5 para visualización con barras.
 */

export interface Macrocycle {
  id: string;
  name: string;
  family: 'Búlgaro' | 'Coreano' | 'Chino' | 'Cubano' | 'Polaco' | 'Ruso' | 'Ucraniano' | 'Colombiano' | 'Híbrido' | 'USA' | 'HYROX';
  desc: string;
  frequency: string;       // "5d/sem"
  duration: string;        // "12 semanas"
  intensity: number;       // 1-5
  volume: number;          // 1-5
  color: string;
  bestFor?: string;
}

export const MACROCYCLES: Macrocycle[] = [
  // ── BÚLGARO ──────────────────────────────────────────────
  {
    id: 'bulgaro-6d',
    name: 'Búlgaro 6D',
    family: 'Búlgaro',
    desc: 'Daily Max. Especificidad máxima, intensidad extrema, frecuencia alta.',
    frequency: '6d/sem',
    duration: '12 semanas',
    intensity: 5,
    volume: 2,
    color: '#EF4444',
    bestFor: 'Atletas avanzados con SNC adaptado a >90% diario.',
  },

  // ── COREANO ──────────────────────────────────────────────
  {
    id: 'coreano-5d',
    name: 'Coreano 5D',
    family: 'Coreano',
    desc: 'Estructura rígida, fuerza posicional, disciplina. Sesión única.',
    frequency: '5d/sem',
    duration: '12 semanas',
    intensity: 4,
    volume: 4,
    color: '#3B82F6',
    bestFor: 'Énfasis en tirones y posiciones de transición.',
  },
  {
    id: 'coreano-6d',
    name: 'Coreano 6D',
    family: 'Coreano',
    desc: 'Coreano de alta densidad. Más volumen distribuido en 6 días.',
    frequency: '6d/sem',
    duration: '12 semanas',
    intensity: 4,
    volume: 5,
    color: '#3B82F6',
    bestFor: 'Atletas full-time con buena capacidad de recuperación.',
  },

  // ── CHINO ────────────────────────────────────────────────
  {
    id: 'chino-5d',
    name: 'Chino 5D',
    family: 'Chino',
    desc: 'Hibridación fuerza-técnica + culturismo funcional. Pulls y squats.',
    frequency: '5d/sem',
    duration: '4 semanas',
    intensity: 4,
    volume: 4,
    color: '#F59E0B',
    bestFor: 'Corrección de debilidades específicas, hipertrofia.',
  },

  // ── CUBANO ───────────────────────────────────────────────
  {
    id: 'cubano-novicio-2d',
    name: 'Cubano Novicio 2D',
    family: 'Cubano',
    desc: 'Iniciación con 2 sesiones semanales. Foco técnico.',
    frequency: '2d/sem',
    duration: '8 semanas',
    intensity: 2,
    volume: 1,
    color: '#10B981',
    bestFor: 'Principiantes absolutos, tiempo muy limitado.',
  },
  {
    id: 'cubano-novicio-3d',
    name: 'Cubano Novicio 3D',
    family: 'Cubano',
    desc: 'Distribución eficiente: volumen lunes, técnico miércoles, intensidad viernes.',
    frequency: '3d/sem',
    duration: '8 semanas',
    intensity: 2,
    volume: 2,
    color: '#10B981',
    bestFor: 'Novato con disponibilidad media.',
  },
  {
    id: 'cubano-int-5d',
    name: 'Cubano Intermedio 5D',
    family: 'Cubano',
    desc: 'Lun volumen · Mié intensidad media · Vie test. Estructura clásica.',
    frequency: '5d/sem',
    duration: '12 semanas',
    intensity: 3,
    volume: 3,
    color: '#10B981',
    bestFor: 'Atleta con base técnica establecida.',
  },
  {
    id: 'cubano-avanzado-5d',
    name: 'Cubano Avanzado 5D',
    family: 'Cubano',
    desc: 'Mayor capacidad de trabajo. Volumen mensual 1.100-1.300 reps.',
    frequency: '5d/sem',
    duration: '12 semanas',
    intensity: 4,
    volume: 5,
    color: '#10B981',
    bestFor: 'Avanzado con tolerancia alta al volumen.',
  },
  {
    id: 'cubano-competidor',
    name: 'Cubano Competidor',
    family: 'Cubano',
    desc: 'Macrociclo orientado a salida competitiva. Acumulación → realización.',
    frequency: '5d/sem',
    duration: '16 semanas',
    intensity: 5,
    volume: 4,
    color: '#10B981',
    bestFor: 'Pre-competencia, picos planificados.',
  },

  // ── POLACO ───────────────────────────────────────────────
  {
    id: 'polaco-4d',
    name: 'Polaco 4D',
    family: 'Polaco',
    desc: 'Ciclo corto de choque. Progresión cauta + picos frecuentes.',
    frequency: '4d/sem',
    duration: '6 semanas',
    intensity: 4,
    volume: 2,
    color: '#DC2626',
    bestFor: 'Atletas que necesitan picar rápido sin saturar.',
  },
  {
    id: 'polaco-5d',
    name: 'Polaco 5D',
    family: 'Polaco',
    desc: 'Calidad sobre cantidad. Series cortas (1-3 reps), mucho pull desde bloques.',
    frequency: '5d/sem',
    duration: '6 semanas',
    intensity: 4,
    volume: 2,
    color: '#DC2626',
    bestFor: 'Recuperar sensaciones de competencia rápidamente.',
  },

  // ── RUSO ─────────────────────────────────────────────────
  {
    id: 'ruso-5d',
    name: 'Ruso 5D',
    family: 'Ruso',
    desc: 'Waviness: ondulación diaria + semanal. GPP extensa.',
    frequency: '5d/sem',
    duration: '16 semanas',
    intensity: 3,
    volume: 5,
    color: '#06B6D4',
    bestFor: 'Atleta clásico, ciclo largo con peaking final.',
  },

  // ── UCRANIANO ────────────────────────────────────────────
  {
    id: 'ucraniano-3d',
    name: 'Ucraniano 3D',
    family: 'Ucraniano',
    desc: 'Alta densidad pura. EMOM-heavy, ideal para CrossFitters.',
    frequency: '3d/sem',
    duration: '12 semanas',
    intensity: 4,
    volume: 3,
    color: '#FACC15',
    bestFor: 'Tiempo limitado, enfoque en densidad.',
  },
  {
    id: 'ucraniano-4d',
    name: 'Ucraniano 4D',
    family: 'Ucraniano',
    desc: 'Estándar. Más volumen accesorio y distribución de carga.',
    frequency: '4d/sem',
    duration: '12 semanas',
    intensity: 4,
    volume: 4,
    color: '#FACC15',
    bestFor: 'Balance entre densidad y accesorios.',
  },

  // ── COLOMBIANO ───────────────────────────────────────────
  {
    id: 'colombiano-5d',
    name: 'Colombiano 5D',
    family: 'Colombiano',
    desc: 'Prioridad absoluta al C&J. Mesociclos con ondulación constante.',
    frequency: '5d/sem',
    duration: '12 semanas',
    intensity: 4,
    volume: 4,
    color: '#A855F7',
    bestFor: 'Atletas con Jerk débil que necesitan reforzar overhead.',
  },

  // ── HÍBRIDO MODERNO ──────────────────────────────────────
  {
    id: 'hibrido-3d',
    name: 'Híbrido Moderno 3D',
    family: 'Híbrido',
    desc: 'Alta densidad por sesión. Compuestos grandes, menos accesorios.',
    frequency: '3d/sem',
    duration: '12 semanas',
    intensity: 3,
    volume: 2,
    color: '#22C55E',
    bestFor: 'Atletas máster o time-constrained.',
  },
  {
    id: 'hibrido-4d',
    name: 'Híbrido Moderno 4D',
    family: 'Híbrido',
    desc: 'Block periodization. Hipertrofia + fuerza + densidad EMOM.',
    frequency: '4d/sem',
    duration: '12 semanas',
    intensity: 3,
    volume: 3,
    color: '#22C55E',
    bestFor: 'Atleta con tiempo limitado, sostenibilidad largo plazo.',
  },
  {
    id: 'hibrido-5d',
    name: 'Híbrido Moderno 5D',
    family: 'Híbrido',
    desc: 'Acumulación → Transmutación → Realización. Sesiones ~90min.',
    frequency: '5d/sem',
    duration: '12 semanas',
    intensity: 4,
    volume: 3,
    color: '#22C55E',
    bestFor: 'Transición CrossFit → Weightlifting competitivo.',
  },
  {
    id: 'hibrido-block',
    name: 'Híbrido Modular (BLOCK)',
    family: 'Híbrido',
    desc: 'Variación coordinada. Bloques concentrados con ondulación semanal.',
    frequency: 'variable',
    duration: 'modular',
    intensity: 4,
    volume: 4,
    color: '#22C55E',
    bestFor: 'Evitar estancamiento, programación adaptable.',
  },

  // ── USA / HYROX ──────────────────────────────────────────
  {
    id: 'usa-school',
    name: 'USA Weightlifting',
    family: 'USA',
    desc: 'Periodización lineal americana. Balance volumen / intensidad.',
    frequency: '4-5d/sem',
    duration: '10-12 semanas',
    intensity: 3,
    volume: 3,
    color: '#0EA5E9',
    bestFor: 'Estándar competitivo norteamericano.',
  },
  {
    id: 'hyrox',
    name: 'HYROX',
    family: 'HYROX',
    desc: 'Específico para competencia Hyrox: capacidad aeróbica + funcional.',
    frequency: '4-5d/sem',
    duration: '12-16 semanas',
    intensity: 3,
    volume: 4,
    color: '#F97316',
    bestFor: 'Atletas Hyrox o híbrido endurance/fuerza.',
  },
];

export const MACROCYCLE_FAMILIES = Array.from(new Set(MACROCYCLES.map(m => m.family)));

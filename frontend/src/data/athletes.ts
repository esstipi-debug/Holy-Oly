export interface AthleteSession {
  date: string;
  load: number;        // session_load = sets × reps × weight × rpe
  rpe_reported: number;
  rpe_expected: number;
  sleep_hours: number;
  soreness: number;    // 1-10
  motivation: number;  // 1-10
  life_stress: number; // 1-10
  completed: boolean;
  notes?: string;
}

export interface AthleteMaxes {
  snatch: number;
  clean: number;
  jerk: number;
  back_squat: number;
  front_squat: number;
  body_weight: number;
}

export interface CFBenchmark {
  name: string;
  time?: string;      // ej "3:42"
  rounds?: string;    // ej "24 rounds"
  scale: 'rx' | 'scaled' | 'rx_plus';
}

export interface CFSkills {
  pullups_strict: number;
  hspu: number;       // hand-stand push-ups
  muscle_ups_bar: number;
  muscle_ups_ring: number;
  double_unders_unbroken: number;
}

export interface AthleteProfile {
  id: string;
  email: string;
  password: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  weight_class: string;
  club: string;
  province: string;
  coach_id: string;
  role: 'athlete';
  /** Producto al que pertenece el perfil. Default 'holy-oly' si no se especifica. */
  product?: 'holy-oly' | 'volta';
  macrocycle: {
    program_id: string;
    program_name: string;
    week: number;
    day: number;
    total_weeks: number;
    focus: string;
  };
  maxes: AthleteMaxes;
  injuries?: string[];
  sessions_last_7: AthleteSession[];
  prior_fitness: number;
  prior_fatigue: number;
  subscription: 'FREE' | 'PRO' | 'ELITE';
  /** Benchmarks CrossFit · opcional, sólo perfiles Volta. */
  cf_benchmarks?: CFBenchmark[];
  /** Skills/destrezas CF · opcional, sólo perfiles Volta. */
  cf_skills?: CFSkills;
}

export interface CoachProfile {
  id: string;
  email: string;
  password: string;
  name: string;
  club: string;
  province: string;
  role: 'coach';
  athlete_ids: string[];
  specialization: string;
  experience_years: number;
}

// ─── COACHES ────────────────────────────────────────────────────────────────

export const coaches: CoachProfile[] = [
  {
    id: 'coach_001',
    email: 'coach@example.com',
    password: 'coach123',
    name: 'Sebastián Torres',
    club: 'Club Halterofilia Buenos Aires',
    province: 'Buenos Aires',
    role: 'coach',
    athlete_ids: ['ath_001', 'ath_002', 'ath_003'],
    specialization: 'Escuela Rusa / Búlgara híbrida',
    experience_years: 14,
  },
  {
    id: 'coach_002',
    email: 'coach2@holyoly.com',
    password: 'coach456',
    name: 'Marcela Ríos',
    club: 'Centro de Alto Rendimiento Córdoba',
    province: 'Córdoba',
    role: 'coach',
    athlete_ids: ['ath_004', 'ath_005'],
    specialization: 'Escuela China / Técnica',
    experience_years: 9,
  },
];

// ─── ATHLETES ───────────────────────────────────────────────────────────────

export const athletes: AthleteProfile[] = [
  {
    id: 'ath_001',
    email: 'user@example.com',
    password: 'password123',
    name: 'Matías Guerrero',
    age: 24,
    gender: 'M',
    weight_class: '-73kg',
    club: 'Club Halterofilia Buenos Aires',
    province: 'Buenos Aires',
    coach_id: 'coach_001',
    role: 'athlete',
    subscription: 'PRO',
    macrocycle: {
      program_id: 'ruso-5d',
      program_name: 'Ruso 5D',
      week: 4,
      day: 3,
      total_weeks: 16,
      focus: 'Fuerza-Técnica',
    },
    maxes: {
      snatch: 112,
      clean: 138,
      jerk: 135,
      back_squat: 175,
      front_squat: 152,
      body_weight: 72.4,
    },
    injuries: ['Tendón de Aquiles (I) — carga controlada'],
    prior_fitness: 61.2,
    prior_fatigue: 44.8,
    sessions_last_7: [
      { date: '2026-04-29', load: 3840, rpe_reported: 7, rpe_expected: 7, sleep_hours: 7.5, soreness: 4, motivation: 8, life_stress: 3, completed: true },
      { date: '2026-04-30', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 8.0, soreness: 3, motivation: 7, life_stress: 2, completed: false, notes: 'Descanso activo' },
      { date: '2026-05-01', load: 4200, rpe_reported: 8, rpe_expected: 7, sleep_hours: 6.5, soreness: 5, motivation: 9, life_stress: 4, completed: true },
      { date: '2026-05-02', load: 3600, rpe_reported: 7, rpe_expected: 8, sleep_hours: 7.0, soreness: 6, motivation: 7, life_stress: 3, completed: true },
      { date: '2026-05-03', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 9.0, soreness: 2, motivation: 8, life_stress: 2, completed: false, notes: 'Día libre' },
      { date: '2026-05-04', load: 4500, rpe_reported: 8, rpe_expected: 8, sleep_hours: 7.0, soreness: 4, motivation: 9, life_stress: 3, completed: true },
      { date: '2026-05-05', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 7.5, soreness: 3, motivation: 8, life_stress: 2, completed: false, notes: 'Sesión pendiente hoy' },
    ],
  },
  {
    id: 'ath_002',
    email: 'luciana@holyoly.com',
    password: 'luci2026',
    name: 'Luciana Vega',
    age: 21,
    gender: 'F',
    weight_class: '-59kg',
    club: 'Club Halterofilia Buenos Aires',
    province: 'Buenos Aires',
    coach_id: 'coach_001',
    role: 'athlete',
    subscription: 'PRO',
    macrocycle: {
      program_id: 'chino-5d',
      program_name: 'Chino 5D',
      week: 2,
      day: 1,
      total_weeks: 4,
      focus: 'Técnica-Velocidad',
    },
    maxes: {
      snatch: 78,
      clean: 97,
      jerk: 95,
      back_squat: 120,
      front_squat: 105,
      body_weight: 58.1,
    },
    prior_fitness: 55.4,
    prior_fatigue: 38.2,
    sessions_last_7: [
      { date: '2026-04-29', load: 2800, rpe_reported: 6, rpe_expected: 7, sleep_hours: 8.0, soreness: 3, motivation: 9, life_stress: 2, completed: true },
      { date: '2026-04-30', load: 3100, rpe_reported: 7, rpe_expected: 7, sleep_hours: 7.5, soreness: 4, motivation: 8, life_stress: 3, completed: true },
      { date: '2026-05-01', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 8.5, soreness: 2, motivation: 8, life_stress: 1, completed: false, notes: 'Descanso' },
      { date: '2026-05-02', load: 3300, rpe_reported: 8, rpe_expected: 7, sleep_hours: 7.0, soreness: 5, motivation: 7, life_stress: 4, completed: true },
      { date: '2026-05-03', load: 2900, rpe_reported: 6, rpe_expected: 7, sleep_hours: 7.5, soreness: 3, motivation: 8, life_stress: 3, completed: true },
      { date: '2026-05-04', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 8.0, soreness: 2, motivation: 9, life_stress: 2, completed: false, notes: 'Día libre' },
      { date: '2026-05-05', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 7.5, soreness: 2, motivation: 9, life_stress: 2, completed: false, notes: 'Sesión pendiente hoy' },
    ],
  },
  {
    id: 'ath_003',
    email: 'franco@holyoly.com',
    password: 'franco2026',
    name: 'Franco Rizzo',
    age: 27,
    gender: 'M',
    weight_class: '-89kg',
    club: 'Club Halterofilia Buenos Aires',
    province: 'Buenos Aires',
    coach_id: 'coach_001',
    role: 'athlete',
    subscription: 'ELITE',
    macrocycle: {
      program_id: 'bulgaro-6d',
      program_name: 'Búlgaro 6D',
      week: 6,
      day: 5,
      total_weeks: 12,
      focus: 'Pico de Fuerza',
    },
    maxes: {
      snatch: 145,
      clean: 178,
      jerk: 175,
      back_squat: 225,
      front_squat: 200,
      body_weight: 88.3,
    },
    injuries: ['Hombro derecho — supervisión médica activa'],
    prior_fitness: 72.1,
    prior_fatigue: 68.4,
    sessions_last_7: [
      { date: '2026-04-29', load: 6200, rpe_reported: 9, rpe_expected: 8, sleep_hours: 6.5, soreness: 7, motivation: 8, life_stress: 5, completed: true },
      { date: '2026-04-30', load: 5800, rpe_reported: 9, rpe_expected: 9, sleep_hours: 7.0, soreness: 8, motivation: 7, life_stress: 4, completed: true },
      { date: '2026-05-01', load: 4100, rpe_reported: 7, rpe_expected: 8, sleep_hours: 7.5, soreness: 6, motivation: 6, life_stress: 5, completed: true },
      { date: '2026-05-02', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 9.0, soreness: 5, motivation: 7, life_stress: 3, completed: false, notes: 'Descanso por indicación coach' },
      { date: '2026-05-03', load: 6500, rpe_reported: 9, rpe_expected: 8, sleep_hours: 6.0, soreness: 8, motivation: 9, life_stress: 4, completed: true },
      { date: '2026-05-04', load: 5900, rpe_reported: 8, rpe_expected: 9, sleep_hours: 7.0, soreness: 7, motivation: 8, life_stress: 5, completed: true },
      { date: '2026-05-05', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 7.5, soreness: 6, motivation: 7, life_stress: 4, completed: false, notes: 'Sesión pendiente hoy' },
    ],
  },
  {
    id: 'ath_004',
    email: 'daniela@holyoly.com',
    password: 'dani2026',
    name: 'Daniela Moreno',
    age: 19,
    gender: 'F',
    weight_class: '-49kg',
    club: 'Centro de Alto Rendimiento Córdoba',
    province: 'Córdoba',
    coach_id: 'coach_002',
    role: 'athlete',
    subscription: 'PRO',
    macrocycle: {
      program_id: 'chino-5d',
      program_name: 'Chino 5D',
      week: 3,
      day: 2,
      total_weeks: 4,
      focus: 'Técnica-Velocidad',
    },
    maxes: {
      snatch: 65,
      clean: 82,
      jerk: 80,
      back_squat: 100,
      front_squat: 88,
      body_weight: 48.6,
    },
    prior_fitness: 48.9,
    prior_fatigue: 31.5,
    sessions_last_7: [
      { date: '2026-04-29', load: 1800, rpe_reported: 6, rpe_expected: 6, sleep_hours: 8.5, soreness: 2, motivation: 9, life_stress: 3, completed: true },
      { date: '2026-04-30', load: 2100, rpe_reported: 7, rpe_expected: 7, sleep_hours: 8.0, soreness: 3, motivation: 8, life_stress: 4, completed: true },
      { date: '2026-05-01', load: 1900, rpe_reported: 6, rpe_expected: 7, sleep_hours: 8.5, soreness: 2, motivation: 9, life_stress: 2, completed: true },
      { date: '2026-05-02', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 9.0, soreness: 1, motivation: 9, life_stress: 1, completed: false, notes: 'Descanso' },
      { date: '2026-05-03', load: 2200, rpe_reported: 7, rpe_expected: 7, sleep_hours: 8.0, soreness: 3, motivation: 8, life_stress: 3, completed: true },
      { date: '2026-05-04', load: 2000, rpe_reported: 6, rpe_expected: 7, sleep_hours: 8.5, soreness: 2, motivation: 9, life_stress: 2, completed: true },
      { date: '2026-05-05', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 8.0, soreness: 2, motivation: 9, life_stress: 2, completed: false, notes: 'Sesión pendiente hoy' },
    ],
  },
  {
    id: 'ath_005',
    email: 'nicolas@holyoly.com',
    password: 'nico2026',
    name: 'Nicolás Paredes',
    age: 23,
    gender: 'M',
    weight_class: '-81kg',
    club: 'Centro de Alto Rendimiento Córdoba',
    province: 'Córdoba',
    coach_id: 'coach_002',
    role: 'athlete',
    subscription: 'FREE',
    macrocycle: {
      program_id: 'usa-school',
      program_name: 'USA Weightlifting',
      week: 1,
      day: 1,
      total_weeks: 10,
      focus: 'Hipertrofia-Fuerza',
    },
    maxes: {
      snatch: 125,
      clean: 155,
      jerk: 152,
      back_squat: 195,
      front_squat: 170,
      body_weight: 80.7,
    },
    prior_fitness: 58.3,
    prior_fatigue: 29.1,
    sessions_last_7: [
      { date: '2026-04-29', load: 4800, rpe_reported: 8, rpe_expected: 7, sleep_hours: 6.0, soreness: 5, motivation: 6, life_stress: 7, completed: true, notes: 'Semana de exámenes' },
      { date: '2026-04-30', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 5.5, soreness: 6, motivation: 5, life_stress: 8, completed: false, notes: 'No pudo ir' },
      { date: '2026-05-01', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 7.0, soreness: 4, motivation: 6, life_stress: 6, completed: false, notes: 'Faltó' },
      { date: '2026-05-02', load: 4200, rpe_reported: 8, rpe_expected: 7, sleep_hours: 7.5, soreness: 4, motivation: 7, life_stress: 5, completed: true },
      { date: '2026-05-03', load: 4600, rpe_reported: 7, rpe_expected: 8, sleep_hours: 7.0, soreness: 4, motivation: 7, life_stress: 4, completed: true },
      { date: '2026-05-04', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 8.0, soreness: 3, motivation: 8, life_stress: 3, completed: false, notes: 'Descanso' },
      { date: '2026-05-05', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 7.5, soreness: 3, motivation: 8, life_stress: 3, completed: false, notes: 'Primer día nuevo macrociclo' },
    ],
  },
  // ── VOLTA · perfil CrossFit (demo mode cuando product=='volta') ────────────
  {
    id: 'ath_volta_001',
    email: 'camila@volta.com',
    password: 'volta123',
    name: 'Camila Bravo',
    age: 26,
    gender: 'F',
    weight_class: '-63kg',
    club: 'CrossFit Palermo',
    province: 'Buenos Aires',
    coach_id: 'coach_001',
    role: 'athlete',
    product: 'volta',
    subscription: 'PRO',
    macrocycle: {
      program_id: 'cf-open-prep',
      program_name: 'CF Open Prep · Q2',
      week: 5,
      day: 4,
      total_weeks: 12,
      focus: 'Engine-Gymnastics',
    },
    maxes: {
      snatch: 62,
      clean: 82,
      jerk: 80,
      back_squat: 115,
      front_squat: 100,
      body_weight: 62.4,
    },
    prior_fitness: 64.8,
    prior_fatigue: 41.2,
    cf_benchmarks: [
      { name: 'Fran',  time: '3:42',  scale: 'rx' },
      { name: 'Helen', time: '9:15',  scale: 'rx' },
      { name: 'Grace', time: '3:58',  scale: 'rx' },
      { name: 'Murph', time: '41:20', scale: 'scaled' },
      { name: 'Cindy', rounds: '22 rounds', scale: 'rx' },
    ],
    cf_skills: {
      pullups_strict: 12,
      hspu: 8,
      muscle_ups_bar: 4,
      muscle_ups_ring: 2,
      double_unders_unbroken: 80,
    },
    sessions_last_7: [
      { date: '2026-04-29', load: 2100, rpe_reported: 7, rpe_expected: 7, sleep_hours: 7.5, soreness: 4, motivation: 9, life_stress: 3, completed: true,  notes: 'Fran 3:42 Rx · PR -33s' },
      { date: '2026-04-30', load: 1850, rpe_reported: 7, rpe_expected: 7, sleep_hours: 7.0, soreness: 5, motivation: 8, life_stress: 3, completed: true,  notes: 'EMOM 20 Snatch 50kg + Box jump' },
      { date: '2026-05-01', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 8.5, soreness: 3, motivation: 8, life_stress: 2, completed: false, notes: 'Mobility + foam · descanso activo' },
      { date: '2026-05-02', load: 2400, rpe_reported: 8, rpe_expected: 8, sleep_hours: 7.0, soreness: 6, motivation: 8, life_stress: 4, completed: true,  notes: 'Helen 9:15 Rx · 2do mejor' },
      { date: '2026-05-03', load: 1700, rpe_reported: 6, rpe_expected: 7, sleep_hours: 8.0, soreness: 4, motivation: 9, life_stress: 3, completed: true,  notes: 'Strength · Back Squat 5×3 @ 95kg' },
      { date: '2026-05-04', load: 2050, rpe_reported: 7, rpe_expected: 7, sleep_hours: 7.5, soreness: 4, motivation: 8, life_stress: 3, completed: true,  notes: 'AMRAP 15 · DU + Wall ball + T2B' },
      { date: '2026-05-05', load: 0,    rpe_reported: 0, rpe_expected: 0, sleep_hours: 7.5, soreness: 3, motivation: 9, life_stress: 2, completed: false, notes: 'WOD del día pendiente · Cindy' },
    ],
  },
];

// Mapa rápido email → perfil
export const athleteByEmail = Object.fromEntries(athletes.map(a => [a.email, a]));
export const coachById = Object.fromEntries(coaches.map(c => [c.id, c]));
export const athleteById = Object.fromEntries(athletes.map(a => [a.id, a]));

/**
 * Catálogo de logros celebrables.
 *
 * Cada `Celebration` describe un evento "share-worthy": PR, milestone, racha,
 * tier-up, etc. Las card-variants (Minimalist, Stadium, StatSheet, ...) consumen
 * este shape para generar la pantalla social optimizada para screenshot.
 *
 * Fase 3.5.A · ver PLAN_TRABAJO.md
 */

import type { AthleteProfile } from './athletes';
import type { ChartData } from '../components/social/Chart';

export type CelebrationType =
  | 'pr_lift'
  | 'skill_milestone'
  | 'streak'
  | 'tier_up'
  | 'wod_benchmark'
  | 'total_olympic'
  | 'consistency_milestone'
  | 'anniversary'
  | 'leaderboard'
  | 'first_movement'
  | 'session_today'
  | 'volume_14d'
  | 'consecutive_days'
  | 'weekly_intensity'
  | 'adherence'
  | 'progress_compare'
  | 'radar_ho'
  | 'radar_vol';

export type AccentTheme = 'gold' | 'primary' | 'fire' | 'ice' | 'royal' | 'forest';

export interface Celebration {
  id: string;
  type: CelebrationType;
  /** Eyebrow chico arriba: "NUEVO RÉCORD PERSONAL" */
  headline: string;
  /** Línea principal bajo el número: "CLEAN & JERK" */
  title: string;
  /** Valor hero: "145" */
  value: string;
  /** Unidad pequeña al lado del valor: "KG", "DÍAS", "REPS" */
  unit?: string;
  /** Contexto bajo el título: "2× peso corporal · zona élite" */
  context?: string;
  /** Emoji decorativo */
  icon: string;
  /** Tema de color */
  accent: AccentTheme;
  /** ISO date */
  date: string;
  /** Hashtag sin "#" */
  hashtag: string;
  /** Datos extra para variantes tipo stat-sheet (label → value) */
  stats?: Array<{ label: string; value: string }>;
  /** Datos opcionales de gráfico (sparkline, bars, ring, heatmap, comparison) */
  chart?: ChartData;
}

/* ------------------------------------------------------------------ */
/* Builders por tipo de logro                                          */
/* ------------------------------------------------------------------ */

function prClean(athlete: AthleteProfile | null): Celebration {
  const v = athlete?.maxes.clean ?? 145;
  const bw = athlete?.maxes.body_weight ?? 72;
  const ratio = (v / bw).toFixed(2);
  return {
    id: 'pr_clean',
    type: 'pr_lift',
    headline: '⭐ NUEVO RÉCORD PERSONAL ⭐',
    title: 'CLEAN & JERK',
    value: String(v),
    unit: 'KG',
    context: `${ratio}× peso corporal`,
    icon: '🏋️',
    accent: 'gold',
    date: new Date().toISOString(),
    hashtag: `HolyOlyPR${v}kg`,
    stats: [
      { label: 'Snatch', value: `${athlete?.maxes.snatch ?? 110}kg` },
      { label: 'Clean & Jerk', value: `${v}kg` },
      { label: 'Total Olímpico', value: `${(athlete?.maxes.snatch ?? 110) + v}kg` },
      { label: 'Bodyweight', value: `${bw}kg` },
    ],
  };
}

function prSnatch(athlete: AthleteProfile | null): Celebration {
  const v = athlete?.maxes.snatch ?? 110;
  const bw = athlete?.maxes.body_weight ?? 72;
  return {
    id: 'pr_snatch',
    type: 'pr_lift',
    headline: '⭐ NUEVO RÉCORD PERSONAL ⭐',
    title: 'SNATCH',
    value: String(v),
    unit: 'KG',
    context: `${(v / bw).toFixed(2)}× peso corporal`,
    icon: '🏋️',
    accent: 'gold',
    date: new Date().toISOString(),
    hashtag: `HolyOlySnatch${v}`,
    stats: [
      { label: 'Snatch', value: `${v}kg` },
      { label: 'Clean & Jerk', value: `${athlete?.maxes.clean ?? 145}kg` },
      { label: 'Front Squat', value: `${athlete?.maxes.front_squat ?? 165}kg` },
      { label: 'Back Squat', value: `${athlete?.maxes.back_squat ?? 185}kg` },
    ],
  };
}

function totalOlympic(athlete: AthleteProfile | null): Celebration {
  const sn = athlete?.maxes.snatch ?? 110;
  const cj = athlete?.maxes.clean ?? 145;
  const total = sn + cj;
  return {
    id: 'total_olympic',
    type: 'total_olympic',
    headline: 'TOTAL OLÍMPICO',
    title: 'SNATCH + C&J',
    value: String(total),
    unit: 'KG',
    context: `Sn ${sn} · CJ ${cj}`,
    icon: '🥇',
    accent: 'gold',
    date: new Date().toISOString(),
    hashtag: `HolyOlyTotal${total}`,
    stats: [
      { label: 'Snatch', value: `${sn}kg` },
      { label: 'Clean & Jerk', value: `${cj}kg` },
      { label: 'TOTAL', value: `${total}kg` },
      { label: 'Categoría', value: athlete?.weight_class ?? '−73kg' },
    ],
  };
}

function streak(athlete: AthleteProfile | null): Celebration {
  const days = athlete?.sessions_last_7.filter(s => s.completed).length ?? 5;
  const value = Math.max(days * 4, 14);
  return {
    id: 'streak',
    type: 'streak',
    headline: '🔥 RACHA ACTIVA 🔥',
    title: 'DÍAS CONSECUTIVOS',
    value: String(value),
    unit: 'DÍAS',
    context: 'Sin saltar entrenos',
    icon: '🔥',
    accent: 'fire',
    date: new Date().toISOString(),
    hashtag: `HolyOlyRacha${value}`,
    stats: [
      { label: 'Racha actual', value: `${value} días` },
      { label: 'Sesiones últimas 7d', value: String(days) },
      { label: 'Asistencia', value: `${Math.round((days / 7) * 100)}%` },
    ],
  };
}

function tierUp(): Celebration {
  return {
    id: 'tier_up',
    type: 'tier_up',
    headline: 'TIER UP',
    title: 'CINTURÓN PÚRPURA',
    value: 'L4',
    unit: 'NIVEL',
    context: 'Comprometido → Avanzado',
    icon: '🟣',
    accent: 'royal',
    date: new Date().toISOString(),
    hashtag: 'HolyOlyPurpura',
    stats: [
      { label: 'Nivel actual', value: 'Cinturón Púrpura' },
      { label: 'Sesiones totales', value: '128' },
      { label: 'Próximo tier', value: 'Cinturón Marrón' },
    ],
  };
}

function wodBenchmark(): Celebration {
  return {
    id: 'wod_fran',
    type: 'wod_benchmark',
    headline: 'BENCHMARK WOD',
    title: 'FRAN',
    value: '3:42',
    unit: 'TIME',
    context: '21-15-9 · Thrusters & Pull-ups',
    icon: '⏱️',
    accent: 'fire',
    date: new Date().toISOString(),
    hashtag: 'HolyOlyFran',
    stats: [
      { label: 'WOD', value: 'Fran' },
      { label: 'Tiempo', value: '3:42' },
      { label: 'Anterior', value: '4:15' },
      { label: 'Mejora', value: '-33s' },
    ],
  };
}

function skillMilestone(): Celebration {
  return {
    id: 'first_muscle_up',
    type: 'skill_milestone',
    headline: 'PRIMER',
    title: 'MUSCLE-UP',
    value: '1',
    unit: 'REP',
    context: 'Skill desbloqueado · Tier Avanzado',
    icon: '💪',
    accent: 'primary',
    date: new Date().toISOString(),
    hashtag: 'HolyOlyMuscleUp',
    stats: [
      { label: 'Skill', value: 'Muscle-up' },
      { label: 'Tier', value: 'Avanzado' },
      { label: 'Prereqs', value: 'Strict Pull-up + Dip' },
    ],
  };
}

function consistency(): Celebration {
  return {
    id: 'consistency_100',
    type: 'consistency_milestone',
    headline: 'MILESTONE',
    title: 'SESIONES COMPLETADAS',
    value: '100',
    unit: 'SESIONES',
    context: 'Tres dígitos de constancia',
    icon: '🎯',
    accent: 'primary',
    date: new Date().toISOString(),
    hashtag: 'HolyOly100',
    stats: [
      { label: 'Sesiones totales', value: '100' },
      { label: 'Tonelaje levantado', value: '52.4 t' },
      { label: 'Tiempo en plataforma', value: '8 meses' },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Logros "diarios" con gráficos                                       */
/* ------------------------------------------------------------------ */

function last14Loads(athlete: AthleteProfile | null): number[] {
  // sessions_last_7 → expandir a 14d con relleno realista para visualización
  const real = athlete?.sessions_last_7.map(s => Math.round(s.load)) ?? [];
  const pad = 14 - real.length;
  if (pad <= 0) return real.slice(-14);
  // Días anteriores (sintéticos pero plausibles, descendentes para mostrar crecimiento)
  const base = real.length > 0 ? Math.round(real.reduce((a, b) => a + b, 0) / real.length) : 1200;
  const synth = Array.from({ length: pad }, (_, i) => {
    const factor = 0.55 + (i / Math.max(pad - 1, 1)) * 0.4;
    return Math.round(base * factor + (i % 2 === 0 ? -50 : 80));
  });
  return [...synth, ...real];
}

function sessionToday(athlete: AthleteProfile | null): Celebration {
  // Última sesión real completada — si hoy fue descanso, usar la previa con carga
  const sessions = athlete?.sessions_last_7 ?? [];
  const lastReal = [...sessions].reverse().find(s => s.load > 0) ?? sessions[sessions.length - 1];
  const load = Math.round(lastReal?.load ?? 1840);
  const rpe = lastReal?.rpe_reported || 7;
  const loads14 = last14Loads(athlete);
  return {
    id: 'session_today',
    type: 'session_today',
    headline: 'ENTRENAMIENTO DE HOY',
    title: 'SESIÓN COMPLETADA',
    value: String(load),
    unit: 'KG·VOL',
    context: `RPE ${rpe} · sesión completa`,
    icon: '✅',
    accent: 'primary',
    date: new Date().toISOString(),
    hashtag: `HolyOlySesion${load}`,
    stats: [
      { label: 'Volumen', value: `${load} kg` },
      { label: 'RPE reportado', value: String(rpe) },
      { label: 'Sueño', value: `${lastReal?.sleep_hours ?? 7.5} h` },
      { label: 'Motivación', value: `${lastReal?.motivation ?? 8}/10` },
    ],
    chart: { kind: 'sparkline', values: loads14.filter(v => v > 0), labels: ['−13d', 'HOY'] },
  };
}

function volume14d(athlete: AthleteProfile | null): Celebration {
  const loads = last14Loads(athlete);
  const total = loads.reduce((a, b) => a + b, 0);
  const tons = (total / 1000).toFixed(1);
  return {
    id: 'volume_14d',
    type: 'volume_14d',
    headline: 'VOLUMEN ACUMULADO',
    title: '14 DÍAS',
    value: tons,
    unit: 'T',
    context: `${total.toLocaleString('es')} kg movidos`,
    icon: '📊',
    accent: 'ice',
    date: new Date().toISOString(),
    hashtag: `HolyOly${tons}T`,
    stats: [
      { label: 'Total 14d', value: `${tons} t` },
      { label: 'Promedio diario', value: `${Math.round(total / 14).toLocaleString('es')} kg` },
      { label: 'Pico', value: `${Math.max(...loads).toLocaleString('es')} kg` },
      { label: 'Sesiones', value: String(loads.filter(v => v > 100).length) },
    ],
    chart: { kind: 'bars', values: loads, highlight: loads.length - 1 },
  };
}

function consecutiveDays(athlete: AthleteProfile | null): Celebration {
  const loads = last14Loads(athlete);
  // intensidad = load normalizado [0..1]
  const max = Math.max(...loads, 1);
  const days = loads.map((v, i) => ({
    date: `d-${13 - i}`,
    intensity: v > 100 ? Math.max(v / max, 0.25) : 0,
  }));
  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].intensity > 0) s++;
      else break;
    }
    return s;
  })();
  const value = Math.max(streak, athlete ? athlete.sessions_last_7.filter(s => s.completed).length * 4 : 12);
  return {
    id: 'consecutive_days',
    type: 'consecutive_days',
    headline: '🔥 DÍAS CONSECUTIVOS 🔥',
    title: 'SIN SALTAR ENTRENOS',
    value: String(value),
    unit: 'DÍAS',
    context: 'Constancia · zona top 10%',
    icon: '🔥',
    accent: 'fire',
    date: new Date().toISOString(),
    hashtag: `HolyOly${value}Dias`,
    stats: [
      { label: 'Racha actual', value: `${value} días` },
      { label: 'Mejor racha', value: `${Math.max(value, 28)} días` },
      { label: 'Adherencia 14d', value: `${Math.round((days.filter(d => d.intensity > 0).length / 14) * 100)}%` },
    ],
    chart: { kind: 'heatmap14', days },
  };
}

function weeklyIntensity(athlete: AthleteProfile | null): Celebration {
  const rpes = athlete?.sessions_last_7.map(s => s.rpe_reported) ?? [6, 7, 8, 7, 8, 9, 7];
  const padded = rpes.length === 7 ? rpes : [...Array(7 - rpes.length).fill(7), ...rpes];
  const avg = (padded.reduce((a, b) => a + b, 0) / padded.length).toFixed(1);
  return {
    id: 'weekly_intensity',
    type: 'weekly_intensity',
    headline: 'INTENSIDAD SEMANAL',
    title: 'RPE PROMEDIO',
    value: avg,
    unit: '/10',
    context: 'Última semana',
    icon: '⚡',
    accent: 'gold',
    date: new Date().toISOString(),
    hashtag: `HolyOlyIntensidad${avg}`,
    stats: [
      { label: 'RPE promedio', value: avg },
      { label: 'Sesión más dura', value: `RPE ${Math.max(...padded)}` },
      { label: 'Más suave', value: `RPE ${Math.min(...padded)}` },
    ],
    chart: { kind: 'bars', values: padded, labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] },
  };
}

function adherence(athlete: AthleteProfile | null): Celebration {
  const done = athlete?.sessions_last_7.filter(s => s.completed).length ?? 6;
  const total = 7;
  const pct = Math.round((done / total) * 100);
  return {
    id: 'adherence',
    type: 'adherence',
    headline: 'ADHERENCIA SEMANAL',
    title: 'SESIONES PROGRAMADAS',
    value: `${pct}`,
    unit: '%',
    context: `${done}/${total} sesiones esta semana`,
    icon: '🎯',
    accent: 'forest',
    date: new Date().toISOString(),
    hashtag: `HolyOlyAdherencia${pct}`,
    stats: [
      { label: 'Completadas', value: `${done}/${total}` },
      { label: 'Adherencia', value: `${pct}%` },
      { label: 'Promedio club', value: '64%' },
    ],
    chart: { kind: 'ring', value: done, max: total, centerLabel: `${pct}%` },
  };
}

function radarHO(athlete: AthleteProfile | null): Celebration {
  const m = athlete?.maxes ?? { snatch: 110, clean: 100, jerk: 130, back_squat: 175, front_squat: 152, body_weight: 72 };
  const cleanAndJerk = m.clean + m.jerk - m.clean;  // jerk como aprox CJ
  return {
    id: 'radar_ho_strength',
    type: 'radar_ho',
    headline: 'PERFIL DE FUERZA',
    title: 'BALANCE OLÍMPICO',
    value: `${(m.snatch / m.body_weight).toFixed(2)}`,
    unit: '× BW',
    context: `Snatch · C&J · Squat Back · Squat Front`,
    icon: '🎯',
    accent: 'gold',
    date: new Date().toISOString(),
    hashtag: 'HolyOlyBalance',
    stats: [
      { label: 'Snatch / C&J',          value: `${Math.round((m.snatch / cleanAndJerk) * 100)}% (ideal 80%)` },
      { label: 'C&J / Squat Back',      value: `${Math.round((cleanAndJerk / m.back_squat) * 100)}% (ideal 80%)` },
      { label: 'Front / Back Squat',    value: `${Math.round((m.front_squat / m.back_squat) * 100)}% (ideal 90%)` },
      { label: 'Total / Peso corporal', value: `${((m.snatch + cleanAndJerk) / m.body_weight).toFixed(2)}×` },
    ],
    chart: {
      kind: 'radar',
      axes: [
        { label: 'Snatch',  value: Math.round((m.snatch / cleanAndJerk) * 100),       ideal: 80,  max: 100 },
        { label: 'C&J',     value: Math.round((cleanAndJerk / m.back_squat) * 100),   ideal: 80,  max: 100 },
        { label: 'Sq Back', value: 100,                                                ideal: 100, max: 100 },
        { label: 'Sq Front',value: Math.round((m.front_squat / m.back_squat) * 100), ideal: 90,  max: 100 },
      ],
    },
  };
}

function radarVOL(): Celebration {
  return {
    id: 'radar_vol_profile',
    type: 'radar_vol',
    headline: 'PERFIL CROSSFIT',
    title: '5 DIMENSIONES',
    value: '70',
    unit: '/100',
    context: 'Score global · percentil vs población',
    icon: '🎯',
    accent: 'ice',
    date: new Date().toISOString(),
    hashtag: 'HolyOlyPerfil',
    stats: [
      { label: 'Strength',    value: '78 · sólido' },
      { label: 'Engine',      value: '46 · punto débil ⚠' },
      { label: 'Gymnastics',  value: '82 · tu fuerte' },
      { label: 'Benchmarks',  value: '70 · bueno' },
      { label: 'Consistency', value: '76 · regular' },
    ],
    chart: {
      kind: 'radar',
      axes: [
        { label: 'Strength',    value: 78, ideal: 75, max: 100 },
        { label: 'Engine',      value: 46, ideal: 75, max: 100 },
        { label: 'Gymnastics',  value: 82, ideal: 75, max: 100 },
        { label: 'Benchmarks',  value: 70, ideal: 75, max: 100 },
        { label: 'Consistency', value: 76, ideal: 75, max: 100 },
      ],
    },
  };
}

function progressCompare(athlete: AthleteProfile | null): Celebration {
  const now = athlete?.maxes.snatch ?? 110;
  const before = Math.max(Math.round(now * 0.78), 60);
  const delta = now - before;
  return {
    id: 'progress_snatch_6mo',
    type: 'progress_compare',
    headline: 'PROGRESO · 6 MESES',
    title: 'SNATCH',
    value: `+${delta}`,
    unit: 'KG',
    context: `${before} → ${now} kg`,
    icon: '📈',
    accent: 'royal',
    date: new Date().toISOString(),
    hashtag: `HolyOlyProgreso${delta}kg`,
    stats: [
      { label: 'Hace 6 meses', value: `${before} kg` },
      { label: 'Hoy', value: `${now} kg` },
      { label: 'Δ', value: `+${delta} kg (${Math.round((delta / before) * 100)}%)` },
    ],
    chart: { kind: 'comparison', before, after: now, unit: 'kg' },
  };
}

function readLB(key: string, fallback: string): string {
  try {
    const v = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function leaderboardTop10(athlete: AthleteProfile | null): Celebration {
  const rank = parseInt(readLB('social:lb_rank', '7'), 10);
  const total = parseInt(readLB('social:lb_total', '15'), 10);
  const metricLabel = readLB('social:lb_metric', 'OLY Index');
  const value = readLB('social:lb_value', '3.42');
  const periodLabel = readLB('social:lb_period_label', 'Esta semana');
  const club = athlete?.club ?? readLB('social:lb_club', 'tu club');
  const percentile = Math.max(1, Math.round((rank / Math.max(total, 1)) * 100));
  const accent: AccentTheme = rank <= 3 ? 'gold' : rank <= 10 ? 'royal' : 'primary';
  const icon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏆';
  return {
    id: 'leaderboard_top10',
    type: 'leaderboard',
    headline: rank <= 10 ? '🏆 RANKING DEL CLUB' : '📈 SUBIENDO EN EL RANKING',
    title: `TOP ${rank <= 3 ? rank : rank <= 10 ? '10' : Math.ceil(percentile / 5) * 5 + '%'}`,
    value: `#${rank}`,
    unit: `de ${total}`,
    context: `${metricLabel} · ${periodLabel}`,
    icon,
    accent,
    date: new Date().toISOString(),
    hashtag: `HolyOlyTop${rank}`,
    stats: [
      { label: 'Posición', value: `#${rank} de ${total}` },
      { label: metricLabel, value },
      { label: 'Club', value: club },
      { label: 'Período', value: periodLabel },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Catálogo público                                                    */
/* ------------------------------------------------------------------ */

export function buildCelebrationCatalog(athlete: AthleteProfile | null): Celebration[] {
  return [
    // Diarios (con gráficos) — los más relevantes primero
    sessionToday(athlete),
    consecutiveDays(athlete),
    volume14d(athlete),
    weeklyIntensity(athlete),
    adherence(athlete),
    progressCompare(athlete),
    // Radar charts
    radarHO(athlete),
    radarVOL(),
    // Hitos puntuales
    prClean(athlete),
    prSnatch(athlete),
    totalOlympic(athlete),
    streak(athlete),
    tierUp(),
    wodBenchmark(),
    skillMilestone(),
    consistency(),
    // Social ranking
    leaderboardTop10(athlete),
  ];
}

export const ACCENT_HEX: Record<AccentTheme, string> = {
  gold: '#F5C518',
  primary: '#7C5CFF',
  fire: '#FF6B35',
  ice: '#56CCF2',
  royal: '#A855F7',
  forest: '#22C55E',
};

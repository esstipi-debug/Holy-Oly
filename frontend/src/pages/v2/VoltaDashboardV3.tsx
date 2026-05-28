/**
 * VoltaDashboardV3 · home del atleta Volta (CrossFit).
 *
 * Diferencia vs Holy Oly home: foco en WOD del día · benchmarks heroes
 * (FRAN/GRACE/HELEN/MURPH) · doble sesión · readiness CNS pre-WOD.
 *
 * Spec: claude_design_prompts_batch_v4/04_VOLTA.md · prompt 30
 * Style: FIFA Modo Leyenda + Tactical HUD · cyan dominante · lightning iconography
 *
 * CSS scope: .vd-root (Volta Dashboard)
 * API: GET /v1/volta/dashboard/me
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import { useAthlete } from '../../context/AthleteContext';
import { coachById, type AthleteProfile, type AthleteSession, type CFBenchmark } from '../../data/athletes';
import { getPendingForToday } from '../../lib/plannedSessions';
import { voltaWod, type RecommendedWodResponse } from '../../lib/voltaWod';
import type { PlannedSession } from '../../types/training';
import '../../styles/v2/volta-dashboard.css';

// ============================================================
// Types
// ============================================================
type AthleteLevel = 'RX' | 'Scaled' | 'Intermediate';
type WodCategory  = 'Girl WOD' | 'Hero WOD' | 'Custom' | 'Open WOD';
type WodType      = 'AMRAP' | 'For Time' | 'EMOM' | 'Chipper';
type SessionTag   = 'WOD' | 'Strength' | 'Skill' | 'Cardio' | 'Yoga' | 'Rest';
type Feedback     = 'fire' | 'good' | 'ok' | 'hard' | 'broken';
type ReadinessZone = 'green' | 'amber' | 'red';

interface Athlete {
  name: string;
  avatar: string;
  level: AthleteLevel;
  flag: string;
  box: string;
  coach: string;
}

interface WodMovement {
  reps: string;          // ej "21-15-9"
  name: string;          // ej "Thrusters"
  weight?: string;       // ej "95lb"
}

interface WodToday {
  name: string;          // FRAN
  category: WodCategory;
  type: WodType;
  movements: WodMovement[];
  schemeDesc: string;    // ej "21-15-9 Thrusters · Pull-ups"
  estimatedRx: string;   // ej "5-8 min"
  estimatedScaled: string;
}

interface SecondSession {
  enabled: boolean;
  at: string;            // "18:00"
  type: SessionTag;
  description: string;   // "Back Squat 5x5 @ 75%"
}

interface Readiness {
  score: number;         // 0-100
  zone: ReadinessZone;
  cns: number;           // 0-100
  sleepHours: number;
  recommendation: string;// "Vas en RX hoy"
}

interface Benchmark {
  key: 'FRAN' | 'GRACE' | 'HELEN' | 'MURPH';
  label: string;
  pr: string;            // "4:23"
  prRaw: number;         // seconds, used for delta arithmetic
  deltaSec: number;      // negative = improvement
  unit: 'time' | 'split';
  variantToggle?: ('Half' | 'Full');
}

interface LastSession {
  date: string;          // "Hoy" · "Ayer" · "Vie"
  tag: SessionTag;
  duration: string;      // "12:34"
  scale: 'RX' | 'Scaled' | '—';
  feedback: Feedback;
}

interface Quest {
  id: string;
  text: string;
  current: number;
  target: number;
  unit?: string;
}

interface DashboardData {
  athlete: Athlete;
  notifications: number;
  wodToday: WodToday;
  secondSession: SecondSession;
  readiness: Readiness;
  benchmarks: Benchmark[];
  lastSessions: LastSession[];
  quests: Quest[];
}

// ============================================================
// Real-data builders · mapean AthleteContext / voltaWod /
// plannedSessions al shape DashboardData del layout V3.
//
// Fuente de verdad: la home legacy src/pages/VoltaDashboard.tsx.
// Slots sin equivalente real → default sensato (ver SIN MAPEO abajo).
// ============================================================

/** Iniciales para el avatar (máx 2 chars). "Camila Bravo" → "CB". */
function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "MARCO V." styling de la home V3: nombre en mayúsculas. */
function displayName(name: string): string {
  return (name || 'Atleta').toUpperCase();
}

/** Provincia/país → emoji bandera. Sólo conocemos provincias AR en seed → 🇦🇷. */
function flagFor(_athlete: AthleteProfile): string {
  // SIN MAPEO real de país · seed sólo tiene provincias argentinas.
  return '🇦🇷';
}

/** Nivel del atleta derivado del scale predominante de sus benchmarks. */
function deriveLevel(athlete: AthleteProfile | null): AthleteLevel {
  const bms = athlete?.cf_benchmarks ?? [];
  if (bms.length === 0) return 'Intermediate';
  const rxCount = bms.filter(b => b.scale === 'rx' || b.scale === 'rx_plus').length;
  if (rxCount >= Math.ceil(bms.length / 2)) return 'RX';
  return 'Scaled';
}

/** "mm:ss" o "hh:mm:ss" → segundos. Devuelve null si no parsea. */
function parseTimeToSec(t?: string): number | null {
  if (!t) return null;
  const parts = t.split(':').map(p => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

const HERO_KEYS = ['FRAN', 'GRACE', 'HELEN', 'MURPH'] as const;
type HeroKey = (typeof HERO_KEYS)[number];

/** Construye los 4 benchmarks heroes desde cf_benchmarks reales del atleta. */
function buildBenchmarks(athlete: AthleteProfile | null): Benchmark[] {
  const byName = new Map<string, CFBenchmark>();
  for (const b of athlete?.cf_benchmarks ?? []) {
    byName.set(b.name.trim().toUpperCase(), b);
  }
  return HERO_KEYS.map((key: HeroKey) => {
    const real = byName.get(key);
    const pr = real?.time ?? real?.rounds ?? '—';
    const prRaw = parseTimeToSec(real?.time) ?? 0;
    // SIN MAPEO de histórico · sólo tenemos el PR actual, no el previo → delta neutro.
    return {
      key,
      label: key,
      pr,
      prRaw,
      deltaSec: 0,
      unit: key === 'MURPH' ? 'split' : 'time',
      ...(key === 'MURPH' ? { variantToggle: 'Half' as const } : {}),
    };
  });
}

/** Mapea la zona del engine (readiness_category / cns_zone) a la del widget V3. */
function deriveReadiness(
  stress: ReturnType<typeof useAthlete>['stress'],
  today: AthleteSession | undefined,
): Readiness {
  if (!stress) {
    return {
      score: 0,
      zone: 'amber',
      cns: 0,
      sleepHours: today?.sleep_hours ?? 0,
      recommendation: 'Calculando readiness…',
    };
  }
  const cat = (stress.readiness_category ?? '').toUpperCase();
  const zone: ReadinessZone =
    cat === 'GREEN' || cat === 'READY' || cat === 'OPTIMAL' ? 'green'
    : cat === 'RED' || cat === 'CRITICAL' || cat === 'LOW' ? 'red'
    : 'amber';
  const recommendation =
    zone === 'green' ? 'Vas en RX hoy'
    : zone === 'red' ? 'Tu cuerpo pide descanso'
    : 'Entrená con criterio hoy';
  return {
    score: Math.round(stress.readiness),
    zone,
    cns: stress.cns_score != null ? Math.round(stress.cns_score) : Math.round(stress.readiness),
    sleepHours: today?.sleep_hours ?? 0,
    recommendation,
  };
}

const WOD_TYPE_MAP: Record<RecommendedWodResponse['type'], WodType> = {
  AMRAP: 'AMRAP',
  EMOM: 'EMOM',
  'For Time': 'For Time',
  Strength: 'EMOM',          // no hay chip 'Strength' en V3 · cae a EMOM visual
  'Active Recovery': 'AMRAP',
};

/** Recommended WOD del backend → shape WodToday del hero V3. */
function buildWodToday(wod: RecommendedWodResponse | null, scale: 'rx' | 'scaled' | 'beginner'): WodToday | null {
  if (!wod) return null;
  const durMin = Math.round(wod.duration_sec / 60);
  const scaledMin = Math.round(durMin * 1.4);
  return {
    name: wod.title.toUpperCase(),
    // SIN MAPEO de categoría Girl/Hero · el engine no la expone → Custom / Open.
    category: wod.template_id ? 'Open WOD' : 'Custom',
    type: WOD_TYPE_MAP[wod.type] ?? 'AMRAP',
    movements: wod.movements.map(m => ({
      reps: m.scaling[scale] ?? m.scaling.rx ?? '',
      name: m.name,
    })),
    schemeDesc: wod.movements.map(m => m.name).join(' · '),
    estimatedRx: `~${durMin} min`,
    estimatedScaled: `~${scaledMin} min`,
  };
}

const FOCUS_TO_TAG: Record<string, SessionTag> = {
  metcon: 'WOD',
  strength: 'Strength',
  technique: 'Skill',
  olympic: 'Strength',
  accessory: 'Skill',
};

/** Segunda sesión hoy desde plannedSessions (slot PM si hay doble). */
function buildSecondSession(pending: PlannedSession[]): SecondSession {
  const pm = pending.find(s => s.slot === 'pm');
  if (!pm) return { enabled: false, at: '', type: 'Strength', description: '' };
  const tag = FOCUS_TO_TAG[pm.focus] ?? 'Strength';
  const avgPct = pm.exercises.length
    ? Math.round((pm.exercises.reduce((a, e) => a + e.pct, 0) / pm.exercises.length) * 100)
    : 0;
  const first = pm.exercises[0];
  const desc = first
    ? `${first.name} ${first.sets}×${first.reps}${avgPct ? ` @ ${avgPct}%` : ''}`
    : `${pm.exercises.length} ejercicios`;
  return { enabled: true, at: 'PM', type: tag, description: desc };
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Fecha ISO → label relativo ("Hoy"/"Ayer") o día de semana. */
function dateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return DAY_LABELS[d.getDay()];
}

/** Adivina el tipo de sesión a partir de las notas (heurística simple). */
function tagFromSession(s: AthleteSession): SessionTag {
  const n = (s.notes ?? '').toLowerCase();
  if (n.includes('mobility') || n.includes('foam') || n.includes('yoga')) return 'Yoga';
  if (n.includes('descanso') || n.includes('día libre') || n.includes('rest')) return 'Rest';
  if (n.includes('squat') || n.includes('strength') || n.includes('deadlift') || n.includes('press')) return 'Strength';
  if (n.includes('row') || n.includes('run') || n.includes('bike') || n.includes('cardio')) return 'Cardio';
  if (!s.completed && s.load === 0) return 'Rest';
  return 'WOD';
}

/** Feedback emoji-zone derivado de RPE reportado + motivación. */
function feedbackFromSession(s: AthleteSession): Feedback {
  if (!s.completed && s.load === 0) return 'ok';
  const rpe = s.rpe_reported || 0;
  if (rpe >= 9) return 'broken';
  if (rpe >= 8) return 'hard';
  if (s.motivation >= 8 && rpe <= 7) return 'fire';
  if (rpe === 0) return 'ok';
  return 'good';
}

/** Duración legible · no hay duración real → usamos tonelaje como proxy informativo. */
function durationFromSession(s: AthleteSession): string {
  if (s.load <= 0) return '—';
  return `${(s.load / 1000).toFixed(1)}t`;
}

/** Escala del set actual (Rx si completó con buen RPE, si no Scaled). */
function scaleFromSession(s: AthleteSession): 'RX' | 'Scaled' | '—' {
  if (!s.completed || s.load === 0) return '—';
  return s.rpe_reported && s.rpe_reported <= s.rpe_expected + 1 ? 'RX' : 'Scaled';
}

/** Últimas 7 sesiones reales (más reciente primero) → cards del track V3. */
function buildLastSessions(athlete: AthleteProfile | null): LastSession[] {
  const sessions = athlete?.sessions_last_7 ?? [];
  return sessions
    .slice()
    .reverse()
    .map(s => ({
      date: dateLabel(s.date),
      tag: tagFromSession(s),
      duration: durationFromSession(s),
      scale: scaleFromSession(s),
      feedback: feedbackFromSession(s),
    }));
}

/** Inicio de la semana ISO (lunes) a las 00:00. */
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const day = (r.getDay() + 6) % 7; // 0 = lunes
  r.setDate(r.getDate() - day);
  return r;
}

/** Quests semanales derivados de sesiones reales. */
function buildQuests(athlete: AthleteProfile | null): Quest[] {
  const sessions = athlete?.sessions_last_7 ?? [];
  const weekStart = startOfWeek(new Date());
  const thisWeek = sessions.filter(s => {
    const d = new Date(`${s.date}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d >= weekStart && s.completed && s.load > 0;
  });
  const sessionCount = thisWeek.length;
  const mobilityDays = sessions.filter(s => {
    const n = (s.notes ?? '').toLowerCase();
    return n.includes('mobility') || n.includes('foam') || n.includes('yoga');
  }).length;
  const goodSleepDays = sessions.filter(s => s.sleep_hours >= 7.5).length;
  return [
    { id: 'q1', text: '4 sesiones esta semana', current: Math.min(sessionCount, 4), target: 4, unit: 'sesiones' },
    { id: 'q2', text: '1 día de movilidad', current: Math.min(mobilityDays, 1), target: 1, unit: 'día' },
    { id: 'q3', text: '3 noches de 7.5h+', current: Math.min(goodSleepDays, 3), target: 3, unit: 'noches' },
  ];
}

// ============================================================
// Icons (line · 1.7px stroke · viewBox 24)
// ============================================================
const ICONS: Record<string, ReactElement> = {
  zap:      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  bell:     <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  cog:      <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  arrowR:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  flame:    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
  dumbbell: <><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></>,
  heart:    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  trend:    <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  trendDn:  <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
  check:    <polyline points="20 6 9 17 4 12"/>,
  target:   <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  moon:     <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
  spark:    <><polygon points="12 2 15 9 22 9.5 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.5 9 9 12 2"/></>,
  trophy:   <><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M17 4h3v3a3 3 0 0 1-3 3"/><path d="M7 4H4v3a3 3 0 0 0 3 3"/></>,
  yoga:     <><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M9 13l-3 4"/><path d="M15 13l3 4"/><path d="M8 11h8"/></>,
  cardio:   <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
  rest:     <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
};

function Icon({ name, size = 14, stroke = 1.7, style, className, filled = false }: {
  name: keyof typeof ICONS; size?: number; stroke?: number;
  style?: CSSProperties; className?: string; filled?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         fill={filled ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// ============================================================
// Helpers
// ============================================================
const FEEDBACK_EMOJI: Record<Feedback, string> = {
  fire:   '🔥',
  good:   '😎',
  ok:     '😐',
  hard:   '😮‍💨',
  broken: '💀',
};

const SESSION_ICON: Record<SessionTag, keyof typeof ICONS> = {
  WOD:      'zap',
  Strength: 'dumbbell',
  Skill:    'target',
  Cardio:   'cardio',
  Yoga:     'yoga',
  Rest:     'rest',
};

const SESSION_COLOR: Record<SessionTag, string> = {
  WOD:      'var(--engine-stress)',      // cyan
  Strength: '#F472B6',                   // pink
  Skill:    'var(--engine-adapt)',       // violet
  Cardio:   'var(--engine-pulse)',       // red
  Yoga:     'var(--engine-oly)',         // green
  Rest:     'var(--text-mid)',
};

function fmtDeltaSec(deltaSec: number): { text: string; up: boolean; flat: boolean } {
  if (deltaSec === 0) return { text: '→ igual', up: false, flat: true };
  const isImprovement = deltaSec < 0; // less time = better
  const abs = Math.abs(deltaSec);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const dur = m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  return { text: `${isImprovement ? '-' : '+'}${dur}`, up: isImprovement, flat: false };
}

// ============================================================
// ZONA A · HEADER STICKY (88px)
// ============================================================
function Header({ data }: { data: DashboardData }) {
  return (
    <header className="vd-header" role="banner">
      <div className="vd-h-left">
        <span className="vd-brand">
          <Icon name="zap" size={14} stroke={2.2} filled className="vd-brand-bolt"/>
          <span className="vd-brand-tag">VOLTA</span>
        </span>
        <div className="vd-h-id">
          <div className="vd-avatar" aria-label={`Avatar ${data.athlete.name}`}>{data.athlete.avatar}</div>
          <div className="vd-h-meta">
            <div className="vd-h-name">{data.athlete.name}</div>
            <div className="vd-h-sub">
              <span className={`vd-level lv-${data.athlete.level.toLowerCase()}`}>{data.athlete.level}</span>
              <span className="dot">·</span>
              <span className="vd-flag" aria-label="bandera">{data.athlete.flag}</span>
              <span className="dot">·</span>
              <span className="vd-box">{data.athlete.box}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="vd-h-actions">
        <button className="vd-icon-btn" aria-label={`${data.notifications} notificaciones`}>
          <Icon name="bell" size={16} stroke={1.8}/>
          {data.notifications > 0 && (
            <span className="vd-badge-pip" aria-hidden="true">{data.notifications}</span>
          )}
        </button>
        <button className="vd-icon-btn" aria-label="Ajustes">
          <Icon name="cog" size={16} stroke={1.6}/>
        </button>
      </div>
    </header>
  );
}

// ============================================================
// ZONA B · WOD DEL DÍA HERO
// ============================================================
function WodHero({ wod, onStart }: { wod: WodToday; onStart: () => void }) {
  return (
    <section className="vd-wod-hero" aria-label={`WOD del día: ${wod.name}`}>
      <span className="br-tl"/><span className="br-tr"/>
      <span className="br-bl"/><span className="br-br"/>

      <div className="vd-wod-head">
        <div className="vd-wod-titles">
          <div className="vd-wod-eyebrow">
            <Icon name="zap" size={9} stroke={2.4} filled/> WOD DEL DÍA
          </div>
          <h2 className="vd-wod-name">{wod.name}</h2>
          <div className="vd-wod-chips">
            <span className={`vd-chip vd-chip-cat cat-${wod.category.replace(/\s+/g, '-').toLowerCase()}`}>
              {wod.category}
            </span>
            <span className={`vd-chip vd-chip-type type-${wod.type.replace(/\s+/g, '-').toLowerCase()}`}>
              {wod.type}
            </span>
          </div>
        </div>
        <div className="vd-wod-status">
          <span className="pip"/> LIVE
        </div>
      </div>

      <div className="vd-wod-movements">
        {wod.movements.map((m, i) => (
          <div key={i} className="vd-move-row">
            <span className="vd-move-reps">{m.reps}</span>
            <span className="vd-move-name">{m.name}</span>
            {m.weight && <span className="vd-move-weight">{m.weight}</span>}
          </div>
        ))}
      </div>

      <div className="vd-wod-est">
        <div className="vd-est-row">
          <span className="vd-est-label">
            <Icon name="clock" size={9} stroke={2}/> ESTIMADO
          </span>
        </div>
        <div className="vd-est-tracks">
          <div className="vd-est-track">
            <span className="t-tag rx">RX</span>
            <span className="t-val">{wod.estimatedRx}</span>
          </div>
          <div className="vd-est-track">
            <span className="t-tag sc">SC</span>
            <span className="t-val">{wod.estimatedScaled}</span>
          </div>
        </div>
      </div>

      <button className="vd-cta-prewod" onClick={onStart} aria-label="Empezar Pre-WOD">
        EMPEZAR PRE-WOD <Icon name="arrowR" size={14} stroke={2.4}/>
      </button>
    </section>
  );
}

// ============================================================
// ZONA C · DOBLE SESIÓN BANNER
// ============================================================
function DoubleSession({ s }: { s: SecondSession }) {
  if (!s.enabled) return null;
  return (
    <section className="vd-double" aria-label="Segunda sesión hoy">
      <div className="vd-double-info">
        <div className="vd-double-head">
          <Icon name="clock" size={10} stroke={2.2}/>
          <span className="vd-double-eyebrow">SEGUNDA SESIÓN HOY · {s.at}</span>
        </div>
        <div className="vd-double-desc">
          <span className="tag">{s.type}</span>
          <span>·</span>
          <span className="ex">{s.description}</span>
        </div>
      </div>
      <div className="vd-double-actions">
        <button className="vd-btn-mini ghost" aria-label="Más tarde">MÁS TARDE</button>
        <button className="vd-btn-mini primary" aria-label="Empezar ahora">AHORA</button>
      </div>
    </section>
  );
}

// ============================================================
// ZONA D · READINESS WIDGET
// ============================================================
function ReadinessWidget({ r }: { r: Readiness }) {
  const color = r.zone === 'green' ? 'var(--engine-oly)'
              : r.zone === 'amber' ? 'var(--engine-macro)'
              : 'var(--engine-pulse)';
  const glow  = r.zone === 'green' ? 'var(--glow-green)'
              : r.zone === 'amber' ? 'var(--glow-amber)'
              : 'var(--glow-red)';

  return (
    <section className="vd-readiness" aria-label={`Readiness ${r.score} de 100`}
             style={{ ['--rd-color' as string]: color, ['--rd-glow' as string]: glow } as CSSProperties}>
      <div className="vd-rd-ring" role="img" aria-label={`Score readiness ${r.score}`}>
        <div className="vd-rd-ring-bg"
             style={{ background: `conic-gradient(${color} ${r.score}%, rgba(255,255,255,0.06) 0)` }}>
          <div className="vd-rd-ring-inner">
            <span className="vd-rd-num">{r.score}</span>
            <span className="vd-rd-denom">/100</span>
          </div>
        </div>
      </div>
      <div className="vd-rd-body">
        <div className="vd-rd-eyebrow">READINESS</div>
        <div className="vd-rd-reco">{r.recommendation}</div>
        <div className="vd-rd-meta">
          <span className="vd-rd-meta-cell">
            <Icon name="spark" size={9} stroke={2}/> CNS <b>{r.cns}</b>
          </span>
          <span className="vd-rd-meta-cell">
            <Icon name="moon" size={9} stroke={2}/> SUEÑO <b>{r.sleepHours}h</b>
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ZONA E · BENCHMARKS HEROES (bento 2x2)
// ============================================================
function BenchmarksGrid({ items, onTap }: { items: Benchmark[]; onTap: (b: Benchmark) => void }) {
  const [murphVariant, setMurphVariant] = useState<'Half' | 'Full'>('Half');

  return (
    <>
      <div className="vd-sec-head">
        <h3>Heroes · benchmarks</h3>
        <span className="meta">PR · tap → histórico</span>
      </div>
      <div className="vd-bench-grid">
        {items.map((b) => {
          const d = fmtDeltaSec(b.deltaSec);
          const showVariant = b.key === 'MURPH';
          return (
            <button key={b.key} className="vd-bench-card"
                    onClick={() => onTap(b)}
                    aria-label={`${b.label} PR ${b.pr}`}>
              <span className="br-tl"/><span className="br-br"/>

              <div className="vd-bench-head">
                <span className="vd-bench-name">{b.label}</span>
                {showVariant && (
                  <span className="vd-bench-variant"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setMurphVariant(v => v === 'Half' ? 'Full' : 'Half'); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault(); e.stopPropagation();
                            setMurphVariant(v => v === 'Half' ? 'Full' : 'Half');
                          }
                        }}
                        aria-label={`Cambiar variante ${murphVariant}`}>
                    {murphVariant}
                  </span>
                )}
              </div>

              <div className="vd-bench-pr">{b.pr}</div>

              <div className={`vd-bench-delta ${d.flat ? 'flat' : d.up ? 'up' : 'down'}`}>
                <Icon name={d.flat ? 'check' : d.up ? 'trend' : 'trendDn'} size={10} stroke={2}/>
                {d.text}
                <span className="vs">vs prev</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// ZONA F · LAST 7 SESSIONS (mini cards horizontal scroll)
// ============================================================
function LastSessions({ sessions }: { sessions: LastSession[] }) {
  return (
    <>
      <div className="vd-sec-head">
        <h3>Últimas 7 sesiones</h3>
        <span className="meta">scroll →</span>
      </div>
      <div className="vd-last-track" role="list">
        {sessions.map((s, i) => {
          const color = SESSION_COLOR[s.tag];
          const today = s.date === 'Hoy';
          return (
            <div key={i} className="vd-last-card"
                 role="listitem"
                 data-today={today || undefined}
                 style={{ ['--ls-color' as string]: color } as CSSProperties}>
              <div className="vd-last-head">
                <span className="vd-last-date">{s.date}</span>
                <span className="vd-last-tag" style={{ color }}>
                  <Icon name={SESSION_ICON[s.tag]} size={9} stroke={2}/> {s.tag.toUpperCase()}
                </span>
              </div>
              <div className="vd-last-dur">{s.duration}</div>
              <div className="vd-last-foot">
                {s.scale !== '—' && (
                  <span className={`vd-last-scale s-${s.scale.toLowerCase()}`}>{s.scale}</span>
                )}
                <span className="vd-last-emo" aria-label={`feedback ${s.feedback}`}>
                  {FEEDBACK_EMOJI[s.feedback]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// ZONA G · QUESTS SEMANA
// ============================================================
function QuestsFooter({ quests }: { quests: Quest[] }) {
  return (
    <section className="vd-quests" aria-label="Quests de la semana">
      <div className="vd-sec-head">
        <h3>Quests · semana</h3>
        <span className="meta">
          <Icon name="trophy" size={9} stroke={2}/>
          {quests.filter(q => q.current >= q.target).length}/{quests.length} done
        </span>
      </div>
      <div className="vd-quests-list">
        {quests.map((q, i) => {
          const pct = Math.min(100, Math.round((q.current / q.target) * 100));
          const done = q.current >= q.target;
          return (
            <div key={q.id} className="vd-quest" data-done={done || undefined}>
              <div className="vd-quest-head">
                <span className="vd-quest-num">Q{i + 1}</span>
                <span className="vd-quest-text">{q.text}</span>
                <span className="vd-quest-count">
                  {q.current}/{q.target}{q.unit ? ` ${q.unit}` : ''}
                </span>
              </div>
              <div className="vd-quest-bar">
                <div className="fill" style={{ width: `${pct}%` }}/>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// WOD Hero · estado loading/sin-datos (cuando el engine aún no respondió)
// ============================================================
function WodHeroPlaceholder({ loading, onStart }: { loading: boolean; onStart: () => void }) {
  return (
    <section className="vd-wod-hero" aria-label="WOD del día">
      <span className="br-tl"/><span className="br-tr"/>
      <span className="br-bl"/><span className="br-br"/>
      <div className="vd-wod-head">
        <div className="vd-wod-titles">
          <div className="vd-wod-eyebrow">
            <Icon name="zap" size={9} stroke={2.4} filled/> WOD DEL DÍA
          </div>
          <h2 className="vd-wod-name">{loading ? '···' : 'SIN WOD'}</h2>
        </div>
      </div>
      <div className="vd-wod-movements">
        <div className="vd-move-row">
          <span className="vd-move-name">
            {loading ? 'WISE está generando tu WOD de hoy…' : 'No pudimos cargar el WOD del día.'}
          </span>
        </div>
      </div>
      <button className="vd-cta-prewod" onClick={onStart} aria-label="Ir a Pre-WOD">
        IR A PRE-WOD <Icon name="arrowR" size={14} stroke={2.4}/>
      </button>
    </section>
  );
}

// ============================================================
// Main · lee de AthleteContext + voltaWod + plannedSessions
// (sin props · rule 3). Reemplaza el home legacy VoltaDashboard.
// ============================================================
export default function VoltaDashboardV3() {
  const { navigate } = useNav();
  const { athlete, stress } = useAthlete();

  const goPreWod = () => navigate('VOLTA_PREWOD');
  const goStats  = () => navigate('VOLTA_STATS');

  // ─── WOD recomendado del día (mismo endpoint que la home legacy) ───
  const [wod, setWod] = useState<RecommendedWodResponse | null>(null);
  const [wodLoading, setWodLoading] = useState(true);
  const scale = voltaWod.getScale();

  useEffect(() => {
    let cancelled = false;
    setWodLoading(true);
    voltaWod.today()
      .then(res => { if (!cancelled) setWod(res); })
      .catch(() => { if (!cancelled) setWod(null); })
      .finally(() => { if (!cancelled) setWodLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ─── Sesiones planificadas hoy (doble sesión AM/PM) ───
  const [pending, setPending] = useState<PlannedSession[]>([]);
  useEffect(() => {
    if (!athlete) { setPending([]); return; }
    const refresh = () => setPending(getPendingForToday(athlete.id));
    refresh();
    window.addEventListener('storage', refresh);
    const id = window.setInterval(refresh, 1500);
    return () => { window.removeEventListener('storage', refresh); window.clearInterval(id); };
  }, [athlete?.id]);

  const today = athlete?.sessions_last_7?.at(-1);
  const coachName = athlete?.coach_id ? coachById[athlete.coach_id]?.name : undefined;

  const data: DashboardData = useMemo(() => ({
    athlete: {
      name: displayName(athlete?.name ?? 'Atleta'),
      avatar: toInitials(athlete?.name ?? 'Atleta'),
      level: deriveLevel(athlete),
      flag: flagFor(athlete ?? ({} as AthleteProfile)),
      box: athlete?.club ?? 'Sin box',
      coach: coachName ? displayName(coachName) : '—',
    },
    notifications: 0, // SIN MAPEO · no hay feed de notificaciones real
    wodToday: buildWodToday(wod, scale) ?? {
      name: '—', category: 'Custom', type: 'AMRAP',
      movements: [], schemeDesc: '', estimatedRx: '—', estimatedScaled: '—',
    },
    secondSession: buildSecondSession(pending),
    readiness: deriveReadiness(stress, today),
    benchmarks: buildBenchmarks(athlete),
    lastSessions: buildLastSessions(athlete),
    quests: buildQuests(athlete),
  }), [athlete, stress, wod, scale, pending, today, coachName]);

  const hasWod = !!buildWodToday(wod, scale);

  return (
    <div className="vd-root">
      <Header data={data}/>
      <div className="vd-scroll">
        {hasWod
          ? <WodHero wod={data.wodToday} onStart={goPreWod}/>
          : <WodHeroPlaceholder loading={wodLoading} onStart={goPreWod}/>}
        <DoubleSession s={data.secondSession}/>
        <ReadinessWidget r={data.readiness}/>
        <BenchmarksGrid items={data.benchmarks} onTap={() => goStats()}/>
        <LastSessions sessions={data.lastSessions}/>
        <QuestsFooter quests={data.quests}/>
      </div>
    </div>
  );
}

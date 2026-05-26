import React, { useEffect, useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import type { AthleteProfile, AthleteSession } from '../data/athletes';
import type { PlannedSession } from '../types/training';
import {
  getSessionsForDate,
  upsertPlannedSession,
  clearDate,
} from '../lib/plannedSessions';
import SkillFocusAssign from './SkillFocusAssign';
import ManualSessionAssigner from './ManualSessionAssigner';
import SkillEvaluationPanel from './SkillEvaluationPanel';

// ──────────────────────────────────────────────────────────────────
// Tipos internos
// ──────────────────────────────────────────────────────────────────

interface PrescribedExercise {
  name: string;
  sets: number;
  reps: number;
  pct: number;
  max: number; // kg base para el cálculo
}

interface PlannedDay {
  dow: number;            // 0=lun … 6=dom
  letter: string;         // L M X J V S D
  label: string;          // 'Lun', 'Mar', …
  type: 'fuerza' | 'tecnica' | 'liviano' | 'max' | 'descanso';
  avgPct: number;         // 0–1 (intensidad promedio prescripta)
  exercises: PrescribedExercise[];
}

type DayStatus = 'completed' | 'in_progress' | 'future' | 'rest' | 'missed';

interface CalendarCell {
  date: Date;
  inPast: boolean;
  isToday: boolean;
  load: number;
  rpe: number;
  pct: number;            // intensidad estimada 0–1
  completed: boolean;
  session?: AthleteSession;
  plannedType?: PlannedDay['type'];
  plannedPct?: number;
}

// ──────────────────────────────────────────────────────────────────
// Constantes visuales
// ──────────────────────────────────────────────────────────────────

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_LABELS  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS      = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const HO_GOLD   = '#F5C518';
const HO_PURPLE = '#7C5CFF';

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

// Lunes=0 … Domingo=6
const dowMon0 = (d: Date) => (d.getDay() + 6) % 7;

const startOfWeekMon = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - dowMon0(x));
  return x;
};

const sameYMD = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const round2_5 = (kg: number) => Math.round(kg / 2.5) * 2.5;

const fmtDayLabel = (d: Date) =>
  `${DAY_LABELS[dowMon0(d)]} ${String(d.getDate()).padStart(2, '0')}/${MONTHS[d.getMonth()]}`;

const intensityColor = (pct: number, completed: boolean): { bg: string; border: string } => {
  if (pct <= 0) return { bg: 'rgba(255,255,255,0.04)', border: 'var(--card-border)' };
  if (pct < 0.6)  return { bg: 'rgba(148,163,184,0.18)', border: 'rgba(148,163,184,0.35)' };
  if (pct < 0.75) return { bg: 'rgba(34,197,94,0.22)',  border: 'rgba(34,197,94,0.45)'  };
  if (pct < 0.9)  return { bg: `${HO_GOLD}33`,           border: `${HO_GOLD}66`          };
  return            { bg: 'rgba(239,68,68,0.28)',       border: 'rgba(239,68,68,0.55)'  };
  // 'completed' no cambia el color base; un dot extra lo marca abajo
  void completed;
};

const intensityLabel = (pct: number) => {
  if (pct <= 0) return 'descanso';
  if (pct < 0.6)  return 'liviano';
  if (pct < 0.75) return 'técnico';
  if (pct < 0.9)  return 'fuerza';
  return 'max';
};

// ──────────────────────────────────────────────────────────────────
// getPlannedWeek · arma 7 días según foco del macrociclo
// ──────────────────────────────────────────────────────────────────

const getPlannedWeek = (
  athlete: AthleteProfile,
): PlannedDay[] => {
  const { macrocycle, maxes } = athlete;
  const focus = (macrocycle.focus || '').toLowerCase();
  const week  = macrocycle.week || 1;
  const total = macrocycle.total_weeks || 12;
  const phase = week / total; // 0–1

  // Detectar deload (cada 4 semanas, baja intensidad)
  const isDeload = week > 1 && week % 4 === 0;

  // Bias de intensidad según foco
  const techBias = focus.includes('téc') || focus.includes('tec') ? -0.05 : 0;
  const strBias  = focus.includes('fuerza') ? +0.05 : 0;
  // Avanzar en el macro sube intensidad ~5%
  const phaseBias = (phase - 0.5) * 0.10;

  const adj = (base: number) => {
    if (isDeload) return Math.max(0.55, base - 0.15);
    return Math.min(0.95, Math.max(0.5, base + techBias + strBias + phaseBias));
  };

  // Plantilla semanal típica olímpica
  // L: snatch técnico · M: clean+jerk · X: descanso · J: fuerza pesada · V: snatch fuerza
  // S: cleans + sentadilla · D: descanso
  const week_template: PlannedDay[] = [
    {
      dow: 0, letter: 'L', label: 'Lun',
      type: isDeload ? 'liviano' : 'tecnica',
      avgPct: adj(0.72),
      exercises: [
        { name: 'Arrancada',         sets: 5, reps: 3, pct: adj(0.75), max: maxes.snatch },
        { name: 'Tirón Arrancada',   sets: 4, reps: 3, pct: adj(0.85), max: maxes.snatch },
        { name: 'Sentadilla Frontal',sets: 4, reps: 4, pct: adj(0.72), max: maxes.front_squat },
      ],
    },
    {
      dow: 1, letter: 'M', label: 'Mar',
      type: isDeload ? 'liviano' : 'fuerza',
      avgPct: adj(0.80),
      exercises: [
        { name: 'Clean & Jerk',      sets: 4, reps: 2, pct: adj(0.82), max: maxes.jerk },
        { name: 'Cargada de Fuerza', sets: 4, reps: 3, pct: adj(0.78), max: maxes.clean },
        { name: 'Press Militar',     sets: 4, reps: 5, pct: adj(0.70), max: Math.round(maxes.jerk * 0.55) },
      ],
    },
    {
      dow: 2, letter: 'X', label: 'Mié',
      type: 'descanso',
      avgPct: 0,
      exercises: [],
    },
    {
      dow: 3, letter: 'J', label: 'Jue',
      type: isDeload ? 'tecnica' : (phase > 0.7 ? 'max' : 'fuerza'),
      avgPct: adj(phase > 0.7 ? 0.90 : 0.85),
      exercises: [
        { name: 'Sentadilla Atrás',  sets: 5, reps: 3, pct: adj(0.85), max: maxes.back_squat },
        { name: 'Tirón Cargada',     sets: 4, reps: 3, pct: adj(0.90), max: maxes.clean },
        { name: 'Buenos Días',       sets: 3, reps: 6, pct: adj(0.55), max: maxes.back_squat },
      ],
    },
    {
      dow: 4, letter: 'V', label: 'Vie',
      type: isDeload ? 'liviano' : 'fuerza',
      avgPct: adj(0.82),
      exercises: [
        { name: 'Arrancada de Fuerza', sets: 5, reps: 2, pct: adj(0.82), max: maxes.snatch },
        { name: 'Sobre la Cabeza',     sets: 4, reps: 3, pct: adj(0.70), max: Math.round(maxes.snatch * 0.6) },
        { name: 'Sentadilla Frontal',  sets: 4, reps: 3, pct: adj(0.80), max: maxes.front_squat },
      ],
    },
    {
      dow: 5, letter: 'S', label: 'Sáb',
      type: isDeload ? 'tecnica' : (phase > 0.7 ? 'max' : 'fuerza'),
      avgPct: adj(phase > 0.7 ? 0.92 : 0.85),
      exercises: [
        { name: 'Arrancada',          sets: 4, reps: 1, pct: adj(phase > 0.7 ? 0.92 : 0.88), max: maxes.snatch },
        { name: 'Clean & Jerk',       sets: 4, reps: 1, pct: adj(phase > 0.7 ? 0.90 : 0.85), max: maxes.jerk },
        { name: 'Sentadilla Atrás',   sets: 4, reps: 3, pct: adj(0.83), max: maxes.back_squat },
      ],
    },
    {
      dow: 6, letter: 'D', label: 'Dom',
      type: 'descanso',
      avgPct: 0,
      exercises: [],
    },
  ];

  return week_template;
};

// ──────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────

interface Props {
  athlete: AthleteProfile;
}

const AthleteTrainingView: React.FC<Props> = ({ athlete }) => {
  const { navigate } = useNav();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const plannedWeek = useMemo(() => getPlannedWeek(athlete), [athlete]);

  // Sesión de hoy: el último item de sessions_last_7 (convención del backend mock).
  const todaySession = athlete.sessions_last_7.at(-1);
  const todayPlanned = plannedWeek[dowMon0(today)];

  const todayStatus: DayStatus = (() => {
    if (todayPlanned.type === 'descanso') return 'rest';
    if (todaySession?.completed) return 'completed';
    if (todaySession && todaySession.load > 0) return 'in_progress';
    return 'future';
  })();

  // Día expandido en la barra semanal
  const [expandedDay, setExpandedDay] = useState<number>(dowMon0(today));

  // Celda calendario 30d seleccionada
  const [selectedCell, setSelectedCell] = useState<CalendarCell | null>(null);

  // Estado de UI para acciones de coach
  const [restAssigned, setRestAssigned] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSent, setCommentSent] = useState(false);

  // ─── Esta semana (mapping completado vs prescripto) ──────────
  const weekStart = useMemo(() => startOfWeekMon(today), [today]);
  const sessionsByDate = useMemo(() => {
    const m = new Map<string, AthleteSession>();
    for (const s of athlete.sessions_last_7) m.set(s.date, s);
    return m;
  }, [athlete.sessions_last_7]);

  const weekDays = useMemo(() => {
    return plannedWeek.map((p, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const isToday = sameYMD(date, today);
      const isPast = date < today && !isToday;
      const session = sessionsByDate.get(toISO(date));
      let status: DayStatus = 'future';
      if (p.type === 'descanso') status = 'rest';
      else if (session?.completed) status = 'completed';
      else if (session && session.load > 0) status = 'in_progress';
      else if (isPast) status = 'missed';
      else status = 'future';
      return { plan: p, date, isToday, status };
    });
  }, [plannedWeek, weekStart, today, sessionsByDate]);

  // ─── Calendar 30 días ────────────────────────────────────────
  // 5 semanas terminando en la semana actual: 4 semanas previas + actual.
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const cells: CalendarCell[] = [];
    const gridStart = new Date(weekStart);
    gridStart.setDate(weekStart.getDate() - 7 * 4); // 4 semanas atrás
    for (let i = 0; i < 35; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const isToday = sameYMD(d, today);
      const inPast = d < today;
      const session = sessionsByDate.get(toISO(d));
      const plan = plannedWeek[dowMon0(d)];
      // Estimar %1RM histórico: usar rpe_reported (1-10) como proxy si no hay pct directo.
      const pctFromSession = session
        ? (session.rpe_reported >= 9 ? 0.93 : session.rpe_reported >= 8 ? 0.85 : session.rpe_reported >= 7 ? 0.78 : session.rpe_reported >= 5 ? 0.68 : session.rpe_reported >= 1 ? 0.55 : 0)
        : 0;
      const pctEffective = inPast
        ? pctFromSession
        : (plan ? plan.avgPct : 0);
      cells.push({
        date: d,
        inPast,
        isToday,
        load: session?.load ?? 0,
        rpe: session?.rpe_reported ?? 0,
        pct: pctEffective,
        completed: !!session?.completed,
        session,
        plannedType: plan?.type,
        plannedPct: plan?.avgPct,
      });
    }
    return cells;
  }, [weekStart, today, sessionsByDate, plannedWeek]);

  // ─── Acciones coach ──────────────────────────────────────────
  const sendComment = () => {
    if (!commentText.trim()) return;
    setCommentSent(true);
    setTimeout(() => {
      setCommentOpen(false);
      setCommentSent(false);
      setCommentText('');
    }, 1500);
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Sección 1 · HOY ───────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Hoy · {fmtDayLabel(today)}
          </p>
          <StatusBadge status={todayStatus} />
        </div>

        <div style={{
          background: 'var(--surface)',
          border: `1px solid ${todayStatus === 'completed' ? 'rgba(34,197,94,0.30)' : `${HO_GOLD}40`}`,
          borderRadius: 18,
          padding: 16,
          boxShadow: todayStatus === 'in_progress' ? `0 0 0 1px ${HO_GOLD}33, 0 6px 24px -10px ${HO_GOLD}55` : 'none',
        }}>
          {todayPlanned.type === 'descanso' ? (
            <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
              <p style={{ fontSize: 30, lineHeight: 1, marginBottom: 6 }}>🛌</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Día de descanso programado</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                {athlete.macrocycle.focus} · Sem {athlete.macrocycle.week}/{athlete.macrocycle.total_weeks}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', fontStyle: 'italic', letterSpacing: '-.01em' }}>
                  Sesión {todayPlanned.type}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>
                  Intensidad ~{Math.round(todayPlanned.avgPct * 100)}%
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayPlanned.exercises.map((ex, i) => {
                  const kg = round2_5(ex.max * ex.pct);
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'var(--bg)', borderRadius: 12, padding: '10px 12px',
                      border: '1px solid var(--card-border)',
                    }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{ex.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {ex.sets} × {ex.reps} @ {Math.round(ex.pct * 100)}%
                        </p>
                      </div>
                      <p style={{
                        fontSize: 15, fontWeight: 900, color: HO_GOLD,
                        letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums',
                      }}>
                        {kg}kg
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Sección 2 · ESTA SEMANA ──────────────────────────── */}
      <section>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Esta semana
        </p>

        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6,
          scrollbarWidth: 'none',
        }}>
          {weekDays.map((d, i) => {
            const isOpen = expandedDay === i;
            const { bg, border } = intensityColor(d.plan.avgPct, d.status === 'completed');
            return (
              <button
                key={i}
                onClick={() => setExpandedDay(isOpen ? -1 : i)}
                className="btn-press"
                style={{
                  flex: '0 0 auto', width: 58, padding: '10px 0', borderRadius: 14,
                  background: bg, border: `1px solid ${isOpen ? HO_GOLD : border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: d.isToday ? `inset 0 0 0 1px ${HO_GOLD}` : 'none',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '.06em' }}>
                  {d.plan.letter}
                </span>
                <MiniRing pct={d.plan.avgPct} status={d.status} />
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {d.date.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {expandedDay >= 0 && (
          <div style={{
            marginTop: 10, background: 'var(--surface)',
            border: '1px solid var(--card-border)', borderRadius: 14, padding: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', fontStyle: 'italic' }}>
                {weekDays[expandedDay].plan.label} · {weekDays[expandedDay].plan.type}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {weekDays[expandedDay].plan.avgPct > 0
                  ? `~${Math.round(weekDays[expandedDay].plan.avgPct * 100)}% 1RM`
                  : 'sin carga'}
              </p>
            </div>

            {weekDays[expandedDay].plan.exercises.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Descanso · recuperación activa opcional.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {weekDays[expandedDay].plan.exercises.map((ex, i) => {
                  const kg = round2_5(ex.max * ex.pct);
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 11,
                    }}>
                      <span style={{ color: 'var(--text)', fontWeight: 700 }}>{ex.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {ex.sets}×{ex.reps} · {kg}kg
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Sección 2.5 · FOCOS TÉCNICOS · SKILL TREE ────────── */}
      <SkillFocusAssign athlete={athlete} />

      {/* ── Sección 3 · CALENDAR 30 DÍAS ─────────────────────── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Mapa 30 días · intensidad
          </p>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600 }}>
            buscar carga para planificar
          </p>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 16, padding: 12,
        }}>
          {/* header L M X J V S D */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {DAY_LETTERS.map((d, i) => (
              <p key={i} style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center', letterSpacing: '.08em' }}>
                {d}
              </p>
            ))}
          </div>

          {/* grid 5×7 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {calendarCells.map((c, i) => {
              const isSel = selectedCell && sameYMD(selectedCell.date, c.date);
              const { bg, border } = intensityColor(c.pct, c.completed);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedCell(isSel ? null : c)}
                  className="btn-press"
                  style={{
                    aspectRatio: '1', borderRadius: 8,
                    background: bg,
                    border: `1px solid ${isSel ? HO_GOLD : (c.isToday ? `${HO_PURPLE}` : border)}`,
                    cursor: 'pointer', position: 'relative',
                    padding: 0, fontFamily: 'inherit',
                    opacity: !c.inPast && !c.isToday ? 0.6 : 1,
                  }}
                  aria-label={fmtDayLabel(c.date)}
                >
                  <span style={{
                    position: 'absolute', top: 2, left: 4,
                    fontSize: 8, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {c.date.getDate()}
                  </span>
                  {c.completed && (
                    <span style={{
                      position: 'absolute', bottom: 3, right: 3,
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#22C55E',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* leyenda */}
          <div style={{
            display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap',
            justifyContent: 'center', alignItems: 'center',
          }}>
            {[
              { label: 'descanso', pct: 0 },
              { label: 'liviano',  pct: 0.55 },
              { label: 'técnico',  pct: 0.70 },
              { label: 'fuerza',   pct: 0.85 },
              { label: 'max',      pct: 0.93 },
            ].map((leg, i) => {
              const { bg, border } = intensityColor(leg.pct, false);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 3,
                    background: bg, border: `1px solid ${border}`,
                  }} />
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600 }}>{leg.label}</span>
                </div>
              );
            })}
          </div>

          {/* detalle de celda seleccionada */}
          {selectedCell && (
            <div style={{
              marginTop: 10, padding: 10, borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--card-border)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', fontStyle: 'italic' }}>
                {fmtDayLabel(selectedCell.date)}
              </p>
              {selectedCell.inPast || selectedCell.isToday ? (
                selectedCell.session && selectedCell.session.load > 0 ? (
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    Load {selectedCell.load} · RPE {selectedCell.rpe}/10 · IMR ~{Math.round(selectedCell.pct * 100)}%
                    {selectedCell.completed ? ' · ✓ completada' : ' · pendiente'}
                  </p>
                ) : (
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {selectedCell.plannedType === 'descanso' ? 'Descanso programado' : 'Sin sesión registrada'}
                  </p>
                )
              ) : (
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  Plan: {intensityLabel(selectedCell.plannedPct ?? 0)}
                  {selectedCell.plannedPct && selectedCell.plannedPct > 0
                    ? ` · ~${Math.round(selectedCell.plannedPct * 100)}% 1RM`
                    : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Sección 3.5 · DOBLE SESIÓN ───────────────────────── */}
      <DoubleSessionPanel athlete={athlete} today={today} />

      {/* ── Sección 3.6 · EVALUACIÓN DE DESTREZA (coach califica skill tree) ── */}
      <SkillEvaluationPanel athlete={athlete} />

      {/* ── Sección 3.7 · ASIGNACIÓN MANUAL DEL DÍA ──────────── */}
      <ManualSessionAssigner athlete={athlete} />

      {/* ── Sección 4 · CTAs COACH ───────────────────────────── */}
      <section>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Acciones del coach
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('ASSIGN_MACRO')}
            className="btn-press"
            style={{
              flex: 1, padding: '12px 6px', borderRadius: 12,
              background: 'rgba(124,92,255,0.14)', color: HO_PURPLE,
              border: `1px solid ${HO_PURPLE}55`,
              fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Modificar sesión
          </button>

          <button
            onClick={() => setRestAssigned(v => !v)}
            className="btn-press"
            style={{
              flex: 1, padding: '12px 6px', borderRadius: 12,
              background: restAssigned ? 'rgba(34,197,94,0.18)' : 'var(--surface)',
              color: restAssigned ? '#4ade80' : 'var(--text)',
              border: `1px solid ${restAssigned ? 'rgba(34,197,94,0.45)' : 'var(--card-border)'}`,
              fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {restAssigned ? '✓ Descanso' : 'Asignar descanso'}
          </button>

          <button
            onClick={() => setCommentOpen(v => !v)}
            className="btn-press"
            style={{
              flex: 1, padding: '12px 6px', borderRadius: 12,
              background: `${HO_GOLD}22`, color: HO_GOLD,
              border: `1px solid ${HO_GOLD}55`,
              fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Comentar
          </button>
        </div>

        {commentOpen && (
          <div style={{
            marginTop: 10, background: 'var(--surface)', border: '1px solid var(--card-border)',
            borderRadius: 12, padding: 12,
          }}>
            {commentSent ? (
              <p style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, textAlign: 'center' }}>
                ✓ Comentario enviado a {athlete.name.split(' ')[0]}
              </p>
            ) : (
              <>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Mensaje rápido para ${athlete.name.split(' ')[0]}…`}
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--bg)', border: '1px solid var(--card-border)',
                    borderRadius: 10, color: 'var(--text)', fontSize: 12,
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={sendComment}
                  disabled={!commentText.trim()}
                  className="btn-press"
                  style={{
                    width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10,
                    background: commentText.trim() ? HO_GOLD : 'transparent',
                    color: commentText.trim() ? '#000' : 'var(--text-secondary)',
                    border: commentText.trim() ? 'none' : '1px solid var(--card-border)',
                    fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                    cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                  }}
                >
                  Enviar
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: DayStatus }> = ({ status }) => {
  const map: Record<DayStatus, { label: string; bg: string; fg: string; bd: string }> = {
    completed:   { label: '✓ Completado', bg: 'rgba(34,197,94,0.14)',  fg: '#4ade80', bd: 'rgba(34,197,94,0.35)' },
    in_progress: { label: '🏃 En curso',   bg: `${HO_GOLD}22`,           fg: HO_GOLD,   bd: `${HO_GOLD}55`         },
    future:      { label: '⏸ Pendiente',  bg: 'rgba(124,92,255,0.14)', fg: HO_PURPLE, bd: `${HO_PURPLE}55`        },
    rest:        { label: '🛌 Descanso',   bg: 'rgba(148,163,184,0.14)', fg: 'var(--text-secondary)', bd: 'var(--card-border)' },
    missed:      { label: '✕ Saltada',     bg: 'rgba(239,68,68,0.14)',  fg: '#f87171', bd: 'rgba(239,68,68,0.35)' },
  };
  const s = map[status];
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.08em',
      padding: '4px 10px', borderRadius: 10,
      background: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
    }}>{s.label}</span>
  );
};

const MiniRing: React.FC<{ pct: number; status: DayStatus }> = ({ pct, status }) => {
  const size = 22;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = c * (1 - Math.min(1, Math.max(0, pct)));
  const color =
    status === 'completed' ? '#22C55E'
    : status === 'in_progress' ? HO_GOLD
    : status === 'missed' ? '#EF4444'
    : status === 'rest' ? 'var(--text-secondary)'
    : HO_PURPLE;

  if (status === 'rest') {
    return (
      <span style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: 'var(--text-secondary)',
      }}>·</span>
    );
  }

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--card-border)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={filled}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      {pct > 0 && (
        <text
          x="50%" y="52%"
          dominantBaseline="middle" textAnchor="middle"
          fontSize="7" fontWeight={800} fill={color}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(pct * 100)}
        </text>
      )}
    </svg>
  );
};

// ──────────────────────────────────────────────────────────────────
// DoubleSessionPanel · coach asigna AM + PM para HOY
// Form básico: pre-fill plantilla HO (AM Snatch · PM Squat+Pull),
// el coach ajusta sólo % de 1RM. Expandir en el futuro para fecha
// arbitraria + ejercicios libres.
// ──────────────────────────────────────────────────────────────────

const DEFAULT_AM_PCT = 0.78;
const DEFAULT_PM_PCT = 0.80;

const buildDefaultAM = (dateISO: string, amPct: number): PlannedSession => ({
  date: dateISO,
  slot: 'am',
  focus: 'olympic',
  exercises: [
    { name: 'Arrancada',      sets: 5, reps: 2, pct: amPct,         max_key: 'snatch' },
    { name: 'Clean & Jerk',   sets: 4, reps: 2, pct: amPct - 0.03,  max_key: 'jerk'   },
  ],
});

const buildDefaultPM = (dateISO: string, pmPct: number): PlannedSession => ({
  date: dateISO,
  slot: 'pm',
  focus: 'strength',
  exercises: [
    { name: 'Sentadilla Atrás', sets: 5, reps: 3, pct: pmPct,         max_key: 'back_squat' },
    { name: 'Tirón Cargada',    sets: 4, reps: 3, pct: pmPct + 0.05,  max_key: 'clean'      },
  ],
});

const DoubleSessionPanel: React.FC<{ athlete: AthleteProfile; today: Date }> = ({ athlete, today }) => {
  const todayISO = toISO(today);
  const [existing, setExisting] = useState<PlannedSession[]>([]);
  const [open, setOpen] = useState(false);
  const [amPct, setAmPct] = useState<number>(DEFAULT_AM_PCT);
  const [pmPct, setPmPct] = useState<number>(DEFAULT_PM_PCT);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => setExisting(getSessionsForDate(athlete.id, todayISO));

  useEffect(() => {
    refresh();
    // refrescar tras cambios desde otra tab
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athlete.id, todayISO]);

  const hasDouble = existing.some(s => s.slot === 'am') && existing.some(s => s.slot === 'pm');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleAssign = () => {
    const am = buildDefaultAM(todayISO, amPct);
    const pm = buildDefaultPM(todayISO, pmPct);
    // Limpiar cualquier 'full' previo del día para evitar conflictos.
    clearDate(athlete.id, todayISO);
    upsertPlannedSession(athlete.id, am);
    upsertPlannedSession(athlete.id, pm);
    refresh();
    setOpen(false);
    showToast(`Doble sesión asignada para ${athlete.name.split(' ')[0]}`);
  };

  const handleRemove = () => {
    clearDate(athlete.id, todayISO);
    refresh();
    showToast('Doble sesión removida');
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          Doble sesión · hoy
        </p>
        {hasDouble && (
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '.08em',
            padding: '3px 8px', borderRadius: 8,
            background: `${HO_GOLD}22`, color: HO_GOLD, border: `1px solid ${HO_GOLD}55`,
          }}>AM + PM</span>
        )}
      </div>

      {hasDouble ? (
        <div style={{
          background: 'var(--surface)', border: `1px solid ${HO_GOLD}40`,
          borderRadius: 14, padding: 12,
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {existing.map(s => (
              <div key={s.slot} style={{
                flex: 1, background: 'var(--bg)', border: '1px solid var(--card-border)',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: HO_GOLD, letterSpacing: '.1em' }}>
                  {s.slot.toUpperCase()} · {s.focus}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                  {s.exercises.length} ejerc · ~{Math.round((s.exercises.reduce((a,e)=>a+e.pct,0) / Math.max(1,s.exercises.length)) * 100)}%
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={handleRemove}
            className="btn-press"
            style={{
              width: '100%', padding: '10px 0', borderRadius: 10,
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--card-border)',
              fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Quitar doble sesión</button>
        </div>
      ) : open ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 14, padding: 12,
        }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 10, fontStyle: 'italic' }}>
            Form básico · plantilla HO (AM Snatch + C&amp;J · PM Squat + Pull). Expandir en el futuro.
          </p>

          <SlotIntensityRow label="AM · Olympic" pct={amPct} onChange={setAmPct} />
          <SlotIntensityRow label="PM · Strength" pct={pmPct} onChange={setPmPct} />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setOpen(false)}
              className="btn-press"
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'transparent', color: 'var(--text-secondary)',
                border: '1px solid var(--card-border)',
                fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Cancelar</button>
            <button
              onClick={handleAssign}
              className="btn-press"
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: HO_GOLD, color: '#000', border: 'none',
                fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Asignar</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn-press"
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12,
            background: `${HO_GOLD}14`, color: HO_GOLD,
            border: `1px dashed ${HO_GOLD}55`,
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
          }}
        >+ Asignar doble sesión hoy</button>
      )}

      {toast && (
        <p style={{
          marginTop: 8, fontSize: 11, fontWeight: 700, textAlign: 'center',
          color: '#4ade80',
        }}>✓ {toast}</p>
      )}
    </section>
  );
};

const SlotIntensityRow: React.FC<{ label: string; pct: number; onChange: (v: number) => void }> = ({ label, pct, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: HO_GOLD, fontVariantNumeric: 'tabular-nums' }}>
        ~{Math.round(pct * 100)}%
      </span>
    </div>
    <input
      type="range"
      min={60}
      max={95}
      step={1}
      value={Math.round(pct * 100)}
      onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
      style={{ width: '100%', accentColor: HO_GOLD }}
    />
  </div>
);

export default AthleteTrainingView;

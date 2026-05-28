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
import CustomWodAssigner from './CustomWodAssigner';
import SessionHistoryList from './SessionHistoryList';
import { PlateBadge, type PlateTier } from './PlateBadge';
import '../styles/v2/athlete-training-view.css';

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

// Intensity → V2 token-driven heatmap color. Drives the 30d map cells and
// week-strip ring background. Colors come from engine/tier tokens (no hardcodes).
const intensityColor = (pct: number, completed: boolean): { bg: string; border: string } => {
  void completed; // 'completed' no cambia el color base; un dot extra lo marca abajo
  if (pct <= 0)   return { bg: 'var(--surface-2)', border: 'var(--border-soft)' };
  if (pct < 0.6)  return { bg: 'color-mix(in oklab, var(--text-lo) 22%, transparent)',     border: 'color-mix(in oklab, var(--text-lo) 40%, transparent)' };
  if (pct < 0.75) return { bg: 'color-mix(in oklab, var(--engine-oly) 24%, transparent)',  border: 'color-mix(in oklab, var(--engine-oly) 48%, transparent)' };
  if (pct < 0.9)  return { bg: 'color-mix(in oklab, var(--engine-belt) 26%, transparent)', border: 'color-mix(in oklab, var(--engine-belt) 52%, transparent)' };
  return            { bg: 'color-mix(in oklab, var(--engine-pulse) 30%, transparent)',     border: 'color-mix(in oklab, var(--engine-pulse) 56%, transparent)' };
};

const intensityLabel = (pct: number) => {
  if (pct <= 0) return 'descanso';
  if (pct < 0.6)  return 'liviano';
  if (pct < 0.75) return 'técnico';
  if (pct < 0.9)  return 'fuerza';
  return 'max';
};

// Intensity → halterofilia plate tier (PlateBadge). Used as the visual
// intensity marker on today's session header.
const intensityTier = (pct: number): PlateTier => {
  if (pct <= 0)   return 'white';
  if (pct < 0.6)  return 'green';
  if (pct < 0.75) return 'yellow';
  if (pct < 0.9)  return 'blue';
  return 'red';
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
    <div className="atv-root">

      {/* ── Sección 1 · HOY ───────────────────────────────────── */}
      <section className="atv-section atv-today">
        <div className="atv-head">
          <span className="atv-eyebrow">
            <span className="pip" />Hoy · {fmtDayLabel(today)}
          </span>
          <StatusBadge status={todayStatus} />
        </div>

        <div className={`atv-card atv-today${todayStatus === 'completed' ? ' is-completed' : ''}${todayStatus === 'in_progress' ? ' is-progress' : ''}`}>
          <span className="br br-tl" /><span className="br br-tr" />
          {todayPlanned.type === 'descanso' ? (
            <div className="atv-rest">
              <span className="icon">🛌</span>
              <p className="atv-rest-title">Día de descanso programado</p>
              <p className="atv-rest-sub">
                {athlete.macrocycle.focus} · Sem {athlete.macrocycle.week}/{athlete.macrocycle.total_weeks}
              </p>
            </div>
          ) : (
            <>
              <div className="atv-today-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PlateBadge tier={intensityTier(todayPlanned.avgPct)} size={34} />
                  <p className="atv-today-title">Sesión {todayPlanned.type}</p>
                </div>
                <p className="atv-today-int">~{Math.round(todayPlanned.avgPct * 100)}% 1RM</p>
              </div>

              <div className="atv-ex-list">
                {todayPlanned.exercises.map((ex, i) => {
                  const kg = round2_5(ex.max * ex.pct);
                  return (
                    <div key={i} className="atv-ex">
                      <div>
                        <p className="atv-ex-name">{ex.name}</p>
                        <p className="atv-ex-scheme">
                          {ex.sets} × {ex.reps} @ {Math.round(ex.pct * 100)}%
                        </p>
                      </div>
                      <p className="atv-ex-kg">{kg}kg</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Sección 2 · ESTA SEMANA ──────────────────────────── */}
      <section className="atv-section atv-week">
        <div className="atv-head">
          <span className="atv-eyebrow"><span className="pip" />Esta semana</span>
        </div>

        <div className="atv-week-strip scroll-x-no-bar">
          {weekDays.map((d, i) => {
            const isOpen = expandedDay === i;
            const { bg, border } = intensityColor(d.plan.avgPct, d.status === 'completed');
            return (
              <button
                key={i}
                onClick={() => setExpandedDay(isOpen ? -1 : i)}
                className="atv-day btn-press"
                data-open={isOpen}
                data-today={d.isToday}
                style={{ ['--db' as string]: border, background: bg }}
              >
                <span className="atv-day-letter">{d.plan.letter}</span>
                <MiniRing pct={d.plan.avgPct} status={d.status} />
                <span className="atv-day-num">{d.date.getDate()}</span>
              </button>
            );
          })}
        </div>

        {expandedDay >= 0 && (
          <div className="atv-day-detail">
            <div className="atv-day-detail-head">
              <p className="atv-day-detail-title">
                {weekDays[expandedDay].plan.label} · {weekDays[expandedDay].plan.type}
              </p>
              <p className="atv-day-detail-int">
                {weekDays[expandedDay].plan.avgPct > 0
                  ? `~${Math.round(weekDays[expandedDay].plan.avgPct * 100)}% 1RM`
                  : 'sin carga'}
              </p>
            </div>

            {weekDays[expandedDay].plan.exercises.length === 0 ? (
              <p className="atv-day-detail-empty">Descanso · recuperación activa opcional.</p>
            ) : (
              <div className="atv-day-detail-list">
                {weekDays[expandedDay].plan.exercises.map((ex, i) => {
                  const kg = round2_5(ex.max * ex.pct);
                  return (
                    <div key={i} className="atv-day-detail-row">
                      <span className="nm">{ex.name}</span>
                      <span className="vl">{ex.sets}×{ex.reps} · {kg}kg</span>
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
      <section className="atv-section atv-map">
        <div className="atv-head">
          <span className="atv-eyebrow"><span className="pip" />Mapa 30 días · intensidad</span>
          <span className="atv-meta">buscar carga para planificar</span>
        </div>

        <div className="atv-card">
          <span className="br br-tl" /><span className="br br-tr" />
          {/* header L M X J V S D */}
          <div className="atv-map-grid-head">
            {DAY_LETTERS.map((d, i) => (
              <p key={i} className="atv-map-dow">{d}</p>
            ))}
          </div>

          {/* grid 5×7 */}
          <div className="atv-map-grid">
            {calendarCells.map((c, i) => {
              const isSel = !!(selectedCell && sameYMD(selectedCell.date, c.date));
              const { bg, border } = intensityColor(c.pct, c.completed);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedCell(isSel ? null : c)}
                  className="atv-cell btn-press"
                  data-selected={isSel}
                  data-today={c.isToday}
                  data-future={!c.inPast && !c.isToday}
                  style={{ ['--cbg' as string]: bg, ['--cb' as string]: border }}
                  aria-label={fmtDayLabel(c.date)}
                >
                  <span className="atv-cell-num">{c.date.getDate()}</span>
                  {c.completed && <span className="atv-cell-done" />}
                </button>
              );
            })}
          </div>

          {/* leyenda */}
          <div className="atv-legend">
            {[
              { label: 'descanso', pct: 0 },
              { label: 'liviano',  pct: 0.55 },
              { label: 'técnico',  pct: 0.70 },
              { label: 'fuerza',   pct: 0.85 },
              { label: 'max',      pct: 0.93 },
            ].map((leg, i) => {
              const { bg, border } = intensityColor(leg.pct, false);
              return (
                <div key={i} className="atv-legend-item">
                  <span className="atv-legend-swatch" style={{ ['--lbg' as string]: bg, ['--lb' as string]: border }} />
                  <span className="atv-legend-label">{leg.label}</span>
                </div>
              );
            })}
          </div>

          {/* detalle de celda seleccionada */}
          {selectedCell && (
            <div className="atv-cell-detail">
              <p className="atv-cell-detail-title">{fmtDayLabel(selectedCell.date)}</p>
              {selectedCell.inPast || selectedCell.isToday ? (
                selectedCell.session && selectedCell.session.load > 0 ? (
                  <p className="atv-cell-detail-meta">
                    Load {selectedCell.load} · RPE {selectedCell.rpe}/10 · IMR ~{Math.round(selectedCell.pct * 100)}%
                    {selectedCell.completed ? ' · ✓ completada' : ' · pendiente'}
                  </p>
                ) : (
                  <p className="atv-cell-detail-meta">
                    {selectedCell.plannedType === 'descanso' ? 'Descanso programado' : 'Sin sesión registrada'}
                  </p>
                )
              ) : (
                <p className="atv-cell-detail-meta">
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

      {/* ── Sección 3.8 · TIER COMPETIDOR · VOLTA (promote + custom WOD) ── */}
      <CustomWodAssigner athlete={athlete} />

      {/* ── Sección 3.9 · HISTORIAL DE SESIONES (detalle cronológico) ── */}
      <SessionHistoryList athlete={athlete} />

      {/* ── Sección 4 · CTAs COACH ───────────────────────────── */}
      <section className="atv-section atv-actions">
        <div className="atv-head">
          <span className="atv-eyebrow"><span className="pip" />Acciones del coach</span>
        </div>

        <div className="atv-cta-row">
          <button
            onClick={() => navigate('ASSIGN_MACRO')}
            className="atv-cta atv-cta-violet btn-press"
          >
            Modificar sesión
          </button>

          <button
            onClick={() => setRestAssigned(v => !v)}
            className={`atv-cta btn-press ${restAssigned ? 'atv-cta-on' : 'atv-cta-neutral'}`}
          >
            {restAssigned ? '✓ Descanso' : 'Asignar descanso'}
          </button>

          <button
            onClick={() => setCommentOpen(v => !v)}
            className="atv-cta atv-cta-belt btn-press"
          >
            Comentar
          </button>
        </div>

        {commentOpen && (
          <div className="atv-comment">
            {commentSent ? (
              <p className="atv-comment-sent">
                ✓ Comentario enviado a {athlete.name.split(' ')[0]}
              </p>
            ) : (
              <>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Mensaje rápido para ${athlete.name.split(' ')[0]}…`}
                  autoFocus
                  className="atv-input"
                />
                <button
                  onClick={sendComment}
                  disabled={!commentText.trim()}
                  className="atv-send btn-press"
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
  const map: Record<DayStatus, { label: string; color: string }> = {
    completed:   { label: 'Completado', color: 'var(--engine-oly)' },
    in_progress: { label: 'En curso',   color: 'var(--engine-belt)' },
    future:      { label: 'Pendiente',  color: 'var(--engine-adapt)' },
    rest:        { label: 'Descanso',   color: 'var(--text-mid)' },
    missed:      { label: 'Saltada',    color: 'var(--engine-pulse)' },
  };
  const s = map[status];
  return (
    <span className="atv-badge" style={{ ['--bc' as string]: s.color }}>
      <span className="dot" />{s.label}
    </span>
  );
};

const MiniRing: React.FC<{ pct: number; status: DayStatus }> = ({ pct, status }) => {
  const size = 22;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = c * (1 - Math.min(1, Math.max(0, pct)));
  const color =
    status === 'completed' ? 'var(--engine-oly)'
    : status === 'in_progress' ? 'var(--engine-belt)'
    : status === 'missed' ? 'var(--engine-pulse)'
    : status === 'rest' ? 'var(--text-mid)'
    : 'var(--engine-adapt)';

  if (status === 'rest') {
    return (
      <span style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: 'var(--text-mid)',
      }}>·</span>
    );
  }

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-soft)" strokeWidth={stroke} />
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
          style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}
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
    <section className="atv-section atv-double">
      <div className="atv-head">
        <span className="atv-eyebrow"><span className="pip" />Doble sesión · hoy</span>
        {hasDouble && (
          <span className="atv-badge" style={{ ['--bc' as string]: 'var(--engine-belt)' }}>
            <span className="dot" />AM + PM
          </span>
        )}
      </div>

      {hasDouble ? (
        <div className="atv-card">
          <span className="br br-tl" /><span className="br br-tr" />
          <div className="atv-double-slots">
            {existing.map(s => (
              <div key={s.slot} className="atv-slot">
                <p className="atv-slot-tag">{s.slot.toUpperCase()} · {s.focus}</p>
                <p className="atv-slot-meta">
                  {s.exercises.length} ejerc · ~{Math.round((s.exercises.reduce((a,e)=>a+e.pct,0) / Math.max(1,s.exercises.length)) * 100)}%
                </p>
              </div>
            ))}
          </div>
          <button onClick={handleRemove} className="atv-ghost-btn btn-press">
            Quitar doble sesión
          </button>
        </div>
      ) : open ? (
        <div className="atv-card">
          <span className="br br-tl" /><span className="br br-tr" />
          <p className="atv-double-hint">
            Form básico · plantilla HO (AM Snatch + C&amp;J · PM Squat + Pull). Expandir en el futuro.
          </p>

          <SlotIntensityRow label="AM · Olympic" pct={amPct} onChange={setAmPct} />
          <SlotIntensityRow label="PM · Strength" pct={pmPct} onChange={setPmPct} />

          <div className="atv-btn-pair">
            <button onClick={() => setOpen(false)} className="atv-ghost-btn btn-press">
              Cancelar
            </button>
            <button onClick={handleAssign} className="atv-confirm-btn btn-press">
              Asignar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="atv-add-btn btn-press">
          + Asignar doble sesión hoy
        </button>
      )}

      {toast && <p className="atv-toast">✓ {toast}</p>}
    </section>
  );
};

const SlotIntensityRow: React.FC<{ label: string; pct: number; onChange: (v: number) => void }> = ({ label, pct, onChange }) => (
  <div className="atv-slider-row">
    <div className="atv-slider-head">
      <span className="atv-slider-label">{label}</span>
      <span className="atv-slider-val">~{Math.round(pct * 100)}%</span>
    </div>
    <input
      type="range"
      min={60}
      max={95}
      step={1}
      value={Math.round(pct * 100)}
      onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
      className="atv-slider"
    />
  </div>
);

export default AthleteTrainingView;

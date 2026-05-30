import React, { useMemo, useState, useEffect } from 'react';
import { useAthlete } from '../context/AthleteContext';
import {
  generateMacroPlan,
  prescribedWeight,
  anchorDayIndex,
  type MacroPlan,
} from '../lib/macroPlan';

/**
 * MacrocycleExplorer · carta del entrenamiento del día con flechas ◀▶ para
 * recorrer el macrociclo (pasado ↔ futuro) + curva de intensidad con un punto
 * marcando la semana actual.
 *
 * Datos: plan periodizado generado de `athlete.macrocycle` (programa, semanas,
 * focus) + pesos calculados con `athlete.maxes`. Ver lib/macroPlan.ts.
 */

const GOLD = '#F5C518';
const GREEN = '#22C55E';

type Status = 'done' | 'today' | 'future';
const STATUS_META: Record<Status, { label: string; color: string }> = {
  done: { label: '✓ Completado', color: GREEN },
  today: { label: '▶ Hoy', color: GOLD },
  future: { label: '○ Por venir', color: 'var(--text-secondary)' },
};

const IntensityCurve: React.FC<{ plan: MacroPlan; currentWeek: number }> = ({ plan, currentWeek }) => {
  const W = 300, H = 66, pad = 8;
  const data = plan.weekIntensity;
  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (w: number) => (n <= 1 ? W / 2 : pad + ((w - 1) / (n - 1)) * (W - 2 * pad));
  const y = (v: number) => (H - pad) - ((v - min) / span) * (H - 2 * pad);
  const points = data.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Intensidad del macro
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          Sem {currentWeek} · {Math.round((data[currentWeek - 1] ?? 0) * 100)}% media
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline
          points={points}
          fill="none"
          stroke="rgba(245,197,24,0.35)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((v, i) => {
          const isCurrent = i + 1 === currentWeek;
          return (
            <circle
              key={i}
              cx={x(i + 1)}
              cy={y(v)}
              r={isCurrent ? 4 : 2}
              fill={isCurrent ? GOLD : 'rgba(255,255,255,0.25)'}
              stroke={isCurrent ? GOLD : 'none'}
              strokeWidth={isCurrent ? 2 : 0}
              style={isCurrent ? { filter: `drop-shadow(0 0 4px ${GOLD})` } : undefined}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>S1</span>
        <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>S{n}</span>
      </div>
    </div>
  );
};

const MacrocycleExplorer: React.FC = () => {
  const { athlete } = useAthlete();

  const macro = athlete?.macrocycle;
  const plan = useMemo<MacroPlan | null>(() => {
    if (!macro) return null;
    return generateMacroPlan({
      programName: macro.program_name,
      focus: macro.focus,
      totalWeeks: macro.total_weeks,
      sessionsPerWeek: 4,
    });
  }, [macro?.program_name, macro?.focus, macro?.total_weeks]);

  const anchor = useMemo(
    () => (plan && macro ? anchorDayIndex(plan, macro.week, macro.day) : 0),
    [plan, macro?.week, macro?.day],
  );

  const [current, setCurrent] = useState(anchor);
  // Si cambia el plan/anchor (cambió de atleta o macro), reposicionar en "hoy".
  useEffect(() => { setCurrent(anchor); }, [anchor]);

  if (!plan || !macro || !athlete) return null;

  const day = plan.days[current];
  if (!day) return null;

  const status: Status = current < anchor ? 'done' : current === anchor ? 'today' : 'future';
  const meta = STATUS_META[status];
  const maxes = athlete.maxes;

  const go = (delta: number) =>
    setCurrent((i) => Math.max(0, Math.min(plan.days.length - 1, i + delta)));
  const atStart = current === 0;
  const atEnd = current === plan.days.length - 1;

  const ArrowBtn: React.FC<{ dir: -1 | 1; disabled: boolean }> = ({ dir, disabled }) => (
    <button
      onClick={() => go(dir)}
      disabled={disabled}
      aria-label={dir === -1 ? 'Día anterior' : 'Día siguiente'}
      style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        color: disabled ? 'var(--card-border)' : 'var(--text)',
        fontSize: 18, fontWeight: 800, lineHeight: 1,
        cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
        opacity: disabled ? 0.4 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {dir === -1 ? '‹' : '›'}
    </button>
  );

  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
        Mi Macrociclo
      </p>

      {/* Header · flechas + semana */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <ArrowBtn dir={-1} disabled={atStart} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', margin: 0 }}>
            Semana {day.week} / {plan.totalWeeks}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, marginTop: 1 }}>
            {plan.programName} · {day.dayLabel}
          </p>
        </div>
        <ArrowBtn dir={1} disabled={atEnd} />
      </div>

      {/* Carta del día */}
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${status === 'today' ? `${GOLD}55` : 'var(--card-border)'}`,
        borderRadius: 16, padding: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{day.theme}</p>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '.04em',
            color: meta.color, padding: '3px 8px', borderRadius: 6,
            background: status === 'future' ? 'transparent' : `${meta.color}1a`,
            border: `1px solid ${status === 'future' ? 'var(--card-border)' : `${meta.color}40`}`,
            whiteSpace: 'nowrap',
          }}>{meta.label}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {day.exercises.map((ex, i) => {
            const w = prescribedWeight(ex, maxes);
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 10,
                background: 'var(--bg)', border: '1px solid var(--card-border)',
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{ex.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, marginTop: 1 }}>
                    {ex.sets} × {ex.reps}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {w != null ? (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 900, color: GOLD, margin: 0 }}>{w} kg</p>
                      <p style={{ fontSize: 9, color: 'var(--text-secondary)', margin: 0 }}>
                        {Math.round(ex.intensity * 100)}% · RPE {ex.rpe}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                      RPE {ex.rpe}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Curva del macro */}
        <IntensityCurve plan={plan} currentWeek={day.week} />
      </div>
    </div>
  );
};

export default MacrocycleExplorer;

import React, { useMemo, useState, useEffect } from 'react';
import { useAthlete } from '../context/AthleteContext';
import {
  generateMacroPlan,
  prescribedWeight,
  anchorDayIndex,
  type MacroPlan,
} from '../lib/macroPlan';
import PlateIcon, { type PlateWeight } from './PlateIcon';
import '../styles/peakqual/tokens.css';

/**
 * MacrocycleExplorer · "sesión de hoy" navegable, con el diseño Peak Qual (discos).
 * Carta del entrenamiento del día (movimientos · %RM · peso + iconos HOLY OLY) +
 * flechas ◀▶ para recorrer el macro (pasado↔futuro) + indicador de semana +
 * curva de intensidad con punto en la semana actual.
 *
 * Estilo scopeado a .pq (tokens Peak Qual). Data real de useAthlete + placeholder
 * honesto donde falte historial. Iconos de disco = componente PlateIcon (nuevo estilo).
 */

const CYAN = 'var(--engine-stress)';   // #00E5FF
const AMBER = 'var(--engine-macro)';   // #FFB300
const GREEN = 'var(--engine-oly)';     // #22C55E

const TIER_KG: Array<[number, string]> = [[25, '4'], [20, '3'], [15, '2'], [10, '1']];
const TIER_WEIGHT: Record<string, PlateWeight> = { '1': 10, '2': 15, '3': 20, '4': 25 };
function platesForWeight(w: number): string[] {
  if (!w || w <= 20) return [];
  let perSide = (w - 20) / 2;
  const out: string[] = [];
  for (const [kg, tier] of TIER_KG) {
    while (perSide >= kg - 0.01 && out.length < 4) { out.push(tier); perSide -= kg; }
  }
  return out.reverse();
}

type Status = 'done' | 'today' | 'future';
const STATUS_META: Record<Status, { label: string; color: string }> = {
  done: { label: '✓ COMPLETADO', color: GREEN },
  today: { label: '▶ HOY', color: CYAN },
  future: { label: '○ POR VENIR', color: 'var(--text-lo)' },
};

const IntensityCurve: React.FC<{ plan: MacroPlan; currentWeek: number }> = ({ plan, currentWeek }) => {
  const W = 300, H = 60, pad = 8;
  const data = plan.weekIntensity;
  const n = data.length;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const x = (w: number) => (n <= 1 ? W / 2 : pad + ((w - 1) / (n - 1)) * (W - 2 * pad));
  const y = (v: number) => (H - pad) - ((v - min) / span) * (H - 2 * pad);
  const points = data.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>
          Intensidad del macro
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mid)' }}>
          Sem {currentWeek} · {Math.round((data[currentWeek - 1] ?? 0) * 100)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline points={points} fill="none" stroke={CYAN} strokeOpacity={0.45} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {data.map((v, i) => {
          const cur = i + 1 === currentWeek;
          return <circle key={i} cx={x(i + 1)} cy={y(v)} r={cur ? 4 : 2} fill={cur ? AMBER : 'rgba(255,255,255,.25)'} style={cur ? { filter: `drop-shadow(0 0 5px ${AMBER})` } : undefined} />;
        })}
      </svg>
    </div>
  );
};

const MacrocycleExplorer: React.FC = () => {
  const { athlete } = useAthlete();
  const macro = athlete?.macrocycle;
  const plan = useMemo<MacroPlan | null>(
    () => (macro ? generateMacroPlan({ programName: macro.program_name, focus: macro.focus, totalWeeks: macro.total_weeks, sessionsPerWeek: 4 }) : null),
    [macro?.program_name, macro?.focus, macro?.total_weeks],
  );
  const anchor = useMemo(() => (plan && macro ? anchorDayIndex(plan, macro.week, macro.day) : 0), [plan, macro?.week, macro?.day]);
  const [current, setCurrent] = useState(anchor);
  useEffect(() => { setCurrent(anchor); }, [anchor]);

  if (!plan || !macro || !athlete) return null;
  const day = plan.days[current];
  if (!day) return null;

  const status: Status = current < anchor ? 'done' : current === anchor ? 'today' : 'future';
  const meta = STATUS_META[status];
  const maxes = athlete.maxes;
  const go = (d: number) => setCurrent((i) => Math.max(0, Math.min(plan.days.length - 1, i + d)));
  const atStart = current === 0, atEnd = current === plan.days.length - 1;

  const Arrow: React.FC<{ dir: -1 | 1; disabled: boolean }> = ({ dir, disabled }) => (
    <button onClick={() => go(dir)} disabled={disabled}
      aria-label={dir === -1 ? 'Día anterior' : 'Día siguiente'}
      style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
        color: disabled ? 'var(--text-lo)' : CYAN, fontSize: 20, fontWeight: 700, lineHeight: 1,
        cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-display)',
        opacity: disabled ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{dir === -1 ? '‹' : '›'}</button>
  );

  return (
    <div className="pq">
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--text-lo)', margin: '0 0 8px' }}>
        Sesión de hoy · macrociclo
      </p>

      {/* Header · flechas + semana */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Arrow dir={-1} disabled={atStart} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-hi)', margin: 0, letterSpacing: '-.01em' }}>
            SEMANA {day.week} / {plan.totalWeeks}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mid)', margin: '1px 0 0', letterSpacing: '.04em' }}>
            {macro.program_name} · {day.dayLabel}
          </p>
        </div>
        <Arrow dir={1} disabled={atEnd} />
      </div>

      {/* Carta del día */}
      <div style={{
        background: 'var(--surface-1)',
        border: `1px solid ${status === 'today' ? 'var(--border-hard)' : 'var(--border-soft)'}`,
        borderRadius: 14, padding: 14,
        boxShadow: status === 'today' ? 'var(--glow-cyan)' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)', margin: 0, textTransform: 'uppercase', letterSpacing: '.01em' }}>{day.theme}</p>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.06em',
            color: meta.color, padding: '3px 8px', borderRadius: 4,
            background: status === 'future' ? 'transparent' : `color-mix(in oklab, ${meta.color} 14%, transparent)`,
            border: `1px solid ${status === 'future' ? 'var(--border-soft)' : `color-mix(in oklab, ${meta.color} 45%, transparent)`}`,
            whiteSpace: 'nowrap',
          }}>{meta.label}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {day.exercises.map((ex, i) => {
            const w = prescribedWeight(ex, maxes);
            const tiers = w != null ? platesForWeight(w) : [];
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 8,
                background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-hi)', margin: 0, textTransform: 'uppercase', letterSpacing: '.01em' }}>{ex.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mid)', margin: '1px 0 0' }}>{ex.sets} × {ex.reps}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tiers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }} aria-hidden="true">
                      {tiers.map((t, j) => <PlateIcon key={j} weight={TIER_WEIGHT[t]} view="flat" size="S" />)}
                    </div>
                  )}
                  <div style={{ textAlign: 'right', minWidth: 56 }}>
                    {w != null ? (
                      <>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>{w}<span style={{ fontSize: 9, color: 'var(--text-mid)', marginLeft: 1 }}>kg</span></p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: AMBER, margin: 0 }}>{Math.round(ex.intensity * 100)}%</p>
                      </>
                    ) : (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-mid)', margin: 0 }}>RPE {ex.rpe}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <IntensityCurve plan={plan} currentWeek={day.week} />
      </div>
    </div>
  );
};

export default MacrocycleExplorer;

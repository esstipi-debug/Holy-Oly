import React, { useMemo, useState } from 'react';
import BottomSheet from '../BottomSheet';
import { imrBandSeries } from '../../data/imrBand';
import { imrInsight, SEVERITY_COLOR } from '../../data/insight';

/**
 * ImrBandChart · gráfico estrella del coach (spec §4.1①): IMR real por semana vs
 * banda esperada de la fase + lectura automática (1 línea + drawer).
 * Render SVG: banda sombreada por fase · línea + área del IMR real · dots por
 * estado · semana actual con glow.
 */
interface Props { athleteId: string; programId: string | null; currentWeek: number; }

const W = 300, H = 120, PAD = 6;
const yScale = (v: number) => PAD + (1 - (Math.max(40, Math.min(102, v)) - 40) / 62) * (H - PAD * 2);
const dotColor = (real: number, lo: number, hi: number, current: boolean) =>
  current ? 'var(--engine-stress)' : real > hi ? '#EF4444' : real < lo ? '#F59E0B' : '#22C55E';

const ImrBandChart: React.FC<Props> = ({ athleteId, programId, currentWeek }) => {
  const series = useMemo(() => imrBandSeries(athleteId, programId, currentWeek), [athleteId, programId, currentWeek]);
  const [open, setOpen] = useState(false);

  const cur = series.find(s => s.current) ?? series[series.length - 1];
  const insight = cur ? imrInsight(cur.real, cur.lo, cur.hi, cur.phase) : null;
  const color = insight ? SEVERITY_COLOR[insight.severity] : 'var(--text-secondary)';

  const n = Math.max(1, series.length);
  const cell = (W - PAD * 2) / n;
  const xOf = (i: number) => PAD + cell * i + cell / 2;
  const linePts = series.map((s, i) => `${xOf(i).toFixed(1)},${yScale(s.real).toFixed(1)}`).join(' ');
  const areaPts = `${PAD.toFixed(1)},${(H - PAD).toFixed(1)} ${linePts} ${(W - PAD).toFixed(1)},${(H - PAD).toFixed(1)}`;

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>IMR vs banda de fase</h3>
        <span className="meta">tap para detalle</span>
      </div>
      <div className="add-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="120" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="imrArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--engine-stress)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--engine-stress)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* gridlines de referencia (60/75/90%) */}
          {[90, 75, 60].map(g => (
            <line key={g} x1={PAD} x2={W - PAD} y1={yScale(g)} y2={yScale(g)}
              stroke="var(--card-border)" strokeWidth="0.5" strokeDasharray="2 4" />
          ))}

          {/* banda esperada de la fase (zona sombreada por semana) */}
          {series.map((s, i) => (
            <rect key={`b${s.week}`} x={PAD + cell * i + 0.5} width={Math.max(1, cell - 1)}
              y={yScale(s.hi)} height={Math.max(1.5, yScale(s.lo) - yScale(s.hi))}
              fill="color-mix(in oklab, var(--engine-oly) 15%, transparent)" rx="2" />
          ))}

          {/* highlight de la semana actual */}
          {series.map((s, i) => s.current ? (
            <rect key={`c${s.week}`} x={PAD + cell * i} width={cell} y={PAD} height={H - PAD * 2}
              fill="color-mix(in oklab, var(--engine-stress) 9%, transparent)" rx="2" />
          ) : null)}

          {/* área + línea del IMR real */}
          <polygon points={areaPts} fill="url(#imrArea)" />
          <polyline points={linePts} fill="none" stroke="var(--engine-stress)" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />

          {/* dots por estado */}
          {series.map((s, i) => (
            <circle key={`d${s.week}`} cx={xOf(i)} cy={yScale(s.real)} r={s.current ? 4 : 2.4}
              fill={dotColor(s.real, s.lo, s.hi, s.current)} stroke="var(--surface)" strokeWidth="1"
              style={s.current ? { filter: 'drop-shadow(0 0 4px var(--engine-stress))' } : undefined} />
          ))}
        </svg>

        <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 9, color: 'var(--text-secondary)' }}>
          <span><span style={{ color: 'var(--engine-stress)' }}>●</span> IMR real</span>
          <span><span style={{ color: 'var(--engine-oly)' }}>▬</span> banda esperada</span>
          <span style={{ marginLeft: 'auto' }}>S1 → S{series.length}</span>
        </div>

        {insight && (
          <p style={{ fontSize: 11, lineHeight: 1.4, marginTop: 8, color, fontWeight: 600 }}>
            <span style={{ color: '#F5C518' }}>✦ </span>{insight.text}
          </p>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="IMR vs banda · por semana">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {series.map(s => {
            const ins = imrInsight(s.real, s.lo, s.hi, s.phase);
            return (
              <div key={s.week} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: s.current ? 'color-mix(in oklab, var(--engine-stress) 14%, transparent)' : 'var(--surface)', border: '1px solid var(--card-border)' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>Sem {s.week} · {s.phase}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Esperado {s.lo}-{s.hi}% · plan {s.planned}%</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: SEVERITY_COLOR[ins.severity] }}>{s.real}%</span>
              </div>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};

export default ImrBandChart;

import React, { useMemo, useState } from 'react';
import BottomSheet from '../BottomSheet';
import { imrBandSeries } from '../../data/imrBand';
import { imrInsight, SEVERITY_COLOR } from '../../data/insight';

/**
 * ImrBandChart · gráfico estrella del coach (spec §4.1①): IMR real por semana vs
 * banda esperada de la fase (sombreada) + lectura automática (1 línea + drawer).
 */
interface Props { athleteId: string; programId: string | null; currentWeek: number; }

const ImrBandChart: React.FC<Props> = ({ athleteId, programId, currentWeek }) => {
  const series = useMemo(() => imrBandSeries(athleteId, programId, currentWeek), [athleteId, programId, currentWeek]);
  const [open, setOpen] = useState(false);

  const cur = series.find(s => s.current) ?? series[series.length - 1];
  const insight = cur ? imrInsight(cur.real, cur.lo, cur.hi, cur.phase) : null;
  const color = insight ? SEVERITY_COLOR[insight.severity] : 'var(--text-secondary)';

  // Escala: IMR 40-102 → 0-100% alto de columna.
  const y = (v: number) => Math.max(0, Math.min(100, ((v - 40) / 62) * 100));

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>IMR vs banda de fase</h3>
        <span className="meta">tap para detalle</span>
      </div>
      <div className="add-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
          {series.map(s => (
            <div key={s.week} style={{ flex: 1, position: 'relative', height: '100%' }} title={`S${s.week} · ${s.phase}`}>
              {/* banda esperada de la fase */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${y(s.lo)}%`, height: `${y(s.hi) - y(s.lo)}%`, background: 'color-mix(in oklab, var(--engine-oly) 18%, transparent)' }} />
              {/* IMR real */}
              <div style={{ position: 'absolute', left: '15%', right: '15%', bottom: 0, height: `${y(s.real)}%`, background: s.current ? 'var(--engine-stress)' : (s.real > s.hi ? '#EF4444' : s.real < s.lo ? '#F59E0B' : '#22C55E'), borderRadius: 2, opacity: s.current ? 1 : 0.7 }} />
            </div>
          ))}
        </div>
        {insight && (
          <p style={{ fontSize: 11, lineHeight: 1.4, marginTop: 10, color, fontWeight: 600 }}>
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

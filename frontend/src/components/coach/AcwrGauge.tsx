import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { acwrInsight, SEVERITY_COLOR, type Severity } from '../../data/insight';

/**
 * AcwrGauge · gráfico ③ del coach (spec §4.1③): gauge agudo:crónico (ACWR) con
 * lectura automática (1 línea + drawer). Zona segura 0.8-1.3.
 */
const ZONES: Array<[string, Severity, string]> = [
  ['< 0.8', 'watch', 'carga baja'],
  ['0.8-1.3', 'ok', 'seguro'],
  ['> 1.3', 'alert', 'riesgo'],
];

const AcwrGauge: React.FC<{ acwr: number }> = ({ acwr }) => {
  const [open, setOpen] = useState(false);
  const ins = acwrInsight(acwr);
  const color = SEVERITY_COLOR[ins.severity];
  const pct = Math.min(100, (acwr / 2) * 100); // escala 0-2 → ring

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>ACWR · riesgo de lesión</h3>
        <span className="meta">agudo:crónico</span>
      </div>
      <div className="add-card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.06) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: `drop-shadow(0 0 6px ${color}66)` }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color }}>{acwr.toFixed(2)}</span>
          </div>
        </div>
        <p style={{ fontSize: 11, lineHeight: 1.4, color, fontWeight: 600, flex: 1 }}>
          <span style={{ color: '#F5C518' }}>✦ </span>{ins.text}
        </p>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="ACWR · agudo:crónico">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <p>El <strong style={{ color: 'var(--text)' }}>ACWR</strong> (acute:chronic workload ratio) compara la carga reciente (aguda) con la habitual (crónica). <strong style={{ color: 'var(--text)' }}>0.8–1.3</strong> es la zona segura; por encima de 1.3 el riesgo de lesión sube marcadamente.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {ZONES.map(([range, sev, label]) => (
              <div key={range} style={{ flex: 1, padding: 8, borderRadius: 8, background: 'var(--surface)', border: `1px solid ${SEVERITY_COLOR[sev]}40`, textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: SEVERITY_COLOR[sev] }}>{range}</p>
                <p style={{ fontSize: 9 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default AcwrGauge;

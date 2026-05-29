import React, { useState } from 'react';
import type { AthleteProfile } from '../../data/athletes';
import type { Competition } from '../../data/competitions';
import { useBodyweight } from '../../context/BodyweightContext';
import { weighInsFor, latestWeight, makeWeight, type MakeWeightStatus } from '../../data/bodyweight';
import Chart from '../social/Chart';
import AddWeighInSheet from './AddWeighInSheet';

/**
 * BodyweightCard · peso actual vs límite de categoría + tendencia + "hacer el peso"
 * (atado a la próxima competencia de Wave 3). Card del coach en AthleteDeepDive.
 */
interface Props { athlete: AthleteProfile; nextComp: Competition | null; }
const STATUS_COLOR: Record<MakeWeightStatus, string> = {
  under: '#22C55E', on: '#FBBF24', over: '#EF4444', 'no-class': 'var(--text-secondary)',
};

const BodyweightCard: React.FC<Props> = ({ athlete, nextComp }) => {
  const { weighIns, addWeighIn, removeWeighIn } = useBodyweight();
  const [adding, setAdding] = useState(false);
  const series = weighInsFor(weighIns, athlete.id);
  const current = latestWeight(weighIns, athlete);
  const mw = makeWeight(athlete, nextComp, current, new Date());
  const color = STATUS_COLOR[mw.status];

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>Peso · categoría</h3>
        <button className="add-link-btn" onClick={() => setAdding(true)}>＋ Registrar</button>
      </div>
      <div className="add-card" style={{ borderLeft: `3px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
            {current.toFixed(1)} <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>kg</span>
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color }}>{athlete.weight_class}</p>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color, marginTop: 2, lineHeight: 1.4 }}>
          <span style={{ color: '#F5C518' }}>✦ </span>{mw.message}
        </p>
        {series.length >= 2 ? (
          <div style={{ marginTop: 8 }}>
            <Chart data={{ kind: 'sparkline', values: series.map(w => w.kg) }} color={color} width={300} height={48} />
          </div>
        ) : (
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8 }}>Registrá pesajes para ver la tendencia.</p>
        )}
        {series.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {series.slice(-4).reverse().map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                <span>{fmtDate(w.date)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>{w.kg.toFixed(1)} kg</strong>
                  <button onClick={() => removeWeighIn(w.id)} aria-label="Quitar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>×</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddWeighInSheet open={adding} onClose={() => setAdding(false)} athleteName={athlete.name} defaultKg={current}
        onSave={(input) => addWeighIn({ athleteId: athlete.id, ...input })} />
    </div>
  );
};

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
export default BodyweightCard;

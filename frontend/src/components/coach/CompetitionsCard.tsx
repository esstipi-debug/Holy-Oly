import React, { useState } from 'react';
import type { AthleteProfile } from '../../data/athletes';
import { useCompetitions } from '../../context/CompetitionContext';
import { competitionsFor, alignment, type Alignment } from '../../data/competitions';
import AddCompetitionSheet from './AddCompetitionSheet';

/**
 * CompetitionsCard · competencias objetivo del atleta + insight de alineación de pico.
 * Muestra countdown, una mini-barra del macro con bandera en la semana en que cae la
 * competencia, y si el pico no llega a tiempo, un CTA para planificar (Approach C).
 */
interface Props {
  athlete: AthleteProfile;
  onPlan: () => void;   // abre AssignMacrocycle (week-picker competition-aware)
}
const ACCENT = 'var(--engine-macro)';
const STATUS_COLOR: Record<Alignment['status'], string> = {
  'on-peak': '#22C55E', early: '#F59E0B', late: '#EF4444', past: 'var(--text-secondary)',
};

const CompetitionsCard: React.FC<Props> = ({ athlete, onPlan }) => {
  const { competitions, addCompetition, removeCompetition } = useCompetitions();
  const [adding, setAdding] = useState(false);
  const today = new Date();
  const list = competitionsFor(competitions, athlete.id);

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>Competencias objetivo</h3>
        <button className="add-link-btn" onClick={() => setAdding(true)}>＋ Agregar</button>
      </div>
      {list.length === 0 ? (
        <div className="add-card">
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Sin competencias agendadas. Agregá una para planificar el pico del macro hacia esa fecha.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(c => {
            const al = alignment(c, athlete, today);
            const color = STATUS_COLOR[al.status];
            return (
              <div key={c.id} className="add-card" style={{ borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{c.priority ? '🏆 ' : ''}{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {fmtDate(c.date)} · {al.weeksUntil >= 0 ? `en ${al.weeksUntil} sem` : 'pasada'}{c.level ? ` · ${c.level}` : ''}{c.objective ? ` · ${c.objective}` : ''}
                    </p>
                  </div>
                  <button onClick={() => removeCompetition(c.id)} aria-label="Quitar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, fontFamily: 'inherit', lineHeight: 1 }}>×</button>
                </div>
                <MacroFlagBar total={athlete.macrocycle.total_weeks} current={athlete.macrocycle.week} compWeek={al.compWeek} color={color} />
                <p style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.4, marginTop: 6 }}>
                  <span style={{ color: '#F5C518' }}>✦ </span>{al.message}
                </p>
                {(al.status === 'early' || al.status === 'late') && (
                  <button onClick={onPlan} style={planBtn()}>Planificar hacia esta competencia →</button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddCompetitionSheet open={adding} onClose={() => setAdding(false)} athleteName={athlete.name}
        onSave={(input) => addCompetition({ athleteId: athlete.id, ...input })} />
    </div>
  );
};

const MacroFlagBar: React.FC<{ total: number; current: number; compWeek: number; color: string }> = ({ total, current, compWeek, color }) => {
  const safeTotal = total > 0 ? total : 12;
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
      {Array.from({ length: safeTotal }, (_, i) => {
        const w = i + 1;
        const past = w <= current;
        const isComp = w === compWeek;
        return <div key={w} style={{ flex: 1, height: 6, borderRadius: 2, background: isComp ? color : past ? 'var(--text-secondary)' : 'var(--card-border)' }} />;
      })}
    </div>
  );
};

function planBtn(): React.CSSProperties {
  return { marginTop: 8, width: '100%', padding: '9px 0', borderRadius: 8, background: `color-mix(in oklab, ${ACCENT} 14%, transparent)`, border: `1px solid color-mix(in oklab, ${ACCENT} 45%, transparent)`, color: ACCENT, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.03em' };
}
function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}
export default CompetitionsCard;

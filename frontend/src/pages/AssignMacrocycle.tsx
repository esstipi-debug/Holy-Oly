import React, { useState, useMemo } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { MACROCYCLES, MACROCYCLE_FAMILIES, type Macrocycle } from '../data/macrocycles';

const Bars: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        style={{
          width: 12, height: 4, borderRadius: 2,
          background: i <= value ? color : 'var(--card-border)',
        }}
      />
    ))}
  </div>
);

type FamilyFilter = 'TODOS' | Macrocycle['family'];

const AssignMacrocycle: React.FC = () => {
  const { navigate } = useNav();
  const { selectedAthlete, athlete: currentAthlete } = useAthlete();
  const target = selectedAthlete ?? currentAthlete;
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<FamilyFilter>('TODOS');

  const filtered = useMemo(
    () => filter === 'TODOS' ? MACROCYCLES : MACROCYCLES.filter(m => m.family === filter),
    [filter],
  );

  const handleConfirm = () => {
    if (!selected) return;
    navigate('ATHLETE_DETAIL');
  };

  const initials = target ? target.name.split(' ').slice(0, 2).map(n => n[0]).join('') : '';
  const selectedMacro = selected ? MACROCYCLES.find(m => m.id === selected) : null;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 170 }}>

      {/* HEADER */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' }}>
          Asignar Macrociclo
        </h1>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>
          {MACROCYCLES.length} sistemas · Filtrá por escuela
        </p>
      </div>

      {/* SELECTED ATHLETE */}
      {target && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            background: 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.25)',
            borderRadius: 16, padding: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: 'linear-gradient(135deg, #06B6D4, #0070FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#fff',
            }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{target.name}</p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                Macro actual: {target.macrocycle.program_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAMILY FILTER (chips horizontales) */}
      <div style={{ padding: '0 20px 16px' }}>
        <div
          className="scroll-x-no-bar"
          style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}
        >
          {(['TODOS', ...MACROCYCLE_FAMILIES] as FamilyFilter[]).map(f => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0,
                  padding: '7px 13px', borderRadius: 999,
                  background: active ? 'var(--text)' : 'var(--surface)',
                  color: active ? 'var(--bg)' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--text)' : 'var(--card-border)'}`,
                  fontSize: 11, fontWeight: 700, letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{f}</button>
            );
          })}
        </div>
      </div>

      {/* SCHOOLS */}
      <div style={{ padding: '0 20px 20px' }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          {filtered.length} disponibles
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((macro) => {
            const active = selected === macro.id;
            return (
              <button
                key={macro.id}
                onClick={() => setSelected(macro.id)}
                style={{
                  textAlign: 'left',
                  background: active ? `${macro.color}10` : 'var(--surface)',
                  border: `1px solid ${active ? macro.color : 'var(--card-border)'}`,
                  borderLeft: `4px solid ${macro.color}`,
                  borderRadius: 16, padding: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: active ? macro.color : 'var(--text)' }}>
                      {macro.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                      {macro.desc}
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                        background: 'var(--surface2)', color: 'var(--text-secondary)',
                        letterSpacing: '.04em', textTransform: 'uppercase',
                      }}>{macro.frequency}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                        background: 'var(--surface2)', color: 'var(--text-secondary)',
                        letterSpacing: '.04em', textTransform: 'uppercase',
                      }}>{macro.duration}</span>
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1.5px solid ${active ? macro.color : 'var(--card-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {active && (
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: macro.color }} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 18, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Intensidad
                    </p>
                    <Bars value={macro.intensity} color="#EF4444" />
                  </div>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Volumen
                    </p>
                    <Bars value={macro.volume} color="#06B6D4" />
                  </div>
                </div>

                {active && macro.bestFor && (
                  <p style={{
                    fontSize: 10, color: macro.color, marginTop: 10,
                    paddingTop: 10, borderTop: `1px dashed ${macro.color}55`,
                    fontStyle: 'italic',
                  }}>
                    💡 {macro.bestFor}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONFIRM */}
      <div style={{
        position: 'absolute', bottom: 84, left: 16, right: 16,
        zIndex: 40,
      }}>
        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14,
            background: selected ? 'var(--cta-bg)' : 'var(--surface)',
            color: selected ? 'var(--cta-text)' : 'var(--text-secondary)',
            border: selected ? 'none' : '1px solid var(--card-border)',
            fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: selected ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            opacity: selected ? 1 : 0.6,
            transition: 'all .2s ease',
          }}
        >
          {selectedMacro
            ? `Confirmar · ${selectedMacro.name}`
            : 'Elegí un macrociclo'}
        </button>
      </div>
    </div>
  );
};

export default AssignMacrocycle;

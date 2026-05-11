import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

interface School {
  id: string;
  name: string;
  desc: string;
  color: string;
  intensity: number;
  volume: number;
}

const SCHOOLS: School[] = [
  { id: 'bulgarian', name: 'Bulgarian Method', desc: 'Max intensity, high frequency. Diario al 90%+.',           color: '#EF4444', intensity: 5, volume: 2 },
  { id: 'soviet',    name: 'Soviet System',    desc: 'Volumen periodizado, precisión técnica.',                   color: '#06B6D4', intensity: 3, volume: 5 },
  { id: 'chinese',   name: 'Chinese School',   desc: 'Énfasis en pull, estabilidad y sentadilla profunda.',       color: '#F59E0B', intensity: 4, volume: 4 },
  { id: 'catalyst',  name: 'Catalyst Athletics',desc: 'Periodización lineal americana, balance vol/int.',         color: '#22C55E', intensity: 4, volume: 3 },
];

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

const AssignMacrocycle: React.FC = () => {
  const { navigate } = useNav();
  const { selectedAthlete, athlete: currentAthlete } = useAthlete();
  const target = selectedAthlete ?? currentAthlete;
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    // En un mundo real esto haría POST. Acá navegamos al detalle del atleta.
    navigate('ATHLETE_DETAIL');
  };

  const initials = target ? target.name.split(' ').slice(0, 2).map(n => n[0]).join('') : '';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 110 }}>

      {/* HEADER */}
      <div style={{ padding: '52px 20px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' }}>
          Asignar Macrociclo
        </h1>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>
          Selecciona la escuela filosófica
        </p>
      </div>

      {/* SELECTED ATHLETE */}
      {target && (
        <div style={{ padding: '0 20px 20px' }}>
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

      {/* SCHOOLS */}
      <div style={{ padding: '0 20px 20px' }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Escuelas disponibles
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SCHOOLS.map((school) => {
            const active = selected === school.id;
            return (
              <button
                key={school.id}
                onClick={() => setSelected(school.id)}
                style={{
                  textAlign: 'left',
                  background: active ? `${school.color}10` : 'var(--surface)',
                  border: `1px solid ${active ? school.color : 'var(--card-border)'}`,
                  borderLeft: `4px solid ${school.color}`,
                  borderRadius: 16, padding: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: active ? school.color : 'var(--text)' }}>
                      {school.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                      {school.desc}
                    </p>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1.5px solid ${active ? school.color : 'var(--card-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {active && (
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: school.color }} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 18, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Intensidad
                    </p>
                    <Bars value={school.intensity} color="#EF4444" />
                  </div>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Volumen
                    </p>
                    <Bars value={school.volume} color="#06B6D4" />
                  </div>
                </div>
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
          {selected
            ? `Confirmar · ${SCHOOLS.find(s => s.id === selected)?.name}`
            : 'Elegí una escuela'}
        </button>
      </div>
    </div>
  );
};

export default AssignMacrocycle;

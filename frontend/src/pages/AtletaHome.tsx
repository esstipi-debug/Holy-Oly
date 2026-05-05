import React from 'react';
import { useAthlete } from '../context/AthleteContext';

const readinessRingColor = (r: number) =>
  r >= 7 ? '#22C55E' : r >= 5 ? '#F59E0B' : '#EF4444';

const readinessLabel = (r: number) =>
  r >= 7 ? 'VERDE' : r >= 5 ? 'AMARILLO' : 'ROJO';

const PILDORAS = [
  { emoji: '🧠', label: 'Mentalidad', active: true, gradient: 'linear-gradient(135deg,#22C55E,#06B6D4)' },
  { emoji: '💤', label: 'Recuperación', active: true, gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)' },
  { emoji: '🎯', label: 'Técnica', active: false, gradient: '#1e1e30' },
  { emoji: '🥗', label: 'Nutrición', active: false, gradient: '#1e1e30' },
];

const AtletaHome: React.FC = () => {
  const { athlete, stress, stressLoading } = useAthlete();
  if (!athlete) return null;

  const { macrocycle, maxes, injuries } = athlete;
  const firstName = athlete.name.split(' ')[0];
  const lastInitial = athlete.name.split(' ')[1]?.[0] ?? '';

  const readinessRaw = stress ? Math.round(stress.readiness) : null;
  const ringColor = readinessRaw !== null ? readinessRingColor(readinessRaw / 10) : '#1e2d1e';
  const ringLabel = readinessRaw !== null ? readinessLabel(readinessRaw / 10) : '—';

  // Calcular tonelaje semana actual
  const tonelaje = athlete.sessions_last_7
    .filter(s => s.completed && s.load > 0)
    .reduce((acc, s) => acc + s.load / 1000, 0);
  const sesiones = athlete.sessions_last_7.filter(s => s.completed).length;

  // Ejercicios de sesión basados en maxes del atleta
  const sessionExercises = [
    { name: 'Arrancada', sets: 5, reps: 3, pct: 0.85, max: maxes.snatch },
    { name: 'Dos Tiempos', sets: 4, reps: 2, pct: 0.80, max: maxes.jerk },
    { name: 'Sentadilla Frontal', sets: 4, reps: 4, pct: 0.75, max: maxes.front_squat },
  ];

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: '8px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: '#64748b' }}>Buenos días,</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-.02em' }}>{athlete.name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Belt badge */}
          <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#1e1e3f)', border: '1px solid #3B82F6', borderRadius: 20, padding: '4px 10px' }}>
            <span style={{ fontSize: 9, color: '#60a5fa', fontWeight: 700, letterSpacing: '.06em' }}>
              {athlete.weight_class}
            </span>
          </div>
          {/* Avatar */}
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white' }}>
            {firstName[0]}{lastInitial}
          </div>
        </div>
      </div>

      {/* Píldoras stories */}
      <div style={{ padding: '0 24px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#334155', marginBottom: 10 }}>Píldoras de hoy</p>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {PILDORAS.map((p) => (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', padding: 2, background: p.gradient, flexShrink: 0 }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#141420', border: '2px solid #07070F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {p.emoji}
                </div>
              </div>
              <span style={{ fontSize: 10, color: p.active ? '#94a3b8' : '#475569' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness ring + OLY Index + Streak */}
      <div style={{ padding: '0 24px 16px', display: 'flex', gap: 12 }}>

        {/* Readiness ring */}
        <div style={{ flex: 1, background: '#111118', border: '1px solid #1e1e30', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>Readiness</p>
          {stressLoading ? (
            <div style={{ width: 110, height: 110, borderRadius: '50%', border: '6px solid #1e2d1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #22C55E', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              border: `6px solid ${ringColor}`,
              boxShadow: readinessRaw !== null ? `0 0 24px ${ringColor}50` : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: ringColor, lineHeight: 1 }}>
                {readinessRaw ?? '—'}
              </span>
              <span style={{ fontSize: 11, color: ringColor, fontWeight: 600 }}>{ringLabel}</span>
            </div>
          )}
          {stress && (
            <span style={{ fontSize: 10, color: '#4ade80' }}>
              Fit {Math.round(stress.fitness)} · Fat {Math.round(stress.fatigue)}
            </span>
          )}
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {/* OLY Index */}
          <div style={{ background: '#111118', border: '1px solid #1e1e30', borderRadius: 20, padding: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>OLY Index</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#F59E0B', letterSpacing: '-.02em', lineHeight: 1 }}>
              {(maxes.snatch / maxes.body_weight > 0 ? (maxes.snatch / maxes.body_weight * 2.5).toFixed(1) : '7.4')}
            </p>
            <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{athlete.weight_class} · {athlete.club.split(' ').slice(-1)[0]}</p>
          </div>
          {/* Streak */}
          <div style={{ background: '#111118', border: '1px solid #1e1e30', borderRadius: 20, padding: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>Racha</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{sesiones}</span>
              <span style={{ fontSize: 11, color: '#78350f', fontWeight: 700 }}>SEM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Belt progress */}
      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ background: '#111118', border: '1px solid #1e1e30', borderRadius: 20, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>
                Sem {macrocycle.week} / {macrocycle.total_weeks} · {macrocycle.program_name}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>
                Día {macrocycle.day} <span style={{ color: '#475569', fontWeight: 400 }}>· {macrocycle.focus}</span>
              </p>
            </div>
            <div style={{ background: '#1e1e3f', border: '1px solid #3B82F6', borderRadius: 12, padding: '4px 8px' }}>
              <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700 }}>
                {Math.round((macrocycle.week / macrocycle.total_weeks) * 100)}%
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 3, background: '#1e1e30', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3B82F6, #6366F1)', width: `${(macrocycle.week / macrocycle.total_weeks) * 100}%` }} />
          </div>
          <p style={{ fontSize: 10, color: '#475569', marginTop: 6 }}>
            {macrocycle.total_weeks - macrocycle.week} semanas restantes
          </p>
        </div>
      </div>

      {/* Today's session */}
      <div style={{ padding: '0 24px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#334155', marginBottom: 10 }}>
          Sesión de hoy · Semana {macrocycle.week} · Día {macrocycle.day}
        </p>
        <div style={{ background: '#111118', border: '1px solid #1e1e30', borderRadius: 20, overflow: 'hidden' }}>
          {/* Session header */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,#0f2318,#111118)', borderBottom: '1px solid #1e1e30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{macrocycle.program_name}</p>
              <p style={{ fontSize: 11, color: '#4ade80', marginTop: 2 }}>
                {sessionExercises.length} ejercicios · {macrocycle.focus}
              </p>
            </div>
            {injuries && injuries.length > 0 ? (
              <span style={{ fontSize: 10, background: '#7f1d1d', color: '#f87171', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>🛡️ CARGA</span>
            ) : (
              <span style={{ fontSize: 10, background: '#14532d', color: '#4ade80', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>VERDE</span>
            )}
          </div>
          {/* Exercises */}
          <div style={{ padding: '4px 16px' }}>
            {sessionExercises.map((ex, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < sessionExercises.length - 1 ? '1px solid #1e1e30' : 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{ex.name}</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>
                    {ex.sets}×{ex.reps} @ {Math.round(ex.max * ex.pct)}kg{' '}
                    <span style={{ color: '#4ade80' }}>({Math.round(ex.pct * 100)}% 1RM)</span>
                  </p>
                </div>
                {i < 2 ? <span style={{ fontSize: 18 }}>⭐</span> : <span style={{ fontSize: 11, color: '#475569' }}>+ más</span>}
              </div>
            ))}
          </div>
          {/* CTA */}
          <div style={{ padding: '14px 16px' }}>
            <button style={{ width: '100%', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontSize: 15, fontWeight: 800, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', letterSpacing: '.02em' }}>
              Iniciar Sesión →
            </button>
          </div>
        </div>
      </div>

      {/* Injury shield (si aplica) */}
      {injuries && injuries.length > 0 && (
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg,#1c0505,#111118)', border: '1px solid #7f1d1d', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#450a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#f87171', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Injury Shield</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>{injuries[0]}</p>
            </div>
            <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700, border: '1px solid #7f1d1d', borderRadius: 8, padding: '4px 8px' }}>Ver →</span>
          </div>
        </div>
      )}

      {/* Pulse widget */}
      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ background: 'linear-gradient(135deg,#0f0f2e,#111118)', border: '1px solid #3730a3', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Reto Semanal Pulse</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>Snatch técnico · {maxes.snatch - 10}kg</p>
            <p style={{ fontSize: 10, color: '#6366f1', marginTop: 1 }}>Caduca domingo · +300 XP</p>
          </div>
          <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, border: '1px solid #3730a3', borderRadius: 8, padding: '4px 8px' }}>Ver →</span>
        </div>
      </div>

      {/* Weekly stats */}
      <div style={{ padding: '0 24px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#334155', marginBottom: 10 }}>Esta semana</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: sesiones, label: 'Sesiones', color: '#f1f5f9' },
            { value: tonelaje.toFixed(1), label: 'Ton. (t)', color: '#F59E0B' },
            { value: `+${sesiones * 250}`, label: 'XP ganada', color: '#4ade80' },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, background: '#111118', border: '1px solid #1e1e30', borderRadius: 16, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AtletaHome;

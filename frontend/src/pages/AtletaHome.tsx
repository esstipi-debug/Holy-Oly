import React from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useNav } from '../context/NavigationContext';

const ringColor = (r: number) => r >= 70 ? '#22C55E' : r >= 50 ? '#F59E0B' : '#EF4444';
const ringLabel = (r: number) => r >= 70 ? 'VERDE' : r >= 50 ? 'AMARILLO' : 'ROJO';

const PILDORAS = [
  { emoji: '🧠', label: 'Mentalidad', ring: 'linear-gradient(135deg,#22C55E,#06B6D4)' },
  { emoji: '💤', label: 'Recuperación', ring: 'linear-gradient(135deg,#F59E0B,#EF4444)' },
  { emoji: '🎯', label: 'Técnica', ring: 'transparent' },
  { emoji: '🥗', label: 'Nutrición', ring: 'transparent' },
];

const S = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--card-border)',
    borderRadius: 20,
  } as React.CSSProperties,
  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-secondary)',
    marginBottom: 4,
  },
  text: { color: 'var(--text)' } as React.CSSProperties,
  muted: { color: 'var(--text-secondary)' } as React.CSSProperties,
};

const AtletaHome: React.FC = () => {
  const { navigate } = useNav();
  const { athlete, stress, stressLoading } = useAthlete();
  if (!athlete) return null;

  const { macrocycle, maxes, injuries } = athlete;
  const firstName = athlete.name.split(' ')[0];
  const lastInitial = athlete.name.split(' ')[1]?.[0] ?? '';

  const readiness = stress ? Math.round(stress.readiness) : null;
  const rc = readiness !== null ? ringColor(readiness) : '#334155';
  const rl = readiness !== null ? ringLabel(readiness) : '—';

  const completedSessions = athlete.sessions_last_7.filter(s => s.completed);
  const sesiones = completedSessions.length;
  const tonelaje = completedSessions.reduce((acc, s) => acc + (s.load ?? 0) / 1000, 0);

  const olyIndex = maxes.body_weight > 0
    ? (maxes.snatch / maxes.body_weight * 2.5).toFixed(1)
    : '7.4';

  const sessionExercises = [
    { name: 'Arrancada', sets: 5, reps: 3, pct: 0.85, max: maxes.snatch },
    { name: 'Dos Tiempos', sets: 4, reps: 2, pct: 0.80, max: maxes.jerk },
    { name: 'Sentadilla Frontal', sets: 4, reps: 4, pct: 0.75, max: maxes.front_squat },
  ];

  const pct = Math.round((macrocycle.week / macrocycle.total_weeks) * 100);

  return (
    <div style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, ...S.muted }}>Buenos días,</p>
          <p style={{ fontSize: 22, fontWeight: 900, ...S.text, letterSpacing: '-.02em', lineHeight: 1.1 }}>{athlete.name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: '4px 10px' }}>
            <span style={{ fontSize: 9, color: '#60a5fa', fontWeight: 700, letterSpacing: '.06em' }}>{athlete.weight_class}</span>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'var(--bg)' }}>
            {firstName[0]}{lastInitial}
          </div>
        </div>
      </div>

      {/* Píldoras */}
      <div style={{ padding: '0 20px 16px' }}>
        <p style={{ ...S.label, marginBottom: 10 }}>Píldoras de hoy</p>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {PILDORAS.map((p) => (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', padding: p.ring === 'transparent' ? 0 : 2.5, background: p.ring, border: p.ring === 'transparent' ? '2px solid var(--card-border)' : 'none' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {p.emoji}
                </div>
              </div>
              <span style={{ fontSize: 9, ...S.muted, textAlign: 'center' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness + OLY Index + Streak */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 10 }}>
        {/* Readiness ring */}
        <div style={{ flex: 1.2, ...S.card, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={S.label}>Readiness</p>
          {stressLoading ? (
            <div style={{ width: 100, height: 100, borderRadius: '50%', border: '5px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              border: `5px solid ${rc}`,
              boxShadow: readiness !== null ? `0 0 20px ${rc}40` : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: rc, lineHeight: 1 }}>{readiness ?? '—'}</span>
              <span style={{ fontSize: 10, color: rc, fontWeight: 700 }}>{rl}</span>
            </div>
          )}
          {stress && (
            <span style={{ fontSize: 9, color: 'var(--primary)', textAlign: 'center' }}>
              Fit {Math.round(stress.fitness)} · Fat {Math.round(stress.fatigue)}
            </span>
          )}
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div style={{ ...S.card, padding: 14, flex: 1, cursor: 'pointer' }} onClick={() => navigate('INDEX')}>
            <p style={S.label}>OLY Index</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', letterSpacing: '-.03em', lineHeight: 1 }}>{olyIndex}</p>
            <p style={{ fontSize: 10, ...S.muted, marginTop: 2 }}>{athlete.weight_class} · {athlete.club.split(' ').slice(-1)[0]}</p>
          </div>
          <div style={{ ...S.card, padding: 14, flex: 1 }}>
            <p style={S.label}>Racha</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{sesiones}</span>
              <span style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>SEM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macrocycle progress */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ ...S.label, marginBottom: 2 }}>
                Sem {macrocycle.week} / {macrocycle.total_weeks} · {macrocycle.program_name}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, ...S.text }}>
                Día {macrocycle.day} <span style={{ ...S.muted, fontWeight: 400 }}>· {macrocycle.focus}</span>
              </p>
            </div>
            <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '4px 8px' }}>
              <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700 }}>{pct}%</span>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--card-border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#3B82F6,#6366F1)', width: `${pct}%`, transition: 'width .6s ease' }} />
          </div>
          <p style={{ fontSize: 10, ...S.muted, marginTop: 6 }}>{macrocycle.total_weeks - macrocycle.week} semanas restantes</p>
        </div>
      </div>

      {/* Today's session */}
      <div style={{ padding: '0 20px 14px' }}>
        <p style={{ ...S.label, marginBottom: 10 }}>
          Sesión de hoy · Semana {macrocycle.week} · Día {macrocycle.day}
        </p>
        <div style={{ ...S.card, overflow: 'hidden' }}>
          {/* Session header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, ...S.text }}>{macrocycle.program_name}</p>
              <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>
                {sessionExercises.length} ejercicios · {macrocycle.focus}
              </p>
            </div>
            {injuries && injuries.length > 0 ? (
              <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)' }}>🛡️ CARGA</span>
            ) : (
              <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.1)', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(34,197,94,0.2)' }}>VERDE</span>
            )}
          </div>
          {/* Exercises */}
          <div style={{ padding: '0 16px' }}>
            {sessionExercises.map((ex, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < sessionExercises.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, ...S.text }}>{ex.name}</p>
                  <p style={{ fontSize: 11, ...S.muted }}>
                    {ex.sets}×{ex.reps} @ {Math.round(ex.max * ex.pct)}kg{' '}
                    <span style={{ color: 'var(--primary)' }}>({Math.round(ex.pct * 100)}% 1RM)</span>
                  </p>
                </div>
                {i < 2 ? <span style={{ fontSize: 18 }}>⭐</span> : <span style={{ fontSize: 11, ...S.muted }}>+ más</span>}
              </div>
            ))}
          </div>
          {/* CTA */}
          <div style={{ padding: 14 }}>
            <button
              onClick={() => navigate('WARMUP')}
              style={{
                width: '100%',
                background: 'var(--cta-bg)',
                color: 'var(--cta-text)',
                fontSize: 15,
                fontWeight: 800,
                padding: '14px 0',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '.02em',
              }}
            >
              Iniciar Sesión →
            </button>
          </div>
        </div>
      </div>

      {/* Injury shield */}
      {injuries && injuries.length > 0 && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: '#f87171', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Injury Shield</p>
              <p style={{ fontSize: 13, fontWeight: 700, ...S.text, marginTop: 2 }}>{String(injuries[0])}</p>
            </div>
            <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>Ver →</span>
          </div>
        </div>
      )}

      {/* Pulse widget */}
      <div style={{ padding: '0 20px 14px' }}>
        <div
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
          onClick={() => navigate('PULSE')}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Reto Semanal Pulse</p>
            <p style={{ fontSize: 13, fontWeight: 700, ...S.text, marginTop: 2 }}>Snatch técnico · {maxes.snatch - 10}kg</p>
            <p style={{ fontSize: 10, color: '#6366f1', marginTop: 1 }}>Caduca domingo · +300 XP</p>
          </div>
          <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '4px 8px' }}>Ver →</span>
        </div>
      </div>

      {/* Weekly stats */}
      <div style={{ padding: '0 20px 20px' }}>
        <p style={{ ...S.label, marginBottom: 10 }}>Esta semana</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: sesiones, label: 'Sesiones', color: 'var(--text)' },
            { value: tonelaje.toFixed(1), label: 'Ton. (t)', color: '#F59E0B' },
            { value: `+${sesiones * 250}`, label: 'XP ganada', color: 'var(--primary)' },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, ...S.card, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: 10, ...S.muted, marginTop: 2 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AtletaHome;

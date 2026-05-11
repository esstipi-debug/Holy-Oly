import React from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useNav } from '../context/NavigationContext';

const ringColor = (r: number) => r >= 70 ? '#22C55E' : r >= 50 ? '#F59E0B' : '#EF4444';
const ringLabel = (r: number) => r >= 70 ? 'Listo para carga alta' : r >= 50 ? 'Carga moderada' : 'Tu cuerpo pide descanso';
const ringTag = (r: number) => r >= 70 ? 'ÓPTIMO' : r >= 50 ? 'MODERADO' : 'BAJO';

const RADIUS = 86;
const STROKE = 10;
const CIRCUM = 2 * Math.PI * RADIUS;

const ReadinessRing: React.FC<{ value: number | null; color: string }> = ({ value, color }) => {
  const pct = value !== null ? value / 100 : 0;
  const offset = CIRCUM * (1 - pct);
  return (
    <svg width={RADIUS * 2 + STROKE * 2} height={RADIUS * 2 + STROKE * 2} style={{ display: 'block' }}>
      <circle
        cx={RADIUS + STROKE}
        cy={RADIUS + STROKE}
        r={RADIUS}
        fill="none"
        stroke="var(--card-border)"
        strokeWidth={STROKE}
      />
      <circle
        cx={RADIUS + STROKE}
        cy={RADIUS + STROKE}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUM}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
        style={{ transition: 'stroke-dashoffset .8s ease, stroke .3s ease', filter: `drop-shadow(0 0 12px ${color}80)` }}
      />
    </svg>
  );
};

const Chip: React.FC<{
  label: string;
  value: string | number;
  accent?: string;
  onClick?: () => void;
}> = ({ label, value, accent, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: '0 0 auto',
      minWidth: 110,
      background: 'var(--surface)',
      border: '1px solid var(--card-border)',
      borderRadius: 18,
      padding: '12px 14px',
      textAlign: 'left',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform .15s ease, border-color .15s ease',
      fontFamily: 'inherit',
    }}
    onMouseEnter={(e) => {
      if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
    }}
  >
    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>
      {label}
    </p>
    <p style={{ fontSize: 22, fontWeight: 900, color: accent ?? 'var(--text)', letterSpacing: '-.02em', lineHeight: 1 }}>
      {value}
    </p>
  </button>
);

const AtletaHome: React.FC = () => {
  const { navigate } = useNav();
  const { athlete, stress, stressLoading } = useAthlete();
  if (!athlete) return null;

  const { macrocycle, maxes, injuries } = athlete;
  const firstName = athlete.name.split(' ')[0];
  const lastInitial = athlete.name.split(' ')[1]?.[0] ?? '';

  const readiness = stress ? Math.round(stress.readiness) : null;
  const rc = readiness !== null ? ringColor(readiness) : 'var(--text-secondary)';
  const rl = readiness !== null ? ringLabel(readiness) : 'Calculando…';
  const rtag = readiness !== null ? ringTag(readiness) : '—';

  const completedSessions = athlete.sessions_last_7.filter((s) => s.completed);
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

  const macroPct = Math.round((macrocycle.week / macrocycle.total_weeks) * 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ background: 'var(--bg)', paddingBottom: 90, minHeight: '100%' }}>

      {/* HEADER — minimal */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{greeting},</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.15 }}>
            {firstName}
          </p>
        </div>
        <button
          onClick={() => navigate('PROFILE')}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--primary),#3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: 'var(--bg)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {firstName[0]}{lastInitial}
        </button>
      </div>

      {/* HERO — readiness */}
      <div style={{ padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 14 }}>
          Readiness · Hoy
        </p>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {stressLoading ? (
            <div style={{
              width: RADIUS * 2 + STROKE * 2, height: RADIUS * 2 + STROKE * 2,
              borderRadius: '50%', border: `${STROKE}px solid var(--card-border)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              <ReadinessRing value={readiness} color={rc} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 56, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.04em', lineHeight: 1 }}>
                  {readiness ?? '—'}
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', color: rc, marginTop: 4 }}>
                  {rtag}
                </span>
              </div>
            </>
          )}
        </div>
        <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginTop: 18, textAlign: 'center', maxWidth: 280 }}>
          {rl}
        </p>
        {stress && (
          <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Fitness <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(stress.fitness)}</strong>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Fatiga <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(stress.fatigue)}</strong>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {athlete.weight_class}
            </span>
          </div>
        )}
      </div>

      {/* MACRO PROGRESS — slim full-width */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text)', fontWeight: 700 }}>
            {macrocycle.program_name}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Sem {macrocycle.week}/{macrocycle.total_weeks} · {macroPct}%
          </p>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'var(--card-border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, var(--primary), #3B82F6)',
            width: `${macroPct}%`, transition: 'width .8s ease',
          }} />
        </div>
      </div>

      {/* TODAY'S SESSION — hero card */}
      <div style={{ padding: '0 20px 22px' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--card-border)',
          borderRadius: 22,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 18px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 4 }}>
                  Sesión de hoy
                </p>
                <p style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' }}>
                  {macrocycle.focus}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Día {macrocycle.day} · {sessionExercises.length} ejercicios
                </p>
              </div>
              {injuries && injuries.length > 0 ? (
                <span style={{ fontSize: 9, background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '4px 9px', borderRadius: 20, fontWeight: 800, letterSpacing: '.06em', border: '1px solid rgba(239,68,68,0.3)' }}>CARGA</span>
              ) : (
                <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.1)', color: 'var(--primary)', padding: '4px 9px', borderRadius: 20, fontWeight: 800, letterSpacing: '.06em', border: '1px solid rgba(34,197,94,0.2)' }}>VERDE</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 14 }}>
              {sessionExercises.map((ex, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '10px 0',
                  borderBottom: i < sessionExercises.length - 1 ? '1px solid var(--card-border)' : 'none',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ex.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {ex.sets}×{ex.reps} · <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(ex.max * ex.pct)}kg</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('WARMUP')}
            style={{
              width: '100%',
              background: 'var(--cta-bg)',
              color: 'var(--cta-text)',
              fontSize: 14,
              fontWeight: 800,
              padding: '15px 0',
              border: 'none',
              borderTop: '1px solid var(--card-border)',
              cursor: 'pointer',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              fontFamily: 'inherit',
            }}
          >
            Empezar · Calentamiento
          </button>
        </div>
      </div>

      {/* QUICK STATS — horizontal scroll chips */}
      <div style={{ padding: '0 0 20px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '0 20px 10px' }}>
          Sigamos
        </p>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
          <Chip label="OLY Index" value={olyIndex} accent="#F59E0B" onClick={() => navigate('INDEX')} />
          <Chip label="Racha" value={`${sesiones}🔥`} accent="#f97316" />
          <Chip label="Pulse" value="+300 XP" accent="#818cf8" onClick={() => navigate('PULSE')} />
          <Chip label="Píldoras" value="4" accent="var(--primary)" onClick={() => navigate('PILLS')} />
          <Chip label="Schedule" value="→" onClick={() => navigate('SCHEDULE')} />
        </div>
      </div>

      {/* INJURY — only if exists */}
      {injuries && injuries.length > 0 && (
        <div style={{ padding: '0 20px 18px' }}>
          <div
            onClick={() => navigate('PERFORMANCE')}
            style={{
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: 18,
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, color: '#f87171', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>Injury Shield</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{String(injuries[0])}</p>
            </div>
            <span style={{ fontSize: 18, color: 'var(--text-secondary)' }}>›</span>
          </div>
        </div>
      )}

      {/* WEEK SUMMARY — inline row, not boxes */}
      <div style={{ padding: '0 20px 24px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Esta semana
        </p>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--card-border)',
          borderRadius: 18,
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.03em', lineHeight: 1 }}>{sesiones}</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>Sesiones</p>
          </div>
          <div style={{ width: 1, background: 'var(--card-border)' }} />
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', letterSpacing: '-.03em', lineHeight: 1 }}>{tonelaje.toFixed(1)}<span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 2 }}>t</span></p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>Volumen</p>
          </div>
          <div style={{ width: 1, background: 'var(--card-border)' }} />
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-.03em', lineHeight: 1 }}>+{sesiones * 250}</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>XP</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AtletaHome;

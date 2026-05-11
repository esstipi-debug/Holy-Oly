import React from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useNav } from '../context/NavigationContext';
import WiseAssistant from '../components/WiseAssistant';

const ringColor = (r: number) => r >= 70 ? '#22C55E' : r >= 50 ? '#F59E0B' : '#EF4444';
const ringLabel = (r: number) => r >= 70 ? 'Listo para carga alta' : r >= 50 ? 'Carga moderada' : 'Tu cuerpo pide descanso';
const ringTag = (r: number) => r >= 70 ? 'ÓPTIMO' : r >= 50 ? 'MODERADO' : 'BAJO';

const RADIUS = 86;
const STROKE = 10;
const CIRCUM = 2 * Math.PI * RADIUS;

const PILDORAS = [
  { emoji: '🧠', label: 'Mentalidad',  ring: 'linear-gradient(135deg,#22C55E,#06B6D4)', active: true },
  { emoji: '💤', label: 'Recuperación', ring: 'linear-gradient(135deg,#F59E0B,#EF4444)', active: true },
  { emoji: '🎯', label: 'Técnica',      ring: 'var(--card-border)',                       active: false },
  { emoji: '🥗', label: 'Nutrición',    ring: 'var(--card-border)',                       active: false },
];

const BELTS = [
  { name: 'BLANCO',  next: 'AMARILLO',  color: '#E5E7EB' },
  { name: 'AMARILLO',next: 'NARANJA',   color: '#FACC15' },
  { name: 'NARANJA', next: 'AZUL',      color: '#FB923C' },
  { name: 'AZUL',    next: 'PÚRPURA',   color: '#3B82F6' },
  { name: 'PÚRPURA', next: 'MARRÓN',    color: '#A855F7' },
  { name: 'MARRÓN',  next: 'NEGRO',     color: '#92400E' },
  { name: 'NEGRO',   next: 'MAESTRO',   color: '#0A0A0A' },
];

const ReadinessRing: React.FC<{ value: number | null; color: string }> = ({ value, color }) => {
  const pct = value !== null ? value / 100 : 0;
  const offset = CIRCUM * (1 - pct);
  return (
    <svg width={RADIUS * 2 + STROKE * 2} height={RADIUS * 2 + STROKE * 2} style={{ display: 'block' }}>
      <circle cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS} fill="none" stroke="var(--card-border)" strokeWidth={STROKE} />
      <circle
        cx={RADIUS + STROKE} cy={RADIUS + STROKE} r={RADIUS}
        fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round"
        strokeDasharray={CIRCUM} strokeDashoffset={offset}
        transform={`rotate(-90 ${RADIUS + STROKE} ${RADIUS + STROKE})`}
        style={{ transition: 'stroke-dashoffset .8s ease, stroke .3s ease', filter: `drop-shadow(0 0 12px ${color}80)` }}
      />
    </svg>
  );
};

const formatDate = (d: Date) => {
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

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
    { name: 'Arrancada',         sets: 5, reps: 3, pct: 0.85, max: maxes.snatch },
    { name: 'Dos Tiempos',       sets: 4, reps: 2, pct: 0.80, max: maxes.jerk },
    { name: 'Sentadilla Frontal',sets: 4, reps: 4, pct: 0.75, max: maxes.front_squat },
  ];

  const macroPct = Math.round((macrocycle.week / macrocycle.total_weeks) * 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Belt / XP derivation
  const fitness = athlete.prior_fitness ?? 60;
  const beltIdx = Math.min(BELTS.length - 1, Math.floor(fitness / 15));
  const belt = BELTS[beltIdx];
  const beltNext = BELTS[Math.min(BELTS.length - 1, beltIdx + 1)];
  const xpNow = Math.round((fitness * 1500));
  const xpCurrentBase = beltIdx * 22500;
  const xpNextBase = (beltIdx + 1) * 22500;
  const xpPct = Math.max(4, Math.min(100, Math.round(((xpNow - xpCurrentBase) / (xpNextBase - xpCurrentBase)) * 100)));

  return (
    <div style={{ background: 'var(--bg)', paddingBottom: 90, minHeight: '100%' }}>

      {/* HEADER */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '.04em' }}>
            {greeting} · {formatDate(new Date())}
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.15, marginTop: 2 }}>
            {firstName}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: `${belt.color}1a`, border: `1px solid ${belt.color}66`, borderRadius: 20, padding: '4px 10px',
          }}>
            <span style={{ fontSize: 9, color: belt.color, fontWeight: 800, letterSpacing: '.08em' }}>
              CINTURÓN {belt.name}
            </span>
          </div>
          <button
            onClick={() => navigate('PROFILE')}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--primary),#3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: 'var(--bg)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(0,0,0,.25)',
            }}
          >
            {firstName[0]}{lastInitial}
          </button>
        </div>
      </div>

      {/* HERO — readiness ring */}
      <div style={{
        padding: '16px 20px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: readiness !== null
          ? `radial-gradient(circle at 50% 40%, ${rc}1f 0%, transparent 60%)`
          : 'transparent',
      }}>
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
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{athlete.weight_class}</span>
          </div>
        )}
      </div>

      {/* PÍLDORAS — story-style rings con emojis grandes */}
      <div style={{ padding: '0 20px 20px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Píldoras de hoy
        </p>
        <div className="scroll-x-no-bar" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {PILDORAS.map((p) => (
            <button
              key={p.label}
              onClick={() => navigate('PILLS')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', padding: 0,
              }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                padding: p.active ? 2.5 : 2,
                background: p.ring,
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'var(--surface)',
                  border: '2px solid var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  opacity: p.active ? 1 : 0.55,
                }}>
                  {p.emoji}
                </div>
              </div>
              <span style={{ fontSize: 10, color: p.active ? 'var(--text-secondary)' : 'var(--text-secondary)', opacity: p.active ? 1 : 0.6, fontWeight: 600 }}>
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* OLY INDEX + RACHA row */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 12 }}>
        <button
          onClick={() => navigate('INDEX')}
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--card-border)',
            borderRadius: 20, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>
            OLY Index
          </p>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', letterSpacing: '-.03em', lineHeight: 1 }}>
            {olyIndex}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
            Top 23% del club
          </p>
        </button>
        <div style={{
          flex: 1, background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 20, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>
            Racha
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#f97316', letterSpacing: '-.03em', lineHeight: 1 }}>
              {sesiones}
            </span>
            <span style={{ fontSize: 10, color: '#92400e', fontWeight: 800, letterSpacing: '.08em' }}>SEM</span>
          </div>
        </div>
      </div>

      {/* BELT / XP PROGRESS */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 20, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                XP · {belt.name} → {beltNext.name}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {xpNow.toLocaleString('es')}{' '}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>/ {xpNextBase.toLocaleString('es')} XP</span>
              </p>
            </div>
            <div style={{
              background: `${beltNext.color}1a`, border: `1px solid ${beltNext.color}55`,
              borderRadius: 10, padding: '4px 8px',
            }}>
              <span style={{ fontSize: 11, color: beltNext.color, fontWeight: 800 }}>{xpPct}%</span>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--card-border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: `linear-gradient(90deg, ${belt.color}, ${beltNext.color})`,
              width: `${xpPct}%`, transition: 'width .8s ease',
            }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            {(xpNextBase - xpNow).toLocaleString('es')} XP para {beltNext.name}
          </p>
        </div>
      </div>

      {/* MACRO progress slim */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text)', fontWeight: 700 }}>{macrocycle.program_name}</p>
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

      {/* SESIÓN DE HOY */}
      <div style={{ padding: '0 20px 20px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
          Sesión de hoy · Semana {macrocycle.week} · Día {macrocycle.day}
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 22, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08), transparent)',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {macrocycle.program_name} · {macrocycle.focus}
              </p>
              <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>
                {sessionExercises.length} ejercicios
              </p>
            </div>
            {injuries && injuries.length > 0 ? (
              <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: 20, fontWeight: 800, letterSpacing: '.06em', border: '1px solid rgba(239,68,68,0.3)' }}>
                CARGA
              </span>
            ) : (
              <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.12)', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, fontWeight: 800, letterSpacing: '.06em', border: '1px solid rgba(34,197,94,0.25)' }}>
                VERDE
              </span>
            )}
          </div>

          <div style={{ padding: '4px 16px' }}>
            {sessionExercises.map((ex, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < sessionExercises.length - 1 ? '1px solid var(--card-border)' : 'none',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ex.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {ex.sets}×{ex.reps} @ <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(ex.max * ex.pct)}kg</strong>{' '}
                    <span style={{ color: 'var(--primary)' }}>({Math.round(ex.pct * 100)}% 1RM)</span>
                  </p>
                </div>
                {i < 2 ? <span style={{ fontSize: 18 }}>⭐</span> : <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>+ más</span>}
              </div>
            ))}
          </div>

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
                fontFamily: 'inherit',
              }}
            >
              Iniciar Sesión →
            </button>
          </div>
        </div>
      </div>

      {/* INJURY SHIELD */}
      {injuries && injuries.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          <div
            onClick={() => navigate('PERFORMANCE')}
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: 20, padding: 14,
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: '#f87171', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>Injury Shield</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{String(injuries[0])}</p>
            </div>
            <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700, border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '4px 8px' }}>Ver →</span>
          </div>
        </div>
      )}

      {/* PULSE WIDGET — gradiente índigo destacado */}
      <div style={{ padding: '0 20px 18px' }}>
        <div
          onClick={() => navigate('PULSE')}
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.08))',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 20, padding: 16,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(99,102,241,0.12)',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>⚡</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Reto Semanal Pulse
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
              Snatch técnico · {maxes.snatch - 10}kg
            </p>
            <p style={{ fontSize: 10, color: '#818cf8', marginTop: 2 }}>
              Caduca domingo · +300 XP
            </p>
          </div>
          <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700, border: '1px solid rgba(99,102,241,0.5)', borderRadius: 8, padding: '4px 8px' }}>
            Ver →
          </span>
        </div>
      </div>

      {/* ESTA SEMANA */}
      <div style={{ padding: '0 20px 24px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
          Esta semana
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 18, padding: '16px 18px',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.03em', lineHeight: 1 }}>{sesiones}</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>Sesiones</p>
          </div>
          <div style={{ width: 1, background: 'var(--card-border)' }} />
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', letterSpacing: '-.03em', lineHeight: 1 }}>
              {tonelaje.toFixed(1)}<span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 2 }}>t</span>
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>Volumen</p>
          </div>
          <div style={{ width: 1, background: 'var(--card-border)' }} />
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-.03em', lineHeight: 1 }}>+{sesiones * 250}</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>XP</p>
          </div>
        </div>
      </div>

      <WiseAssistant context="Holy Oly · Dashboard Atleta" />
    </div>
  );
};

export default AtletaHome;

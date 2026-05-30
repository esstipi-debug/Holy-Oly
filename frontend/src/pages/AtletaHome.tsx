import React, { useEffect, useMemo, useState } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useNav } from '../context/NavigationContext';
import WiseAssistant from '../components/WiseAssistant';
import MetricHistoryModal, { type MetricType } from '../components/MetricHistoryModal';
import WellnessButton from '../components/WellnessButton';
import MacrocycleExplorer from '../components/MacrocycleExplorer';
import { getPendingForToday, getPendingForTodayAsync, setActiveSlot } from '../lib/plannedSessions';
import type { PlannedSession, TrainingSlot } from '../types/training';

const ringColor = (r: number) => r >= 70 ? '#22C55E' : r >= 50 ? '#F59E0B' : '#EF4444';
const ringLabel = (r: number) => r >= 70 ? 'Listo para carga alta' : r >= 50 ? 'Carga moderada' : 'Tu cuerpo pide descanso';
const ringTag = (r: number) => r >= 70 ? 'ÓPTIMO' : r >= 50 ? 'MODERADO' : 'BAJO';
const EMPTY_LABEL = 'Completá tu check-in diario para ver tu readiness real';
const EMPTY_TAG = '—';

const RADIUS = 86;
const STROKE = 10;
const CIRCUM = 2 * Math.PI * RADIUS;


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
  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null);
  if (!athlete) return null;

  const { macrocycle, maxes, injuries } = athlete;
  const firstName = athlete.name.split(' ')[0];
  const lastInitial = athlete.name.split(' ')[1]?.[0] ?? '';

  const readiness = stress ? Math.round(stress.readiness) : null;
  const rc = readiness !== null ? ringColor(readiness) : 'var(--text-secondary)';
  const rl = stressLoading ? 'Calculando…' : (readiness !== null ? ringLabel(readiness) : EMPTY_LABEL);
  const rtag = readiness !== null ? ringTag(readiness) : (stressLoading ? '—' : EMPTY_TAG);

  const completedSessions = athlete.sessions_last_7.filter((s) => s.completed);
  const sesiones = completedSessions.length;
  const tonelaje = completedSessions.reduce((acc, s) => acc + (s.load ?? 0) / 1000, 0);


  const sessionExercises = [
    { name: 'Arrancada',         sets: 5, reps: 3, pct: 0.85, max: maxes.snatch },
    { name: 'Clean & Jerk',      sets: 4, reps: 2, pct: 0.80, max: maxes.jerk },
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

  // Belt ceremony trigger: si subió de cinturón desde la última celebración, dispará la fullscreen.
  useEffect(() => {
    let lastCelebrated = -1;
    try {
      const raw = localStorage.getItem('belt:last_celebrated_idx');
      lastCelebrated = raw === null ? beltIdx - 1 : parseInt(raw, 10);
      // Si nunca se celebró nada (raw null), seedeamos con beltIdx-1 para que el siguiente up sí dispare.
      if (raw === null) {
        try { localStorage.setItem('belt:last_celebrated_idx', String(Math.max(0, beltIdx))); } catch { /* ignore */ }
        return;
      }
    } catch { /* ignore */ }
    if (beltIdx > lastCelebrated) {
      navigate('BELT_CEREMONY');
    }
  }, [beltIdx, navigate]);

  return (
    <div className="anim-fade-in" style={{ background: 'var(--bg)', paddingBottom: 90, minHeight: '100%' }}>

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
        <button
          onClick={() => { if (readiness !== null) setActiveMetric('readiness'); }}
          disabled={readiness === null}
          aria-label="Ver historial de readiness"
          style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', padding: 0, cursor: readiness !== null ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
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
        </button>
        <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginTop: 18, textAlign: 'center', maxWidth: 280 }}>
          {rl}
        </p>
        {stress && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <button
              onClick={() => setActiveMetric('fitness')}
              className="btn-press"
              style={{
                fontSize: 11, color: 'var(--text-secondary)',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 14, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Fitness <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(stress.fitness)}</strong>
            </button>
            <button
              onClick={() => setActiveMetric('fatigue')}
              className="btn-press"
              style={{
                fontSize: 11, color: 'var(--text-secondary)',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 14, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Fatiga <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(stress.fatigue)}</strong>
            </button>
            {stress.cns_score != null && (
              <button
                onClick={() => setActiveMetric('cns')}
                className="btn-press"
                style={{
                  fontSize: 11, color: 'var(--text-secondary)',
                  background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
                  borderRadius: 14, padding: '4px 10px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                CNS <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(stress.cns_score)}</strong>
              </button>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{athlete.weight_class}</span>
          </div>
        )}
      </div>

      {/* ranking semanal (Top 10) · removido · pedido del Boss */}

      {/* Sesión de hoy · explorador con diseño de discos (carta del día + flechas ◀▶ + curva + iconos HOLY OLY) */}
      <div style={{ padding: '0 20px 16px' }}>
        <MacrocycleExplorer />
      </div>

      {/* WISE SCORE — surfacing del puntaje "smart trainer" del engine */}
      {stress && (
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>
              Wise Score · entrenás con criterio
            </p>
            <WellnessButton
              variant="pill"
              currentReadiness={stress.readiness}
              historyMetric="readiness"
            />
          </div>
          {(() => {
            const wise = Math.round(stress.readiness);
            const wiseColor = wise >= 70 ? '#22C55E' : wise >= 50 ? '#F59E0B' : '#EF4444';
            const wiseLabel = wise >= 70 ? 'Smart trainer ✓' : wise >= 50 ? 'Carga consciente' : 'Forzando · ajustá';
            const sessions = athlete.sessions_last_7 ?? [];
            const last3 = sessions.slice(-3);
            const chips = last3.length === 3 ? last3.map((s, i) => {
              const delta = s.completed ? (s.rpe_reported && s.rpe_reported <= 7 ? '+30' : s.rpe_reported && s.rpe_reported >= 9 ? '−20' : '+10') : '−15';
              const sub = s.completed
                ? (s.rpe_reported && s.rpe_reported <= 7 ? 'Carga safe' : s.rpe_reported && s.rpe_reported >= 9 ? 'RPE alto ⚠' : `RPE ${s.rpe_reported ?? '–'}`)
                : 'Skip';
              const isPos = delta.startsWith('+');
              return { day: i === 0 ? 'Hace 3d' : i === 1 ? 'Hace 2d' : 'Ayer', val: delta, sub, color: isPos ? '#22C55E' : '#EF4444', border: isPos ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)' };
            }) : [];
            return (
              <div style={{
                background: `${wiseColor}0F`,
                border: `1px solid ${wiseColor}33`,
                borderRadius: 18, padding: 14, position: 'relative',
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMetric('stress');
                  }}
                  aria-label="Ver historial de stress"
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 26, height: 26, borderRadius: '50%',
                    background: `${wiseColor}22`, border: `1px solid ${wiseColor}55`,
                    color: wiseColor, fontSize: 11, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontFamily: 'inherit', zIndex: 1,
                  }}
                >ⓘ</button>
                <button
                  onClick={() => navigate('PULSE')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', padding: 0, textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: `4px solid ${wiseColor}`,
                    background: `radial-gradient(circle, ${wiseColor}1A, transparent)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: `0 0 18px ${wiseColor}33`,
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: wiseColor, lineHeight: 1 }}>{wise}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: `${wiseColor}AA`, letterSpacing: '.04em' }}>WISE</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: wiseColor, marginBottom: 4 }}>{wiseLabel}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Puntos por seguir las recomendaciones del engine y no sobre-entrenarte.
                    </div>
                  </div>
                </button>
                {chips.length === 3 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                    {chips.map((d) => (
                      <div key={d.day} style={{
                        flex: 1, background: 'var(--surface)',
                        border: `1px solid ${d.border}`, borderRadius: 10,
                        padding: 8, textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 3 }}>{d.day}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: d.color }}>{d.val}</div>
                        <div style={{ fontSize: 8, color: 'var(--text-secondary)' }}>{d.sub}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* píldoras del día · removido · pedido del Boss */}

      {/* skill tree · removido · pedido del Boss */}

      {/* oly index + racha · removido · pedido del Boss */}

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

      {/* quests de la semana · removido · pedido del Boss */}

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

      {/* DOBLE SESIÓN · si el coach asignó AM + PM hoy */}
      <DoubleSessionCards athleteId={athlete.id} maxes={maxes} onStart={() => navigate('WARMUP')} />

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

      {/* ESTA SEMANA · tappable → HO_STATS para ver volumen + IMR + zona en detalle */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Esta semana
          </p>
          <button
            onClick={() => navigate('HO_STATS')}
            className="btn-press"
            style={{
              fontSize: 10, fontWeight: 800, color: '#F59E0B', letterSpacing: '.06em',
              background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 16, padding: '4px 10px',
              cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase',
            }}
          >Ver detalle →</button>
        </div>
        <button
          onClick={() => navigate('HO_STATS')}
          className="btn-press"
          style={{
            width: '100%',
            background: 'var(--surface)', border: '1px solid var(--card-border)',
            borderRadius: 18, padding: '16px 18px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.03em', lineHeight: 1, fontStyle: 'italic' }}>{sesiones}</p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Sesiones</p>
          </div>
          <div style={{ textAlign: 'left', borderLeft: '1px solid var(--card-border)', paddingLeft: 8 }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#F59E0B', letterSpacing: '-.03em', lineHeight: 1, fontStyle: 'italic' }}>
              {tonelaje.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 2, fontStyle: 'normal' }}>t</span>
            </p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Volumen</p>
          </div>
          <div style={{ textAlign: 'left', borderLeft: '1px solid var(--card-border)', paddingLeft: 8 }}>
            {(() => {
              const rpes = completedSessions.map(s => s.rpe_reported).filter(r => r > 0);
              const avgRpe = rpes.length > 0 ? rpes.reduce((a,b)=>a+b,0)/rpes.length : 0;
              const imr = avgRpe >= 9 ? 88 : avgRpe >= 8 ? 80 : avgRpe >= 7 ? 72 : avgRpe >= 6 ? 65 : 0;
              const imrColor = imr >= 85 ? '#EF4444' : imr >= 75 ? '#F59E0B' : imr > 0 ? '#22C55E' : 'var(--text-secondary)';
              return (
                <>
                  <p style={{ fontSize: 22, fontWeight: 900, color: imrColor, letterSpacing: '-.03em', lineHeight: 1, fontStyle: 'italic' }}>
                    {imr || '—'}<span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 1, fontStyle: 'normal' }}>%</span>
                  </p>
                  <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>IMR · 1RM</p>
                </>
              );
            })()}
          </div>
          <div style={{ textAlign: 'left', borderLeft: '1px solid var(--card-border)', paddingLeft: 8 }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-.03em', lineHeight: 1, fontStyle: 'italic' }}>+{sesiones * 250}</p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>XP</p>
          </div>
        </button>
      </div>

      <WiseAssistant context="Holy Oly · Dashboard Atleta" />

      {/* MODAL · historial 14d de la métrica seleccionada */}
      {activeMetric && stress && (
        <MetricHistoryModal
          metric={activeMetric}
          currentValue={
            activeMetric === 'readiness' ? stress.readiness
            : activeMetric === 'fitness' ? stress.fitness
            : activeMetric === 'fatigue' ? stress.fatigue
            : activeMetric === 'cns' ? (stress.cns_score ?? 50)
            : stress.fitness  // 'stress' usa CTL (fitness) como aproximación de carga acumulada
          }
          onClose={() => setActiveMetric(null)}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// DoubleSessionCards
// Si el coach asignó 2 sesiones (am + pm) hoy → muestra 2 cards stacked.
// Si asignó 1 (full) → renderiza 1 card.
// Si no asignó nada → no renderiza (deja que la sección hardcoded muestre).
// ──────────────────────────────────────────────────────────────────

interface DoubleSessionCardsProps {
  athleteId: string;
  maxes: { snatch: number; clean: number; jerk: number; back_squat: number; front_squat: number };
  onStart: () => void;
}

const SLOT_LABEL: Record<TrainingSlot, string> = { am: 'AM · Mañana', pm: 'PM · Tarde', full: 'Sesión' };
const FOCUS_EMOJI: Record<string, string> = {
  olympic: '🏋️', technique: '🎯', strength: '💪', accessory: '🧰', metcon: '🔥',
};

const DoubleSessionCards: React.FC<DoubleSessionCardsProps> = ({ athleteId, maxes, onStart }) => {
  const [pending, setPending] = useState<PlannedSession[]>([]);

  // Sync (localStorage) + async (backend) refresh.
  // Local primero para UX instantánea · backend mergea cuando llega.
  const refreshSync = useMemo(() => () => setPending(getPendingForToday(athleteId)), [athleteId]);
  const refreshAsync = useMemo(() => async () => {
    try {
      const merged = await getPendingForTodayAsync(athleteId);
      setPending(merged);
    } catch {
      // Sin backend → ya tenemos lo de localStorage
    }
  }, [athleteId]);

  useEffect(() => {
    refreshSync();
    refreshAsync();
    const onStorage = () => refreshSync();
    window.addEventListener('storage', onStorage);
    // Poll suave: localStorage cada 1.5s · backend cada 30s
    const localId = window.setInterval(refreshSync, 1500);
    const remoteId = window.setInterval(refreshAsync, 30000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(localId);
      window.clearInterval(remoteId);
    };
  }, [refreshSync, refreshAsync]);

  if (pending.length === 0) return null;

  const handlePick = (slot: TrainingSlot) => {
    setActiveSlot(slot);
    onStart();
  };

  const isDouble = pending.length === 2 && pending.some(s => s.slot === 'am') && pending.some(s => s.slot === 'pm');

  const HO_GOLD = '#F5C518';

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
        {isDouble ? 'Doble sesión · hoy' : 'Sesión asignada · hoy'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pending
          .slice()
          .sort((a, b) => (a.slot === 'am' ? -1 : b.slot === 'am' ? 1 : 0))
          .map(s => {
            const avgPct = s.exercises.reduce((a, e) => a + e.pct, 0) / Math.max(1, s.exercises.length);
            const totalKg = s.exercises.reduce((acc, e) => acc + Math.round((maxes[e.max_key] ?? 0) * e.pct), 0);
            const statusColor =
              s.status === 'completed' ? '#22C55E' :
              s.status === 'in_progress' ? HO_GOLD :
              'var(--text-secondary)';
            const statusLabel =
              s.status === 'completed' ? '✓ Completada' :
              s.status === 'in_progress' ? '🏃 En curso' :
              '⏸ Pendiente';
            return (
              <button
                key={`${s.date}-${s.slot}`}
                onClick={() => handlePick(s.slot)}
                className="btn-press"
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'var(--surface)',
                  border: `1px solid ${s.slot === 'am' ? `${HO_GOLD}55` : 'rgba(124,92,255,0.45)'}`,
                  borderRadius: 18, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: s.slot === 'am' ? `${HO_GOLD}22` : 'rgba(124,92,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {FOCUS_EMOJI[s.focus] ?? '💪'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.01em' }}>
                      {SLOT_LABEL[s.slot]}
                    </p>
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                      {s.focus}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    {s.exercises.length} ejerc · ~{Math.round(avgPct * 100)}% · {totalKg}kg total
                  </p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: statusColor, marginTop: 4 }}>
                    {statusLabel}
                  </p>
                </div>
                <span style={{ fontSize: 16, color: HO_GOLD, fontWeight: 900 }}>→</span>
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default AtletaHome;

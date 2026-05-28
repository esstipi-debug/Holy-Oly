import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useAthlete } from '../context/AthleteContext';
import AthleteTrainingView from '../components/AthleteTrainingView';
import DeviationsCard from '../components/DeviationsCard';
import WeeklyAnalysisCharts from '../components/WeeklyAnalysisCharts';
import { useAthleteStress, fallbackReadiness } from '../hooks/useAthleteStress';

const AthleteDeepDive: React.FC = () => {
  const { navigate } = useNav();
  const { product } = useProduct();
  const { selectedAthlete, athlete: currentAthlete } = useAthlete();
  const a = selectedAthlete ?? currentAthlete;
  const { stress: athleteStress, loading: stressLoading } = useAthleteStress(a);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const sendFeedback = () => {
    if (!feedbackMsg.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackSent(false);
      setFeedbackMsg('');
    }, 1500);
  };

  if (!a) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100%', padding: 40, color: 'var(--text-secondary)', textAlign: 'center' }}>
        <p style={{ fontSize: 13 }}>Seleccioná un atleta desde el panel de coach.</p>
        <button
          onClick={() => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH')}
          style={{
            marginTop: 14, padding: '10px 18px', borderRadius: 12,
            background: 'var(--primary)', color: 'var(--bg)',
            border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Ir al panel de coach →</button>
      </div>
    );
  }

  const completed = a.sessions_last_7.filter(s => s.completed);
  // Engine real (Banister) si está disponible; sino fórmula local proxy.
  const readiness = athleteStress ? athleteStress.readiness : fallbackReadiness(a);
  // Para fatigue label/color usamos el ratio fatigue/fitness del engine si lo tenemos.
  const fitnessVal = athleteStress?.fitness ?? a.prior_fitness;
  const fatigueVal = athleteStress?.fatigue ?? a.prior_fatigue;
  const ratio = fatigueVal / Math.max(fitnessVal, 1);
  const fatigueLabel = ratio > 1.1 ? 'CRASH' : ratio > 0.9 ? 'ALTO' : ratio > 0.7 ? 'NORMAL' : 'BAJO';
  const fatigueColor = ratio > 0.9 ? '#EF4444' : ratio > 0.7 ? '#F59E0B' : '#22C55E';
  const restHours = ratio > 1.1 ? 48 : ratio > 0.9 ? 24 : 0;
  const consistency = a.sessions_last_7.length > 0
    ? Math.round((completed.length / a.sessions_last_7.length) * 100)
    : 0;
  const cnsZone = athleteStress?.cns_zone ?? null;
  const isEngineReal = !!athleteStress;

  // Carga semanal: ATL (acute) approximation per día
  const loads = a.sessions_last_7.map(s => s.load);
  const totalLoad = loads.reduce((s, v) => s + v, 0);
  const maxLoad = Math.max(...loads, 1);
  const hasLoadData = a.sessions_last_7.length > 0 && totalLoad > 0;
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const rmList = [
    { lift: 'Arrancada',         rm: `${a.maxes.snatch} kg`,      change: '+2kg', date: '5d' },
    { lift: 'Clean & Jerk',      rm: `${a.maxes.clean + a.maxes.jerk - a.maxes.clean} kg`, change: '+5kg', date: '2d' },
    { lift: 'Cargada',           rm: `${a.maxes.clean} kg`,       change: '+3kg', date: '1w' },
    { lift: 'Sentadilla Atrás',  rm: `${a.maxes.back_squat} kg`,  change: '0kg',  date: '1w' },
    { lift: 'Sentadilla Frontal',rm: `${a.maxes.front_squat} kg`, change: '+1kg', date: '4d' },
  ];

  const initials = a.name.split(' ').slice(0, 2).map(n => n[0]).join('');

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 110 }}>

      {/* HEADER */}
      <div style={{
        padding: '52px 20px 22px',
        background: 'linear-gradient(180deg, var(--surface), transparent)',
        borderBottom: '1px solid var(--card-border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '.1em',
            padding: '4px 10px', borderRadius: 10,
            background: a.injuries?.length ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            color: a.injuries?.length ? '#f87171' : '#4ade80',
            border: `1px solid ${a.injuries?.length ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
          }}>{a.injuries?.length ? 'LESIÓN ACTIVA' : 'ACTIVO'}</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.06em' }}>
            {a.club}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--primary), #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'var(--bg)',
          }}>{initials}</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' }}>
              {a.name}
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>
              {a.macrocycle.program_name}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, letterSpacing: '.04em' }}>
                {a.age} años
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>·</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>
                {a.weight_class}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>·</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>
                {a.maxes.body_weight}kg
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{
            background: 'var(--surface)', border: `1px solid ${fatigueColor}33`, borderRadius: 16, padding: 14,
          }}>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Fatiga (Banister) {stressLoading && <span style={{ color: '#F59E0B' }}>· …</span>}
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, color: fatigueColor, letterSpacing: '-.02em', lineHeight: 1 }}>
              {fatigueLabel}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
              {restHours > 0 ? `Descanso sugerido: ${restHours}h` : 'Sin alertas'}
            </p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, opacity: 0.7 }}>
              F {fitnessVal.toFixed(0)} · Ftg {fatigueVal.toFixed(0)}
            </p>
          </div>
          <div style={{
            background: 'var(--surface)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 14,
          }}>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Readiness {isEngineReal ? '· Engine' : '· ~Local'}
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-.02em', lineHeight: 1 }}>
              {readiness.toFixed(1)}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
              Consistencia: {consistency}%
            </p>
            {cnsZone && (
              <p style={{ fontSize: 9, color: 'var(--primary)', fontWeight: 700, marginTop: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                CNS: {cnsZone}
              </p>
            )}
          </div>
        </div>

        {/* MACRO INFO */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16,
          padding: 14, marginBottom: 20,
        }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Macrociclo activo
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {a.macrocycle.focus}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Sem {a.macrocycle.week}/{a.macrocycle.total_weeks} · Día {a.macrocycle.day}
            </p>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--card-border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, var(--primary), #3B82F6)',
              width: `${Math.round((a.macrocycle.week / a.macrocycle.total_weeks) * 100)}%`,
            }} />
          </div>
        </div>

        {/* CARGA SEMANAL */}
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Carga semanal (ATL/CTL)
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16,
          padding: '14px 16px 8px', marginBottom: 20,
        }}>
          {hasLoadData ? (
            <>
              <div style={{ height: 100, display: 'flex', alignItems: 'stretch', gap: 6 }}>
                {a.sessions_last_7.map((s, i) => {
                  const pct = (s.load / maxLoad) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%',
                        height: `${Math.max(2, pct)}%`,
                        minHeight: 4,
                        background: s.completed
                          ? 'linear-gradient(180deg, var(--primary), rgba(34,197,94,0.4))'
                          : 'rgba(255,255,255,0.08)',
                        borderRadius: 4,
                        transition: 'height .6s ease',
                      }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {days.map((d, i) => (
                  <p key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700 }}>{d}</p>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              height: 116, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 22, opacity: 0.5 }}>⌛</span>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>
                Sin sesiones registradas en los últimos 7 días
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-secondary)', opacity: 0.6, textAlign: 'center' }}>
                Los datos aparecerán cuando el atleta complete entrenamientos
              </p>
            </div>
          )}
        </div>

        {/* ENTRENAMIENTO · vista del coach sobre lo que entrena el atleta */}
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Entrenamiento
        </p>
        <div style={{ marginBottom: 20 }}>
          <AthleteTrainingView athlete={a} />
        </div>

        {/* DESVÍOS DEL MACROCICLO · plan vs real con tooltip explicativo */}
        <DeviationsCard
          macroId={a.macrocycle.program_id}
          athleteId={a.id}
          weeks={4}
        />

        {/* ANÁLISIS SEMANAL · 6 mini-charts con tendencias + alerta opcional */}
        <WeeklyAnalysisCharts athleteId={a.id} weeks={8} />

        {/* RMs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            RM registradas
          </p>
          <button
            onClick={() => navigate('PERFORMANCE')}
            style={{
              fontSize: 10, color: 'var(--primary)', fontWeight: 700,
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Ver todo →</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {rmList.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '12px 14px',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.lift}</p>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>{item.date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.02em' }}>{item.rm}</p>
                <p style={{ fontSize: 10, color: item.change.startsWith('+') ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 700 }}>
                  {item.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* INJURIES if any */}
        {a.injuries && a.injuries.length > 0 && (
          <>
            <p style={{ fontSize: 10, color: '#f87171', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Lesiones activas
            </p>
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 14, padding: 14, marginBottom: 20,
            }}>
              {a.injuries.map((inj, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: i < a.injuries!.length - 1 ? 6 : 0 }}>
                  🩹 {inj}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FOOTER ACTIONS · 76 nav + safe-area iOS + 8 buffer */}
      <div style={{
        position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)', left: 16, right: 16,
        display: 'flex', gap: 8, zIndex: 40,
      }}>
        <button
          onClick={() => navigate('ASSIGN_MACRO')}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            background: 'rgba(168,85,247,0.12)', color: '#c084fc',
            border: '1px solid rgba(168,85,247,0.3)',
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            backdropFilter: 'blur(8px)',
          }}
        >Cambiar macro</button>
        <button
          onClick={() => setShowFeedback(true)}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            background: 'var(--cta-bg)', color: 'var(--cta-text)',
            border: 'none',
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Enviar feedback</button>
      </div>

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div
          onClick={() => !feedbackSent && setShowFeedback(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', background: 'var(--surface)',
              borderTop: '1px solid var(--card-border)',
              borderRadius: '20px 20px 0 0', padding: 20,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            {feedbackSent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                  Feedback enviado a {a.name.split(' ')[0]}
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                    💬 Feedback a {a.name.split(' ')[0]}
                  </p>
                  <button
                    onClick={() => setShowFeedback(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 18, cursor: 'pointer' }}
                  >✕</button>
                </div>
                <textarea
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Ej. Excelente progreso en C&J esta semana, seguí con los pulls hasta el viernes."
                  autoFocus
                  style={{
                    width: '100%', minHeight: 100, padding: 12,
                    background: 'var(--bg)', border: '1px solid var(--card-border)',
                    borderRadius: 12, color: 'var(--text)', fontSize: 13,
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={sendFeedback}
                  disabled={!feedbackMsg.trim()}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 12,
                    background: feedbackMsg.trim() ? 'var(--cta-bg)' : 'var(--surface2, transparent)',
                    color: feedbackMsg.trim() ? 'var(--cta-text)' : 'var(--text-secondary)',
                    border: feedbackMsg.trim() ? 'none' : '1px solid var(--card-border)',
                    fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                    cursor: feedbackMsg.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', opacity: feedbackMsg.trim() ? 1 : 0.6,
                  }}
                >Enviar mensaje</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteDeepDive;

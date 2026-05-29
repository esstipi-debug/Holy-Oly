import React, { useState } from 'react';
import '../styles/v2/athlete-deep-dive.css';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useAthlete } from '../context/AthleteContext';
import AthleteTrainingView from '../components/AthleteTrainingView';
import DeviationsCard from '../components/DeviationsCard';
import WeeklyAnalysisCharts from '../components/WeeklyAnalysisCharts';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import { useAthleteStress, fallbackReadiness } from '../hooks/useAthleteStress';
import { deriveRmStatus } from '../data/derive';
import { buildMacroAssignment } from '../data/macroDetail';
import { readinessInsight, SEVERITY_COLOR } from '../data/insight';
import ImrBandChart from '../components/coach/ImrBandChart';
import AcwrGauge from '../components/coach/AcwrGauge';
import TransitionSheet from '../components/coach/TransitionSheet';
import CompetitionsCard from '../components/coach/CompetitionsCard';

/** Readiness (0-10) → tier disc (halterofilia plates). Same semantics as CoachStatsHO. */
const readinessToTier = (r: number): PlateTier => {
  if (r >= 8.5) return 'red';
  if (r >= 7) return 'blue';
  if (r >= 5.5) return 'yellow';
  if (r >= 4) return 'green';
  return 'white';
};

const AthleteDeepDive: React.FC = () => {
  const { navigate } = useNav();
  const { product } = useProduct();
  const { selectedAthlete, athlete: currentAthlete, updateMacro } = useAthlete();
  const a = selectedAthlete ?? currentAthlete;
  const { stress: athleteStress, loading: stressLoading } = useAthleteStress(a);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

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
      <div className="add-root">
        <div className="add-empty">
          <div className="add-empty-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <p>Seleccioná un atleta desde el panel de coach.</p>
          <button
            className="add-empty-btn"
            onClick={() => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH')}
          >Ir al panel de coach →</button>
        </div>
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

  // ACWR (agudo:crónico) desde loads reales: aguda = media de las últimas 3
  // sesiones completadas, crónica = media de la ventana. Zona segura 0.8-1.3.
  const completedLoads = completed.map(s => s.load);
  const acuteArr = completedLoads.slice(-3);
  const acute = acuteArr.length ? acuteArr.reduce((s, v) => s + v, 0) / acuteArr.length : 0;
  const chronic = completedLoads.length ? completedLoads.reduce((s, v) => s + v, 0) / completedLoads.length : 0;
  const acwr = chronic > 0 ? acute / chronic : 1;

  // RM por lift · 1:1 con a.maxes (sin duplicar C&J). Cambio/fecha del último
  // test derivados de forma determinística del 1RM real + id (data/derive.ts).
  const rmList = [
    { lift: 'Arrancada',          key: 'snatch',      kg: a.maxes.snatch },
    { lift: 'Cargada',            key: 'clean',       kg: a.maxes.clean },
    { lift: 'Envión',             key: 'jerk',        kg: a.maxes.jerk },
    { lift: 'Sentadilla Atrás',   key: 'back_squat',  kg: a.maxes.back_squat },
    { lift: 'Sentadilla Frontal', key: 'front_squat', kg: a.maxes.front_squat },
  ].map(({ lift, key, kg }) => {
    const st = deriveRmStatus(a.id, key, kg);
    return { lift, rm: `${kg} kg`, change: st.change, date: st.date };
  });

  const initials = a.name.split(' ').slice(0, 2).map(n => n[0]).join('');

  const readinessTier = readinessToTier(readiness);

  return (
    <div className="add-root">

      {/* HEADER */}
      <div className="add-header">
        <span className="br" />
        <span className="br br-r" />
        <div className="add-header-top">
          <span className="add-chip" data-injured={a.injuries?.length ? 'true' : 'false'}>
            <span className="pip" />
            {a.injuries?.length ? 'Lesión activa' : 'Activo'}
          </span>
          <span className="add-club">{a.club}</span>
        </div>

        <div className="add-id">
          <div className="add-avatar">{initials}</div>
          <div className="add-id-meta">
            <h1 className="add-name">{a.name}</h1>
            <p className="add-program">{a.macrocycle.program_name}</p>
            <div className="add-tags">
              <span className="age">{a.age} años</span>
              <span className="dot">·</span>
              <span className="t">{a.weight_class}</span>
              <span className="dot">·</span>
              <span className="t">{a.maxes.body_weight}kg</span>
            </div>
          </div>
          <div className="add-tier">
            <PlateBadge tier={readinessTier} size={44} />
            <span className="add-tier-lbl">Nivel</span>
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="add-metrics">
        <div className="add-metric" style={{ ['--mc' as string]: fatigueColor }}>
          <span className="br" />
          <p className="add-metric-eyebrow">
            Fatiga (Banister) {stressLoading && <span className="wait">· …</span>}
          </p>
          <p className="add-metric-val txt">{fatigueLabel}</p>
          <p className="add-metric-note">
            {restHours > 0 ? `Descanso sugerido: ${restHours}h` : 'Sin alertas'}
          </p>
          <p className="add-metric-sub">
            F {fitnessVal.toFixed(0)} · Ftg {fatigueVal.toFixed(0)}
          </p>
        </div>
        <div className="add-metric" style={{ ['--mc' as string]: 'var(--engine-oly)' }}>
          <span className="br" />
          <p className="add-metric-eyebrow">
            Readiness {isEngineReal ? '· Engine' : '· ~Local'}
          </p>
          <p className="add-metric-val">{readiness.toFixed(1)}</p>
          <p className="add-metric-note">Consistencia: {consistency}%</p>
          {cnsZone && (
            <p className="add-metric-cns">CNS: {cnsZone}</p>
          )}
        </div>
      </div>

      {/* LECTURA · insight de readiness (spec §2.5 · 1 línea coloreada por severidad) */}
      {(() => {
        const ins = readinessInsight(readiness);
        return (
          <div style={{
            margin: '0 0 16px', padding: '9px 12px', borderRadius: 10,
            background: 'var(--surface)', border: `1px solid ${SEVERITY_COLOR[ins.severity]}40`,
            fontSize: 11, fontWeight: 600, color: SEVERITY_COLOR[ins.severity], lineHeight: 1.4,
          }}>
            <span style={{ color: '#F5C518' }}>✦ </span>{ins.text}
          </div>
        );
      })()}

      {/* MACRO INFO */}
      <div className="add-section">
        <div className="add-section-head">
          <h3>Macrociclo activo</h3>
          <button className="add-link-btn" onClick={() => setShowTransition(true)}>Cambiar días →</button>
        </div>
        <div className="add-card">
          <div className="add-macro-row">
            <p className="add-macro-focus">{a.macrocycle.focus}</p>
            <p className="add-macro-meta">
              Sem {a.macrocycle.week}/{a.macrocycle.total_weeks} · Día {a.macrocycle.day}
            </p>
          </div>
          <div className="add-progress">
            <div
              className="add-progress-fill"
              style={{ width: `${Math.round((a.macrocycle.week / a.macrocycle.total_weeks) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* COMPETENCIAS OBJETIVO · planificador de picos (Approach C) */}
      <CompetitionsCard athlete={a} onPlan={() => navigate('ASSIGN_MACRO')} />

      {/* CARGA SEMANAL */}
      <div className="add-section">
        <div className="add-section-head">
          <h3>Carga semanal</h3>
          <span className="meta">ATL/CTL</span>
        </div>
        <div className="add-card">
          {hasLoadData ? (
            <>
              <div className="add-load-chart">
                {a.sessions_last_7.map((s, i) => {
                  const pct = (s.load / maxLoad) * 100;
                  return (
                    <div key={i} className="add-load-col">
                      <div
                        className="add-load-bar"
                        data-done={s.completed ? 'true' : 'false'}
                        style={{ height: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="add-load-days">
                {days.map((d, i) => (
                  <p key={i}>{d}</p>
                ))}
              </div>
            </>
          ) : (
            <div className="add-load-empty">
              <span className="icon">⌛</span>
              <p className="t1">Sin sesiones registradas en los últimos 7 días</p>
              <p className="t2">Los datos aparecerán cuando el atleta complete entrenamientos</p>
            </div>
          )}
        </div>
      </div>

      {/* ③ ACWR · riesgo de lesión (spec §4.1③) */}
      <AcwrGauge acwr={acwr} />

      {/* ① IMR vs banda de fase · gráfico estrella del coach (spec §4.1①) */}
      <ImrBandChart athleteId={a.id} programId={a.macrocycle.program_id} currentWeek={a.macrocycle.week} />

      {/* ENTRENAMIENTO · vista del coach sobre lo que entrena el atleta */}
      <div className="add-section">
        <div className="add-section-head">
          <h3>Entrenamiento</h3>
        </div>
        {/* SHARED component — rendered as-is (same props), gets its own V2 pass later */}
        <AthleteTrainingView athlete={a} />
      </div>

      {/* SHARED components — rendered as-is (same props), get their own V2 pass later */}
      {/* DESVÍOS DEL MACROCICLO · plan vs real con tooltip explicativo */}
      <DeviationsCard
        macroId={a.macrocycle.program_id}
        athleteId={a.id}
        weeks={4}
      />

      {/* ANÁLISIS SEMANAL · 6 mini-charts con tendencias + alerta opcional */}
      <WeeklyAnalysisCharts athleteId={a.id} weeks={8} />

      {/* RMs */}
      <div className="add-section">
        <div className="add-section-head">
          <h3>RM registradas</h3>
          <button className="add-link-btn" onClick={() => navigate('PERFORMANCE')}>Ver todo →</button>
        </div>
        <div className="add-rm-list">
          {rmList.map((item, i) => (
            <div key={i} className="add-rm">
              <div>
                <p className="add-rm-lift">{item.lift}</p>
                <p className="add-rm-date">{item.date}</p>
              </div>
              <div>
                <p className="add-rm-val">{item.rm}</p>
                <p className="add-rm-change" data-up={item.change.startsWith('+') ? 'true' : 'false'}>
                  {item.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INJURIES if any */}
      {a.injuries && a.injuries.length > 0 && (
        <div className="add-section">
          <div className="add-section-head">
            <h3 className="danger">Lesiones activas</h3>
          </div>
          <div className="add-injuries">
            {a.injuries.map((inj, i) => (
              <div key={i} className="add-injury">🩹 {inj}</div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS · 76 nav + safe-area iOS + 8 buffer */}
      <div className="add-actions">
        <button className="add-action secondary" onClick={() => navigate('ASSIGN_MACRO')}>
          Cambiar macro
        </button>
        <button className="add-action primary" onClick={() => setShowFeedback(true)}>
          Enviar feedback
        </button>
      </div>

      {/* TRANSICIÓN DE DÍAS · asistente (macro afín + week picker) */}
      <TransitionSheet
        open={showTransition}
        onClose={() => setShowTransition(false)}
        athleteName={a.name}
        currentProgramId={a.macrocycle.program_id}
        currentProgramName={a.macrocycle.program_name}
        currentWeek={a.macrocycle.week}
        currentTotal={a.macrocycle.total_weeks}
        onApply={(programId, startWeek) => updateMacro(a.id, buildMacroAssignment(programId, startWeek))}
      />

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div
          className="add-scrim"
          onClick={() => !feedbackSent && setShowFeedback(false)}
        >
          <div className="add-sheet" onClick={(e) => e.stopPropagation()}>
            {feedbackSent ? (
              <div className="add-sheet-sent">
                <span className="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <p>Feedback enviado a {a.name.split(' ')[0]}</p>
              </div>
            ) : (
              <>
                <div className="add-sheet-head">
                  <p className="add-sheet-title">💬 Feedback a {a.name.split(' ')[0]}</p>
                  <button className="add-sheet-close" onClick={() => setShowFeedback(false)}>✕</button>
                </div>
                <textarea
                  className="add-textarea"
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Ej. Excelente progreso en C&J esta semana, seguí con los pulls hasta el viernes."
                  autoFocus
                />
                <button
                  className="add-sheet-send"
                  onClick={sendFeedback}
                  disabled={!feedbackMsg.trim()}
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

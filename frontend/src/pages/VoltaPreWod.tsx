import React, { type CSSProperties } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import WiseAssistant from '../components/WiseAssistant';
import '../styles/v2/volta-prewod.css';

// Paleta legacy preservada SOLO para derivar los colores de estado que se
// inyectan como CSS custom properties (--m-color / --reco-color / --e-tint).
// La presentación vive en styles/v2/volta-prewod.css (.vpw-root). Estos valores
// coinciden con los tokens V2 (engine-pulse/macro/oly) para mantener coherencia.
const C = {
  cyan: '#00E5FF',
  amber: '#FFB300',
  red: '#EF4444',
  green: '#22C55E',
  muted: '#7C8BA1',
};

const Bolt: React.FC<{ size?: number }> = ({ size = 9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const Emoji: React.FC<{ children: React.ReactNode; active?: boolean; tint?: 'red' | 'amber' | 'cyan' }> = ({ children, active, tint = 'cyan' }) => {
  const tintColor = tint === 'amber' ? C.amber : tint === 'red' ? C.red : C.cyan;
  return (
    <button
      className={`vpw-emoji${active ? ' active' : ''}`}
      style={{ ['--e-tint' as string]: tintColor } as CSSProperties}
    >{children}</button>
  );
};

const VoltaPreWod: React.FC = () => {
  const { navigate } = useNav();
  const { stress, stressLoading, adaptation, adaptationLoading } = useAthlete();

  // ─── Estado real desde stress + adaptation ───
  const hrvValue = stress?.cns_score != null ? Math.round(45 + (stress.cns_score / 100) * 30) : null;
  const hrvZone = stress?.cns_zone?.toUpperCase() ?? null;
  const hrvColor = hrvZone === 'RED' ? C.red : hrvZone === 'YELLOW' || hrvZone === 'ORANGE' ? C.amber : C.green;
  const hrvBadge = hrvZone === 'RED' ? '⚠ CRIT' : hrvZone === 'YELLOW' || hrvZone === 'ORANGE' ? '⚠ WARN' : '✓ OK';
  const hrvKind: 'critical' | 'warning' = hrvZone === 'RED' ? 'critical' : 'warning';
  const sleepReadiness = stress?.readiness != null ? Math.round(stress.readiness) : null;
  const sleepColor = sleepReadiness == null ? C.muted : sleepReadiness < 50 ? C.red : sleepReadiness < 70 ? C.amber : C.green;
  const vFormCat = stress?.readiness_category?.toUpperCase() ?? null;
  const vFormColor = vFormCat === 'GREEN' || vFormCat === 'READY' || vFormCat === 'OPTIMAL'
    ? C.green
    : vFormCat === 'RED' || vFormCat === 'CRITICAL' || vFormCat === 'LOW'
      ? C.red
      : C.amber;
  const vFormBadge = vFormCat === 'GREEN' || vFormCat === 'READY' || vFormCat === 'OPTIMAL'
    ? '🟢' : vFormCat === 'RED' || vFormCat === 'CRITICAL' || vFormCat === 'LOW' ? '🔴' : '🟡';

  const zone = adaptation?.risk_zone ?? null;
  // Recomendación principal según zona
  const recoTitle = zone === 'red'
    ? '🛑 DESCANSO ACTIVO RECOMENDADO'
    : zone === 'orange'
      ? '⚠ Reducir intensidad 20-30%'
      : zone === 'yellow'
        ? '⚠ Entrenar con criterio · -10-15% volumen'
        : zone === 'green'
          ? '✓ READY · cargá fuerte'
          : adaptationLoading ? 'Calculando…' : 'Sin datos';
  const recoColor = zone === 'red' ? C.red : zone === 'orange' ? C.red : zone === 'yellow' ? C.amber : C.green;
  const recoDesc = zone === 'red'
    ? 'Tu sistema nervioso no está recuperado. Mejor sesión de movilidad o descanso completo.'
    : zone === 'orange'
      ? 'Riesgo elevado. Sustituí movimientos complejos por variantes técnicas; reducí cargas.'
      : zone === 'yellow'
        ? 'Estás OK pero con fatiga acumulada. Mantené técnica y bajá volumen accesorio.'
        : zone === 'green'
          ? 'Indicadores en verde. Adelante con la sesión planeada.'
          : '';

  // Cafeína: simulamos toma hace ~2.5h. Decaimiento exp con t1/2 = 5h.
  const intakeMg = 200;
  const intake = new Date(Date.now() - 2.5 * 3600 * 1000);
  const hrs = intake.getHours();
  const mins = intake.getMinutes();
  const h12 = ((hrs + 11) % 12) + 1;
  const ampm = hrs < 12 ? 'am' : 'pm';
  const intakeLabel = `${h12}:${mins.toString().padStart(2, '0')}${ampm}`;
  const residualMg = Math.round(intakeMg * Math.pow(0.5, 2.5 / 5));

  const metrics = [
    {
      label: 'HRV',
      value: hrvValue != null ? String(hrvValue) : (stressLoading ? '…' : '—'),
      sub: stress?.cns_zone ? `CNS ${stress.cns_zone}` : '—',
      color: hrvColor,
      badge: hrvBadge,
      kind: hrvKind,
      isText: false,
    },
    {
      label: 'Readiness',
      value: sleepReadiness != null ? String(sleepReadiness) : (stressLoading ? '…' : '—'),
      sub: stress?.readiness_category ?? '—',
      color: sleepColor,
      badge: sleepReadiness != null && sleepReadiness < 50 ? '⚠ CRIT' : '⚠ WARN',
      kind: (sleepReadiness != null && sleepReadiness < 50 ? 'critical' : 'warning') as 'critical' | 'warning',
      isText: false,
    },
    {
      label: 'V-Form',
      value: vFormCat ?? '—',
      sub: zone ? `Risk ${adaptation?.risk_score ?? '—'}` : '—',
      color: vFormColor,
      badge: vFormBadge,
      kind: 'warning' as const,
      isText: true,
    },
  ];

  return (
    <div className="vpw-root">

      {/* HEADER */}
      <div className="vpw-header">
        <div className="vpw-header-mark"><Bolt size={18} /></div>
        <div className="vpw-header-meta">
          <div className="vpw-eyebrow"><Bolt /> Check pre-WOD</div>
          <h1 className="vpw-title">¿Listo?</h1>
          <div className="vpw-subtitle">AMRAP 20min · Hoy</div>
        </div>
      </div>

      {/* SHARE PRE-WOD CTA */}
      <button onClick={() => navigate('PREWOD_SHARE')} className="vpw-share btn-press">
        <span>Compartir pre-WOD</span>
        <span className="arrow">↗</span>
      </button>

      {/* ESTADO AHORA */}
      <div>
        <div className="vpw-sec-head"><h3>Tu estado ahora mismo</h3></div>
        <div className="vpw-metrics" style={{ marginTop: 8 }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              className="vpw-metric"
              style={{ ['--m-color' as string]: m.color } as CSSProperties}
            >
              <div className="vpw-metric-label">{m.label}</div>
              <div className={`vpw-metric-value${m.isText ? ' is-text' : ''}`}>{m.value}</div>
              <div className="vpw-metric-sub">{m.sub}</div>
              <span className={`vpw-metric-badge ${m.kind}`}>{m.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RECOMENDACIÓN PRINCIPAL (Session Adaptation Engine) */}
      <div className="vpw-reco" style={{ ['--reco-color' as string]: recoColor } as CSSProperties}>
        <div className="vpw-reco-title">{recoTitle}</div>
        {recoDesc && <div className="vpw-reco-desc">{recoDesc}</div>}
        {adaptation && zone !== 'red' && adaptation.adapted_plan.length > 0 && (
          <div className="vpw-reco-plan">
            {adaptation.adapted_plan.slice(0, 4).map((ex) => (
              <div key={ex.exercise} className="vpw-reco-ex">
                • <span className="ex-name">{ex.exercise}</span>:{' '}
                <span className={`ex-scheme ${ex.degradation > 0 ? 'degraded' : 'kept'}`}>
                  {ex.sets}×{ex.reps} @ {ex.weight}
                </span>
                {ex.reasoning && <span className="ex-reason"> · {ex.reasoning}</span>}
              </div>
            ))}
          </div>
        )}
        {adaptation?.client_side_fallback && (
          <div className="vpw-reco-note">ⓘ Cálculo local (backend no disponible)</div>
        )}
        {adaptation && adaptation.risk_score != null && (
          <div className="vpw-reco-risk">
            Risk score: <b>{adaptation.risk_score}</b>/100
          </div>
        )}
      </div>

      {/* MOOD */}
      <div>
        <div className="vpw-sec-head"><h3>¿Cómo te sentís hoy?</h3></div>
        <div className="vpw-card" style={{ marginTop: 8 }}>
          <div className="vpw-mood-row">
            <div className="vpw-mood-label">Energía</div>
            <div className="vpw-mood-opts">
              <Emoji tint="red">😩</Emoji>
              <Emoji tint="amber" active>😐</Emoji>
              <Emoji>💪</Emoji>
              <Emoji>🔥</Emoji>
            </div>
          </div>
          <div className="vpw-mood-row">
            <div className="vpw-mood-label">Musculatura</div>
            <div className="vpw-mood-opts">
              <Emoji tint="red">🤕</Emoji>
              <Emoji tint="amber">😬</Emoji>
              <Emoji active>👌</Emoji>
              <Emoji>🦾</Emoji>
            </div>
          </div>
        </div>
      </div>

      {/* CAFEÍNA */}
      <div>
        <div className="vpw-sec-head"><h3>Cafeína hoy</h3></div>
        <div className="vpw-card row" style={{ marginTop: 8 }}>
          <div className="vpw-caf-left">
            <span className="vpw-caf-icon">☕</span>
            <div>
              <div className="vpw-caf-main">{intakeMg}mg — {intakeLabel}</div>
              <div className="vpw-caf-sub">C_residual actual: {residualMg}mg</div>
            </div>
          </div>
          <button className="vpw-caf-add">+ Agregar</button>
        </div>
      </div>

      {/* WISE SCORE INCENTIVO */}
      <div className="vpw-wise">
        <div className="vpw-wise-ring">
          <span className="vpw-wise-num">84</span>
          <span className="vpw-wise-tag">WISE</span>
        </div>
        <div className="vpw-wise-body">
          <div className="vpw-wise-headline">
            Seguí el WOD modificado → <span className="pts">+30 pts</span>
          </div>
          <div className="vpw-wise-meta">
            Tomá descanso activo → +50 pts · Override → 0 pts
          </div>
        </div>
      </div>

      {/* CTAS */}
      <div className="vpw-ctas">
        <button onClick={() => navigate('WARMUP')} className="vpw-cta primary">
          <Bolt size={13} /> Iniciar WOD (modificado) +30 Wise
        </button>
        <button onClick={() => navigate('PROGRESSION')} className="vpw-cta secondary">
          😴 Cambiar a movilidad / descanso +50 Wise
        </button>
        <button onClick={() => navigate('VOLTA_HOME')} className="vpw-cta ghost">
          Ver WOD sin cambios · sin pts Wise
        </button>
      </div>

      <WiseAssistant context="Volta Atleta · Pre-WOD" />
    </div>
  );
};

export default VoltaPreWod;

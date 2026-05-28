// @ts-nocheck — design import from Claude Design (JSX standalone with React global · usa CSS vars custom)
/* ============================================================
   PEAK QUAL · ATLETA HOME · React app
   Mobile 390×844 · bento HUD
   ============================================================ */

import React, { useState, useMemo, useEffect } from 'react';
import '../../styles/v2/atleta-home.css';
import { useAthlete } from '../../context/AthleteContext';
import { useNav } from '../../context/NavigationContext';
import { progressionApi } from '../../lib/progression';
import { getPendingForToday } from '../../lib/plannedSessions';
import { PlateBadge, type PlateTier } from '../../components/PlateBadge';

/* ---------- Disco · mapeo tier numérico V2 (0-4) → tier nominal PlateBadge ---------- */
// El componente real PlateBadge usa nombres de color; el resto de la home razona
// en índices 0-4. Este mapa traduce sin perder el color por tier.
const TIER_TO_PLATE: PlateTier[] = ['white', 'green', 'yellow', 'blue', 'red'];
const tierToPlate = (t: string | number): PlateTier =>
  TIER_TO_PLATE[Math.max(0, Math.min(4, parseInt(String(t), 10) || 0))];

/* ---------- Lucide-style icons (stroke 1.5) ---------- */
const ICONS = {
  activity:  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
  flame:     <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
  trending:  <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  bell:      <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  chevron:   <polyline points="9 18 15 12 9 6"/>,
  arrow:     <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  home:      <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  bar:       <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6"  y1="20" x2="6"  y2="14"/></>,
  plus:      <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>,
  tree:      <><path d="M12 22V12"/><path d="M6 8l6-6 6 6"/><path d="M8 14l4-4 4 4"/></>,
  user:      <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  play:      <polygon points="6 3 20 12 6 21 6 3"/>,
  venus:     <><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></>,
  dumbbell:  <><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></>,
  moon:      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
  target:    <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  shield:    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  zap:       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  check:     <polyline points="20 6 9 17 4 12"/>,
};

function Icon({ name, size = 18, stroke = 1.5, className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

/* ---------- Card base ---------- */
function Card({ critical, children, className = '', style, onClick }) {
  return (
    <div className={`ah-card ${className}`}
         data-critical={critical}
         style={style}
         onClick={onClick}>
      <span className="ah-card-br ah-card-br-tl"/>
      <span className="ah-card-br ah-card-br-tr"/>
      {children}
    </div>
  );
}

/* ---------- Header ---------- */
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAYS_ES = ['dom','lun','mar','mié','jue','vie','sáb'];
function formatHeaderDate(d, week, totalWeeks) {
  const base = `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
  return totalWeeks > 0 ? `${base} · semana ${week}/${totalWeeks}` : base;
}

function Header({ firstName, initial, dateLabel, streak, tier, onProfile }) {
  return (
    <header className="ah-header">
      <div className="ah-greeting">
        <div className="ah-avatar-wrap">
          <div className="ah-avatar">{initial}</div>
          {/* Level badge · disco pequeño marca el tier actual del atleta */}
          <span className="ah-avatar-badge" aria-hidden="true">
            <PlateBadge tier={tierToPlate(tier)} size={22}/>
          </span>
        </div>
        <div>
          <div className="ah-hello">Hola, {firstName} <span style={{color:'var(--text)'}}>👋</span></div>
          <div className="ah-date">{dateLabel}</div>
        </div>
      </div>
      <div className="ah-header-right">
        <span className="ah-streak">
          <Icon name="flame" size={13} stroke={2}/>
          <span>{streak}</span>
        </span>
        <span className="ah-icon-btn" onClick={onProfile} role="button" aria-label="Perfil"><Icon name="user" size={18}/></span>
      </div>
    </header>
  );
}

/* ---------- Semáforo ---------- */
function Semaforo({ state, onClick }) {
  const states = {
    green: { label: 'VERDE',    dot: '🟢',
             text: 'Tu estado: óptimo para entrenar.' },
    amber: { label: 'AMARILLO', dot: '🟡',
             text: 'Recuperación parcial · reduce intensidad 15%.' },
    red:   { label: 'ROJO',     dot: '🔴',
             text: 'Riesgo de sobreentrenamiento · ver detalle.' },
  };
  const s = states[state];
  return (
    <div className={`ah-semaforo s-${state}`} onClick={onClick}>
      <span className="ah-sem-dot"/>
      <span className="ah-sem-label">{s.label}</span>
      <span className="ah-sem-text">{s.text}</span>
      {state === 'red' && <Icon name="chevron" size={16} className="ah-sem-chevron"/>}
    </div>
  );
}

/* ---------- Readiness Ring ---------- */
function ReadinessCard({ value, state, loading, meta, onClick }) {
  const color = state === 'red'   ? 'var(--engine-pulse)'
              : state === 'amber' ? 'var(--engine-macro)'
              :                     'var(--engine-stress)';
  const label = state === 'red'   ? 'CAUTION'
              : state === 'amber' ? 'PROCEED'
              :                     'READY';
  const display = value == null ? '—' : value;

  return (
    <Card critical className="ah-ring-card" onClick={onClick}>
      <div className="ah-eyebrow">
        <Icon name="activity" size={11}/> READINESS · CNS
      </div>
      <div className="ah-ring-wrap">
        <div className="ah-ring"
             style={{
               background: `conic-gradient(${color} ${value == null ? 0 : value}%, rgba(255,255,255,0.05) 0)`,
               filter: value == null ? 'none' : `drop-shadow(0 0 10px ${color})`,
             }}>
          <div className="ah-ring-inner">
            <div className="ah-ring-num">{loading ? '…' : display}</div>
            <div className="ah-ring-label" style={{color}}>{value == null ? '—' : label}</div>
          </div>
        </div>
        <div className="ah-ring-meta">
          <div className="ah-ring-trend">{meta}</div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- OLY Index ---------- */
function OlyCard({ value, sub, onClick }) {
  return (
    <Card className="ah-oly-card" onClick={onClick}>
      <div className="ah-eyebrow">
        <Icon name="trending" size={11}/> OLY IDX
      </div>
      <div className="ah-big-num oly">{value}</div>
      <div className="ah-trend up">{sub}</div>
    </Card>
  );
}

/* ---------- Tier card ---------- */
function TierCard({ tier = '3', name = 'AZUL', pct = 73 }) {
  const tierColors = {
    '0': '#F5F5F7', '1': '#22C55E', '2': '#FBBF24',
    '3': '#3B82F6', '4': '#EF4444',
  };
  const c = tierColors[tier];
  return (
    <Card className="ah-tier-card">
      <div className="ah-eyebrow">DISCO · T{tier}</div>
      <div className="ah-tier-disc">
        <PlateBadge tier={tierToPlate(tier)} size={62}/>
      </div>
      <div className="ah-tier-meta">
        <div className="ah-tier-label" style={{color: c}}>{name}</div>
        <div className="ah-tier-progress">
          <div className="fill" style={{
            width: `${pct}%`,
            background: c,
            boxShadow: `0 0 6px ${c}`,
          }}/>
        </div>
        <div className="ah-tier-pct">{pct}% → ROJO</div>
      </div>
    </Card>
  );
}

/* ---------- Macrocycle ---------- */
function MacroCard({ current = 4, total = 12, peakAt = 8, title = 'Macrociclo', fullWidth = false, onClick }) {
  const safeTotal = total > 0 ? total : 12;
  const safeCurrent = Math.min(current, safeTotal);
  const weeksToPeak = Math.max(0, peakAt - safeCurrent);
  return (
    <Card onClick={onClick} style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <div className="ah-eyebrow">
        <Icon name="calendar" size={11}/> MACROCYCLE
      </div>
      <div className="ah-macro-title">{title} · Sem {safeCurrent}/{safeTotal}</div>
      <div className="ah-macro-bar">
        {Array.from({length: safeTotal}, (_, i) => {
          const w = i + 1;
          const isPast = w <= safeCurrent;
          const isPeak = w === peakAt;
          return (
            <div key={w}
                 className={`tick ${isPast ? 'on' : ''} ${isPeak ? 'peak' : ''}`}/>
          );
        })}
        <span className="flag" style={{ left: `${((peakAt - 0.5) / safeTotal) * 100}%` }}/>
      </div>
      <div className="ah-macro-foot">
        <span>{Math.round((safeCurrent / safeTotal) * 100)}% completado</span>
        <span className="next">{weeksToPeak > 0 ? `↗ pico en ${weeksToPeak} sem` : '↗ fase pico'}</span>
      </div>
    </Card>
  );
}

/* ---------- Hormonal ---------- */
function HormonalCard({ phase, day, foot, onClick }) {
  return (
    <Card className="ah-horm-card" onClick={onClick}>
      <div className="ah-eyebrow">
        <Icon name="venus" size={11}/> CICLO
      </div>
      <div className="ah-horm-phase">{phase}</div>
      <div className="ah-horm-day">D-{day}</div>
      <div className="ah-horm-foot">{foot}</div>
    </Card>
  );
}

/* ---------- Today CTA ---------- */
function TodayCTA({ eyebrow, title, foot, onClick }) {
  return (
    <button className="ah-cta" onClick={onClick}>
      <span className="ah-cta-eyebrow">
        <Icon name="play" size={10} stroke={2}/> {eyebrow}
      </span>
      <span className="ah-cta-title">{title}</span>
      <span className="ah-cta-foot">{foot}</span>
      <span className="ah-cta-arrow">
        <Icon name="arrow" size={16} stroke={2}/>
      </span>
    </button>
  );
}

/* ---------- Heatmap 365 ---------- */
function HeatmapCard({ activeLabel = '—', xpLabel = '', onClick }) {
  // Deterministic-ish fake data: most sessions, some rest, occasional override
  const cells = useMemo(() => {
    const seed = 42;
    const rng = (n) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 364 }, (_, i) => {
      const r = rng(i);
      if (r < 0.06) return { k: 'override' };
      if (r < 0.18) return { k: 'empty' };
      if (r < 0.36) return { k: 'rest' };
      const intensity = Math.floor((r - 0.36) / 0.16) + 1; // 1..4
      return { k: 'session', s: Math.max(1, Math.min(4, intensity)) };
    });
  }, []);

  return (
    <Card className="ah-heatmap-card" onClick={onClick}>
      <div className="ah-eyebrow">
        <Icon name="calendar" size={11}/> 365 DÍAS · CONSISTENCIA
      </div>
      <div className="ah-heatmap">
        {cells.map((c, i) => (
          <span key={i}
                className={`hm-cell hm-${c.k} ${c.s ? 's' + c.s : ''}`}/>
        ))}
      </div>
      <div className="ah-hm-foot">
        <span>{activeLabel}</span>
        <span className="up">{xpLabel}</span>
      </div>
    </Card>
  );
}

/* ---------- Quests ---------- */
function Quests() {
  const quests = [
    { icon: 'moon',     label: 'Sleep ≥ 7h',       progress: 0.62, foot: '4:21h restantes', done: false },
    { icon: 'target',   label: 'RPE realista',     progress: 1.0,  foot: 'completado',       done: true  },
    { icon: 'shield',   label: 'Día sin override', progress: 1.0,  foot: '23h sin override', done: true  },
    { icon: 'zap',      label: 'Movilidad 10min',  progress: 0.4,  foot: '4 / 10 min',       done: false },
    { icon: 'dumbbell', label: 'Volumen +10%',     progress: 0.75, foot: '2 sets más',       done: false },
  ];
  return (
    <div className="ah-quests-row">
      <div className="ah-eyebrow" style={{marginLeft: 4, marginBottom: 4}}>
        <Icon name="check" size={11}/> QUESTS · HOY
      </div>
      <div className="ah-quests-scroll">
        {quests.map((q, i) => (
          <div key={i} className="ah-quest" data-done={q.done}>
            <div className="q-head">
              <Icon name={q.icon} size={14} stroke={1.8}/>
            </div>
            <div className="q-label">{q.label}</div>
            <div className="q-bar">
              <div className="fill" style={{ width: `${q.progress * 100}%` }}/>
            </div>
            <div className="q-foot">{q.foot}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Derivaciones (espejo de la home legacy AtletaHome.tsx) ---------- */

// readiness → estado semáforo (mismos cortes que ringColor legacy: 70 / 50)
const readinessToState = (r) => r == null ? 'green' : r >= 70 ? 'green' : r >= 50 ? 'amber' : 'red';

// Cinturón 0-7 (engine 05) → disco V2 0-4. Mapeo proporcional para que el
// color del disco siga la progresión real del atleta.
//   blanco/amarillo → T0/T1 · naranja/azul → T2/T3 · púrpura+ → T4
const BELT_TO_TIER = ['0', '0', '1', '2', '3', '4', '4', '4'];
const TIER_NAME = ['STARTER', 'VERDE', 'AMARILLO', 'AZUL', 'ÉLITE'];

// Ejercicio principal de hoy derivado de los maxes (igual criterio que la
// sección "Sesión de hoy" legacy: Arrancada 5×3 @ 85%).
const FOCUS_LABEL = (focus) => (focus || 'STRENGTH').toString().toUpperCase();

/* ---------- Main App ---------- */
function App() {
  const { athlete, stress, stressLoading } = useAthlete();
  const { navigate } = useNav();

  // Estado backend de progresión (cinturón + racha + oly index) · graceful fallback.
  const [belt, setBelt] = useState(null);
  const [streak, setStreak] = useState(null);
  const [olyApi, setOlyApi] = useState(null);
  // Estado hormonal (engine 13) · sólo se intenta para atletas femeninas · opt-in.
  const [hormonal, setHormonal] = useState(null);

  useEffect(() => {
    let alive = true;
    progressionApi.bundle()
      .then(b => { if (alive) { setBelt(b.belt); setStreak(b.streak); setOlyApi(b.oly_index); } })
      .catch(() => { /* silent · usamos fallbacks locales */ });
    return () => { alive = false; };
  }, [athlete?.id]);

  useEffect(() => {
    if (!athlete || athlete.gender !== 'F') { setHormonal(null); return; }
    let alive = true;
    // Import diferido para no acoplar el bundle si nunca se usa.
    import('../../lib/hormonal').then(({ hormonalApi, PHASE_COLORS }) => {
      hormonalApi.current()
        .then(c => { if (alive) setHormonal({ data: c, colors: PHASE_COLORS }); })
        .catch(() => { if (alive) setHormonal(null); /* 404 = no configurado */ });
    }).catch(() => { /* ignore */ });
    return () => { alive = false; };
  }, [athlete?.id, athlete?.gender]);

  if (!athlete) return null;

  const { macrocycle, maxes } = athlete;
  const firstName = (athlete.name.split(' ')[0] || '').toUpperCase();
  const initial = firstName[0] || '·';

  // ── Readiness / semáforo ──
  const readiness = stress ? Math.round(stress.readiness) : null;
  const semState = readinessToState(readiness);
  const readinessMeta = stressLoading
    ? 'Calculando…'
    : stress
      ? `Fitness ${Math.round(stress.fitness)} · Fatiga ${Math.round(stress.fatigue)}`
      : 'Completá tu check-in diario';

  // ── OLY index ── (API si está · si no, fórmula legacy snatch/bw*2.5)
  const olyIndex = olyApi != null
    ? olyApi.oly_index.toFixed(1)
    : maxes.body_weight > 0
      ? (maxes.snatch / maxes.body_weight * 2.5).toFixed(1)
      : '—';
  const olySub = `${maxes.snatch}kg snatch`;

  // ── Cinturón → disco ──
  const beltIdx = belt ? Math.max(0, Math.min(7, belt.belt_idx)) : null;
  const tier = beltIdx != null ? BELT_TO_TIER[beltIdx] : '3';
  const tierPct = belt ? Math.max(4, Math.min(100, Math.round(belt.progress_pct))) : 0;
  const tierName = TIER_NAME[parseInt(tier)] ?? 'AZUL';

  // ── Macrociclo ──
  const macroWeek = macrocycle.week ?? 0;
  const macroTotal = macrocycle.total_weeks ?? 0;
  const macroPeak = macroTotal > 0 ? Math.max(1, Math.round(macroTotal * 0.7)) : 8;
  const macroTitle = macrocycle.focus || macrocycle.program_name || 'Macrociclo';

  // ── Racha ── (API best/current · fallback: sesiones completadas 7d)
  const completed = athlete.sessions_last_7.filter(s => s.completed);
  const streakValue = streak ? streak.current : completed.length;

  // ── Sesión de hoy ── (planned real si existe · si no, derivada de maxes)
  const pending = getPendingForToday(athlete.id);
  const todaySession = pending[0] ?? null;
  let ctaEyebrow, ctaTitle, ctaFoot;
  if (todaySession && todaySession.exercises.length > 0) {
    const ex = todaySession.exercises[0];
    const w = Math.round((maxes[ex.max_key] ?? 0) * ex.pct);
    ctaEyebrow = `HOY · ${FOCUS_LABEL(todaySession.focus)}`;
    ctaTitle = `${ex.name} ${ex.sets}×${ex.reps}${w > 0 ? ` @ ${w}kg` : ''}`;
    ctaFoot = `${todaySession.exercises.length} ejercicios · ${Math.round(ex.pct * 100)}% 1RM`;
  } else {
    // Misma sesión por defecto que la home legacy (Arrancada 5×3 @ 85%)
    const snatchW = Math.round(maxes.snatch * 0.85);
    ctaEyebrow = `HOY · ${FOCUS_LABEL(macrocycle.focus)}`;
    ctaTitle = snatchW > 0 ? `Arrancada 5×3 @ ${snatchW}kg` : 'Sesión de hoy';
    ctaFoot = '3 ejercicios principales · 85% 1RM';
  }

  // ── Heatmap footer ── (días activos reales + sesiones de la semana)
  const activeDays = streak ? streak.total_active_days : completed.length;
  const heatActive = `${activeDays} día${activeDays === 1 ? '' : 's'} activo${activeDays === 1 ? '' : 's'}`;
  const heatXp = `${completed.length} sesion${completed.length === 1 ? '' : 'es'} · 7d`;

  // ── Hormonal (real, sólo si configurado) ──
  let hormPhase, hormDay, hormFoot;
  if (hormonal) {
    const c = hormonal.data;
    hormPhase = (hormonal.colors[c.phase]?.label ?? c.phase).toUpperCase();
    hormDay = c.day_of_cycle;
    const adj = c.recommendation?.intensity_adjustment_pct ?? 0;
    hormFoot = `${adj >= 0 ? '+' : ''}${adj}% intens`;
  }

  return (
    <div className="ah-v2-root">
      <div className="ah-sticky">
        <Header
          firstName={firstName}
          initial={initial}
          dateLabel={formatHeaderDate(new Date(), macroWeek, macroTotal)}
          streak={streakValue}
          tier={tier}
          onProfile={() => navigate('PROFILE')}
        />
        <Semaforo state={semState} onClick={() => navigate('PULSE')}/>
      </div>
      <div className="ah-scroll">
        <div className="ah-bento">
          {/* ROW 1 */}
          <div className="ah-row-1">
            <ReadinessCard
              value={readiness}
              state={semState}
              loading={stressLoading}
              meta={readinessMeta}
              onClick={() => navigate('PULSE')}
            />
            <OlyCard value={olyIndex} sub={olySub} onClick={() => navigate('INDEX')}/>
            <TierWithAnimate
              tier={tier} name={tierName} pct={tierPct} animate={false}
              onClick={() => navigate('PROGRESSION')}
            />
          </div>
          {/* ROW 2 */}
          <div className="ah-row-2">
            <MacroCard
              current={macroWeek} total={macroTotal} peakAt={macroPeak}
              title={macroTitle} fullWidth={!hormonal}
              onClick={() => navigate('HO_MACRO_ATHLETE')}
            />
            {hormonal && (
              <HormonalCard
                phase={hormPhase} day={hormDay} foot={hormFoot}
                onClick={() => navigate('HORMONAL')}
              />
            )}
          </div>
          {/* ROW 3 - CTA */}
          <TodayCTA
            eyebrow={ctaEyebrow} title={ctaTitle} foot={ctaFoot}
            onClick={() => navigate('WARMUP')}
          />
          {/* ROW 4 - heatmap */}
          <HeatmapCard activeLabel={heatActive} xpLabel={heatXp} onClick={() => navigate('HO_STATS')}/>
          {/* ROW 5 - quests */}
          <Quests/>
        </div>
      </div>
    </div>
  );
}

// Tier card · disco real (PlateBadge) reacciona al toggle animate re-montando vía key
function TierWithAnimate({ tier, name, pct, animate, onClick }) {
  const c = ['#F5F5F7','#22C55E','#FBBF24','#3B82F6','#EF4444'][parseInt(tier)];
  return (
    <Card className="ah-tier-card" onClick={onClick}>
      <div className="ah-eyebrow">DISCO · T{tier}</div>
      <div className="ah-tier-disc">
        <PlateBadge key={`${tier}-${animate}`} tier={tierToPlate(tier)} size={62} animate={!!animate}/>
      </div>
      <div className="ah-tier-meta">
        <div className="ah-tier-label" style={{color: c}}>{name}</div>
        <div className="ah-tier-progress">
          <div className="fill" style={{
            width: `${pct}%`,
            background: c,
            boxShadow: `0 0 6px ${c}`,
          }}/>
        </div>
        <div className="ah-tier-pct">{pct}%</div>
      </div>
    </Card>
  );
}


export default App;

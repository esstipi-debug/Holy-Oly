/* ============================================================
   PEAK QUAL · ATLETA HOME · React app
   Mobile 390×844 · bento HUD
   ============================================================ */

const { useState, useMemo } = React;

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

/* ---------- Status bar ---------- */
function StatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div className="right">
        <span className="bars">▮▮▮▮</span>
        <span>5G</span>
        <span>96</span>
      </div>
    </div>
  );
}

/* ---------- Header ---------- */
function Header() {
  return (
    <header className="ah-header">
      <div className="ah-greeting">
        <div className="ah-avatar">M</div>
        <div>
          <div className="ah-hello">Hola, MARCO <span style={{color:'var(--text)'}}>👋</span></div>
          <div className="ah-date">jue 27 may · semana 4/12</div>
        </div>
      </div>
      <div className="ah-header-right">
        <span className="ah-streak">
          <Icon name="flame" size={13} stroke={2}/>
          <span>12</span>
        </span>
        <span className="ah-icon-btn"><Icon name="bell" size={18}/></span>
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
function ReadinessCard({ value, state }) {
  const color = state === 'red'   ? 'var(--engine-pulse)'
              : state === 'amber' ? 'var(--engine-macro)'
              :                     'var(--engine-stress)';
  const label = state === 'red'   ? 'CAUTION'
              : state === 'amber' ? 'PROCEED'
              :                     'READY';

  return (
    <Card critical className="ah-ring-card">
      <div className="ah-eyebrow">
        <Icon name="activity" size={11}/> READINESS · CNS
      </div>
      <div className="ah-ring-wrap">
        <div className="ah-ring"
             style={{
               background: `conic-gradient(${color} ${value}%, rgba(255,255,255,0.05) 0)`,
               filter: `drop-shadow(0 0 10px ${color})`,
             }}>
          <div className="ah-ring-inner">
            <div className="ah-ring-num">{value}</div>
            <div className="ah-ring-label" style={{color}}>{label}</div>
          </div>
        </div>
        <div className="ah-ring-meta">
          <div className="ah-ring-trend">HRV 68ms · ↑ +4 vs base</div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- OLY Index ---------- */
function OlyCard() {
  return (
    <Card className="ah-oly-card">
      <div className="ah-eyebrow">
        <Icon name="trending" size={11}/> OLY IDX
      </div>
      <div className="ah-big-num oly">7.4</div>
      <div className="ah-trend up">▲ +0.3 / 30d</div>
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
        <plate-3d tier={tier} size="62"/>
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
function MacroCard({ current = 4, total = 12, peakAt = 8 }) {
  return (
    <Card>
      <div className="ah-eyebrow">
        <Icon name="calendar" size={11}/> MACROCYCLE
      </div>
      <div className="ah-macro-title">Fuerza Máx · Sem {current}/{total}</div>
      <div className="ah-macro-bar">
        {Array.from({length: total}, (_, i) => {
          const w = i + 1;
          const isPast = w <= current;
          const isPeak = w === peakAt;
          return (
            <div key={w}
                 className={`tick ${isPast ? 'on' : ''} ${isPeak ? 'peak' : ''}`}/>
          );
        })}
        <span className="flag" style={{ left: `${((peakAt - 0.5) / total) * 100}%` }}/>
      </div>
      <div className="ah-macro-foot">
        <span>{Math.round((current / total) * 100)}% completado</span>
        <span className="next">↗ pico en {peakAt - current} sem</span>
      </div>
    </Card>
  );
}

/* ---------- Hormonal ---------- */
function HormonalCard({ phase = 'LUTEAL', day = 18 }) {
  return (
    <Card className="ah-horm-card">
      <div className="ah-eyebrow">
        <Icon name="venus" size={11}/> CICLO
      </div>
      <div className="ah-horm-phase">{phase}</div>
      <div className="ah-horm-day">D-{day}</div>
      <div className="ah-horm-foot">-5% intens</div>
    </Card>
  );
}

/* ---------- Today CTA ---------- */
function TodayCTA() {
  return (
    <button className="ah-cta">
      <span className="ah-cta-eyebrow">
        <Icon name="play" size={10} stroke={2}/> HOY · STRENGTH
      </span>
      <span className="ah-cta-title">Back Squat 5×5 @ 85%</span>
      <span className="ah-cta-foot">1h 15min · 4 ejercicios accesorios</span>
      <span className="ah-cta-arrow">
        <Icon name="arrow" size={16} stroke={2}/>
      </span>
    </button>
  );
}

/* ---------- Heatmap 365 ---------- */
function HeatmapCard() {
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
    <Card className="ah-heatmap-card">
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
        <span>287 días activo</span>
        <span className="up">+42 XP semana</span>
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

/* ---------- Bottom Nav ---------- */
function BottomNav({ active }) {
  const tabs = [
    { k: 'home',    icon: 'home',  label: 'Home' },
    { k: 'stats',   icon: 'bar',   label: 'Stats' },
    { k: 'log',     icon: 'plus',  label: 'Log' },
    { k: 'skills',  icon: 'tree',  label: 'Skills' },
    { k: 'profile', icon: 'user',  label: 'Profile' },
  ];
  return (
    <nav className="ah-nav">
      {tabs.map(t => (
        <button key={t.k} className={`ah-nav-tab ${active === t.k ? 'on' : ''}`}>
          <Icon name={t.icon} size={22} stroke={active === t.k ? 1.8 : 1.5}/>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ---------- Tweaks panel ---------- */
function TweaksOverlay({ semState, setSemState, tier, setTier, ready, setReady, animatePlate, setAnimatePlate }) {
  const { TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio } = window;
  if (!TweaksPanel) return null;
  return (
    <TweaksPanel title="Atleta Home">
      <TweakSection label="Estado">
        <TweakRadio
          label="Semáforo"
          value={semState}
          onChange={setSemState}
          options={[
            { value:'green', label:'🟢' },
            { value:'amber', label:'🟡' },
            { value:'red',   label:'🔴' },
          ]}/>
        <TweakSlider
          label="Readiness"
          value={ready}
          min={0} max={100} step={1} unit="%"
          onChange={setReady}/>
      </TweakSection>
      <TweakSection label="Disco">
        <TweakRadio
          label="Tier"
          value={tier}
          onChange={setTier}
          options={[
            { value:'0', label:'T0' },
            { value:'1', label:'T1' },
            { value:'2', label:'T2' },
            { value:'3', label:'T3' },
            { value:'4', label:'T4' },
          ]}/>
        <TweakToggle
          label="Pulse disco"
          value={animatePlate}
          onChange={setAnimatePlate}/>
      </TweakSection>
    </TweaksPanel>
  );
}

/* ---------- Main App ---------- */
function App() {
  const [semState, setSemState]           = useState('green');
  const [tier, setTier]                   = useState('3');
  const [ready, setReady]                 = useState(84);
  const [animatePlate, setAnimatePlate]   = useState(false);

  // Cycle semáforo on tap
  const cycleSem = () => {
    setSemState(s => s === 'green' ? 'amber' : s === 'amber' ? 'red' : 'green');
  };

  const tierMeta = {
    '0': { name: 'STARTER',    pct: 12, next: 'VERDE'    },
    '1': { name: 'VERDE',      pct: 48, next: 'AMARILLO' },
    '2': { name: 'AMARILLO',   pct: 65, next: 'AZUL'     },
    '3': { name: 'AZUL',       pct: 73, next: 'ROJO'     },
    '4': { name: 'ÉLITE',      pct: 92, next: 'LEYENDA'  },
  }[tier];

  return (
    <>
      <div className="phone">
        <div className="phone-inner">
          <StatusBar/>
          <div className="ah-sticky">
            <Header/>
            <Semaforo state={semState} onClick={cycleSem}/>
          </div>
          <div className="ah-scroll">
            <div className="ah-bento">
              {/* ROW 1 */}
              <div className="ah-row-1">
                <ReadinessCard value={ready} state={semState}/>
                <OlyCard/>
                <TierWithAnimate tier={tier} name={tierMeta.name} pct={tierMeta.pct} animate={animatePlate}/>
              </div>
              {/* ROW 2 */}
              <div className="ah-row-2">
                <MacroCard/>
                <HormonalCard/>
              </div>
              {/* ROW 3 - CTA */}
              <TodayCTA/>
              {/* ROW 4 - heatmap */}
              <HeatmapCard/>
              {/* ROW 5 - quests */}
              <Quests/>
            </div>
          </div>
          <BottomNav active="home"/>
        </div>
      </div>
      <TweaksOverlay
        semState={semState} setSemState={setSemState}
        tier={tier} setTier={setTier}
        ready={ready} setReady={setReady}
        animatePlate={animatePlate} setAnimatePlate={setAnimatePlate}/>
    </>
  );
}

// Tier card needs to react to animate toggle by re-rendering plate-3d
function TierWithAnimate({ tier, name, pct, animate }) {
  return (
    <Card className="ah-tier-card">
      <div className="ah-eyebrow">DISCO · T{tier}</div>
      <div className="ah-tier-disc">
        <plate-3d key={`${tier}-${animate}`} tier={tier} size="62" {...(animate ? {animate: ''} : {})}/>
      </div>
      <div className="ah-tier-meta">
        <div className="ah-tier-label" style={{
          color: ['#F5F5F7','#22C55E','#FBBF24','#3B82F6','#EF4444'][parseInt(tier)]
        }}>{name}</div>
        <div className="ah-tier-progress">
          <div className="fill" style={{
            width: `${pct}%`,
            background: ['#F5F5F7','#22C55E','#FBBF24','#3B82F6','#EF4444'][parseInt(tier)],
            boxShadow: `0 0 6px ${['#F5F5F7','#22C55E','#FBBF24','#3B82F6','#EF4444'][parseInt(tier)]}`,
          }}/>
        </div>
        <div className="ah-tier-pct">{pct}%</div>
      </div>
    </Card>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

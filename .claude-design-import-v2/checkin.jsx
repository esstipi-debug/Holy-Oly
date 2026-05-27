/* ============================================================
   PEAK QUAL · DAILY CHECK-IN · React app
   ============================================================ */

const { useState, useMemo, useRef, useCallback } = React;

/* ---------- icons ---------- */
const ICONS = {
  x:      <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  moon:   <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
  coffee: <><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>,
  wine:   <><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5V3H7v7a5 5 0 0 0 5 5z"/></>,
  brain:  <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18z"/></>,
  heart:  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  smoke:  <><path d="M2 12h11a3 3 0 0 0 3-3V3"/><path d="M20 12V8a2 2 0 0 0-2-2"/><rect x="2" y="14" width="16" height="6" rx="1"/><line x1="20" y1="14" x2="20" y2="20"/><line x1="22" y1="14" x2="22" y2="20"/></>,
  warn:   <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  bulb:   <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z"/></>,
  zap:    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
};
function Icon({ name, size = 14, stroke = 1.6, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

/* ============================================================
   SLIDER · custom pointer-driven
   ============================================================ */
function Slider({ value, min, max, step = 1, onChange, color = 'var(--engine-stress)', ticks }) {
  const ref = useRef(null);
  const setFromPoint = useCallback((clientX) => {
    const r = ref.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const raw = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
  }, [min, max, step, onChange]);

  const onDown = (e) => {
    e.preventDefault();
    ref.current.setPointerCapture(e.pointerId);
    setFromPoint(e.clientX);
    const move = (ev) => { if (ref.current?.hasPointerCapture(ev.pointerId)) setFromPoint(ev.clientX); };
    const up = (ev) => {
      ref.current?.releasePointerCapture(ev.pointerId);
      ref.current?.removeEventListener('pointermove', move);
      ref.current?.removeEventListener('pointerup', up);
    };
    ref.current.addEventListener('pointermove', move);
    ref.current.addEventListener('pointerup', up);
  };
  const pct = (value - min) / (max - min);

  return (
    <div className="ci-slider" ref={ref} onPointerDown={onDown}
         style={{ '--s-c': color }}>
      <div className="track">
        <div className="fill" style={{ width: `${pct * 100}%` }}/>
        {ticks && (
          <div className="ticks">
            {ticks.map(t => (
              <span key={t} className="tick"
                    style={{ left: `${((t - min) / (max - min)) * 100}%` }}/>
            ))}
          </div>
        )}
        <div className="thumb" style={{ left: `${pct * 100}%` }}/>
      </div>
    </div>
  );
}

/* ============================================================
   PILL · educational
   ============================================================ */
function Pill({ kind = 'info', icon = '💡', children }) {
  return (
    <div className="ci-pill" data-kind={kind}>
      <span className="ic">{icon}</span>
      <span className="txt">{children}</span>
    </div>
  );
}

/* ============================================================
   CARD · base
   ============================================================ */
function Card({ status, label, icon, value, required, children }) {
  return (
    <div className="ci-card" data-st={status}>
      <div className="ci-card-head">
        <span className="lbl">
          {icon && <Icon name={icon} size={11}/>} {label}
          {required && <span className="req">· REQ</span>}
        </span>
        {value !== undefined && <span className="val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   1 · SLEEP
   ============================================================ */
function SleepCard({ value, onChange }) {
  const status = value < 6 ? 'crit' : value < 7 ? 'warn' : 'ok';
  return (
    <Card status={status} label="SLEEP" icon="moon" required value={`${value.toFixed(1)}h`}>
      <div className="ci-display">
        <span className={`big ${status === 'crit' ? 'crit' : status === 'warn' ? 'warn' : ''}`}>
          {value.toFixed(1)}<span style={{fontSize:14,color:'var(--text-mid)'}}>h</span>
        </span>
        <span className="sub">
          {value < 6 ? 'sub-óptimo' : value < 7 ? 'aceptable' : value < 9 ? 'óptimo' : 'recuperación full'}
        </span>
      </div>
      <Slider value={value} min={3} max={10} step={0.1}
              onChange={onChange}
              ticks={[3, 6, 7, 9, 10]}
              color={status === 'crit' ? 'var(--engine-pulse)'
                    : status === 'warn' ? 'var(--engine-macro)'
                    : 'var(--engine-oly)'}/>
      <div className="ci-slider-row">
        <span>3h</span><span>6h</span><span>7h</span><span>9h</span><span>10h</span>
      </div>
      {value < 6 && (
        <Pill kind="warn" icon="⚠">
          <strong>&lt;6h reduce recovery 40%</strong> · evita carga pesada hoy
        </Pill>
      )}
    </Card>
  );
}

/* ============================================================
   2 · CAFEÍNA
   ============================================================ */
function CaffeineCard({ mg, time, onChangeMg, onChangeTime }) {
  // residual = c0 · 0.5^(t/5h)
  const residual = useMemo(() => {
    if (!time) return mg;
    const [h, m] = time.split(':').map(Number);
    const taken = h + m / 60;
    const now = 17 + 30 / 60; // 17:30 (fake "now")
    const dt = Math.max(0, now - taken);
    return Math.round(mg * Math.pow(0.5, dt / 5));
  }, [mg, time]);

  const status = mg > 350 ? 'crit' : mg > 200 ? 'warn' : 'ok';

  return (
    <Card status={status} label="CAFEÍNA" icon="coffee"
          value={`${mg}mg · res ${residual}mg`}>
      <div className="ci-caff-row">
        <div className="ci-display">
          <span className={`big ${status === 'crit' ? 'crit' : status === 'warn' ? 'warn' : ''}`}>
            {mg}<span style={{fontSize:12,color:'var(--text-mid)'}}>mg</span>
          </span>
        </div>
        <input type="time" className="ci-time-input"
               value={time}
               onChange={e => onChangeTime(e.target.value)}/>
      </div>
      <Slider value={mg} min={0} max={400} step={10}
              onChange={onChangeMg}
              ticks={[0, 100, 200, 350, 400]}
              color={status === 'crit' ? 'var(--engine-pulse)'
                    : status === 'warn' ? 'var(--engine-macro)'
                    : 'var(--engine-stress)'}/>
      <div className="ci-slider-row">
        <span>0</span><span>100</span><span>200</span><span style={{color: 'var(--engine-macro)'}}>350</span><span style={{color: 'var(--engine-pulse)'}}>400</span>
      </div>
      <Pill>
        <span><strong>C_residual = {residual}mg</strong> ahora · t½ = 5h · tomado {time}</span>
      </Pill>
      {mg > 350 && (
        <Pill kind="crit" icon="⚠">
          <strong>&gt;350mg</strong> deteriora HRV nocturno · corta a las 14:00
        </Pill>
      )}
    </Card>
  );
}

/* ============================================================
   3 · ALCOHOL
   ============================================================ */
function AlcoholCard({ value, onChange }) {
  const opts = [
    { v:'none', em:'🚫', lbl:'NADA',   tone:'ok'   },
    { v:'one',  em:'🍷', lbl:'1 COPA', tone:'warn' },
    { v:'multi',em:'🍺', lbl:'2+',     tone:'crit' },
  ];
  const status = value === 'multi' ? 'crit'
               : value === 'one'   ? 'warn'
               : value === 'none'  ? 'ok' : null;
  return (
    <Card status={status} label="ALCOHOL" icon="wine" required>
      <div className="ci-alc-row">
        {opts.map(o => (
          <button key={o.v} className="ci-alc-btn"
                  data-active={value === o.v}
                  data-tone={o.tone}
                  onClick={() => onChange(o.v)}>
            <span className="em">{o.em}</span>
            <span className="lbl">{o.lbl}</span>
          </button>
        ))}
      </div>
      {value && value !== 'none' && (
        <Pill kind={value === 'multi' ? 'crit' : 'warn'} icon="⚠">
          <strong>Reduce MPS 24h</strong> · {value === 'multi' ? 'evita WOD intenso hoy' : 'evita PR hoy'}
        </Pill>
      )}
    </Card>
  );
}

/* ============================================================
   4 · STRESS
   ============================================================ */
function StressCard({ value, onChange }) {
  const emoji = value <= 2 ? '😌' : value <= 4 ? '😐' : value <= 6 ? '😟' : value <= 8 ? '😫' : '🔥';
  const label = value <= 2 ? 'sereno' : value <= 4 ? 'estable' : value <= 6 ? 'tenso' : value <= 8 ? 'alto' : 'crítico';
  const status = value <= 4 ? 'ok' : value <= 7 ? 'warn' : 'crit';
  return (
    <Card status={status} label="STRESS DE VIDA" icon="brain" value={`${value}/10 · ${label}`}>
      <div className="ci-stress-row">
        <span className="ci-stress-emoji">{emoji}</span>
        <div style={{flex:1}}>
          <div className="ci-display" style={{marginBottom:6}}>
            <span className={`big ${status === 'crit' ? 'crit' : status === 'warn' ? 'warn' : ''}`}>
              {value}<span style={{fontSize:12,color:'var(--text-mid)'}}>/10</span>
            </span>
            <span className="sub">{label}</span>
          </div>
          <Slider value={value} min={1} max={10} step={1}
                  onChange={onChange}
                  ticks={[1,4,7,10]}
                  color={status === 'crit' ? 'var(--engine-pulse)'
                        : status === 'warn' ? 'var(--engine-macro)'
                        : 'var(--engine-oly)'}/>
        </div>
      </div>
      {value > 7 && (
        <Pill kind="crit" icon="⚠">
          <strong>Stress crónico = cortisol elevado</strong> · peor recovery · reduce intensidad
        </Pill>
      )}
    </Card>
  );
}

/* ============================================================
   5 · PAIN · body map
   ============================================================ */
const PAIN_ZONES = [
  { k:'shoulders', label:'Hombros',  cx:40, cy:42, r:6   },
  { k:'core',      label:'Core',     cx:40, cy:65, r:7   },
  { k:'back',      label:'Espalda',  cx:40, cy:75, r:5.5 },
  { k:'hip',       label:'Cadera',   cx:40, cy:92, r:6   },
  { k:'knees',     label:'Rodillas', cx:40, cy:120,r:5.5 },
  { k:'feet',      label:'Pies',     cx:40, cy:148,r:5   },
];

function painTone(v) {
  if (v >= 7) return 'crit';
  if (v >= 4) return 'warn';
  return null;
}

function PainCard({ pain, onChangeZone }) {
  const [active, setActive] = useState(null);
  const critCount = Object.values(pain).filter(v => v >= 7).length;
  const anyHigh = Object.values(pain).some(v => v >= 7);
  const status = anyHigh ? 'crit'
               : Object.values(pain).some(v => v >= 4) ? 'warn'
               : 'ok';
  const total = Object.values(pain).reduce((s, v) => s + v, 0);

  return (
    <Card status={status} label="DOLOR / MOLESTIAS" icon="heart"
          value={total > 0 ? `${total} acumulado` : 'sin dolor'}>
      <div className="ci-pain">
        <svg className="ci-pain-svg" viewBox="0 0 80 160">
          {/* simple body silhouette */}
          <path className="silhouette" d="M40 8 Q33 8 33 16 Q33 22 36 25 L34 32 L30 35 L20 42 L18 56 L20 70 L26 80 L30 88 L28 110 L30 130 L28 148 L32 155 L37 155 L38 138 L40 122 L42 138 L43 155 L48 155 L52 148 L50 130 L52 110 L50 88 L54 80 L60 70 L62 56 L60 42 L50 35 L46 32 L44 25 Q47 22 47 16 Q47 8 40 8z"/>
          {PAIN_ZONES.map(z => (
            <circle key={z.k}
                    className="zone"
                    cx={z.cx} cy={z.cy} r={z.r}
                    data-active={active === z.k}
                    data-pain={painTone(pain[z.k])}
                    onClick={() => setActive(z.k)}/>
          ))}
        </svg>
        <div className="ci-pain-chips">
          {PAIN_ZONES.map(z => (
            <div key={z.k}
                 className="ci-pain-chip"
                 data-active={active === z.k}
                 data-pain={painTone(pain[z.k])}
                 onClick={() => setActive(z.k)}>
              <span className="name">{z.label}</span>
              <span className="val">{pain[z.k]}</span>
            </div>
          ))}
        </div>
      </div>
      {active && (
        <div className="ci-pain-expand">
          <span className="name">{PAIN_ZONES.find(z => z.k === active).label}</span>
          <div className="slider-wrap">
            <Slider value={pain[active]} min={0} max={10} step={1}
                    onChange={v => onChangeZone(active, v)}
                    ticks={[0,4,7,10]}
                    color={pain[active] >= 7 ? 'var(--engine-pulse)'
                          : pain[active] >= 4 ? 'var(--engine-macro)'
                          : 'var(--engine-oly)'}/>
          </div>
          <span className="val-display"
                style={{color: pain[active] >= 7 ? 'var(--engine-pulse)'
                            : pain[active] >= 4 ? 'var(--engine-macro)'
                            : 'var(--text-hi)'}}>
            {pain[active]}
          </span>
        </div>
      )}
      {anyHigh && (
        <Pill kind="crit" icon="🚨">
          <strong>Coach notificado</strong> · ajustamos WOD · {critCount} zona{critCount > 1 ? 's' : ''} ≥7
        </Pill>
      )}
    </Card>
  );
}

/* ============================================================
   6 · FUMAR · conditional 32px
   ============================================================ */
function SmokeCard({ smoked, cigs, onToggle, onChangeCigs }) {
  const status = !smoked ? 'ok'
               : cigs >= 6 ? 'crit'
               : cigs >= 1 ? 'warn' : 'warn';
  return (
    <Card status={status} label="FUMAR" icon="smoke" value={smoked ? `${cigs} hoy` : '0 hoy'}>
      <div className="ci-smoke">
        <div className="ci-toggle">
          <button data-active={!smoked} data-tone="ok" onClick={() => onToggle(false)}>NO</button>
          <button data-active={smoked} data-tone="crit" onClick={() => onToggle(true)}>SÍ</button>
        </div>
        {smoked && (
          <div className="ci-cigs">
            <button onClick={() => onChangeCigs(Math.max(0, cigs - 1))}>−</button>
            <span className="n">{cigs}</span>
            <button onClick={() => onChangeCigs(Math.min(40, cigs + 1))}>+</button>
          </div>
        )}
      </div>
      {smoked && (
        <Pill kind="warn" icon="💡">
          <strong>Fumar reduce VO2max 5%</strong> · cada cigarrillo afecta 4h
        </Pill>
      )}
    </Card>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
function App() {
  const [sleep, setSleep]     = useState(7.2);
  const [caffMg, setCaffMg]   = useState(200);
  const [caffTime, setTime]   = useState('09:14');
  const [alcohol, setAlcohol] = useState(null);
  const [stress, setStress]   = useState(5);
  const [pain, setPain] = useState({
    shoulders: 0, core: 0, back: 0, hip: 0, knees: 0, feet: 0,
  });
  const [smoker]              = useState(true); // from onboarding
  const [smoked, setSmoked]   = useState(false);
  const [cigs, setCigs]       = useState(0);

  const setPainZone = (z, v) => setPain(p => ({ ...p, [z]: v }));

  // Critical count
  const critCount = useMemo(() => {
    let n = 0;
    if (sleep < 6) n++;
    if (caffMg > 350) n++;
    if (alcohol === 'multi') n++;
    if (stress > 7) n++;
    if (Object.values(pain).some(v => v >= 7)) n++;
    if (smoked && cigs >= 6) n++;
    return n;
  }, [sleep, caffMg, alcohol, stress, pain, smoked, cigs]);

  const canSubmit = sleep > 0 && alcohol !== null;

  return (
    <div className="phone">
      <div className="phone-inner">
        <div className="status-bar">
          <span>17:30</span>
          <div className="right"><span>▮▮▮▮</span><span>5G</span><span>72</span></div>
        </div>

        <header className="ci-header">
          <div className="ci-h-left">
            <div className="ci-h-title">Check-in</div>
            <div className="ci-h-date">jueves 27 may</div>
          </div>
          <button className="ci-h-x" aria-label="Cerrar"><Icon name="x" size={18} stroke={2}/></button>
        </header>

        <div className="ci-scroll">
          {critCount > 3 && (
            <div className="ci-crit-banner">
              <span className="br br-tl"/><span className="br br-tr"/>
              <Icon name="warn" size={20} stroke={2} className="icon"/>
              <div className="text">
                CONTROL DE DAÑOS · {critCount} alertas
                <span className="small">Tu coach va a recibir un resumen · ajustamos el WOD de hoy.</span>
              </div>
            </div>
          )}

          <SleepCard value={sleep} onChange={setSleep}/>
          <CaffeineCard mg={caffMg} time={caffTime}
                        onChangeMg={setCaffMg} onChangeTime={setTime}/>
          <AlcoholCard value={alcohol} onChange={setAlcohol}/>
          <StressCard value={stress} onChange={setStress}/>
          <PainCard pain={pain} onChangeZone={setPainZone}/>
          {smoker && (
            <SmokeCard smoked={smoked} cigs={cigs}
                       onToggle={setSmoked} onChangeCigs={setCigs}/>
          )}

          <p className="ci-tagline">"Sin tus datos, no te podemos cuidar."</p>
        </div>

        <div className="ci-submit-bar">
          <button className="ci-submit" disabled={!canSubmit}>
            <span>Guardar check-in</span>
            <span className="xp"><Icon name="zap" size={11} stroke={2}/> + 12 XP</span>
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

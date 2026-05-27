// @ts-nocheck — design import from Claude Design (JSX standalone with React global · usa CSS vars custom)
/* ============================================================
   PEAK QUAL · COACH DASHBOARD · React app
   ============================================================ */

import React, { useState, useMemo  } from 'react';
import '../../styles/v2/coach-dash.css';

/* ---------- Lucide icons ---------- */
const ICONS = {
  bell:      <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  warn:      <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  chevR:     <polyline points="9 18 15 12 9 6"/>,
  arrowR:    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  flag:      <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  zap:       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  cal:       <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  pkg:       <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  wrench:    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>,
  bolt:      <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  barbell:   <><path d="M2 12h2"/><path d="M20 12h2"/><path d="M5 9v6"/><path d="M19 9v6"/><path d="M8 7v10"/><path d="M16 7v10"/><path d="M8 12h8"/></>,
  weight:    <circle cx="12" cy="12" r="9"/>,
  kettle:    <><path d="M14 6h-4l-2 3v4a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4V9z"/><path d="M10 4h4"/><path d="M10 4a2 2 0 0 0-2 2v0"/><path d="M14 4a2 2 0 0 1 2 2v0"/></>,
  rower:     <><line x1="4" y1="12" x2="20" y2="12"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/><path d="M9 9l-2 3 2 3"/><path d="M15 9l2 3-2 3"/></>,
};

function Icon({ name, size = 18, stroke = 1.5, className = '', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

/* ---------- Tier color helper ---------- */
const TIER_COLOR = {
  '0': '#F5F5F7', '1': '#22C55E', '2': '#FBBF24',
  '3': '#3B82F6', '4': '#EF4444',
};
const TIER_NAME = {
  '0':'STARTER','1':'VERDE','2':'AMARILLO','3':'AZUL','4':'ÉLITE'
};

/* ============================================================
   DATA · 12 atletas
   ============================================================ */
const ATHLETES = [
  // 3 critical
  { id:'lr', name:'LUCÍA RODRÍGUEZ', spec:'CrossFit · OLY', avatar:'LR',
    tier:'4', ovr:87, status:'red',
    note:'Riesgo lesión alto · 3 factores convergen',
    stats:{ STR:88, CND:76, TEC:92, PWR:84, REC:58, MEN:79 } },
  { id:'mv', name:'MARCO VITALI',    spec:'OLY · Halterofilia', avatar:'MV',
    tier:'4', ovr:85, status:'red',
    note:'CNS rojo 4 sesiones · forzar deload',
    stats:{ STR:91, CND:62, TEC:88, PWR:90, REC:38, MEN:74 } },
  { id:'dp', name:'DIEGO PALMA',     spec:'HYROX · Endurance', avatar:'DP',
    tier:'3', ovr:78, status:'red',
    note:'5 días sin check-in · contactar',
    stats:{ STR:72, CND:85, TEC:74, PWR:70, REC:72, MEN:65 } },
  // 5 watch
  { id:'am', name:'ANA MORENO',      spec:'CrossFit · Open', avatar:'AM',
    tier:'3', ovr:82, status:'amber',
    note:'Vol +18% sem · monitor',
    stats:{ STR:80, CND:84, TEC:79, PWR:82, REC:75, MEN:86 } },
  { id:'jo', name:'JULIÁN ORTEGA',   spec:'OLY · Snatch', avatar:'JO',
    tier:'3', ovr:79, status:'amber',
    note:'RPE divergente · sleep bajo',
    stats:{ STR:83, CND:70, TEC:85, PWR:81, REC:68, MEN:74 } },
  { id:'pt', name:'PAULA TORRES',    spec:'HYROX · Pro', avatar:'PT',
    tier:'2', ovr:76, status:'amber',
    note:'Carga +12% pico · ok',
    stats:{ STR:71, CND:88, TEC:72, PWR:75, REC:77, MEN:73 } },
  { id:'cf', name:'CARMEN FUENTES',  spec:'CrossFit', avatar:'CF',
    tier:'2', ovr:73, status:'amber',
    note:'Inputs irregulares 3d',
    stats:{ STR:68, CND:78, TEC:75, PWR:71, REC:72, MEN:74 } },
  { id:'rb', name:'RODRIGO BENÍTEZ', spec:'OLY', avatar:'RB',
    tier:'2', ovr:71, status:'amber',
    note:'Plateau snatch 3 sem',
    stats:{ STR:78, CND:62, TEC:74, PWR:80, REC:65, MEN:70 } },
  // 4 ok
  { id:'eg', name:'ELENA GÓMEZ',     spec:'CrossFit · Elite', avatar:'EG',
    tier:'4', ovr:88, status:'green',
    note:'Trend +0.6σ adapt · ok',
    stats:{ STR:86, CND:90, TEC:88, PWR:87, REC:88, MEN:90 } },
  { id:'td', name:'TOMÁS DELGADO',   spec:'HYROX', avatar:'TD',
    tier:'3', ovr:80, status:'green',
    note:'Race -90s vs PB',
    stats:{ STR:74, CND:90, TEC:78, PWR:76, REC:84, MEN:82 } },
  { id:'sl', name:'SOFIA LARRAÍN',   spec:'OLY · C&J', avatar:'SL',
    tier:'2', ovr:75, status:'green',
    note:'PR C&J semana pasada',
    stats:{ STR:79, CND:68, TEC:80, PWR:76, REC:75, MEN:75 } },
  { id:'js', name:'JAVIER SÁNCHEZ',  spec:'CrossFit · Novice', avatar:'JS',
    tier:'1', ovr:68, status:'green',
    note:'+6 OVR / 30d · ok',
    stats:{ STR:65, CND:70, TEC:62, PWR:68, REC:78, MEN:72 } },
];

const ALERTS = [
  { who:'LUCÍA', why:'Riesgo lesión alto', detail:'3 factores convergen · resolver', tier:'red' },
  { who:'MARCO', why:'Sobreentrenamiento', detail:'CNS rojo 4 sesiones · forzar deload', tier:'red' },
  { who:'DIEGO', why:'Inputs insuficientes', detail:'5 días sin check-in · contactar', tier:'red' },
];

const WEEK = [
  { d:'LUN', n:24, type:'Strength',  intensity:4, today:false },
  { d:'MAR', n:25, type:'"Fran"',    intensity:5, today:false },
  { d:'MIÉ', n:26, type:'Skill',     intensity:2, today:false },
  { d:'JUE', n:27, type:'Endurance', intensity:3, today:true  },
  { d:'VIE', n:28, type:'Strength',  intensity:4, today:false },
  { d:'SÁB', n:29, type:'Open WOD',  intensity:3, today:false },
  { d:'DOM', n:30, type:'Rest',      intensity:0, today:false, rest:true },
];

const INVENTORY = [
  { icon:'barbell', name:'Barras OLY',  v:12,  total:12,  status:'green'  },
  { icon:'weight',  name:'Bumpers',     v:480, total:600, status:'cyan'   },
  { icon:'kettle',  name:'Kettlebells', v:18,  total:24,  status:'cyan'   },
  { icon:'pkg',     name:'Boxes',       v:8,   total:10,  status:'cyan'   },
  { icon:'rower',   name:'Rowers',      v:4,   total:6,   status:'amber'  },
  { icon:'barbell', name:'Pull-up bars',v:6,   total:6,   status:'green'  },
];

/* ============================================================
   COMPONENTS
   ============================================================ */

function Header() {
  return (
    <header className="cd-header">
      <div className="cd-header-left">
        <div className="cd-h-mark">⌂</div>
        <div>
          <div className="cd-h-name">Box Comando</div>
          <div className="cd-h-sub">Coach Marco</div>
        </div>
        <span className="cd-h-chip">
          <Icon name="users" size={12} stroke={1.8}/> 12 atletas
        </span>
      </div>
      <div className="cd-h-right">
        <button className="cd-h-btn"><Icon name="bell" size={18}/><span className="dot"/></button>
        <button className="cd-h-btn"><Icon name="settings" size={18}/></button>
      </div>
    </header>
  );
}

function TriageStrip({ filter, setFilter }) {
  const counts = useMemo(() => {
    const r = ATHLETES.filter(a => a.status === 'red').length;
    const a = ATHLETES.filter(a => a.status === 'amber').length;
    const g = ATHLETES.filter(a => a.status === 'green').length;
    return { red:r, amber:a, green:g };
  }, []);

  const cards = [
    { k:'red',   label:'CRÍTICO', c:'var(--engine-pulse)', count:counts.red,
      desc:'HRV bajo · fatiga · lesión' },
    { k:'amber', label:'WATCH',   c:'var(--engine-macro)', count:counts.amber,
      desc:'Carga alta · inputs sucios' },
    { k:'green', label:'OK',      c:'var(--engine-oly)',   count:counts.green,
      desc:'Listos para entrenar' },
  ];

  return (
    <div className="cd-triage">
      {cards.map(card => (
        <div key={card.k}
             className="cd-tri-card"
             data-active={filter === card.k}
             style={{ '--c': card.c }}
             onClick={() => setFilter(filter === card.k ? null : card.k)}>
          <span className="br"/><span className="br br-r"/>
          <div className="cd-tri-eyebrow">
            <span className="pip"/>{card.label}
          </div>
          <div className="cd-tri-num">{card.count}</div>
          <div className="cd-tri-desc">{card.desc}</div>
        </div>
      ))}
    </div>
  );
}

function AlertsBanner() {
  return (
    <div className="cd-alerts">
      <div className="cd-alerts-head">
        <Icon name="warn" size={11} stroke={2}/> ALERTAS · {ALERTS.length} críticas
      </div>
      {ALERTS.map((a, i) => (
        <div key={i} className="cd-alert">
          <span className="br br-tl"/><span className="br br-tr"/>
          <Icon name="warn" size={16} stroke={2} className="cd-alert-icon"/>
          <div className="cd-alert-body">
            <div className="cd-alert-name">
              {a.who}<span className="sep">·</span>{a.why}
            </div>
            <div className="cd-alert-meta">{a.detail}</div>
          </div>
          <span className="cd-alert-cta">RESOLVER →</span>
        </div>
      ))}
    </div>
  );
}

function MacroHero() {
  const total = 12, current = 4, peakAt = 8;
  const programs = 23;
  return (
    <div className="cd-macro">
      <span className="br br-tl"/><span className="br br-tr"/>
      <div className="cd-macro-eyebrow">
        <Icon name="cal" size={11} stroke={2}/> MACROCICLO ACTIVO
      </div>
      <div>
        <div className="cd-macro-title">CrossFit Open Prep · Q2 2026</div>
        <div className="cd-macro-sub">Sem {current}/{total} · accumulation phase</div>
      </div>
      <div className="cd-macro-bar">
        {Array.from({length: total}, (_, i) => {
          const w = i + 1;
          const isOn = w <= current;
          const isPeak = w === peakAt;
          return (
            <div key={w} className={`tk ${isOn ? 'on' : ''} ${isPeak ? 'peak' : ''}`}>
              <span className="tk-label">{w}</span>
            </div>
          );
        })}
        <span className="flag" style={{ left: `${((peakAt - 0.5) / total) * 100}%` }}/>
      </div>
      <div className="cd-macro-foot">
        <div className="info">
          <strong>{programs} programas</strong> · 8 sin asignar
        </div>
        <button className="cd-macro-btn">
          ASIGNAR <Icon name="arrowR" size={12} stroke={2}/>
        </button>
      </div>
    </div>
  );
}

function AthleteCard({ a, onClick }) {
  const tColor = TIER_COLOR[a.tier];
  return (
    <div className="athlete" data-status={a.status} onClick={onClick}>
      <span className="status-dot"/>
      <div className="athlete-rank">
        <div className="athlete-ovr-lbl">OVR</div>
        <div className="athlete-ovr">{a.ovr}</div>
        <div className="athlete-tier-row">
          <plate-3d tier={a.tier} size="32"/>
          <div className="athlete-tier-name" style={{ '--tc': tColor }}>T{a.tier}</div>
        </div>
      </div>
      <div className="athlete-id">
        <div className="athlete-avatar">{a.avatar}</div>
        <div>
          <div className="athlete-name">{a.name}</div>
          <div className="athlete-spec">{a.spec}</div>
        </div>
        <div className="athlete-note">{a.note}</div>
      </div>
      <div className="athlete-stats">
        {Object.entries(a.stats).map(([k, v]) => {
          const glow = v >= 85 ? 'high' : v <= 40 ? 'low' : null;
          return (
            <div key={k} className="stat" data-glow={glow}>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
              <div className="bar"><div className="fill" style={{ width: `${v}%` }}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Roster({ filter }) {
  const list = useMemo(() => {
    if (!filter) return ATHLETES;
    return ATHLETES.filter(a => a.status === filter);
  }, [filter]);
  return (
    <div className="cd-roster-grid">
      {list.map(a => <AthleteCard key={a.id} a={a}/>)}
    </div>
  );
}

function WeekWods() {
  return (
    <div className="cd-week">
      {WEEK.map((day, i) => (
        <div key={i} className="day-chip"
             data-today={day.today}
             data-rest={day.rest}>
          <div className="day-name">{day.d}</div>
          <div className="day-num">{day.n}</div>
          <div className="day-type">{day.type}</div>
          {!day.rest && (
            <div className="day-int">
              {[1,2,3,4,5].map(i => (
                <span key={i} className={`b ${i <= day.intensity ? 'on' : ''}`}/>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InventoryStrip() {
  return (
    <div className="cd-inv">
      {INVENTORY.map((it, i) => {
        const pct = Math.round((it.v / it.total) * 100);
        return (
          <div key={i} className="inv-card" data-status={it.status}>
            <div className="inv-name">
              <Icon name={it.icon} size={12} stroke={1.8} className="ic"/>
              {it.name}
            </div>
            <div>
              <div className="inv-val">
                {it.v}<span className="total">/{it.total}</span>
              </div>
              <div className="inv-pct">{pct}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionsFab() {
  const [open, setOpen] = useState(false);
  const actions = [
    { icon:'bolt',   label:'Crear WOD' },
    { icon:'cal',    label:'Asignar macrocycle' },
    { icon:'pkg',    label:'Editar inventario' },
    { icon:'wrench', label:'Toolbox coach' },
  ];
  return (
    <>
      <div className="cd-scrim" data-open={open} onClick={() => setOpen(false)}/>
      <div className="cd-actions" data-open={open}>
        {actions.map((a, i) => (
          <a key={i} className="cd-action" onClick={() => setOpen(false)}>
            <span className="ic"><Icon name={a.icon} size={14} stroke={1.8}/></span>
            {a.label}
          </a>
        ))}
      </div>
      <button className="cd-fab" data-open={open}
              onClick={() => setOpen(o => !o)}
              aria-label="Acciones">
        <Icon name="plus" size={24} stroke={2.2}/>
      </button>
    </>
  );
}

/* ============================================================
   APP
   ============================================================ */

function App() {
  const [filter, setFilter] = useState(null);
  const total = ATHLETES.length;
  const showing = filter
    ? ATHLETES.filter(a => a.status === filter).length
    : total;

  return (
    <div className="coach-frame">
      <Header/>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Triage</h3>
          <span className="meta">{total} atletas · tap = filtrar</span>
        </div>
        <TriageStrip filter={filter} setFilter={setFilter}/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3 style={{color:'var(--engine-pulse)'}}>Alertas</h3>
          <span className="meta">acción inmediata</span>
        </div>
        <AlertsBanner/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Macrociclo</h3>
          <span className="meta">activo · Q2 2026</span>
        </div>
        <MacroHero/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Roster</h3>
          <span className="meta">
            {filter ? `${showing} · filtro ${filter.toUpperCase()}` : `${showing} cards`}
            {filter && <span style={{marginLeft:8, color:'var(--engine-stress)', cursor:'pointer'}}
                            onClick={() => setFilter(null)}>· LIMPIAR</span>}
          </span>
        </div>
        <Roster filter={filter}/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Week WODs</h3>
          <span className="meta">7 días · hoy JUE</span>
        </div>
        <WeekWods/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Inventory</h3>
          <span className="meta">6 ítems · 1 alerta</span>
        </div>
        <InventoryStrip/>
      </div>

      <ActionsFab/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);


export default App;

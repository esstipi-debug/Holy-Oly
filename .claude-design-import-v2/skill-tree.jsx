/* ============================================================
   PEAK QUAL · SKILL TREE v2 · React app
   Radial galaxy · 4 subjects · 95 skills · 5 tiers
   ============================================================ */

const { useState, useMemo, useEffect } = React;

/* ---------- TIER colors (rings + node fills) ---------- */
const TIER_C = {
  1: '#5EEAD4', // mint
  2: '#00E5FF', // cyan
  3: '#A855F7', // violet
  4: '#F472B6', // rose
  5: '#F5A623', // gold
};
const TIER_NAME = { 1:'INITIATE', 2:'CADET', 3:'WARRIOR', 4:'MASTER', 5:'LEGEND' };

/* ---------- SUBJECTS ---------- */
const SUBJECTS = [
  {
    id: 'gimnasia',
    name: 'Gimnasia',
    short: 'GIM',
    color: '#22C55E',
    sigil: 'gymnast',
    nodes: [
      // tier 1 (5 nodes · all mastered)
      { id:'hh',  code:'HH', label:'Hollow Hold',     tier:1, angle:288, state:'mastered',   prereq:[] },
      { id:'ah',  code:'AH', label:'Arch Hold',       tier:1, angle:0,   state:'mastered',   prereq:[] },
      { id:'br',  code:'BR', label:'Bridge',          tier:1, angle:72,  state:'mastered',   prereq:[] },
      { id:'ls',  code:'LS', label:'L-Sit',           tier:1, angle:144, state:'mastered',   prereq:[] },
      { id:'pk',  code:'PK', label:'Pike Push-up',    tier:1, angle:216, state:'mastered',   prereq:[] },
      // tier 2 (4 nodes)
      { id:'hsh', code:'HS', label:'Handstand Hold',  tier:2, angle:325, state:'mastered',   prereq:['ah','hh'] },
      { id:'t2b', code:'T2B',label:'Toes to Bar',     tier:2, angle:55,  state:'mastered',   prereq:['hh','ls'] },
      { id:'pls', code:'PU', label:'Strict Pull-up',  tier:2, angle:145, state:'mastered',   prereq:['hh'] },
      { id:'rsp', code:'RS', label:'Ring Support',    tier:2, angle:235, state:'in-progress',prereq:['ls','pk'] },
      // tier 3 (4 nodes)
      { id:'hsw', code:'HSW',label:'Handstand Walk',  tier:3, angle:340, state:'available',  prereq:['hsh'] },
      { id:'bmu', code:'BMU',label:'Bar Muscle-up',   tier:3, angle:60,  state:'available',  prereq:['t2b','pls'] },
      { id:'rmu', code:'RMU',label:'Ring Muscle-up',  tier:3, angle:200, state:'locked',     prereq:['rsp','pls'] },
      { id:'pst', code:'PST',label:'Pistol Squat',    tier:3, angle:260, state:'locked',     prereq:['rsp'] },
      // tier 4 (3 nodes)
      { id:'hsp', code:'HSP',label:'Strict HSPU',     tier:4, angle:340, state:'locked',     prereq:['hsw'] },
      { id:'rdp', code:'RDP',label:'Ring Dip',        tier:4, angle:200, state:'locked',     prereq:['rmu'] },
      { id:'flv', code:'FL', label:'Front Lever',     tier:4, angle:60,  state:'locked',     prereq:['bmu'] },
      // tier 5 (2 legendary)
      { id:'hpr', code:'HP', label:'Handstand Press', tier:5, angle:340, state:'locked',     prereq:['hsp'] },
      { id:'icr', code:'IX', label:'Iron Cross',      tier:5, angle:130, state:'locked',     prereq:['rdp','flv'] },
    ],
  },
  {
    id: 'halterofilia',
    name: 'Halterofilia',
    short: 'HALT',
    color: '#F5A623',
    sigil: 'barbell',
    nodes: [
      { id:'ohs', code:'OHS',label:'Overhead Squat',  tier:1, angle:300, state:'mastered',   prereq:[] },
      { id:'fsq', code:'FSQ',label:'Front Squat',     tier:1, angle:20,  state:'mastered',   prereq:[] },
      { id:'sgp', code:'SGP',label:'Snatch Grip Pull',tier:1, angle:100, state:'mastered',   prereq:[] },
      { id:'pp',  code:'PP', label:'Power Position',  tier:1, angle:180, state:'mastered',   prereq:[] },
      { id:'tsn', code:'TS', label:'Tall Snatch',     tier:1, angle:240, state:'mastered',   prereq:[] },
      { id:'hsn', code:'HSN',label:'Hang Snatch',     tier:2, angle:340, state:'mastered',   prereq:['ohs','sgp'] },
      { id:'psn', code:'PSN',label:'Power Snatch',    tier:2, angle:60,  state:'mastered',   prereq:['pp','tsn'] },
      { id:'phc', code:'PHC',label:'Hang Clean',      tier:2, angle:140, state:'in-progress',prereq:['fsq','pp'] },
      { id:'pjr', code:'PJ', label:'Push Jerk',       tier:2, angle:240, state:'available',  prereq:['fsq'] },
      { id:'fsn', code:'FSN',label:'Full Snatch',     tier:3, angle:0,   state:'available',  prereq:['hsn','psn'] },
      { id:'pcj', code:'PCJ',label:'Power C&J',       tier:3, angle:120, state:'available',  prereq:['phc','pjr'] },
      { id:'sjk', code:'SJ', label:'Split Jerk',      tier:3, angle:240, state:'locked',     prereq:['pjr'] },
      { id:'sn1', code:'SN1',label:'Snatch 1RM',      tier:4, angle:60,  state:'locked',     prereq:['fsn'] },
      { id:'cj1', code:'CJ1',label:'C&J 1RM',         tier:4, angle:200, state:'locked',     prereq:['pcj','sjk'] },
      { id:'snbw',code:'SBW',label:'Snatch > BW',     tier:5, angle:90,  state:'locked',     prereq:['sn1'] },
      { id:'cjbw',code:'CBW',label:'C&J 2× BW',       tier:5, angle:270, state:'locked',     prereq:['cj1'] },
    ],
  },
  {
    id: 'powerlifting',
    name: 'Powerlifting',
    short: 'PWR',
    color: '#EF4444',
    sigil: 'powerbar',
    nodes: [
      { id:'sqf', code:'SQ', label:'Back Squat Form', tier:1, angle:300, state:'mastered',   prereq:[] },
      { id:'bnf', code:'BN', label:'Bench Form',      tier:1, angle:20,  state:'mastered',   prereq:[] },
      { id:'dlf', code:'DL', label:'Deadlift Form',   tier:1, angle:100, state:'mastered',   prereq:[] },
      { id:'brk', code:'BR', label:'Bracing',         tier:1, angle:180, state:'mastered',   prereq:[] },
      { id:'apn', code:'AP', label:'Apnea Pos.',      tier:1, angle:240, state:'mastered',   prereq:[] },
      { id:'sqp', code:'SQP',label:'Squat Pause',     tier:2, angle:340, state:'mastered',   prereq:['sqf','brk'] },
      { id:'bnp', code:'BNP',label:'Bench Paused',    tier:2, angle:60,  state:'in-progress',prereq:['bnf','brk'] },
      { id:'dlp', code:'DLP',label:'DL Paused',       tier:2, angle:160, state:'in-progress',prereq:['dlf','brk'] },
      { id:'sno', code:'SNO',label:'Sumo DL',         tier:2, angle:260, state:'available',  prereq:['dlf'] },
      { id:'sq1', code:'SQR',label:'Squat 1.5× BW',   tier:3, angle:0,   state:'available',  prereq:['sqp'] },
      { id:'bn1', code:'BNR',label:'Bench 1× BW',     tier:3, angle:120, state:'locked',     prereq:['bnp'] },
      { id:'dl1', code:'DLR',label:'DL 2× BW',        tier:3, angle:240, state:'locked',     prereq:['dlp','sno'] },
      { id:'tot', code:'TOT',label:'Total 5×BW',      tier:4, angle:90,  state:'locked',     prereq:['sq1','bn1','dl1'] },
      { id:'meet',code:'MT', label:'Meet Prep',       tier:4, angle:270, state:'locked',     prereq:['sq1'] },
      { id:'el',  code:'EL', label:'Elite Total',     tier:5, angle:180, state:'locked',     prereq:['tot','meet'] },
    ],
  },
  {
    id: 'acondicionamiento',
    name: 'Acondicionam.',
    short: 'COND',
    color: '#FF6B35',
    sigil: 'pulse',
    nodes: [
      { id:'walk',code:'WK', label:'Z2 Walk 5km',     tier:1, angle:300, state:'mastered',   prereq:[] },
      { id:'jog', code:'JG', label:'5km Jog',         tier:1, angle:20,  state:'mastered',   prereq:[] },
      { id:'row5',code:'RW5',label:'500m Row',        tier:1, angle:100, state:'mastered',   prereq:[] },
      { id:'sk5', code:'SK5',label:'500m SkiErg',     tier:1, angle:180, state:'mastered',   prereq:[] },
      { id:'bup', code:'BU', label:'Burpee Pace',     tier:1, angle:240, state:'mastered',   prereq:[] },
      { id:'r2k', code:'R2K',label:'2km Row',         tier:2, angle:340, state:'mastered',   prereq:['row5'] },
      { id:'r5k', code:'R5K',label:'5km Run',         tier:2, angle:60,  state:'mastered',   prereq:['jog'] },
      { id:'eb',  code:'EB', label:'Echo Bike 10min', tier:2, angle:150, state:'in-progress',prereq:['bup'] },
      { id:'ssd', code:'SSD',label:'SkiErg Sprint',   tier:2, angle:240, state:'available',  prereq:['sk5'] },
      { id:'r10k',code:'10K',label:'10km Run',        tier:3, angle:0,   state:'available',  prereq:['r5k'] },
      { id:'tts', code:'TT', label:'2km TT < 7min',   tier:3, angle:120, state:'locked',     prereq:['r2k'] },
      { id:'hyx', code:'HX', label:'HYROX Sim',       tier:3, angle:240, state:'locked',     prereq:['eb','ssd'] },
      { id:'rce', code:'RC', label:'10K < 40min',     tier:4, angle:90,  state:'locked',     prereq:['r10k','tts'] },
      { id:'comp',code:'CM', label:'HYROX Top 100',   tier:4, angle:270, state:'locked',     prereq:['hyx'] },
      { id:'vo2', code:'VO2',label:'VO2 max > 60',    tier:5, angle:180, state:'locked',     prereq:['rce','comp'] },
    ],
  },
];

/* ---------- Sigil drawings · monolinear neon ---------- */
function Sigil({ kind, color }) {
  // all drawn centered at (0,0), scale ~26 units radius
  const stroke = {
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const filter = { filter: `drop-shadow(0 0 4px ${color})` };
  switch (kind) {
    case 'gymnast':
      return (
        <g style={filter}>
          <circle cx="0" cy="-16" r="4" {...stroke}/>
          <path d="M 0 -12 L 0 4" {...stroke}/>
          <path d="M -12 -4 L 12 -4" {...stroke}/>
          <path d="M 0 4 L -10 16" {...stroke}/>
          <path d="M 0 4 L 10 16" {...stroke}/>
          <circle cx="-14" cy="-4" r="2.5" {...stroke}/>
          <circle cx="14" cy="-4" r="2.5" {...stroke}/>
        </g>
      );
    case 'barbell':
      return (
        <g style={filter}>
          <line x1="-18" y1="0" x2="18" y2="0" {...stroke}/>
          <rect x="-22" y="-7" width="4" height="14" rx="1" {...stroke}/>
          <rect x="18" y="-7" width="4" height="14" rx="1" {...stroke}/>
          <circle cx="-20" cy="0" r="11" {...stroke} strokeWidth="1.5"/>
          <circle cx="20" cy="0" r="11" {...stroke} strokeWidth="1.5"/>
        </g>
      );
    case 'powerbar':
      return (
        <g style={filter}>
          <line x1="-20" y1="0" x2="20" y2="0" {...stroke}/>
          <rect x="-24" y="-9" width="5" height="18" rx="1" {...stroke}/>
          <rect x="19" y="-9" width="5" height="18" rx="1" {...stroke}/>
          <line x1="-24" y1="-12" x2="-24" y2="12" {...stroke} strokeWidth="1"/>
          <line x1="24" y1="-12" x2="24" y2="12" {...stroke} strokeWidth="1"/>
        </g>
      );
    case 'pulse':
      return (
        <g style={filter}>
          <polyline points="-20,0 -12,0 -8,-12 -2,12 4,-8 10,4 14,0 20,0"
                    {...stroke}/>
          <circle cx="-20" cy="0" r="1.5" fill={color}/>
          <circle cx="20" cy="0" r="1.5" fill={color}/>
        </g>
      );
    default: return null;
  }
}

/* ---------- Hex geometry ---------- */
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)].map(n => n.toFixed(2)).join(','));
  }
  return pts.join(' ');
}

const RING_RADII = [0, 82, 130, 180, 230, 275];
function nodePos(tier, angle) {
  const r = RING_RADII[tier];
  const a = (angle - 90) * Math.PI / 180;
  return [300 + r * Math.cos(a), 300 + r * Math.sin(a)];
}

/* ---------- Branch traversal ---------- */
function getRelated(nodeId, nodes) {
  if (!nodeId) return new Set();
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const set = new Set([nodeId]);
  const up = (id) => {
    (byId[id]?.prereq || []).forEach(p => {
      if (!set.has(p)) { set.add(p); up(p); }
    });
  };
  const down = (id) => {
    nodes.forEach(n => {
      if ((n.prereq || []).includes(id) && !set.has(n.id)) {
        set.add(n.id); down(n.id);
      }
    });
  };
  up(nodeId);
  down(nodeId);
  return set;
}

/* ---------- Stars background ---------- */
function Stars() {
  const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const s = Math.sin(i * 9.71) * 10000;
    const r = (n) => { const x = Math.sin(s + n) * 10000; return x - Math.floor(x); };
    return {
      top: r(1) * 100, left: r(2) * 100,
      size: r(3) * 1.2 + 0.4,
      delay: r(4) * 3,
    };
  }), []);
  return (
    <div className="st-stars">
      {stars.map((s, i) => (
        <span key={i} className="s"
              style={{
                top: `${s.top}%`, left: `${s.left}%`,
                width: `${s.size}px`, height: `${s.size}px`,
                animationDelay: `${s.delay}s`,
              }}/>
      ))}
    </div>
  );
}

/* ---------- Galaxy SVG ---------- */
function Galaxy({ subject, selected, setSelected }) {
  const relatedSet = useMemo(() => getRelated(selected, subject.nodes), [selected, subject.nodes]);
  const sigilColor = subject.color;

  // Precompute positions
  const positions = useMemo(() => {
    const m = {};
    subject.nodes.forEach(n => { m[n.id] = nodePos(n.tier, n.angle); });
    return m;
  }, [subject]);

  return (
    <svg className="st-svg galaxy"
         data-has-selection={!!selected}
         viewBox="0 0 600 600"
         preserveAspectRatio="xMidYMid meet"
         onClick={(e) => {
           if (e.target.closest('.hex')) return;
           setSelected(null);
         }}>
      <defs>
        <radialGradient id="sigilGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={sigilColor} stopOpacity="0.4"/>
          <stop offset="60%" stopColor={sigilColor} stopOpacity="0.1"/>
          <stop offset="100%" stopColor={sigilColor} stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* sigil glow background */}
      <circle cx="300" cy="300" r="100" fill="url(#sigilGlow)"/>

      {/* tier rings */}
      {[1,2,3,4,5].map(t => (
        <g key={t}>
          <circle cx="300" cy="300" r={RING_RADII[t]}
                  className="ring-circle"
                  style={{ stroke: `${TIER_C[t]}30` }}/>
          {/* tier label */}
          <text x="300" y={300 - RING_RADII[t] - 4}
                className="ring-label"
                style={{ fill: TIER_C[t] }}
                textAnchor="middle">
            T{t} · {TIER_NAME[t]}
          </text>
        </g>
      ))}

      {/* sigil orb */}
      <circle cx="300" cy="300" r="38"
              className="sigil-orb"
              style={{ '--c-orb': sigilColor }}/>
      <circle cx="300" cy="300" r="46"
              className="sigil-orb-2"
              style={{ '--c-orb': sigilColor }}/>
      <g transform="translate(300, 300)">
        <Sigil kind={subject.sigil} color={sigilColor}/>
      </g>

      {/* connections (drawn before nodes so they're behind) */}
      {subject.nodes.map(n => {
        const [cx, cy] = positions[n.id];
        return (n.prereq || []).map(pid => {
          const [px, py] = positions[pid];
          if (!px) return null;
          const isActive = selected && (relatedSet.has(n.id) && relatedSet.has(pid));
          // gradient flow: from prereq to current
          return (
            <line key={`${pid}-${n.id}`}
                  x1={px} y1={py} x2={cx} y2={cy}
                  className="conn"
                  data-active={isActive}
                  style={{
                    '--c-line': `${TIER_C[n.tier]}28`,
                    '--c-line-active': TIER_C[n.tier],
                  }}/>
          );
        });
      })}

      {/* hex nodes */}
      {subject.nodes.map(n => {
        const [cx, cy] = positions[n.id];
        const c = TIER_C[n.tier];
        const related = selected ? relatedSet.has(n.id) : false;
        return (
          <g key={n.id}
             className="hex"
             data-state={n.state}
             data-selected={selected === n.id}
             data-related={related}
             style={{ '--c': c }}
             onClick={(e) => {
               e.stopPropagation();
               setSelected(n.id);
             }}>
            <polygon className="hex-fill"
                     points={hexPoints(cx, cy, 18)}/>
            <text className="hex-icon"
                  x={cx} y={cy + 3}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.5"
                  fontWeight="700">
              {n.code}
            </text>
            {/* status marker (small bottom-right for in-progress / mastered) */}
            {n.state === 'mastered' && (
              <circle cx={cx + 14} cy={cy + 12} r="3" fill={c}
                      filter={`drop-shadow(0 0 3px ${c})`}/>
            )}
            {n.state === 'in-progress' && (
              <circle cx={cx + 14} cy={cy + 12} r="3" fill="none"
                      stroke={c} strokeWidth="1.5"
                      filter={`drop-shadow(0 0 3px ${c})`}>
                <animate attributeName="r" values="2;4;2" dur="1.6s" repeatCount="indefinite"/>
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Bottom Sheet · Node Detail ---------- */
function NodeSheet({ node, subject, onClose }) {
  if (!node) return null;
  const c = TIER_C[node.tier];

  const stateMeta = {
    mastered:    { label: 'DOMINADO',     pct: 100, cta: 'YA · DEMOSTRACIÓN' },
    'in-progress': { label: 'EN PROGRESO', pct: 64,  cta: 'CONTINUAR · 4 SETS' },
    available:   { label: 'DISPONIBLE',   pct: 0,   cta: 'INICIAR · WOD ASIGNADO' },
    locked:      { label: 'BLOQUEADO',    pct: 0,   cta: 'COMPLETA PREREQ' },
  }[node.state];

  const prereqLabels = node.prereq
    .map(p => subject.nodes.find(n => n.id === p)?.label)
    .filter(Boolean);

  return (
    <div className="st-sheet">
      <div className="sheet-card" style={{ '--c': c }}>
        <div className="sheet-head">
          <div>
            <div className="sheet-tier">T{node.tier} · {TIER_NAME[node.tier]}</div>
            <div className="sheet-name">{node.label}</div>
          </div>
          <span className="sheet-state">{stateMeta.label}</span>
        </div>

        <div className="sheet-desc">
          {node.state === 'mastered'
            ? 'Skill dominado. Demuestra cada 6 semanas para mantener.'
            : node.state === 'in-progress'
            ? 'En curso. Necesitás demostrar consistencia en 3 sesiones más.'
            : node.state === 'available'
            ? 'Listo para empezar. Pre-requisitos completos.'
            : `Bloqueado. Falta dominar ${prereqLabels.length} pre-requisito${prereqLabels.length === 1 ? '' : 's'}.`}
        </div>

        {(node.state === 'in-progress' || node.state === 'mastered') && (
          <div className="sheet-progress">
            <div className="sheet-bar">
              <div className="fill" style={{ width: `${stateMeta.pct}%` }}/>
            </div>
            <div className="sheet-bar-meta">
              <span>progreso</span>
              <span className="v">{stateMeta.pct}%</span>
            </div>
          </div>
        )}

        <button className="sheet-cta"
                disabled={node.state === 'locked'}
                style={node.state === 'locked' ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
          ▸ {stateMeta.cta}
        </button>

        <div className="sheet-meta-row">
          <span>prereq <span className="v">{prereqLabels.length || '—'}</span></span>
          <span>subject <span className="v">{subject.short}</span></span>
          <span>id <span className="v">{node.id}</span></span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Idle stats overlay ---------- */
function IdleOverlay({ subject }) {
  const stats = useMemo(() => {
    const total = subject.nodes.length;
    const mastered = subject.nodes.filter(n => n.state === 'mastered').length;
    const inProgress = subject.nodes.filter(n => n.state === 'in-progress').length;
    return { total, mastered, inProgress };
  }, [subject]);
  return (
    <div className="st-idle" style={{ '--c-subj': subject.color }}>
      <span className="pill" style={{ '--p-c': '#22C55E' }}>
        <span className="pip"/> MASTERED <span className="v">{stats.mastered}/{stats.total}</span>
      </span>
      {stats.inProgress > 0 && (
        <span className="pill" style={{ '--p-c': '#FFB300' }}>
          <span className="pip"/> IN-PROGRESS <span className="v">{stats.inProgress}</span>
        </span>
      )}
    </div>
  );
}

/* ---------- Subject Tabs ---------- */
function SubjectTabs({ active, setActive }) {
  return (
    <div className="st-tabs">
      {SUBJECTS.map((s, i) => {
        const mastered = s.nodes.filter(n => n.state === 'mastered').length;
        return (
          <div key={s.id}
               className="st-tab"
               data-active={active === i}
               style={{ '--c': s.color }}
               onClick={() => setActive(i)}>
            <span className="sigil-wrap">
              <svg width="20" height="20" viewBox="-22 -22 44 44">
                <Sigil kind={s.sigil} color="currentColor"/>
              </svg>
            </span>
            <span className="name">{s.short}</span>
            <span className="meta">{mastered}/{s.nodes.length}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- App ---------- */
function App() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const subject = SUBJECTS[activeIdx];
  const selectedNode = useMemo(
    () => subject.nodes.find(n => n.id === selected) || null,
    [subject, selected]
  );

  // Reset selection when switching subjects
  useEffect(() => { setSelected(null); }, [activeIdx]);

  // 95 total
  const totalSkills = SUBJECTS.reduce((s, x) => s + x.nodes.length, 0);

  return (
    <div className="phone">
      <div className="phone-inner">
        <div className="status-bar">
          <span>9:41</span>
          <div className="right"><span>▮▮▮▮</span><span>5G</span><span>92</span></div>
        </div>

        <header className="st-header">
          <button className="st-h-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="st-h-title">
            SKILL TREE
            <span className="sub">{totalSkills} skills · 5 tiers · 4 subjects</span>
          </div>
          <button className="st-h-stats">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </button>
        </header>

        <SubjectTabs active={activeIdx} setActive={setActiveIdx}/>

        <div className="st-galaxy-wrap"
             style={{ '--c': subject.color }}>
          <Stars/>
          <Galaxy
            subject={subject}
            selected={selected}
            setSelected={setSelected}/>
          {!selected && <IdleOverlay subject={subject}/>}
          {!selected && (
            <div className="st-dots">
              {SUBJECTS.map((_, i) => (
                <span key={i}
                      className={`st-dot ${i === activeIdx ? 'on' : ''}`}
                      style={{ '--c-subj': subject.color }}/>
              ))}
            </div>
          )}
          {selectedNode && (
            <NodeSheet
              node={selectedNode}
              subject={subject}
              onClose={() => setSelected(null)}/>
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

/**
 * HolyOlyCatalogV2 · Catálogo Macrociclos Holy Oly · 23 planes filtrables.
 *
 * Portado de claude_design_drops/2026-05-27_pkql_v2/holy-oly-catalog.jsx
 * Cambios:
 *  - jsx → tsx con tipos
 *  - useNav para navegar a HO_MACRO_DETAIL al tap card
 *  - scope CSS bajo .hc-root (sin reset global)
 *  - sin frame .phone (la app ya es mobile-first)
 */
import { useState, useMemo, type CSSProperties, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import '../../styles/v2/holy-oly-catalog.css';

// ============================================================
// Mock data · 23 macrocycles
// API: GET /v1/macrocycles?product=holy-oly
// ============================================================

interface Macro {
  id: string;
  name: string;
  family: string;
  dur: number;
  freq: number;
  int: number;
  vol: number;
  rec: number;
  reps: string;
  tagline: string;
  bestFor: string;
  status?: 'active' | 'done';
  doneCount?: number;
}

const MACROCYCLES: Macro[] = [
  // RUSO (4)
  { id:'ruso-clasico-16',  name:'Ruso Clásico',         family:'ruso',     dur:16, freq:5, int:4, vol:5, rec:2, reps:'500-650', tagline:'Variabilidad · waviness · GPP', bestFor:'Atletas pacientes que valoran fundamentos sólidos · ciclo largo' },
  { id:'ruso-12s',         name:'Ruso 12 sem',          family:'ruso',     dur:12, freq:4, int:4, vol:4, rec:3, reps:'380-480', tagline:'Versión condensada · base ondulada', bestFor:'Intermedio · objetivo 3-4 meses pre-meet' },
  { id:'medvedev-base',    name:'Medvedev Base',        family:'ruso',     dur:20, freq:5, int:5, vol:5, rec:2, reps:'620-780', tagline:'Texto soviético original · clásico estricto', bestFor:'Avanzado · base soviética purista' },
  { id:'roman-8s',         name:'Roman 8',              family:'ruso',     dur:8,  freq:4, int:4, vol:4, rec:3, reps:'260-340', tagline:'Bloque corto · pre-competencia', bestFor:'Atleta intermedio · 8 semanas focalizadas' },
  // BÚLGARO (3)
  { id:'bulgaro-pureza',   name:'Búlgaro Pureza',       family:'bulgaro',  dur:8,  freq:6, int:5, vol:3, rec:1, reps:'180-240', tagline:'Daily max · Abadjiev puro', bestFor:'Avanzado · SNC adaptado · sin lesiones recientes', status:'active' },
  { id:'bulgaro-mod',      name:'Búlgaro Modificado',   family:'bulgaro',  dur:10, freq:5, int:5, vol:3, rec:2, reps:'240-300', tagline:'Daily max adaptado · ventana intensidad', bestFor:'Intermedio-avanzado · primera exposición a daily max' },
  { id:'abadjiev-8s',      name:'Abadjiev 8s',          family:'bulgaro',  dur:8,  freq:6, int:5, vol:3, rec:1, reps:'200-260', tagline:'Pico de intensidad · pre-meet', bestFor:'Pre-competencia · alta tolerancia CNS' },
  // CUBANO (3)
  { id:'cubano-tecnica',   name:'Cubano Técnica',       family:'cubano',   dur:8,  freq:4, int:3, vol:4, rec:4, reps:'280-340', tagline:'Foco técnico · variantes amplias', bestFor:'Principiante a intermedio · pulir clásicos' },
  { id:'cubano-clasico',   name:'Cubano Clásico 12',    family:'cubano',   dur:12, freq:4, int:3, vol:4, rec:4, reps:'400-500', tagline:'Variantes amplias · ondulación suave', bestFor:'Reentrada o atleta nuevo · 3 meses base' },
  { id:'pedrosa',          name:'Pedrosa',              family:'cubano',   dur:14, freq:5, int:4, vol:4, rec:3, reps:'480-600', tagline:'Cubano avanzado · sistema híbrido', bestFor:'Intermedio-avanzado caribeño' },
  // COREANO (3)
  { id:'coreano-5d',       name:'Coreano 5D',           family:'coreano',  dur:12, freq:5, int:4, vol:5, rec:2, reps:'520-640', tagline:'Disciplina + tirones largos', bestFor:'Atleta serio · alta carga de tirones', status:'done', doneCount:1 },
  { id:'coreano-6d',       name:'Coreano 6D',           family:'coreano',  dur:16, freq:6, int:5, vol:5, rec:1, reps:'700-880', tagline:'Full-time · disciplina coreana', bestFor:'Atleta full-time · alta capacidad recuperación' },
  { id:'jang-mi-ran',      name:'Jang Mi-Ran',          family:'coreano',  dur:20, freq:6, int:5, vol:5, rec:1, reps:'880-1080', tagline:'Pirámide olímpica · referencia oro', bestFor:'Atleta de elite · pre-mundial' },
  // CHINO (3)
  { id:'chino-pulls',      name:'Chino Pulls',          family:'chino',    dur:12, freq:5, int:4, vol:5, rec:2, reps:'540-680', tagline:'Tirones + culturismo · base estructural', bestFor:'Corrección de debilidades · pulls altos' },
  { id:'lu-xiaojun',       name:'Lu Xiaojun',           family:'chino',    dur:16, freq:5, int:5, vol:4, rec:2, reps:'620-780', tagline:'Avanzado clásico · refinamiento', bestFor:'Avanzado · técnica refinada' },
  { id:'chino-tianjin',    name:'Tianjin',              family:'chino',    dur:20, freq:6, int:5, vol:5, rec:1, reps:'880-1100', tagline:'Programa institucional chino', bestFor:'Elite institucional · alta carga' },
  // POLACO (2)
  { id:'polaco-michalak',  name:'Polaco Michalak',      family:'polaco',   dur:12, freq:5, int:4, vol:4, rec:3, reps:'440-560', tagline:'Block periodization · bloques limpios', bestFor:'Competidor enfocado · estructura por bloque' },
  { id:'polaco-peak-8',    name:'Polaco Peaking 8',     family:'polaco',   dur:8,  freq:4, int:5, vol:3, rec:3, reps:'200-260', tagline:'Pre-competencia · taper inteligente', bestFor:'8 sem pre-meet · taper agresivo' },
  // UCRANIANO (1)
  { id:'slobodyanyuk',     name:'Slobodyanyuk',         family:'ucraniano',dur:14, freq:5, int:4, vol:4, rec:3, reps:'480-600', tagline:'Tirones largos · escuela ucraniana', bestFor:'Intermedio-avanzado · foco tirones' },
  // COLOMBIANO (1)
  { id:'colombiano-torres',name:'Colombiano Torres',    family:'colombiano',dur:12,freq:5, int:4, vol:4, rec:3, reps:'460-580', tagline:'Adaptación latina · clima cálido', bestFor:'Latam · ambiente cálido · trabajo aeróbico extra' },
  // HÍBRIDO (2)
  { id:'ruso-polaco',      name:'Híbrido Ruso/Polaco',  family:'hibrido',  dur:14, freq:5, int:4, vol:4, rec:3, reps:'480-620', tagline:'Volumen ruso + bloques polacos', bestFor:'Atleta que combina volumen y especificidad' },
  { id:'bulgaro-cubano',   name:'Híbrido Bulgaro/Cubano',family:'hibrido', dur:10, freq:5, int:5, vol:4, rec:2, reps:'320-400', tagline:'Daily max + técnica cubana', bestFor:'Avanzado · técnica fina + alta intensidad' },
  // USA (1)
  { id:'uwf-cosp',         name:'USA UWF-COSP',         family:'usa',      dur:12, freq:5, int:4, vol:4, rec:3, reps:'460-580', tagline:'Olympic Training Center · sistema americano', bestFor:'Atletas USAW · sistema federación' },
];

interface Family { id: string; name: string; c: string; }
const FAMILIES: Family[] = [
  { id:'all',        name:'Todos',      c:'transparent' },
  { id:'ruso',       name:'Ruso',       c:'#DC2626' },
  { id:'bulgaro',    name:'Búlgaro',    c:'#16A34A' },
  { id:'cubano',     name:'Cubano',     c:'#2563EB' },
  { id:'coreano',    name:'Coreano',    c:'#EA580C' },
  { id:'chino',      name:'Chino',      c:'#EAB308' },
  { id:'polaco',     name:'Polaco',     c:'#9333EA' },
  { id:'ucraniano',  name:'Ucraniano',  c:'#FACC15' },
  { id:'colombiano', name:'Colombiano', c:'#F97316' },
  { id:'hibrido',    name:'Híbrido',    c:'#06B6D4' },
  { id:'usa',        name:'USA',        c:'#6366F1' },
];

const RECOMMENDED = ['polaco-peak-8', 'cubano-clasico', 'ruso-12s'];
const RECO_REASON: Record<string, string> = {
  'polaco-peak-8':  'Tu última fase fue volumen alto · este enfoca taper',
  'cubano-clasico': 'Recomendado · balance técnica + volumen moderado',
  'ruso-12s':       'Base sólida · 12 sem antes del próximo meet',
};

const FAMILY_LABEL: Record<string, string> = {
  ruso:'RUSO', bulgaro:'BÚLG.', cubano:'CUBANO', coreano:'COREANO',
  chino:'CHINO', polaco:'POLACO', ucraniano:'UCR.', colombiano:'COL.',
  hibrido:'HÍBR.', usa:'USA',
};
const FAMILY_COLOR: Record<string, string> = Object.fromEntries(
  FAMILIES.filter(f => f.id !== 'all').map(f => [f.id, f.c])
);

// ============================================================
// Icons
// ============================================================
const ICONS: Record<string, ReactElement> = {
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  grid:   <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  list:   <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="0.5"/><circle cx="4" cy="12" r="0.5"/><circle cx="4" cy="18" r="0.5"/></>,
  clock:  <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  cal:    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  reps:   <><path d="M3 12h4l3 9 4-18 3 9h4"/></>,
  chev:   <polyline points="9 18 15 12 9 6"/>,
};
interface IconProps { name: keyof typeof ICONS; size?: number; stroke?: number; style?: CSSProperties; className?: string; }
function Icon({ name, size = 14, stroke = 1.7, style, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

// ============================================================
// Subcomponents
// ============================================================
function FilterChips({ families, active, toggle }: { families: Family[]; active: string[]; toggle: (id: string) => void }) {
  return (
    <div className="hc-chips" role="tablist">
      {families.map(f => (
        <div key={f.id}
             className="hc-chip"
             data-all={f.id === 'all'}
             data-active={active.includes(f.id) || (f.id === 'all' && active.length === 0)}
             style={{ ['--cc' as string]: f.c } as CSSProperties}
             onClick={() => toggle(f.id)}>
          {f.id !== 'all' && <span className="dot"/>}
          {f.name}
        </div>
      ))}
    </div>
  );
}

function StatBar({ label, value, k }: { label: string; value: number; k: string }) {
  return (
    <div className="hc-card-bar" data-k={k}>
      <span>{label}</span>
      <div className="b">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={`seg ${i <= value ? 'on' : ''}`}/>
        ))}
      </div>
      <span className="v">{value}/5</span>
    </div>
  );
}

function MacroCard({ m, view, onTap }: { m: Macro; view: 'grid' | 'list'; onTap: (id: string) => void }) {
  const c = FAMILY_COLOR[m.family];
  return (
    <article className="hc-card"
             style={{ ['--cc' as string]: c } as CSSProperties}
             onClick={() => onTap(m.id)}
             aria-label={`Macrociclo ${m.name}, familia ${m.family}, ${m.dur} semanas`}>
      {m.status === 'active' && (
        <span className="hc-card-badge active">✓ ASIGNADO</span>
      )}
      {m.status === 'done' && (
        <span className="hc-card-badge done">✦ ×{m.doneCount}</span>
      )}
      <div className="hc-card-banner">
        <span className="fam">{FAMILY_LABEL[m.family]}</span>
        <span className="meta">{m.dur}s · {m.freq}d</span>
      </div>
      <div className="hc-card-body">
        <div className="hc-card-name">{m.name}</div>
        <div className="hc-card-stats">
          <span className="s"><Icon name="cal" size={11} className="ic"/> <strong>{m.dur}</strong>sem</span>
          <span>·</span>
          <span className="s"><Icon name="clock" size={11} className="ic"/> <strong>{m.freq}</strong>d/sem</span>
          <span>·</span>
          <span className="s"><Icon name="reps" size={11} className="ic"/> {m.reps}</span>
        </div>
        <div className="hc-card-bars">
          <StatBar label="Intensidad" value={m.int} k="int"/>
          <StatBar label="Volumen"    value={m.vol} k="vol"/>
          <StatBar label="Recovery"   value={m.rec} k="rec"/>
        </div>
        <div className="hc-card-tagline">"{m.tagline}"</div>
        <div className="hc-card-best"><strong>Best for ·</strong> {m.bestFor}</div>
      </div>
      {view === 'list' && (
        <div className="hc-card-meta">
          <span>{m.dur}s · {m.freq}d</span>
          <span>I{m.int} V{m.vol}</span>
        </div>
      )}
    </article>
  );
}

function Recommended({ ids, onTap }: { ids: string[]; onTap: (id: string) => void }) {
  if (!ids.length) return null;
  return (
    <div>
      <div className="hc-section-head" style={{marginBottom: 6}}>
        <h3 style={{color: 'var(--engine-stress)'}}>● Recomendados por tu baseline</h3>
        <span className="meta">{ids.length} · scroll →</span>
      </div>
      <div className="hc-reco">
        {ids.map(id => {
          const m = MACROCYCLES.find(x => x.id === id);
          if (!m) return null;
          const c = FAMILY_COLOR[m.family];
          return (
            <div key={id}
                 className="hc-reco-card"
                 style={{ ['--cc' as string]: c } as CSSProperties}
                 onClick={() => onTap(id)}>
              <div className="hc-reco-banner"/>
              <div className="hc-reco-body">
                <div className="hc-reco-name">{m.name}</div>
                <div className="hc-reco-reason">
                  <strong>{m.dur}s · {m.freq}d</strong> · {RECO_REASON[id]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EducativoFooter() {
  const [open, setOpen] = useState(false);
  const rows = [
    { f:'Ruso',     c:'#DC2626', philo:'Volumen + waviness',         spot:'Base sólida 6-12 meses' },
    { f:'Búlgaro',  c:'#16A34A', philo:'Daily max',                  spot:'Avanzado · SNC adaptado' },
    { f:'Cubano',   c:'#2563EB', philo:'Técnica + variantes',        spot:'Principiante a intermedio' },
    { f:'Coreano',  c:'#EA580C', philo:'Disciplina + tirones',       spot:'Atleta full-time' },
    { f:'Chino',    c:'#EAB308', philo:'Pulls + culturismo',         spot:'Corrección de debilidades' },
    { f:'Polaco',   c:'#9333EA', philo:'Block periodization',        spot:'Competidor enfocado' },
  ];
  return (
    <div className="hc-edu" data-open={open}>
      <div className="hc-edu-head" onClick={() => setOpen(o => !o)}>
        <span>¿Qué diferencia una escuela de otra?</span>
        <Icon name="chev" size={16} className="chev"/>
      </div>
      <div className="hc-edu-body">
        Cada escuela responde a una pregunta distinta sobre cómo el cuerpo se adapta.
        Ninguna es "mejor" en abstracto — son herramientas con sweet spots distintos.
        <table className="hc-edu-table">
          <thead>
            <tr><th>Escuela</th><th>Filosofía</th><th>Sweet spot</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.f}>
                <td><span className="pip" style={{background:r.c}}/>{r.f}</td>
                <td>{r.philo}</td>
                <td>{r.spot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Main
// ============================================================
export default function HolyOlyCatalogV2() {
  const { navigate, back } = useNav();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeFamilies, setActive] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const toggleFamily = (id: string) => {
    if (id === 'all') return setActive([]);
    setActive(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = useMemo(() => {
    return MACROCYCLES.filter(m => {
      if (activeFamilies.length > 0 && !activeFamilies.includes(m.family)) return false;
      if (query) {
        const q = query.toLowerCase();
        return m.name.toLowerCase().includes(q)
            || m.tagline.toLowerCase().includes(q)
            || m.family.toLowerCase().includes(q)
            || m.bestFor.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeFamilies, query]);

  const openDetail = (id: string) => {
    try { sessionStorage.setItem('ho:selectedMacroId', id); } catch { /* ignore */ }
    navigate('HO_MACRO_DETAIL');
  };

  return (
    <div className="hc-root">
      <header className="hc-header">
        <div className="hc-h-top">
          <div className="hc-h-title">
            <button
              onClick={back}
              aria-label="Volver"
              style={{ background:'transparent', border:'none', color:'var(--text-mid)', fontSize:18, cursor:'pointer', marginRight:8 }}>‹</button>
            Macrociclos
            <span className="sub">HALTEROFILIA · {MACROCYCLES.length} planes</span>
          </div>
          <div className="hc-view-toggle">
            <button data-active={view === 'grid'} onClick={() => setView('grid')} aria-label="Vista grid">
              <Icon name="grid" size={14}/>
            </button>
            <button data-active={view === 'list'} onClick={() => setView('list')} aria-label="Vista lista">
              <Icon name="list" size={14}/>
            </button>
          </div>
        </div>
        <div className="hc-search-row">
          <div className="hc-search">
            <Icon name="search" size={13} className="ic"/>
            <input
              placeholder="Buscar · ruso, daily max, técnica..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}/>
          </div>
          <div className="hc-counter">
            <strong>{filtered.length}</strong> / {MACROCYCLES.length}
          </div>
        </div>
        <FilterChips families={FAMILIES} active={activeFamilies} toggle={toggleFamily}/>
      </header>

      <div className="hc-scroll">
        {activeFamilies.length === 0 && !query && view === 'grid' && (
          <Recommended ids={RECOMMENDED} onTap={openDetail}/>
        )}

        <div>
          <div className="hc-section-head" style={{marginBottom: 6}}>
            <h3>{activeFamilies.length ? 'Filtrados' : 'Catálogo completo'}</h3>
            <span className="meta">{filtered.length} macros</span>
          </div>
          {filtered.length === 0 ? (
            <div className="hc-empty">
              <span className="glyph">∅</span>
              <span className="lbl">Ningún macrociclo coincide</span>
              <button className="reset" onClick={() => { setActive([]); setQuery(''); }}>↻ Reset filtros</button>
            </div>
          ) : (
            <div className="hc-grid" data-view={view}>
              {filtered.map(m => (
                <MacroCard key={m.id} m={m} view={view} onTap={openDetail}/>
              ))}
            </div>
          )}
        </div>

        <EducativoFooter/>
      </div>
    </div>
  );
}

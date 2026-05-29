/**
 * HolyOlyCatalogV2 · Catálogo Macrociclos Holy Oly · 23 planes filtrables.
 *
 * Conexión backend: GET /v1/macrocycles (requiere token JWT).
 * Si backend responde OK · usa data real. Si falla · fallback al mock estático
 * con metadata enriquecida (tagline, bestFor, etc. que el backend no devuelve).
 *
 * Mapping backend → UI: id, name, school → family, weeks → dur, sessions_per_week
 * → freq, difficulty → int. Volumen/recovery/reps/tagline/bestFor enriquecidos
 * desde el lookup local METADATA (clave por id backend).
 */
import { useState, useMemo, useEffect, type CSSProperties, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import { api } from '../../lib/api';
import { MACROCYCLES } from '../../data/macrocycles';
import '../../styles/v2/holy-oly-catalog.css';

// ============================================================
// API contract · GET /v1/macrocycles
// ============================================================
interface ApiProgram {
  id: string;
  name: string;
  school: string;
  weeks: number;
  focus: string;
  difficulty: number;
  sessions_per_week: number;
}
interface ApiResponse { programs: ApiProgram[] }

const SCHOOL_TO_FAMILY: Record<string, string> = {
  'Bulgarian': 'bulgaro',
  'Russian':   'ruso',
  'Cuban':     'cubano',
  'Korean':    'coreano',
  'Chinese':   'chino',
  'Polish':    'polaco',
  'Ukrainian': 'ucraniano',
  'Colombian': 'colombiano',
  'Hybrid':    'hibrido',
  'USA':       'usa',
  'American':  'usa',
};

// Metadata enriquecida que el backend no devuelve · indexada por id backend.
// Si el backend agrega un id desconocido · se renderiza con valores por defecto.
const METADATA: Record<string, { vol: number; rec: number; reps: string; tagline: string; bestFor: string }> = {
  // RUSO
  russian_classic:  { vol: 5, rec: 2, reps: '500-650', tagline: 'Variabilidad · waviness · GPP',           bestFor: 'Atletas pacientes con fundamentos sólidos · ciclo largo' },
  russian_speed:    { vol: 4, rec: 3, reps: '380-480', tagline: 'Strength-speed · velocidad de la barra',  bestFor: 'Intermedio · objetivo 8 semanas pre-meet' },
  russian_chains:   { vol: 5, rec: 2, reps: '620-780', tagline: 'Heavy chains · variable resistance',      bestFor: 'Avanzado · trabajo accommodating resistance' },
  // BÚLGARO
  bulgarian_hf:        { vol: 3, rec: 1, reps: '180-240', tagline: 'High Frequency · daily max',             bestFor: 'Avanzado · SNC adaptado · sin lesiones recientes' },
  bulgarian_heavy:     { vol: 4, rec: 1, reps: '240-320', tagline: 'Bulgarian Heavy · 12 semanas brutales',  bestFor: 'Avanzado · capacidad de recuperación élite' },
  bulgarian_strength:  { vol: 3, rec: 2, reps: '160-220', tagline: 'Strength block · 6 semanas focalizadas', bestFor: 'Intermedio · primer ciclo búlgaro' },
};

// ============================================================
// Mock data · 23 macrocycles (FALLBACK si backend offline)
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

// Fallback offline (sin backend / 401). Se DERIVA de la fuente canónica
// data/macrocycles.ts para que catálogo, detalle y asignación usen los MISMOS
// ids → coherencia: tap en el catálogo abre el detalle correcto del macro.
const FAMILY_ID: Record<string, string> = {
  'Ruso': 'ruso', 'Búlgaro': 'bulgaro', 'Coreano': 'coreano', 'Chino': 'chino',
  'Cubano': 'cubano', 'Polaco': 'polaco', 'Ucraniano': 'ucraniano',
  'Colombiano': 'colombiano', 'Híbrido': 'hibrido', 'USA': 'usa',
};
const numFrom = (s: string, def: number) => {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : def;
};
function macrocyclesToCards(): Macro[] {
  return MACROCYCLES.filter(m => m.product === 'holy-oly').map(m => ({
    id: m.id,
    name: m.name,
    family: FAMILY_ID[m.family] ?? m.family.toLowerCase(),
    dur: numFrom(m.duration, 12),
    freq: numFrom(m.frequency, 5),
    int: m.intensity,
    vol: m.volume,
    rec: Math.max(1, Math.min(5, 6 - m.intensity)),
    reps: `${m.volume * 100}-${m.volume * 120}`,
    tagline: m.desc,
    bestFor: m.bestFor ?? '',
  }));
}
const FALLBACK_MACROCYCLES: Macro[] = macrocyclesToCards();

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

const RECOMMENDED = ['ruso-5d', 'cubano-int-5d', 'usa-catalyst'];
const RECO_REASON: Record<string, string> = {
  'ruso-5d':       'Base sólida · ciclo largo con waviness antes del próximo meet',
  'cubano-int-5d': 'Balance técnica + volumen moderado',
  'usa-catalyst':  'Progresión estructurada · sistema bien documentado',
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

function Recommended({ ids, programs, onTap }: { ids: string[]; programs: Macro[]; onTap: (id: string) => void }) {
  if (!ids.length) return null;
  return (
    <div>
      <div className="hc-section-head" style={{marginBottom: 6}}>
        <h3 style={{color: 'var(--engine-stress)'}}>● Recomendados por tu baseline</h3>
        <span className="meta">{ids.length} · scroll →</span>
      </div>
      <div className="hc-reco">
        {ids.map(id => {
          const m = programs.find(x => x.id === id);
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
// Mapper · ApiProgram (backend) → Macro (UI)
// Enriquece con METADATA local si existe · sino usa defaults razonables.
// ============================================================
function apiToMacro(p: ApiProgram): Macro {
  const meta = METADATA[p.id];
  const family = SCHOOL_TO_FAMILY[p.school] ?? p.school.toLowerCase();
  return {
    id: p.id,
    name: p.name,
    family,
    dur: p.weeks,
    freq: p.sessions_per_week,
    int: p.difficulty,
    vol: meta?.vol ?? Math.min(5, Math.max(1, Math.round(p.weeks / 4))),
    rec: meta?.rec ?? Math.max(1, 5 - p.difficulty),
    reps: meta?.reps ?? `${p.weeks * 30}-${p.weeks * 40}`,
    tagline: meta?.tagline ?? `${p.school} · ${p.focus.toLowerCase()}`,
    bestFor: meta?.bestFor ?? `Dificultad ${p.difficulty}/5 · ${p.sessions_per_week}d/sem`,
  };
}

// ============================================================
// Main
// ============================================================
export default function HolyOlyCatalogV2() {
  const { navigate, back } = useNav();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeFamilies, setActive] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [programs, setPrograms] = useState<Macro[]>(FALLBACK_MACROCYCLES);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'backend' | 'fallback'>('fallback');

  // Fetch real de macrocyclos desde el backend al mount.
  // GET /v1/macrocycles requiere token JWT · api.get lo agrega automático.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse>('/v1/macrocycles');
        if (cancelled) return;
        // El catálogo es canónico (data/macrocycles.ts · RAW_SOURCES). El backend
        // tiene un seed EQUIVOCADO (escuelas Iraní/Turco/Japonés/Europeo que NO son
        // las originales) con ids que el detalle no reconoce → si los usáramos, el
        // tap caería al primer macro (Búlgaro 6D). Solo aceptamos del backend los
        // macros cuyo id exista en la fuente canónica (hoy: ninguno → se ignora).
        const list = (res?.programs ?? []).map(apiToMacro)
          .filter(m => MACROCYCLES.some(x => x.id === m.id));
        if (list.length > 0) {
          setPrograms(list);
          setSource('backend');
        }
      } catch {
        // Sin token / offline / 5xx → usar FALLBACK (init state)
        if (!cancelled) setSource('fallback');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleFamily = (id: string) => {
    if (id === 'all') return setActive([]);
    setActive(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = useMemo(() => {
    return programs.filter(m => {
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
  }, [activeFamilies, query, programs]);

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
            <span className="sub">HALTEROFILIA · {programs.length} planes{loading ? ' · cargando...' : (source === 'backend' ? ' · live' : ' · offline')}</span>
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
            <strong>{filtered.length}</strong> / {programs.length}
          </div>
        </div>
        <FilterChips families={FAMILIES} active={activeFamilies} toggle={toggleFamily}/>
      </header>

      <div className="hc-scroll">
        {activeFamilies.length === 0 && !query && view === 'grid' && (
          <Recommended ids={RECOMMENDED} programs={programs} onTap={openDetail}/>
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

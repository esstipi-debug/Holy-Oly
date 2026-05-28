import React, { useState, useMemo, useEffect, type CSSProperties } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';
import { MACROCYCLES, type Macrocycle } from '../data/macrocycles';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import {
  tryFetchMacrocycles,
  trySuggestMacrosFor,
  type RemoteMacrocycle,
  type MacroSuggestResponse,
} from '../lib/macrocycleApi';
import '../styles/v2/assign-macro.css';

// Barras 1-5 estilo catálogo V2 (.am-bar). k = 'int' | 'vol' colorea el fill.
const SegBars: React.FC<{ label: string; value: number; k: 'int' | 'vol' }> = ({ label, value, k }) => (
  <div className="am-bar" data-k={k}>
    <span>{label}</span>
    <div className="segs">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`seg ${i <= value ? 'on' : ''}`} />
      ))}
    </div>
    <span className="v">{value}/5</span>
  </div>
);

// Mapea intensidad 1-5 → tier de disco halterofilia (blanco→rojo).
function intensityTier(intensity: number): PlateTier {
  if (intensity <= 1) return 'white';
  if (intensity === 2) return 'green';
  if (intensity === 3) return 'yellow';
  if (intensity === 4) return 'blue';
  return 'red';
}

// Shape común UI (super-set entre Macrocycle local y RemoteMacrocycle).
type UIMacro = {
  id: string;
  name: string;
  family: string;
  product: 'holy-oly' | 'volta';
  desc: string;
  frequency: string;
  duration: string;
  intensity: number;
  volume: number;
  color: string;
  bestFor?: string;
  focus?: string;     // sólo backend
  school?: string;    // sólo backend
};

function toUI(m: Macrocycle | RemoteMacrocycle): UIMacro {
  return {
    id: m.id,
    name: m.name,
    family: m.family,
    product: m.product,
    desc: m.desc,
    frequency: m.frequency,
    duration: m.duration,
    intensity: m.intensity,
    volume: m.volume,
    color: m.color,
    bestFor: m.bestFor,
    focus: 'focus' in m ? m.focus : undefined,
    school: 'school' in m ? m.school : undefined,
  };
}

type FamilyFilter = 'TODOS' | string;
type FocusFilter = 'TODOS' | string;

const AssignMacrocycle: React.FC = () => {
  const { navigate } = useNav();
  const { selectedAthlete, athlete: currentAthlete } = useAthlete();
  const { product } = useProduct();
  const target = selectedAthlete ?? currentAthlete;

  const [selected, setSelected] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<FamilyFilter>('TODOS');
  const [focusFilter, setFocusFilter] = useState<FocusFilter>('TODOS');
  const [remoteMacros, setRemoteMacros] = useState<RemoteMacrocycle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [suggestions, setSuggestions] = useState<MacroSuggestResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [showFullList, setShowFullList] = useState(false);

  // Fetch desde el backend real (con fallback a data local)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await tryFetchMacrocycles();
      if (cancelled) return;
      if (remote && remote.length > 0) {
        setRemoteMacros(remote);
        setSource('api');
      } else {
        setSource('local');
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch sugerencias top-3 cuando hay atleta seleccionado y producto holy-oly
  useEffect(() => {
    if (!target || product !== 'holy-oly') {
      setSuggestions(null);
      return;
    }
    let cancelled = false;
    setSuggestionsLoading(true);
    (async () => {
      const res = await trySuggestMacrosFor(target.id);
      if (cancelled) return;
      setSuggestions(res);
      setSuggestionsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [target?.id, product]);

  // Pool combinado: backend (holy-oly real) + locales de Volta que no están en backend.
  // Los 23 del backend son halterofilia (holy-oly). Para Volta seguimos con la data local.
  const allMacros: UIMacro[] = useMemo(() => {
    const local = MACROCYCLES.map(toUI);
    if (!remoteMacros) return local;
    const remoteUI = remoteMacros.map(toUI);
    // Mantener locales de Volta + remoto holy-oly
    const voltaLocal = local.filter(m => m.product === 'volta');
    return [...remoteUI, ...voltaLocal];
  }, [remoteMacros]);

  const macrosForProduct = useMemo(
    () => allMacros.filter(m => m.product === product),
    [allMacros, product],
  );

  const familiesForProduct = useMemo(
    () => Array.from(new Set(macrosForProduct.map(m => m.family))),
    [macrosForProduct],
  );

  const focusesForProduct = useMemo(
    () => Array.from(new Set(macrosForProduct.map(m => m.focus).filter(Boolean) as string[])),
    [macrosForProduct],
  );

  const filtered = useMemo(() => {
    return macrosForProduct.filter(m => {
      const familyOk = familyFilter === 'TODOS' || m.family === familyFilter;
      const focusOk = focusFilter === 'TODOS' || m.focus === focusFilter;
      return familyOk && focusOk;
    });
  }, [familyFilter, focusFilter, macrosForProduct]);

  // Reset filtros si cambia el producto y el filter ya no aplica
  useEffect(() => {
    if (familyFilter !== 'TODOS' && !familiesForProduct.includes(familyFilter)) {
      setFamilyFilter('TODOS');
    }
    if (focusFilter !== 'TODOS' && !focusesForProduct.includes(focusFilter)) {
      setFocusFilter('TODOS');
    }
  }, [product, familyFilter, focusFilter, familiesForProduct, focusesForProduct]);

  const handleConfirm = () => {
    if (!selected) return;
    navigate('ATHLETE_DETAIL');
  };

  const initials = target ? target.name.split(' ').slice(0, 2).map(n => n[0]).join('') : '';
  const selectedMacro = selected ? macrosForProduct.find(m => m.id === selected) : null;

  // Mostrar filtros + listado completo cuando: no hay panel WISE (no holy-oly / sin atleta)
  // o el coach pidió "ver todos".
  const showCatalog = showFullList || product !== 'holy-oly' || !target;

  return (
    <div className="am-root">

      {/* HEADER */}
      <header className="am-header">
        <h1 className="am-title">Asignar Macrociclo</h1>
        <span className="am-sub">
          {loading
            ? 'Cargando programas…'
            : `${macrosForProduct.length} sistemas · ${source === 'api' ? 'engine real' : 'local fallback'}`}
        </span>
      </header>

      {/* SELECTED ATHLETE */}
      {target && (
        <div className="am-section">
          <div className="am-athlete">
            <div className="am-athlete-avatar">{initials}</div>
            <div className="am-athlete-meta">
              <p className="am-athlete-name">{target.name}</p>
              <p className="am-athlete-macro">
                Macro actual: <strong>{target.macrocycle.program_name}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS PANEL · top-3 (WISE) */}
      {product === 'holy-oly' && target && (
        <div className="am-section">
          <div className="am-wise">
            <div className="am-wise-head">
              <span className="am-wise-glyph">✦</span>
              <p className="am-wise-title">WISE sugiere para {target.name.split(' ')[0]}</p>
              {suggestions?.athlete_level && (
                <span className="am-wise-level">{suggestions.athlete_level}</span>
              )}
            </div>

            {suggestionsLoading && (
              <p className="am-wise-empty">Analizando perfil…</p>
            )}

            {!suggestionsLoading && (!suggestions || suggestions.suggestions.length === 0) && (
              <p className="am-wise-empty">
                Sin sugerencias disponibles · explorá el listado completo abajo.
              </p>
            )}

            {!suggestionsLoading && suggestions && suggestions.suggestions.length > 0 && (
              <>
                <div className="am-wise-list">
                  {suggestions.suggestions.map((sug) => {
                    const isExpanded = expandedSuggestion === sug.macro_id;
                    const isSelected = selected === sug.macro_id;
                    const matching = macrosForProduct.find(m => m.id === sug.macro_id);
                    const accent = matching?.color ?? 'var(--engine-macro)';
                    return (
                      <button
                        key={sug.macro_id}
                        className="am-sug"
                        data-selected={isSelected}
                        style={{ ['--cc' as string]: accent } as CSSProperties}
                        onClick={() => setExpandedSuggestion(isExpanded ? null : sug.macro_id)}
                      >
                        <div className="am-sug-row">
                          <div className="am-sug-main">
                            <div className="am-sug-name-row">
                              <span className="am-sug-check">✓</span>
                              <p className="am-sug-name">{sug.macro_name}</p>
                            </div>
                            <p className="am-sug-reason">{sug.reasoning}</p>
                          </div>
                          <div className="am-sug-score">{Math.round(sug.score * 100)}</div>
                        </div>

                        {isExpanded && (
                          <div className="am-sug-detail">
                            <div className="am-sug-tags">
                              <span><strong>{sug.duration_weeks}</strong> sem</span>
                              <span><strong>{sug.sessions_per_week}</strong>d/sem</span>
                              <span>{sug.school}</span>
                              <span>{sug.focus}</span>
                              <span>Difficulty {sug.difficulty}/5</span>
                            </div>
                            <button
                              className="am-sug-assign"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(sug.macro_id);
                                setShowFullList(false);
                              }}
                            >
                              Asignar este macro
                            </button>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {suggestions.rationale && (
                  <p className="am-wise-rationale">
                    <span className="pre">✦ WISE: </span>
                    {suggestions.rationale}
                  </p>
                )}
                <p className="am-wise-disclaimer">
                  Son sugerencias del sistema · vos decidís el macrociclo final.
                </p>
              </>
            )}

            <button className="am-wise-toggle" onClick={() => setShowFullList(v => !v)}>
              {showFullList ? 'Ocultar listado' : `Ver todos (${macrosForProduct.length})`}
            </button>
          </div>
        </div>
      )}

      {/* FAMILY FILTER (escuelas) */}
      {showCatalog && (
        <div className="am-section" style={{ paddingBottom: 8 }}>
          <p className="am-filter-label">Escuela</p>
          <div className="am-chips scroll-x-no-bar">
            {(['TODOS', ...familiesForProduct] as FamilyFilter[]).map(f => (
              <button
                key={f}
                className="am-chip"
                data-all={f === 'TODOS'}
                data-active={familyFilter === f}
                onClick={() => setFamilyFilter(f)}
              >{f}</button>
            ))}
          </div>
        </div>
      )}

      {/* FOCUS FILTER (sólo si la API devolvió focus) */}
      {showCatalog && focusesForProduct.length > 0 && (
        <div className="am-section">
          <p className="am-filter-label">Foco</p>
          <div className="am-chips scroll-x-no-bar">
            {(['TODOS', ...focusesForProduct] as FocusFilter[]).map(f => (
              <button
                key={f}
                className="am-chip am-chip--focus"
                data-all={f === 'TODOS'}
                data-active={focusFilter === f}
                onClick={() => setFocusFilter(f)}
              >{f}</button>
            ))}
          </div>
        </div>
      )}

      {/* PROGRAM LIST */}
      {showCatalog && (
        <div className="am-section" style={{ paddingBottom: 20 }}>
          <p className="am-count"><strong>{filtered.length}</strong> disponibles</p>
          <div className="am-list">
            {filtered.map((macro) => {
              const active = selected === macro.id;
              return (
                <button
                  key={macro.id}
                  className="am-card"
                  data-active={active}
                  style={{ ['--cc' as string]: macro.color } as CSSProperties}
                  onClick={() => setSelected(macro.id)}
                >
                  <div className="am-card-banner">
                    <span className="fam">{macro.family}</span>
                    <span className="meta">{macro.duration} · {macro.frequency}</span>
                  </div>
                  <div className="am-card-body">
                    <div className="am-card-top">
                      <div className="am-card-head">
                        <p className="am-card-name">{macro.name}</p>
                        <p className="am-card-desc">{macro.desc}</p>
                        <div className="am-card-pills">
                          <span className="am-pill">{macro.frequency}</span>
                          <span className="am-pill">{macro.duration}</span>
                          {macro.focus && (
                            <span className="am-pill am-pill--focus">{macro.focus}</span>
                          )}
                        </div>
                      </div>
                      <div className="am-card-aside">
                        <PlateBadge tier={intensityTier(macro.intensity)} size={40} />
                        <div className="am-card-radio">
                          {active && <span className="dot" />}
                        </div>
                      </div>
                    </div>

                    <div className="am-card-bars">
                      <SegBars label="Intensidad" value={macro.intensity} k="int" />
                      <SegBars label="Volumen" value={macro.volume} k="vol" />
                    </div>

                    {active && macro.bestFor && (
                      <p className="am-card-best">💡 {macro.bestFor}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CONFIRM (sticky con backdrop para no superponerse con cards) */}
      <div className="am-confirm-bar">
        <button className="am-confirm" onClick={handleConfirm} disabled={!selected}>
          {selectedMacro
            ? `Confirmar · ${selectedMacro.name}`
            : 'Elegí un macrociclo'}
        </button>
      </div>
    </div>
  );
};

export default AssignMacrocycle;

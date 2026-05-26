import React, { useState, useMemo, useEffect } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';
import { MACROCYCLES, type Macrocycle } from '../data/macrocycles';
import {
  tryFetchMacrocycles,
  trySuggestMacrosFor,
  type RemoteMacrocycle,
  type MacroSuggestResponse,
} from '../lib/macrocycleApi';

const Bars: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        style={{
          width: 12, height: 4, borderRadius: 2,
          background: i <= value ? color : 'var(--card-border)',
        }}
      />
    ))}
  </div>
);

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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 170 }}>

      {/* HEADER */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' }}>
          Asignar Macrociclo
        </h1>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>
          {loading
            ? 'Cargando programas…'
            : `${macrosForProduct.length} sistemas · ${source === 'api' ? 'engine real' : 'local fallback'}`}
        </p>
      </div>

      {/* SELECTED ATHLETE */}
      {target && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            background: 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.25)',
            borderRadius: 16, padding: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: 'linear-gradient(135deg, #06B6D4, #0070FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#fff',
            }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{target.name}</p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                Macro actual: {target.macrocycle.program_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS PANEL · top-3 */}
      {product === 'holy-oly' && target && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(239,68,68,0.06))',
            border: '1px solid rgba(245,158,11,0.30)',
            borderRadius: 16, padding: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                Recomendados para {target.name.split(' ')[0]}
              </p>
              {suggestions?.athlete_level && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                  background: 'rgba(245,158,11,0.18)', color: '#F59E0B',
                  letterSpacing: '.06em', textTransform: 'uppercase',
                }}>{suggestions.athlete_level}</span>
              )}
            </div>

            {suggestionsLoading && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Analizando perfil…
              </p>
            )}

            {!suggestionsLoading && (!suggestions || suggestions.suggestions.length === 0) && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Sin sugerencias disponibles · explorá el listado completo abajo.
              </p>
            )}

            {!suggestionsLoading && suggestions && suggestions.suggestions.length > 0 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {suggestions.suggestions.map((sug) => {
                    const isExpanded = expandedSuggestion === sug.macro_id;
                    const isSelected = selected === sug.macro_id;
                    const matching = macrosForProduct.find(m => m.id === sug.macro_id);
                    const accent = matching?.color ?? '#F59E0B';
                    return (
                      <button
                        key={sug.macro_id}
                        onClick={() => setExpandedSuggestion(isExpanded ? null : sug.macro_id)}
                        style={{
                          textAlign: 'left',
                          background: isSelected ? `${accent}15` : 'var(--surface)',
                          border: `1px solid ${isSelected ? accent : 'var(--card-border)'}`,
                          borderLeft: `3px solid ${accent}`,
                          borderRadius: 12, padding: '10px 12px',
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: accent, fontSize: 11, fontWeight: 800 }}>✓</span>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sug.macro_name}
                              </p>
                            </div>
                            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                              {sug.reasoning}
                            </p>
                          </div>
                          <div style={{
                            flexShrink: 0,
                            fontSize: 10, fontWeight: 800,
                            padding: '4px 8px', borderRadius: 8,
                            background: `${accent}22`, color: accent,
                            letterSpacing: '.04em',
                          }}>
                            {Math.round(sug.score * 100)}
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{
                            marginTop: 10, paddingTop: 10,
                            borderTop: `1px dashed ${accent}55`,
                          }}>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10, color: 'var(--text-secondary)' }}>
                              <span><strong style={{ color: 'var(--text)' }}>{sug.duration_weeks}</strong> sem</span>
                              <span><strong style={{ color: 'var(--text)' }}>{sug.sessions_per_week}</strong>d/sem</span>
                              <span>{sug.school}</span>
                              <span>{sug.focus}</span>
                              <span>Difficulty {sug.difficulty}/5</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(sug.macro_id);
                                setShowFullList(false);
                              }}
                              style={{
                                marginTop: 10, width: '100%',
                                padding: '9px 0', borderRadius: 10,
                                background: accent, color: '#fff',
                                border: 'none', fontFamily: 'inherit',
                                fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                                cursor: 'pointer',
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
                  <p style={{
                    fontSize: 10, color: 'var(--text-secondary)',
                    marginTop: 10, fontStyle: 'italic', lineHeight: 1.4,
                  }}>
                    {suggestions.rationale}
                  </p>
                )}
              </>
            )}

            <button
              onClick={() => setShowFullList(v => !v)}
              style={{
                marginTop: 12, width: '100%',
                padding: '8px 0', borderRadius: 8,
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--card-border)',
                fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {showFullList ? 'Ocultar listado' : `Ver todos (${macrosForProduct.length})`}
            </button>
          </div>
        </div>
      )}

      {/* FAMILY FILTER (escuelas) */}
      {(showFullList || product !== 'holy-oly' || !target) && (
      <div style={{ padding: '0 20px 8px' }}>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          Escuela
        </p>
        <div
          className="scroll-x-no-bar"
          style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}
        >
          {(['TODOS', ...familiesForProduct] as FamilyFilter[]).map(f => {
            const active = familyFilter === f;
            return (
              <button
                key={f}
                onClick={() => setFamilyFilter(f)}
                style={{
                  flexShrink: 0,
                  padding: '7px 13px', borderRadius: 999,
                  background: active ? 'var(--text)' : 'var(--surface)',
                  color: active ? 'var(--bg)' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--text)' : 'var(--card-border)'}`,
                  fontSize: 11, fontWeight: 700, letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{f}</button>
            );
          })}
        </div>
      </div>
      )}

      {/* FOCUS FILTER (sólo si la API devolvió focus) */}
      {(showFullList || product !== 'holy-oly' || !target) && focusesForProduct.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Foco
          </p>
          <div
            className="scroll-x-no-bar"
            style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}
          >
            {(['TODOS', ...focusesForProduct] as FocusFilter[]).map(f => {
              const active = focusFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFocusFilter(f)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 11px', borderRadius: 999,
                    background: active ? '#06B6D4' : 'var(--surface)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${active ? '#06B6D4' : 'var(--card-border)'}`,
                    fontSize: 10, fontWeight: 700, letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{f}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHOOLS */}
      {(showFullList || product !== 'holy-oly' || !target) && (
      <div style={{ padding: '0 20px 20px' }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          {filtered.length} disponibles
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((macro) => {
            const active = selected === macro.id;
            return (
              <button
                key={macro.id}
                onClick={() => setSelected(macro.id)}
                style={{
                  textAlign: 'left',
                  background: active ? `${macro.color}10` : 'var(--surface)',
                  border: `1px solid ${active ? macro.color : 'var(--card-border)'}`,
                  borderLeft: `4px solid ${macro.color}`,
                  borderRadius: 16, padding: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: active ? macro.color : 'var(--text)' }}>
                      {macro.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                      {macro.desc}
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                        background: 'var(--surface2)', color: 'var(--text-secondary)',
                        letterSpacing: '.04em', textTransform: 'uppercase',
                      }}>{macro.frequency}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                        background: 'var(--surface2)', color: 'var(--text-secondary)',
                        letterSpacing: '.04em', textTransform: 'uppercase',
                      }}>{macro.duration}</span>
                      {macro.focus && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
                          background: `${macro.color}1a`, color: macro.color,
                          letterSpacing: '.04em', textTransform: 'uppercase',
                        }}>{macro.focus}</span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1.5px solid ${active ? macro.color : 'var(--card-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {active && (
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: macro.color }} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 18, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Intensidad
                    </p>
                    <Bars value={macro.intensity} color="#EF4444" />
                  </div>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Volumen
                    </p>
                    <Bars value={macro.volume} color="#06B6D4" />
                  </div>
                </div>

                {active && macro.bestFor && (
                  <p style={{
                    fontSize: 10, color: macro.color, marginTop: 10,
                    paddingTop: 10, borderTop: `1px dashed ${macro.color}55`,
                    fontStyle: 'italic',
                  }}>
                    💡 {macro.bestFor}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* CONFIRM (sticky con backdrop para no superponerse con cards) */}
      <div style={{
        position: 'absolute', bottom: 76, left: 0, right: 0,
        zIndex: 40,
        padding: '14px 16px 12px',
        background: 'linear-gradient(to top, var(--bg) 0%, var(--bg) 60%, transparent 100%)',
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14,
            background: selected ? 'var(--cta-bg)' : 'var(--surface)',
            color: selected ? 'var(--cta-text)' : 'var(--text-secondary)',
            border: selected ? 'none' : '1px solid var(--card-border)',
            fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: selected ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            opacity: selected ? 1 : 0.6,
            transition: 'all .2s ease',
            boxShadow: selected ? '0 6px 20px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          {selectedMacro
            ? `Confirmar · ${selectedMacro.name}`
            : 'Elegí un macrociclo'}
        </button>
      </div>
    </div>
  );
};

export default AssignMacrocycle;

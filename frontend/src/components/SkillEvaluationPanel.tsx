import React, { useEffect, useMemo, useState } from 'react';
import { SKILLS, SUBJECTS, type Skill, type SubjectId } from '../data/skillTree';
import {
  skillEvaluation,
  type SkillEvaluationLevel,
  type SkillEvaluationResponse,
} from '../lib/skillEvaluation';
import { useToast } from './Toast';
import type { AthleteProfile } from '../data/athletes';

/**
 * Coach evalúa el nivel de destreza del atleta sobre cada movimiento del skill tree.
 *
 * Diferente de SkillFocusAssign:
 * - SkillFocusAssign  → "trabajá ESTO esta semana" (foco de trabajo)
 * - SkillEvaluationPanel → "tu destreza HOY es X estrellas" (veredicto persistente)
 *
 * UX:
 * - Filtro por subject (gym / oly / power / metcon) + búsqueda por nombre
 * - Lista compacta con stars 1-5 tappables
 * - Textarea inline para nota del coach
 * - Botón "Guardar" por fila (upsert)
 * - Indicador "no evaluado todavía" para movimientos sin nivel
 */

const HO_GOLD = '#F5C518';
const HO_PURPLE = '#7C5CFF';
const STAR_GOLD = '#FBBF24';
const NOTE_MAX = 300;
const PAGE_SIZE = 20;

const LEVEL_LABELS: Record<SkillEvaluationLevel, string> = {
  1: 'novato',
  2: 'básico',
  3: 'funcional',
  4: 'sólido',
  5: 'maestría',
};

interface Props {
  athlete: AthleteProfile;
}

const SkillEvaluationPanel: React.FC<Props> = ({ athlete }) => {
  const { showToast } = useToast();

  const [evaluations, setEvaluations] = useState<SkillEvaluationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [showOnlyUnevaluated, setShowOnlyUnevaluated] = useState<boolean>(false);

  // Estado por fila: nivel pendiente + nota pendiente (controlados localmente
  // hasta que el coach toca "Guardar").
  const [draftLevels, setDraftLevels] = useState<Record<string, SkillEvaluationLevel>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await skillEvaluation.list({ athleteId: athlete.id });
      setEvaluations(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos cargar las evaluaciones';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athlete.id]);

  const evalByMovement = useMemo(() => {
    const m = new Map<string, SkillEvaluationResponse>();
    for (const e of evaluations) m.set(e.movement_id, e);
    return m;
  }, [evaluations]);

  const filteredSkills = useMemo(() => {
    const term = search.trim().toLowerCase();
    let base = subjectFilter === 'all'
      ? SKILLS
      : SKILLS.filter(s => s.subject === subjectFilter);
    if (term) {
      base = base.filter(s => s.name.toLowerCase().includes(term));
    }
    if (showOnlyUnevaluated) {
      base = base.filter(s => !evalByMovement.has(s.id));
    }
    return base.slice().sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  }, [subjectFilter, search, showOnlyUnevaluated, evalByMovement]);

  const pageCount = Math.max(1, Math.ceil(filteredSkills.length / PAGE_SIZE));
  const visible = filteredSkills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page si cambian filtros y queda fuera de rango
  useEffect(() => {
    if (page >= pageCount) setPage(0);
  }, [pageCount, page]);

  const subjectAccent = (s: Skill) =>
    SUBJECTS.find(x => x.id === s.subject)?.color ?? HO_PURPLE;

  const handleStarClick = (skill: Skill, level: SkillEvaluationLevel) => {
    setDraftLevels(prev => ({ ...prev, [skill.id]: level }));
  };

  const handleSave = async (skill: Skill) => {
    const existing = evalByMovement.get(skill.id);
    const level: SkillEvaluationLevel | undefined =
      draftLevels[skill.id] ?? (existing?.level as SkillEvaluationLevel | undefined);
    if (!level) {
      showToast({ message: 'Tappeá una estrella primero', variant: 'warning' });
      return;
    }
    const note = draftNotes[skill.id] ?? existing?.note ?? '';
    setSavingId(skill.id);
    try {
      const saved = await skillEvaluation.upsert(
        athlete.id,
        skill.id,
        level,
        note.trim() || undefined,
      );
      setEvaluations(prev => {
        const others = prev.filter(e => e.movement_id !== skill.id);
        return [saved, ...others];
      });
      // Limpiar drafts post-save
      setDraftLevels(prev => {
        const next = { ...prev };
        delete next[skill.id];
        return next;
      });
      setDraftNotes(prev => {
        const next = { ...prev };
        delete next[skill.id];
        return next;
      });
      showToast({
        message: `Evaluación guardada · ${skill.name} · ${LEVEL_LABELS[level]}`,
        variant: 'success',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos guardar';
      showToast({ message: msg, variant: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const evaluatedCount = evaluations.length;

  return (
    <section>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
      }}>
        <p style={{
          fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase',
        }}>
          Evaluación de destreza · skill tree
        </p>
        <span style={{
          fontSize: 9, fontWeight: 800, color: STAR_GOLD,
          background: `${STAR_GOLD}18`, border: `1px solid ${STAR_GOLD}55`,
          borderRadius: 8, padding: '3px 8px', letterSpacing: '.04em',
        }}>
          {evaluatedCount}/{SKILLS.length} evaluados
        </span>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 14, padding: 12,
      }}>
        {/* Tabs subject */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button
            onClick={() => { setSubjectFilter('all'); setPage(0); }}
            className="btn-press"
            style={{
              padding: '5px 10px', borderRadius: 8,
              background: subjectFilter === 'all' ? 'var(--text)' : 'transparent',
              color: subjectFilter === 'all' ? 'var(--bg)' : 'var(--text-secondary)',
              border: `1px solid ${subjectFilter === 'all' ? 'var(--text)' : 'var(--card-border)'}`,
              fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Todos</button>
          {SUBJECTS.map(s => {
            const active = subjectFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setSubjectFilter(s.id); setPage(0); }}
                className="btn-press"
                style={{
                  padding: '5px 10px', borderRadius: 8,
                  background: active ? s.color : 'transparent',
                  color: active ? '#07070F' : 'var(--text-secondary)',
                  border: `1px solid ${active ? s.color : 'var(--card-border)'}`,
                  fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{s.icon} {s.name}</button>
            );
          })}
        </div>

        {/* Search + toggle no-evaluados */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar movimiento…"
            style={{
              flex: 1, padding: '7px 10px',
              background: 'var(--bg)', border: '1px solid var(--card-border)',
              borderRadius: 10, color: 'var(--text)', fontSize: 11,
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => { setShowOnlyUnevaluated(v => !v); setPage(0); }}
            className="btn-press"
            style={{
              padding: '6px 10px', borderRadius: 10,
              background: showOnlyUnevaluated ? `${HO_PURPLE}25` : 'transparent',
              color: showOnlyUnevaluated ? HO_PURPLE : 'var(--text-secondary)',
              border: `1px solid ${showOnlyUnevaluated ? HO_PURPLE : 'var(--card-border)'}`,
              fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
            title="Mostrar solo movimientos sin evaluar"
          >
            {showOnlyUnevaluated ? '✓ Sin evaluar' : 'Sin evaluar'}
          </button>
        </div>

        {/* Estado de carga / error */}
        {loading ? (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cargando…</p>
        ) : error ? (
          <p style={{ fontSize: 11, color: '#f87171' }}>{error}</p>
        ) : filteredSkills.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', padding: 10 }}>
            No hay movimientos para mostrar con estos filtros.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visible.map(skill => {
                const existing = evalByMovement.get(skill.id);
                const draftLevel = draftLevels[skill.id];
                const draftNote = draftNotes[skill.id];
                const currentLevel: SkillEvaluationLevel | undefined =
                  draftLevel ?? (existing?.level as SkillEvaluationLevel | undefined);
                const noteValue = draftNote ?? existing?.note ?? '';
                const dirty =
                  draftLevel !== undefined && draftLevel !== existing?.level
                  || draftNote !== undefined && draftNote !== (existing?.note ?? '');
                const accent = subjectAccent(skill);
                return (
                  <div
                    key={skill.id}
                    style={{
                      background: 'var(--bg)',
                      border: `1px solid ${existing ? `${STAR_GOLD}44` : 'var(--card-border)'}`,
                      borderRadius: 10, padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', flex: 1 }}>
                        {skill.name}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: accent,
                        background: `${accent}22`, borderRadius: 6, padding: '2px 6px',
                      }}>T{skill.tier}</span>
                    </div>
                    <p style={{
                      fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4,
                      marginBottom: 6,
                    }}>{skill.description}</p>

                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map(lv => {
                        const filled = currentLevel !== undefined && lv <= currentLevel;
                        return (
                          <button
                            key={lv}
                            onClick={() => handleStarClick(skill, lv as SkillEvaluationLevel)}
                            className="btn-press"
                            aria-label={`Nivel ${lv} · ${LEVEL_LABELS[lv as SkillEvaluationLevel]}`}
                            style={{
                              padding: 2, background: 'transparent', border: 'none',
                              cursor: 'pointer', fontSize: 16, lineHeight: 1,
                              color: filled ? STAR_GOLD : 'var(--card-border)',
                            }}
                          >★</button>
                        );
                      })}
                      <span style={{
                        marginLeft: 6, fontSize: 10, fontWeight: 700,
                        color: currentLevel ? STAR_GOLD : 'var(--text-secondary)',
                        letterSpacing: '.04em',
                      }}>
                        {currentLevel
                          ? `${currentLevel}/5 · ${LEVEL_LABELS[currentLevel]}`
                          : 'No evaluado'}
                      </span>
                    </div>

                    {existing && (
                      <p style={{
                        fontSize: 9, color: 'var(--text-secondary)', marginBottom: 6,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        Última eval · {new Date(existing.evaluated_at).toLocaleDateString()}
                        {existing.coach_name ? ` · por ${existing.coach_name}` : ''}
                      </p>
                    )}

                    <textarea
                      value={noteValue}
                      onChange={(e) =>
                        setDraftNotes(prev => ({
                          ...prev,
                          [skill.id]: e.target.value.slice(0, NOTE_MAX),
                        }))
                      }
                      placeholder='Nota técnica (opcional)…'
                      rows={2}
                      style={{
                        width: '100%', padding: '6px 8px',
                        background: 'var(--surface)', border: '1px solid var(--card-border)',
                        borderRadius: 8, color: 'var(--text)', fontSize: 11,
                        fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <button
                        onClick={() => handleSave(skill)}
                        disabled={savingId === skill.id || (!dirty && !!existing)}
                        className="btn-press"
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          background: dirty || !existing ? HO_GOLD : 'transparent',
                          color: dirty || !existing ? '#000' : 'var(--text-secondary)',
                          border: dirty || !existing ? 'none' : '1px solid var(--card-border)',
                          fontSize: 10, fontWeight: 800, letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          cursor: savingId === skill.id ? 'wait'
                            : (!dirty && !!existing) ? 'default' : 'pointer',
                          fontFamily: 'inherit',
                          opacity: savingId === skill.id ? 0.6 : 1,
                        }}
                      >
                        {savingId === skill.id ? 'Guardando…' : existing && !dirty ? 'Guardado' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {pageCount > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 10, gap: 8,
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-press"
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    background: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--card-border)',
                    fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: page === 0 ? 0.4 : 1,
                  }}
                >← Anterior</button>
                <span style={{
                  fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  Página {page + 1} / {pageCount} · {filteredSkills.length} movs
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  className="btn-press"
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    background: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--card-border)',
                    fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
                    cursor: page >= pageCount - 1 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: page >= pageCount - 1 ? 0.4 : 1,
                  }}
                >Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default SkillEvaluationPanel;

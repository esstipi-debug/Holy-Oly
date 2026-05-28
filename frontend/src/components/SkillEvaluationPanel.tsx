import React, { useEffect, useMemo, useState } from 'react';
import { SKILLS, SUBJECTS, type Skill, type SubjectId } from '../data/skillTree';
import {
  skillEvaluation,
  type SkillEvaluationLevel,
  type SkillEvaluationResponse,
} from '../lib/skillEvaluation';
import { useToast } from './Toast';
import { PlateBadge, type PlateTier } from './PlateBadge';
import type { AthleteProfile } from '../data/athletes';
import '../styles/v2/skill-evaluation.css';

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

const NOTE_MAX = 300;
const PAGE_SIZE = 20;

const LEVEL_LABELS: Record<SkillEvaluationLevel, string> = {
  1: 'novato',
  2: 'básico',
  3: 'funcional',
  4: 'sólido',
  5: 'maestría',
};

/** Tier 1-5 del movimiento → disco halterofilia (dificultad como carga). */
const TIER_PLATE: Record<Skill['tier'], PlateTier> = {
  1: 'white',
  2: 'green',
  3: 'yellow',
  4: 'blue',
  5: 'red',
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
    SUBJECTS.find(x => x.id === s.subject)?.color ?? 'var(--engine-adapt)';

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
    <section className="sep-root">
      <div className="sep-head">
        <p className="sep-eyebrow">Evaluación de destreza · skill tree</p>
        <span className="sep-count">
          <span className="pip" />
          {evaluatedCount}/{SKILLS.length} evaluados
        </span>
      </div>

      <div className="sep-card">
        {/* Tabs subject */}
        <div className="sep-tabs">
          <button
            onClick={() => { setSubjectFilter('all'); setPage(0); }}
            className="sep-tab btn-press"
            data-kind="all"
            data-active={subjectFilter === 'all'}
          >Todos</button>
          {SUBJECTS.map(s => {
            const active = subjectFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setSubjectFilter(s.id); setPage(0); }}
                className="sep-tab btn-press"
                data-kind="subject"
                data-active={active}
                style={{ '--sc': s.color } as React.CSSProperties}
              >{s.icon} {s.name}</button>
            );
          })}
        </div>

        {/* Search + toggle no-evaluados */}
        <div className="sep-controls">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar movimiento…"
            className="sep-search"
          />
          <button
            onClick={() => { setShowOnlyUnevaluated(v => !v); setPage(0); }}
            className="sep-toggle btn-press"
            data-active={showOnlyUnevaluated}
            title="Mostrar solo movimientos sin evaluar"
          >
            {showOnlyUnevaluated ? '✓ Sin evaluar' : 'Sin evaluar'}
          </button>
        </div>

        {/* Estado de carga / error */}
        {loading ? (
          <p className="sep-state">Cargando…</p>
        ) : error ? (
          <p className="sep-state" data-tone="error">{error}</p>
        ) : filteredSkills.length === 0 ? (
          <p className="sep-state" data-tone="empty">
            No hay movimientos para mostrar con estos filtros.
          </p>
        ) : (
          <>
            <div className="sep-list">
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
                const saveState = savingId === skill.id
                  ? 'saving'
                  : (dirty || !existing) ? 'ready' : 'saved';
                return (
                  <div
                    key={skill.id}
                    className="sep-row"
                    data-evaluated={!!existing}
                    style={{ '--sc': accent } as React.CSSProperties}
                  >
                    <div className="sep-row-head">
                      <span className="sep-row-name">{skill.name}</span>
                      <PlateBadge tier={TIER_PLATE[skill.tier]} size={26} />
                      <span className="sep-tier-chip">T{skill.tier}</span>
                    </div>
                    <p className="sep-row-desc">{skill.description}</p>

                    {/* Stars */}
                    <div className="sep-stars">
                      {[1, 2, 3, 4, 5].map(lv => {
                        const filled = currentLevel !== undefined && lv <= currentLevel;
                        return (
                          <button
                            key={lv}
                            onClick={() => handleStarClick(skill, lv as SkillEvaluationLevel)}
                            className="sep-star btn-press"
                            data-filled={filled}
                            aria-label={`Nivel ${lv} · ${LEVEL_LABELS[lv as SkillEvaluationLevel]}`}
                          >★</button>
                        );
                      })}
                      <span className="sep-level" data-set={!!currentLevel}>
                        {currentLevel
                          ? `${currentLevel}/5 · ${LEVEL_LABELS[currentLevel]}`
                          : 'No evaluado'}
                      </span>
                    </div>

                    {existing && (
                      <p className="sep-meta">
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
                      className="sep-note"
                    />

                    <div className="sep-actions">
                      <button
                        onClick={() => handleSave(skill)}
                        disabled={savingId === skill.id || (!dirty && !!existing)}
                        className="sep-save btn-press"
                        data-state={saveState}
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
              <div className="sep-pager">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="sep-pager-btn btn-press"
                >← Anterior</button>
                <span className="sep-pager-info">
                  Página {page + 1} / {pageCount} · {filteredSkills.length} movs
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  className="sep-pager-btn btn-press"
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

import React, { useEffect, useMemo, useState } from 'react';
import { SKILLS, SUBJECTS, type Skill, type SubjectId } from '../data/skillTree';
import { skillFocus, type SkillFocusResponse } from '../lib/skillFocus';
import { useToast } from './Toast';
import { PlateBadge, type PlateTier } from './PlateBadge';
import type { AthleteProfile } from '../data/athletes';
import '../styles/v2/skill-focus.css';

/**
 * Coach asigna foco semanal sobre 1-3 movimientos del skill tree del atleta.
 * Loop coach↔atleta · ver draft_skill_tree_interactivity.md.
 *
 * Props: { athlete }  → usamos `athlete.id` como athleteId del backend.
 *
 * UX:
 * - Filtro por subject (gym / oly / power / metcon)
 * - Lista compacta de skills · tap para seleccionar
 * - Textarea nota técnica (máx 200 chars)
 * - Botón Asignar foco · POST /v1/coach/skill-focus
 * - Sección "Focos activos" con botón Retirar por cada uno
 */

const NOTE_MAX = 200;

// Skill tier (1-5) → disco PlateBadge · visualiza dificultad del movimiento.
const tierToPlate = (tier: Skill['tier']): PlateTier => {
  switch (tier) {
    case 1: return 'white';
    case 2: return 'green';
    case 3: return 'yellow';
    case 4: return 'blue';
    default: return 'red';
  }
};

interface Props {
  athlete: AthleteProfile;
}

const SkillFocusAssign: React.FC<Props> = ({ athlete }) => {
  const { showToast } = useToast();

  const [focuses, setFocuses] = useState<SkillFocusResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [selectedMovement, setSelectedMovement] = useState<Skill | null>(null);
  const [note, setNote] = useState<string>('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await skillFocus.listForAthlete(athlete.id);
      setFocuses(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos cargar los focos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athlete.id]);

  const activeIds = useMemo(
    () => new Set(focuses.filter(f => f.status === 'active').map(f => f.movement_id)),
    [focuses],
  );

  const filteredSkills = useMemo(() => {
    const base = subjectFilter === 'all'
      ? SKILLS
      : SKILLS.filter(s => s.subject === subjectFilter);
    // Mostrar primero los no-foco para invitar a elegir.
    return base.slice().sort((a, b) => {
      const aActive = activeIds.has(a.id) ? 1 : 0;
      const bActive = activeIds.has(b.id) ? 1 : 0;
      if (aActive !== bActive) return aActive - bActive;
      return a.tier - b.tier;
    });
  }, [subjectFilter, activeIds]);

  const subjectAccent = (s: Skill) =>
    SUBJECTS.find(x => x.id === s.subject)?.color ?? 'var(--engine-stress)';

  const handleAssign = async () => {
    if (!selectedMovement) return;
    if (activeIds.has(selectedMovement.id)) {
      showToast({ message: 'Ese movimiento ya tiene foco activo', variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const created = await skillFocus.create(
        athlete.id,
        selectedMovement.id,
        note.trim() || undefined,
      );
      setFocuses(prev => [created, ...prev]);
      setSelectedMovement(null);
      setNote('');
      showToast({
        message: `Foco asignado · ${selectedMovement.name}`,
        variant: 'success',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos asignar el foco';
      showToast({ message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetire = async (focus: SkillFocusResponse) => {
    try {
      await skillFocus.retire(focus.id);
      setFocuses(prev => prev.filter(f => f.id !== focus.id));
      showToast({ message: 'Foco retirado', variant: 'info' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos retirar el foco';
      showToast({ message: msg, variant: 'error' });
    }
  };

  const activeFocuses = focuses.filter(f => f.status === 'active');
  const recentDominated = focuses.filter(f => f.status === 'dominated').slice(0, 3);

  return (
    <section className="sfa-root">
      <div className="sfa-head">
        <p className="sfa-eyebrow">Focos técnicos · skill tree</p>
        <span className="sfa-count">
          <i className="pip" />
          {activeFocuses.length} activos
        </span>
      </div>

      {/* Form de asignación */}
      <div className="sfa-card">
        {/* Tabs de subject */}
        <div className="sfa-subjects">
          <button
            onClick={() => setSubjectFilter('all')}
            className="sfa-subject sfa-subject-all btn-press"
            data-active={subjectFilter === 'all'}
          >Todos</button>
          {SUBJECTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSubjectFilter(s.id)}
              className="sfa-subject btn-press"
              data-active={subjectFilter === s.id}
              style={{ ['--sc' as string]: s.color }}
            >{s.icon} {s.name}</button>
          ))}
        </div>

        {/* Lista scrollable de movimientos */}
        <div className="sfa-list">
          {filteredSkills.slice(0, 60).map(s => {
            const isActive = activeIds.has(s.id);
            const isSelected = selectedMovement?.id === s.id;
            const accent = subjectAccent(s);
            return (
              <button
                key={s.id}
                disabled={isActive}
                onClick={() => setSelectedMovement(s)}
                className="sfa-mv btn-press"
                data-selected={isSelected}
                style={{ ['--mc' as string]: accent }}
              >
                <span className="sfa-mv-disc">
                  <PlateBadge tier={tierToPlate(s.tier)} size={26} />
                </span>
                <span className="sfa-mv-name">{s.name}</span>
                <span className="sfa-mv-tier">T{s.tier}</span>
                {isActive && (
                  <span className="sfa-mv-flag"><i className="dot" />foco</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Nota técnica · textarea */}
        {selectedMovement && (
          <div className="sfa-note">
            <p className="sfa-note-label">
              Nota técnica para <strong>{selectedMovement.name}</strong>
            </p>
            <textarea
              className="sfa-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              placeholder='Ej. "Trabajar dip vertical · 3 series de 5 reps."'
              rows={2}
            />
            <p className="sfa-charcount">{note.length}/{NOTE_MAX}</p>

            <div className="sfa-actions">
              <button
                onClick={() => { setSelectedMovement(null); setNote(''); }}
                className="sfa-btn-cancel btn-press"
              >Cancelar</button>
              <button
                onClick={handleAssign}
                disabled={submitting}
                className="sfa-btn-assign btn-press"
              >{submitting ? 'Asignando…' : 'Asignar foco'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Focos activos · lista */}
      <p className="sfa-section-head">Activos · {activeFocuses.length}</p>

      {loading ? (
        <p className="sfa-state">Cargando…</p>
      ) : error ? (
        <p className="sfa-state" data-kind="error">{error}</p>
      ) : activeFocuses.length === 0 ? (
        <div className="sfa-empty">
          Sin focos asignados todavía. Tappeá un movimiento de arriba.
        </div>
      ) : (
        <div className="sfa-active-list">
          {activeFocuses.map(f => {
            const skill = SKILLS.find(s => s.id === f.movement_id);
            return (
              <div key={f.id} className="sfa-active">
                <span className="sfa-active-disc">
                  <PlateBadge tier={tierToPlate(skill?.tier ?? 1)} size={30} />
                </span>
                <div className="sfa-active-body">
                  <p className="sfa-active-title">
                    {skill?.name ?? f.movement_id}
                  </p>
                  {f.note && (
                    <p className="sfa-active-note">{f.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRetire(f)}
                  className="sfa-active-del btn-press"
                >Retirar</button>
              </div>
            );
          })}
        </div>
      )}

      {recentDominated.length > 0 && (
        <>
          <p className="sfa-section-head sfa-mt">
            Recién dominados · {recentDominated.length}
          </p>
          <div className="sfa-dominated">
            {recentDominated.map(f => {
              const skill = SKILLS.find(s => s.id === f.movement_id);
              return (
                <span key={f.id} className="sfa-dom-chip">
                  ✓ {skill?.name ?? f.movement_id}
                </span>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default SkillFocusAssign;

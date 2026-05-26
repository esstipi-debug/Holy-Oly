import React, { useEffect, useMemo, useState } from 'react';
import { SKILLS, SUBJECTS, type Skill, type SubjectId } from '../data/skillTree';
import { skillFocus, type SkillFocusResponse } from '../lib/skillFocus';
import { useToast } from './Toast';
import type { AthleteProfile } from '../data/athletes';

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

const HO_GOLD = '#F5C518';
const HO_PURPLE = '#7C5CFF';
const NOTE_MAX = 200;

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
    SUBJECTS.find(x => x.id === s.subject)?.color ?? HO_PURPLE;

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
    <section>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
      }}>
        <p style={{
          fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase',
        }}>
          Focos técnicos · skill tree
        </p>
        <span style={{
          fontSize: 9, fontWeight: 800, color: HO_GOLD,
          background: `${HO_GOLD}18`, border: `1px solid ${HO_GOLD}55`,
          borderRadius: 8, padding: '3px 8px', letterSpacing: '.04em',
        }}>
          {activeFocuses.length} activos
        </span>
      </div>

      {/* Form de asignación */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 14, padding: 12, marginBottom: 10,
      }}>
        {/* Tabs de subject */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button
            onClick={() => setSubjectFilter('all')}
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
                onClick={() => setSubjectFilter(s.id)}
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

        {/* Lista scrollable de movimientos */}
        <div
          className="scroll-y-no-bar"
          style={{
            maxHeight: 180, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 4,
            paddingRight: 2,
          }}
        >
          {filteredSkills.slice(0, 60).map(s => {
            const isActive = activeIds.has(s.id);
            const isSelected = selectedMovement?.id === s.id;
            const accent = subjectAccent(s);
            return (
              <button
                key={s.id}
                disabled={isActive}
                onClick={() => setSelectedMovement(s)}
                className="btn-press"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 8,
                  background: isSelected ? `${accent}25` : 'var(--bg)',
                  border: `1px solid ${isSelected ? accent : 'var(--card-border)'}`,
                  cursor: isActive ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: isActive ? 0.45 : 1,
                  textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text)', flex: 1,
                }}>
                  {s.name}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: accent,
                  background: `${accent}22`, borderRadius: 6, padding: '2px 6px',
                  marginLeft: 6,
                }}>
                  T{s.tier}
                </span>
                {isActive && (
                  <span style={{
                    fontSize: 9, color: HO_GOLD, fontWeight: 800,
                    marginLeft: 6, letterSpacing: '.04em',
                  }}>● foco</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Nota técnica · textarea */}
        {selectedMovement && (
          <div style={{ marginTop: 10 }}>
            <p style={{
              fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
              marginBottom: 6, letterSpacing: '.04em',
            }}>
              Nota técnica para <strong style={{ color: 'var(--text)' }}>{selectedMovement.name}</strong>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              placeholder='Ej. "Trabajar dip vertical · 3 series de 5 reps."'
              rows={2}
              style={{
                width: '100%', padding: '8px 10px',
                background: 'var(--bg)', border: '1px solid var(--card-border)',
                borderRadius: 10, color: 'var(--text)', fontSize: 11,
                fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <p style={{
              fontSize: 9, color: 'var(--text-secondary)', marginTop: 4,
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>{note.length}/{NOTE_MAX}</p>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => { setSelectedMovement(null); setNote(''); }}
                className="btn-press"
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--card-border)',
                  fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Cancelar</button>
              <button
                onClick={handleAssign}
                disabled={submitting}
                className="btn-press"
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 10,
                  background: HO_GOLD, color: '#000', border: 'none',
                  fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                  cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit',
                  opacity: submitting ? 0.6 : 1,
                }}
              >{submitting ? 'Asignando…' : 'Asignar foco'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Focos activos · lista */}
      <p style={{
        fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
        letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        Activos · {activeFocuses.length}
      </p>

      {loading ? (
        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cargando…</p>
      ) : error ? (
        <p style={{ fontSize: 11, color: '#f87171' }}>{error}</p>
      ) : activeFocuses.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--card-border)',
          borderRadius: 12, padding: 14, textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Sin focos asignados todavía. Tappeá un movimiento de arriba.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeFocuses.map(f => {
            const skill = SKILLS.find(s => s.id === f.movement_id);
            return (
              <div
                key={f.id}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${HO_GOLD}55`,
                  borderRadius: 12, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: `0 0 12px ${HO_GOLD}22`,
                }}
              >
                <span style={{ fontSize: 16 }}>🎯</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 12, fontWeight: 800, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {skill?.name ?? f.movement_id}
                  </p>
                  {f.note && (
                    <p style={{
                      fontSize: 10, color: 'var(--text-secondary)', marginTop: 2,
                      lineHeight: 1.4,
                    }}>{f.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRetire(f)}
                  className="btn-press"
                  style={{
                    background: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--card-border)', borderRadius: 8,
                    padding: '5px 10px', fontSize: 9, fontWeight: 800,
                    letterSpacing: '.06em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  }}
                >Retirar</button>
              </div>
            );
          })}
        </div>
      )}

      {recentDominated.length > 0 && (
        <>
          <p style={{
            fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
            letterSpacing: '.12em', textTransform: 'uppercase', margin: '12px 0 6px',
          }}>
            Recién dominados · {recentDominated.length}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recentDominated.map(f => {
              const skill = SKILLS.find(s => s.id === f.movement_id);
              return (
                <span key={f.id} style={{
                  fontSize: 10, padding: '4px 9px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.14)', color: '#4ade80',
                  border: '1px solid rgba(34,197,94,0.35)', fontWeight: 700,
                }}>
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

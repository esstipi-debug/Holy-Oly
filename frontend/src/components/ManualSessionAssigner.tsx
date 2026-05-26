/**
 * ManualSessionAssigner · coach asigna entrenamiento del día ad-hoc.
 *
 * Caso de uso: atleta SIN macrociclo asignado (o con macrociclo pero el coach
 * quiere modificar la sesión del día puntualmente). Soporta doble turno
 * (am + pm) o sesión única (full).
 *
 * Form: fecha · slot · focus · ejercicios editables · nota.
 * Pre-fill de ejercicios cambia según focus.
 *
 * Persistencia: backend (manual_sessions table). Offline-first NO se necesita
 * acá porque es vista de coach (siempre online).
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { AthleteProfile } from '../data/athletes';
import {
  manualSessionsApi,
  type ManualSessionExercise,
  type ManualSessionFocus,
  type ManualSessionMaxKey,
  type ManualSessionResponse,
  type ManualSessionSlot,
} from '../lib/api';

const HO_GOLD = '#F5C518';
const HO_PURPLE = '#7C5CFF';

const FOCUS_OPTIONS: { value: ManualSessionFocus; label: string; emoji: string }[] = [
  { value: 'technique', label: 'Técnica',  emoji: '🎯' },
  { value: 'strength',  label: 'Fuerza',   emoji: '💪' },
  { value: 'olympic',   label: 'Olímpico', emoji: '🏋️' },
  { value: 'accessory', label: 'Accesorio',emoji: '🧰' },
  { value: 'metcon',    label: 'Metcon',   emoji: '🔥' },
];

const SLOT_OPTIONS: { value: ManualSessionSlot; label: string; sublabel: string }[] = [
  { value: 'full', label: 'Sesión única', sublabel: '1 turno' },
  { value: 'am',   label: 'AM',           sublabel: 'mañana' },
  { value: 'pm',   label: 'PM',           sublabel: 'tarde' },
];

const MAX_KEY_OPTIONS: { value: ManualSessionMaxKey; label: string }[] = [
  { value: 'snatch',       label: 'Arrancada' },
  { value: 'clean',        label: 'Cargada' },
  { value: 'jerk',         label: 'Envión' },
  { value: 'back_squat',   label: 'Sent. Atrás' },
  { value: 'front_squat',  label: 'Sent. Frontal' },
];

// Pre-fill por focus · plantilla típica
const TEMPLATE_BY_FOCUS: Record<ManualSessionFocus, ManualSessionExercise[]> = {
  olympic: [
    { name: 'Arrancada',        sets: 5, reps: 2, pct: 0.78, max_key: 'snatch' },
    { name: 'Clean & Jerk',     sets: 4, reps: 2, pct: 0.78, max_key: 'jerk' },
  ],
  technique: [
    { name: 'Arrancada de Potencia', sets: 5, reps: 3, pct: 0.65, max_key: 'snatch' },
    { name: 'Sobre la Cabeza',       sets: 4, reps: 5, pct: 0.55, max_key: 'snatch' },
  ],
  strength: [
    { name: 'Sentadilla Atrás', sets: 5, reps: 3, pct: 0.82, max_key: 'back_squat' },
    { name: 'Tirón Cargada',    sets: 4, reps: 3, pct: 0.88, max_key: 'clean' },
  ],
  accessory: [
    { name: 'Buenos Días',      sets: 3, reps: 8, pct: 0.50, max_key: 'back_squat' },
    { name: 'Press Militar',    sets: 4, reps: 6, pct: 0.55, max_key: 'jerk' },
  ],
  metcon: [
    { name: 'Front Squat + Push Press', sets: 5, reps: 5, pct: 0.60, max_key: 'front_squat' },
  ],
};

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const fmtDateShort = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

interface Props {
  athlete: AthleteProfile;
}

const ManualSessionAssigner: React.FC<Props> = ({ athlete }) => {
  const hasMacro = useMemo(
    () => !!athlete.macrocycle?.program_name && athlete.macrocycle.program_name.trim().length > 0,
    [athlete.macrocycle?.program_name],
  );

  // Si NO tiene macro → form abierto por default. Si tiene macro → cerrado, checkbox para abrirlo.
  const [adHocMode, setAdHocMode] = useState<boolean>(!hasMacro);
  const [date, setDate] = useState<string>(todayISO());
  const [slot, setSlot] = useState<ManualSessionSlot>('full');
  const [focus, setFocus] = useState<ManualSessionFocus>('olympic');
  const [exercises, setExercises] = useState<ManualSessionExercise[]>(TEMPLATE_BY_FOCUS.olympic);
  const [note, setNote] = useState<string>('');

  const [recent, setRecent] = useState<ManualSessionResponse[]>([]);
  const [loadingRecent, setLoadingRecent] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Carga sesiones manuales recientes del atleta · últimos 14 días
  const refresh = async () => {
    setLoadingRecent(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - 14);
      const fromISO = from.toISOString().slice(0, 10);
      const list = await manualSessionsApi.list({ athlete_id: athlete.id, from: fromISO });
      setRecent(list);
    } catch {
      // ignorar · backend puede no estar listo en dev
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athlete.id]);

  // Al cambiar focus, sugerir template (pero respetar si el coach ya editó)
  const applyTemplate = (newFocus: ManualSessionFocus) => {
    setFocus(newFocus);
    setExercises(TEMPLATE_BY_FOCUS[newFocus].map((e) => ({ ...e })));
  };

  const updateExercise = (idx: number, patch: Partial<ManualSessionExercise>) => {
    setExercises((curr) => curr.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const addExercise = () => {
    setExercises((curr) => [
      ...curr,
      { name: '', sets: 3, reps: 5, pct: 0.7, max_key: 'snatch' },
    ]);
  };

  const removeExercise = (idx: number) => {
    setExercises((curr) => curr.filter((_, i) => i !== idx));
  };

  const showToast = (kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleSubmit = async () => {
    // Validación básica
    if (exercises.length === 0) {
      showToast('err', 'Agregá al menos un ejercicio');
      return;
    }
    if (exercises.some((e) => !e.name.trim())) {
      showToast('err', 'Cada ejercicio necesita un nombre');
      return;
    }
    setSubmitting(true);
    try {
      await manualSessionsApi.create({
        athlete_id: athlete.id,
        date,
        slot,
        focus,
        exercises,
        note: note.trim() || null,
      });
      showToast('ok', `Sesión asignada · ${fmtDateShort(date)} ${slot.toUpperCase()}`);
      setNote('');
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      showToast('err', msg.slice(0, 80));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await manualSessionsApi.delete(id);
      showToast('ok', 'Sesión borrada');
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      showToast('err', msg.slice(0, 80));
    }
  };

  const showForm = adHocMode || !hasMacro;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          Asignación manual del día
        </p>
        {hasMacro && (
          <button
            onClick={() => setAdHocMode((v) => !v)}
            className="btn-press"
            style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 8,
              background: adHocMode ? `${HO_GOLD}22` : 'transparent',
              color: adHocMode ? HO_GOLD : 'var(--text-secondary)',
              border: `1px solid ${adHocMode ? `${HO_GOLD}55` : 'var(--card-border)'}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {adHocMode ? '✓ ad-hoc' : '+ ad-hoc'}
          </button>
        )}
      </div>

      {!hasMacro && (
        <div style={{
          marginBottom: 10, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(124,92,255,0.10)', border: `1px solid ${HO_PURPLE}40`,
          fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <span style={{ color: HO_PURPLE, fontWeight: 800 }}>Sin macrociclo asignado.</span>{' '}
          Asignale la sesión del día manualmente — soporta doble turno (AM + PM).
        </div>
      )}

      {showForm && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 14, padding: 14, marginBottom: 12,
        }}>
          {/* Fecha + Slot */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: 'var(--bg)', border: '1px solid var(--card-border)',
                  color: 'var(--text)', fontSize: 12, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1.4 }}>
              <label style={{ display: 'block', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Turno
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                {SLOT_OPTIONS.map((opt) => {
                  const sel = slot === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSlot(opt.value)}
                      className="btn-press"
                      style={{
                        flex: 1, padding: '6px 4px', borderRadius: 8,
                        background: sel ? `${HO_GOLD}22` : 'var(--bg)',
                        color: sel ? HO_GOLD : 'var(--text)',
                        border: `1px solid ${sel ? `${HO_GOLD}66` : 'var(--card-border)'}`,
                        fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <div>{opt.label}</div>
                      <div style={{ fontSize: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {opt.sublabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Focus */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Foco · template pre-fill
            </label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {FOCUS_OPTIONS.map((opt) => {
                const sel = focus === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => applyTemplate(opt.value)}
                    className="btn-press"
                    style={{
                      flex: '1 1 auto', padding: '6px 10px', borderRadius: 8,
                      background: sel ? `${HO_GOLD}22` : 'var(--bg)',
                      color: sel ? HO_GOLD : 'var(--text)',
                      border: `1px solid ${sel ? `${HO_GOLD}66` : 'var(--card-border)'}`,
                      fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ejercicios */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Ejercicios
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {exercises.map((ex, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 0.5fr 0.5fr 0.6fr 1fr auto',
                  gap: 4, alignItems: 'center',
                }}>
                  <input
                    type="text"
                    placeholder="Ejercicio"
                    value={ex.name}
                    onChange={(e) => updateExercise(i, { name: e.target.value })}
                    style={{
                      padding: '6px 8px', borderRadius: 6,
                      background: 'var(--bg)', border: '1px solid var(--card-border)',
                      color: 'var(--text)', fontSize: 11, fontFamily: 'inherit',
                      outline: 'none', minWidth: 0,
                    }}
                  />
                  <input
                    type="number" min={1} max={20}
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, { sets: parseInt(e.target.value || '1', 10) })}
                    title="sets"
                    style={{
                      padding: '6px 4px', borderRadius: 6,
                      background: 'var(--bg)', border: '1px solid var(--card-border)',
                      color: 'var(--text)', fontSize: 11, fontFamily: 'inherit',
                      outline: 'none', textAlign: 'center', minWidth: 0,
                    }}
                  />
                  <input
                    type="number" min={1} max={50}
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, { reps: parseInt(e.target.value || '1', 10) })}
                    title="reps"
                    style={{
                      padding: '6px 4px', borderRadius: 6,
                      background: 'var(--bg)', border: '1px solid var(--card-border)',
                      color: 'var(--text)', fontSize: 11, fontFamily: 'inherit',
                      outline: 'none', textAlign: 'center', minWidth: 0,
                    }}
                  />
                  <input
                    type="number" min={30} max={110}
                    value={Math.round(ex.pct * 100)}
                    onChange={(e) => updateExercise(i, { pct: Math.max(0.3, Math.min(1.1, parseInt(e.target.value || '70', 10) / 100)) })}
                    title="% 1RM"
                    style={{
                      padding: '6px 4px', borderRadius: 6,
                      background: 'var(--bg)', border: '1px solid var(--card-border)',
                      color: HO_GOLD, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                      outline: 'none', textAlign: 'center', minWidth: 0,
                    }}
                  />
                  <select
                    value={ex.max_key}
                    onChange={(e) => updateExercise(i, { max_key: e.target.value as ManualSessionMaxKey })}
                    style={{
                      padding: '6px 4px', borderRadius: 6,
                      background: 'var(--bg)', border: '1px solid var(--card-border)',
                      color: 'var(--text)', fontSize: 10, fontFamily: 'inherit',
                      outline: 'none', minWidth: 0,
                    }}
                  >
                    {MAX_KEY_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeExercise(i)}
                    className="btn-press"
                    title="Quitar"
                    style={{
                      padding: '6px 8px', borderRadius: 6,
                      background: 'transparent', color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.35)',
                      fontSize: 11, fontWeight: 800, cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >×</button>
                </div>
              ))}
            </div>
            <button
              onClick={addExercise}
              className="btn-press"
              style={{
                width: '100%', marginTop: 6, padding: '7px 0', borderRadius: 8,
                background: 'transparent', color: HO_PURPLE,
                border: `1px dashed ${HO_PURPLE}55`,
                fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+ Agregar ejercicio</button>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Nota (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: trabajá técnica, sin pesos máximos hoy"
              rows={2}
              maxLength={500}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                background: 'var(--bg)', border: '1px solid var(--card-border)',
                color: 'var(--text)', fontSize: 11, fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box', resize: 'vertical',
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-press"
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              background: submitting ? 'var(--card-border)' : HO_GOLD,
              color: submitting ? 'var(--text-secondary)' : '#000',
              border: 'none',
              fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Asignando…' : `Asignar ${slot === 'full' ? 'sesión' : slot.toUpperCase()} · ${fmtDateShort(date)}`}
          </button>

          {toast && (
            <p style={{
              marginTop: 8, fontSize: 11, fontWeight: 700, textAlign: 'center',
              color: toast.kind === 'ok' ? '#4ade80' : '#f87171',
            }}>{toast.kind === 'ok' ? '✓ ' : '⚠ '}{toast.text}</p>
          )}
        </div>
      )}

      {/* Lista de sesiones manuales recientes */}
      {recent.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 12, padding: 10,
        }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Asignaciones manuales recientes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map((m) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8,
                background: 'var(--bg)', border: '1px solid var(--card-border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                    {fmtDateShort(m.date)} · <span style={{ color: HO_GOLD }}>{m.slot.toUpperCase()}</span>{' '}
                    · {m.focus}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {m.exercises.length} ejerc · ~{Math.round((m.exercises.reduce((a, e) => a + e.pct, 0) / Math.max(1, m.exercises.length)) * 100)}%
                    {m.note ? ` · ${m.note.slice(0, 40)}${m.note.length > 40 ? '…' : ''}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="btn-press"
                  title="Borrar"
                  style={{
                    padding: '4px 9px', borderRadius: 6,
                    background: 'transparent', color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.35)',
                    fontSize: 10, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >Borrar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showForm && recent.length === 0 && !loadingRecent && (
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
          Sin asignaciones manuales recientes · usá ad-hoc para modificar la sesión del día.
        </p>
      )}
    </section>
  );
};

export default ManualSessionAssigner;

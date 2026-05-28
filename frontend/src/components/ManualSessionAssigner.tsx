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
import { PlateBadge, type PlateTier } from './PlateBadge';
import '../styles/v2/manual-session-assigner.css';

// % 1RM → tier de disco · visualiza intensidad del ejercicio.
const pctToTier = (pct: number): PlateTier => {
  if (pct < 0.55) return 'white';
  if (pct < 0.68) return 'green';
  if (pct < 0.80) return 'yellow';
  if (pct < 0.90) return 'blue';
  return 'red';
};

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
    <section className="msa-root">
      <div className="msa-head">
        <p className="msa-eyebrow">Asignación manual del día</p>
        {hasMacro && (
          <button
            onClick={() => setAdHocMode((v) => !v)}
            className="btn-press msa-toggle"
            data-active={adHocMode}
          >
            {adHocMode ? '✓ ad-hoc' : '+ ad-hoc'}
          </button>
        )}
      </div>

      {!hasMacro && (
        <div className="msa-banner">
          <strong>Sin macrociclo asignado.</strong>{' '}
          Asignale la sesión del día manualmente — soporta doble turno (AM + PM).
        </div>
      )}

      {showForm && (
        <div className="msa-card">
          {/* Fecha + Slot */}
          <div className="msa-row">
            <div className="msa-field msa-col-date">
              <label className="msa-label">Fecha</label>
              <input
                type="date"
                className="msa-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="msa-field msa-col-slot">
              <label className="msa-label">Turno</label>
              <div className="msa-slots">
                {SLOT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSlot(opt.value)}
                    className="btn-press msa-slot"
                    data-active={slot === opt.value}
                  >
                    <div className="msa-slot-main">{opt.label}</div>
                    <div className="msa-slot-sub">{opt.sublabel}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Focus */}
          <div className="msa-field">
            <label className="msa-label">Foco · template pre-fill</label>
            <div className="msa-focus">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => applyTemplate(opt.value)}
                  className="btn-press msa-focus-chip"
                  data-active={focus === opt.value}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ejercicios */}
          <div className="msa-field">
            <label className="msa-label">Ejercicios</label>
            <div className="msa-ex-list">
              {exercises.map((ex, i) => (
                <div key={i} className="msa-ex">
                  <span className="msa-ex-disc" title={`~${Math.round(ex.pct * 100)}% 1RM`}>
                    <PlateBadge tier={pctToTier(ex.pct)} size={22} />
                  </span>
                  <input
                    type="text"
                    className="msa-input"
                    placeholder="Ejercicio"
                    value={ex.name}
                    onChange={(e) => updateExercise(i, { name: e.target.value })}
                  />
                  <input
                    type="number" min={1} max={20}
                    className="msa-input msa-ex-num"
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, { sets: parseInt(e.target.value || '1', 10) })}
                    title="sets"
                  />
                  <input
                    type="number" min={1} max={50}
                    className="msa-input msa-ex-num"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, { reps: parseInt(e.target.value || '1', 10) })}
                    title="reps"
                  />
                  <input
                    type="number" min={30} max={110}
                    className="msa-input msa-ex-num msa-ex-pct"
                    value={Math.round(ex.pct * 100)}
                    onChange={(e) => updateExercise(i, { pct: Math.max(0.3, Math.min(1.1, parseInt(e.target.value || '70', 10) / 100)) })}
                    title="% 1RM"
                  />
                  <select
                    className="msa-select"
                    value={ex.max_key}
                    onChange={(e) => updateExercise(i, { max_key: e.target.value as ManualSessionMaxKey })}
                  >
                    {MAX_KEY_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeExercise(i)}
                    className="btn-press msa-ex-del"
                    title="Quitar"
                  >×</button>
                </div>
              ))}
            </div>
            <button
              onClick={addExercise}
              className="btn-press msa-ex-add"
            >+ Agregar ejercicio</button>
          </div>

          {/* Note */}
          <div className="msa-field">
            <label className="msa-label">Nota (opcional)</label>
            <textarea
              className="msa-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: trabajá técnica, sin pesos máximos hoy"
              rows={2}
              maxLength={500}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-press msa-submit"
          >
            {submitting ? 'Asignando…' : `Asignar ${slot === 'full' ? 'sesión' : slot.toUpperCase()} · ${fmtDateShort(date)}`}
          </button>

          {toast && (
            <p className="msa-toast" data-kind={toast.kind}>
              {toast.kind === 'ok' ? '✓ ' : '⚠ '}{toast.text}
            </p>
          )}
        </div>
      )}

      {/* Lista de sesiones manuales recientes */}
      {recent.length > 0 && (
        <div className="msa-recent">
          <p className="msa-recent-head">Asignaciones manuales recientes</p>
          <div className="msa-recent-list">
            {recent.map((m) => (
              <div key={m.id} className="msa-recent-item">
                <div className="msa-recent-body">
                  <p className="msa-recent-title">
                    {fmtDateShort(m.date)} · <span className="slot">{m.slot.toUpperCase()}</span>{' '}
                    · <span className="focus">{m.focus}</span>
                  </p>
                  <p className="msa-recent-meta">
                    {m.exercises.length} ejerc · ~{Math.round((m.exercises.reduce((a, e) => a + e.pct, 0) / Math.max(1, m.exercises.length)) * 100)}%
                    {m.note ? ` · ${m.note.slice(0, 40)}${m.note.length > 40 ? '…' : ''}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="btn-press msa-recent-del"
                  title="Borrar"
                >Borrar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showForm && recent.length === 0 && !loadingRecent && (
        <p className="msa-empty">
          Sin asignaciones manuales recientes · usá ad-hoc para modificar la sesión del día.
        </p>
      )}
    </section>
  );
};

export default ManualSessionAssigner;

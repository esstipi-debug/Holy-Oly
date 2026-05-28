import React, { useEffect, useMemo, useState } from 'react';
import {
  competitorApi,
  customWodApi,
  type CompetitorProfile,
  type CustomWodMovement,
  type CustomWodResponse,
  type CustomWodType,
  type CustomWodIntensity,
  type PromotePayload,
  type CompetitorCategory,
} from '../lib/competitor';
import { useToast } from './Toast';
import { PlateBadge } from './PlateBadge';
import type { AthleteProfile } from '../data/athletes';
import '../styles/v2/custom-wod-assigner.css';

/**
 * Coach UI · gestiona tier competidor de un atleta Volta:
 *  - Toggle "Atleta competidor" + form de promoción
 *  - Asignar custom WOD del día (override del recommender)
 *  - Lista de custom WODs recientes con DELETE
 *
 * Props: { athlete } → usamos athlete.id como athleteId del backend.
 *
 * Solo se renderiza dentro de AthleteTrainingView (coach scope).
 * Si el atleta no es competidor todavía, mostramos solo el form de promoción.
 *
 * Estilo V2 dark · scoped bajo `.cwa-root` · tokens de styles/v2/tokens.css.
 * Solo presentación restyleada: toda la lógica (hooks, handlers, build del
 * WOD, API calls) se preserva idéntica.
 */

const WOD_TYPES: CustomWodType[] = [
  'AMRAP',
  'EMOM',
  'For Time',
  'Strength',
  'Skill',
  'Recovery',
];

const CATEGORIES: CompetitorCategory[] = ['RX', 'Scaled', 'Masters', 'Teens'];

// ──────────────────────────────────────────────────────────────────
// Templates rápidos · pre-fill del form
// ──────────────────────────────────────────────────────────────────

interface WodTemplate {
  id: string;
  label: string;
  type: CustomWodType;
  duration_sec: number;
  intensity: CustomWodIntensity;
  movements: CustomWodMovement[];
}

const TEMPLATES: WodTemplate[] = [
  {
    id: 'amrap_20',
    label: 'AMRAP 20 (mid-line)',
    type: 'AMRAP',
    duration_sec: 1200,
    intensity: 'medium',
    movements: [
      {
        name: 'Power Clean',
        scaling: { rx: '5 reps @ 60kg', scaled: '5 @ 45kg', beginner: '5 @ 30kg' },
      },
      {
        name: 'Toes to Bar',
        scaling: { rx: '10 reps', scaled: '10 knee-raises', beginner: '15s hold' },
      },
      {
        name: 'Box Jump',
        scaling: { rx: '15 @ 60cm', scaled: '15 @ 50cm', beginner: '15 step-ups' },
      },
    ],
  },
  {
    id: 'emom_12',
    label: 'EMOM 12 · Snatch',
    type: 'EMOM',
    duration_sec: 720,
    intensity: 'high',
    movements: [
      {
        name: 'Snatch · technical',
        scaling: { rx: '2 reps @ 70%', scaled: '2 @ 60%', beginner: '3 hang muscle snatch' },
      },
    ],
  },
  {
    id: 'fortime_classic',
    label: 'For Time · Classic',
    type: 'For Time',
    duration_sec: 1080,
    intensity: 'high',
    movements: [
      {
        name: 'Thrusters',
        scaling: { rx: '21-15-9 @ 43kg', scaled: '21-15-9 @ 30kg', beginner: '21-15-9 @ 20kg' },
      },
      {
        name: 'Pull-ups',
        scaling: { rx: '21-15-9', scaled: '21-15-9 jumping', beginner: '21-15-9 ring rows' },
      },
    ],
  },
  {
    id: 'strength_squat',
    label: 'Strength · Back Squat',
    type: 'Strength',
    duration_sec: 1800,
    intensity: 'high',
    movements: [
      {
        name: 'Back Squat',
        scaling: { rx: '5×5 @ 80%', scaled: '5×5 @ 70%', beginner: '5×5 @ 60%' },
      },
      {
        name: 'Accessory · Bulgarian Split Squat',
        scaling: { rx: '3×10 @ 20kg', scaled: '3×10 @ 10kg', beginner: '3×10 BW' },
      },
    ],
  },
  {
    id: 'skill_gym',
    label: 'Skill · Gymnastics',
    type: 'Skill',
    duration_sec: 1500,
    intensity: 'medium',
    movements: [
      {
        name: 'Muscle-up · drills',
        scaling: { rx: 'EMOM 10 · 1 BMU', scaled: 'EMOM 10 · 2 strict pull-ups + 2 dips', beginner: 'Ring transitions x10' },
      },
      {
        name: 'HSPU · negatives',
        scaling: { rx: '4×3 strict', scaled: '4×3 negatives', beginner: '4×5 pike push-ups' },
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────
// Promote form
// ──────────────────────────────────────────────────────────────────

interface PromoteFormProps {
  athlete: AthleteProfile;
  onPromoted: (profile: CompetitorProfile) => void;
}

const PromoteForm: React.FC<PromoteFormProps> = ({ athlete, onPromoted }) => {
  const { showToast } = useToast();
  const [category, setCategory] = useState<CompetitorCategory>('RX');
  const [targetEvent, setTargetEvent] = useState('Open 2026');
  const [weeklySessions, setWeeklySessions] = useState(12);
  const [coachNotes, setCoachNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePromote = async () => {
    setSubmitting(true);
    try {
      const payload: PromotePayload = {
        athlete_id: athlete.id,
        category,
        target_event: targetEvent.trim() || null,
        weekly_sessions_target: weeklySessions,
        coach_notes: coachNotes.trim() || null,
      };
      const profile = await competitorApi.promote(payload);
      onPromoted(profile);
      showToast({ message: 'Atleta promovido a competidor', variant: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos promover al atleta';
      showToast({ message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cwa-panel">
      <span className="br br-tl" />
      <span className="br br-tr" />

      <p className="cwa-panel-title" style={{ marginBottom: 6 }}>
        Promover a tier competidor
      </p>
      <p className="cwa-panel-sub" style={{ marginBottom: 14 }}>
        Habilita layout extra · custom WODs · open rank tracking · target event.
      </p>

      <div className="cwa-field">
        <span className="cwa-label">Categoría</span>
        <div className="cwa-seg">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="btn-press cwa-seg-btn"
              data-active={category === c}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="cwa-field">
        <span className="cwa-label">Target event</span>
        <input
          className="cwa-input"
          value={targetEvent}
          onChange={(e) => setTargetEvent(e.target.value.slice(0, 64))}
          placeholder="Open 2026 · Quarterfinals · Semifinals · Games"
        />
      </div>

      <div className="cwa-field">
        <span className="cwa-label">Sessions / semana · target</span>
        <input
          className="cwa-input cwa-input--num"
          type="number"
          min={1}
          max={21}
          value={weeklySessions}
          onChange={(e) => setWeeklySessions(Number(e.target.value) || 12)}
        />
      </div>

      <div className="cwa-field">
        <span className="cwa-label">Notas (coach → atleta)</span>
        <textarea
          className="cwa-textarea"
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value.slice(0, 2000))}
          placeholder="Ej. 'Foco en gymnastics · OHS 90kg para Open 26'"
          rows={2}
        />
      </div>

      <button
        onClick={handlePromote}
        disabled={submitting}
        className="btn-press cwa-cta cwa-cta--cyan"
        data-busy={submitting}
      >{submitting ? 'Promoviendo…' : '✦ Promover a competidor'}</button>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// WOD assigner form
// ──────────────────────────────────────────────────────────────────

interface WodFormProps {
  athleteId: string;
  onCreated: (wod: CustomWodResponse) => void;
}

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const WodForm: React.FC<WodFormProps> = ({ athleteId, onCreated }) => {
  const { showToast } = useToast();
  const [date, setDate] = useState(todayISO());
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CustomWodType>('AMRAP');
  const [durationMin, setDurationMin] = useState(20);
  const [intensity, setIntensity] = useState<CustomWodIntensity>('medium');
  const [movements, setMovements] = useState<CustomWodMovement[]>([
    { name: '', scaling: { rx: '', scaled: '', beginner: '' } },
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const applyTemplate = (tplId: string) => {
    const tpl = TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    setTitle(tpl.label);
    setType(tpl.type);
    setDurationMin(Math.round(tpl.duration_sec / 60));
    setIntensity(tpl.intensity);
    setMovements(tpl.movements.map(m => ({ ...m, scaling: { ...m.scaling } })));
  };

  const updateMovement = (idx: number, patch: Partial<CustomWodMovement>) => {
    setMovements(prev =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch, scaling: { ...m.scaling, ...(patch.scaling ?? {}) } } : m)),
    );
  };

  const addMovement = () =>
    setMovements(prev => [...prev, { name: '', scaling: { rx: '', scaled: '', beginner: '' } }]);

  const removeMovement = (idx: number) =>
    setMovements(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const valid = useMemo(() => {
    if (!title.trim()) return false;
    if (movements.length === 0) return false;
    return movements.every(m =>
      m.name.trim() &&
      m.scaling.rx.trim() &&
      m.scaling.scaled.trim() &&
      m.scaling.beginner.trim(),
    );
  }, [title, movements]);

  const handleSubmit = async () => {
    if (!valid) {
      showToast({ message: 'Completá título y los 3 niveles de scaling', variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const wod = await customWodApi.create({
        athlete_id: athleteId,
        date,
        title: title.trim(),
        type,
        duration_sec: durationMin * 60,
        intensity_target: intensity,
        movements,
        notes: notes.trim() || null,
      });
      onCreated(wod);
      // Reset
      setTitle('');
      setNotes('');
      setMovements([{ name: '', scaling: { rx: '', scaled: '', beginner: '' } }]);
      showToast({ message: 'Custom WOD asignado', variant: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos crear el WOD';
      showToast({ message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cwa-panel" data-accent="gold" style={{ marginTop: 10 }}>
      <span className="br br-tl" />
      <span className="br br-tr" />

      {/* Templates */}
      <span className="cwa-label">Template rápido</span>
      <div className="cwa-tpls">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => applyTemplate(t.id)}
            className="btn-press cwa-tpl"
          >{t.label}</button>
        ))}
      </div>

      {/* Fila 1: fecha + tipo */}
      <div className="cwa-row">
        <div>
          <span className="cwa-label">Fecha</span>
          <input
            className="cwa-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <span className="cwa-label">Tipo</span>
          <select
            className="cwa-select"
            value={type}
            onChange={(e) => setType(e.target.value as CustomWodType)}
          >
            {WOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Fila 2: duración + intensidad */}
      <div className="cwa-row">
        <div>
          <span className="cwa-label">Duración (min)</span>
          <input
            className="cwa-input"
            type="number"
            min={1}
            max={180}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value) || 20)}
          />
        </div>
        <div>
          <span className="cwa-label">Intensidad</span>
          <select
            className="cwa-select"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as CustomWodIntensity)}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
      </div>

      <div className="cwa-field">
        <span className="cwa-label">Título</span>
        <input
          className="cwa-input"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder='Ej. "AMRAP 20 · gymnastics focus"'
        />
      </div>

      {/* Movements editable */}
      <span className="cwa-label">Movimientos · {movements.length}</span>
      <div className="cwa-moves">
        {movements.map((m, idx) => (
          <div key={idx} className="cwa-move">
            <div className="cwa-move-head">
              <input
                className="cwa-input"
                value={m.name}
                onChange={(e) => updateMovement(idx, { name: e.target.value.slice(0, 80) })}
                placeholder="Movimiento"
              />
              {movements.length > 1 && (
                <button
                  onClick={() => removeMovement(idx)}
                  className="btn-press cwa-x"
                  aria-label="Quitar movimiento"
                >×</button>
              )}
            </div>
            {(['rx', 'scaled', 'beginner'] as const).map(scale => (
              <div key={scale} className="cwa-scale" data-scale={scale}>
                <span className="cwa-scale-k">{scale}</span>
                <input
                  className="cwa-input"
                  value={m.scaling[scale]}
                  onChange={(e) => updateMovement(idx, { scaling: { [scale]: e.target.value.slice(0, 80) } as any })}
                  placeholder={scale === 'rx' ? '5 reps @ 60kg' : scale === 'scaled' ? '5 @ 45kg' : '5 @ 30kg'}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={addMovement}
        className="btn-press cwa-add"
      >+ Movimiento</button>

      <div className="cwa-field">
        <span className="cwa-label">Notas (opcional)</span>
        <textarea
          className="cwa-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
          placeholder='Ej. "Foco en pacing · sub-13min"'
          rows={2}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !valid}
        className="btn-press cwa-cta cwa-cta--gold"
        data-busy={submitting}
      >{submitting ? 'Asignando…' : '✦ Asignar custom WOD'}</button>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────

interface Props {
  athlete: AthleteProfile;
}

/** Categoría competidor → disco de tier (emblema visual, no carga). */
const categoryTier = (cat: CompetitorCategory): 'white' | 'green' | 'yellow' | 'blue' | 'red' => {
  switch (cat) {
    case 'RX': return 'red';
    case 'Masters': return 'blue';
    case 'Teens': return 'green';
    case 'Scaled':
    default: return 'yellow';
  }
};

const CustomWodAssigner: React.FC<Props> = ({ athlete }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<CompetitorProfile | null>(null);
  const [recentWods, setRecentWods] = useState<CustomWodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // Profile: 404 OK · si no es competidor lo manejamos como null
      try {
        const p = await competitorApi.getAthlete(athlete.id);
        setProfile(p);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('no tiene perfil de competidor') || msg.includes('404')) {
          setProfile(null);
        } else {
          throw e;
        }
      }
      // WODs solo si es competidor
      try {
        const list = await customWodApi.listForAthlete(athlete.id);
        setRecentWods(list);
      } catch {
        setRecentWods([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tier competidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athlete.id]);

  const handleDemote = async () => {
    if (!profile) return;
    if (!window.confirm('Desactivar tier competidor para este atleta? (preserva historial)')) return;
    try {
      await competitorApi.demote(athlete.id);
      setProfile(prev => prev ? { ...prev, is_competitor: false } : prev);
      showToast({ message: 'Atleta desactivado como competidor', variant: 'info' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos desactivar';
      showToast({ message: msg, variant: 'error' });
    }
  };

  const handleDeleteWod = async (id: string) => {
    if (!window.confirm('Borrar este custom WOD?')) return;
    try {
      await customWodApi.delete(id);
      setRecentWods(prev => prev.filter(w => w.id !== id));
      showToast({ message: 'Custom WOD borrado', variant: 'info' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No pudimos borrar el WOD';
      showToast({ message: msg, variant: 'error' });
    }
  };

  return (
    <section className="cwa-root">
      <div className="cwa-head">
        <div className="cwa-head-l">
          {profile?.is_competitor && (
            <PlateBadge
              tier={categoryTier(profile.category)}
              size={28}
              className="cwa-emblem"
            />
          )}
          <span className="cwa-eyebrow">Tier competidor · Volta</span>
        </div>
        {profile?.is_competitor && (
          <span className="cwa-chip">✦ {profile.category}</span>
        )}
      </div>

      {loading ? (
        <p className="cwa-muted">Cargando…</p>
      ) : error ? (
        <p className="cwa-error">{error}</p>
      ) : !profile || !profile.is_competitor ? (
        <PromoteForm
          athlete={athlete}
          onPromoted={(p) => { setProfile(p); setShowForm(false); }}
        />
      ) : (
        <>
          {/* Profile summary */}
          <div className="cwa-profile">
            <div className="cwa-profile-top">
              <div className="cwa-profile-body">
                <p className="cwa-profile-event">
                  {profile.target_event ?? 'Sin target event'}
                </p>
                <p className="cwa-profile-meta">
                  {profile.category} · {profile.weekly_sessions_target} sesiones/sem
                  {profile.weekly_volume_target_kg ? ` · ${profile.weekly_volume_target_kg}kg target` : ''}
                </p>
                {(profile.open_rank_worldwide || profile.open_rank_regional) && (
                  <p className="cwa-profile-rank">
                    Open {profile.open_year ?? ''}: {profile.open_rank_worldwide ? `#${profile.open_rank_worldwide} worldwide` : ''}
                    {profile.open_rank_regional ? ` · #${profile.open_rank_regional} regional` : ''}
                  </p>
                )}
                {profile.coach_notes && (
                  <p className="cwa-profile-notes">
                    "{profile.coach_notes}"
                  </p>
                )}
              </div>
              <button
                onClick={handleDemote}
                className="btn-press cwa-ghost-danger"
              >desactivar</button>
            </div>
          </div>

          {/* Toggle de form WOD */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn-press cwa-cta-outline"
            >+ Asignar custom WOD del día</button>
          ) : (
            <WodForm
              athleteId={athlete.id}
              onCreated={(wod) => {
                setRecentWods(prev => [wod, ...prev.filter(w => w.date !== wod.date)]);
                setShowForm(false);
              }}
            />
          )}

          {/* Lista de WODs recientes */}
          {recentWods.length > 0 && (
            <>
              <p className="cwa-list-head">
                Custom WODs recientes · {recentWods.length}
              </p>
              <div className="cwa-list">
                {recentWods.slice(0, 8).map(w => (
                  <div key={w.id} className="cwa-wod">
                    <div className="cwa-wod-body">
                      <p className="cwa-wod-title">{w.title}</p>
                      <p className="cwa-wod-meta">
                        {w.date} · {w.type} · {w.movements.length} mov
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteWod(w.id)}
                      className="btn-press cwa-wod-x"
                      aria-label="Borrar WOD"
                    >×</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default CustomWodAssigner;

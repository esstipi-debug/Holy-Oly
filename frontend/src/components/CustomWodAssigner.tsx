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
import type { AthleteProfile } from '../data/athletes';

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
 */

const HO_GOLD = '#F5C518';
const HO_PURPLE = '#7C5CFF';
const VOLTA_CYAN = '#00E5FF';
const VOLTA_RED = '#FF3D00';

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
    <div style={{
      background: 'var(--surface)', border: `1px solid ${VOLTA_CYAN}44`,
      borderRadius: 14, padding: 14,
    }}>
      <p style={{
        fontSize: 11, color: VOLTA_CYAN, fontWeight: 800, marginBottom: 8,
        letterSpacing: '.04em',
      }}>
        Promover a tier competidor
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
        Habilita layout extra · custom WODs · open rank tracking · target event.
      </p>

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
          Categoría
        </p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="btn-press"
              style={{
                padding: '5px 10px', borderRadius: 8,
                background: category === c ? VOLTA_CYAN : 'transparent',
                color: category === c ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${category === c ? VOLTA_CYAN : 'var(--card-border)'}`,
                fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{c}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
          Target event
        </p>
        <input
          value={targetEvent}
          onChange={(e) => setTargetEvent(e.target.value.slice(0, 64))}
          placeholder="Open 2026 · Quarterfinals · Semifinals · Games"
          style={{
            width: '100%', padding: '8px 10px',
            background: 'var(--bg)', border: '1px solid var(--card-border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 11,
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
          Sessions / semana · target
        </p>
        <input
          type="number"
          min={1}
          max={21}
          value={weeklySessions}
          onChange={(e) => setWeeklySessions(Number(e.target.value) || 12)}
          style={{
            width: 80, padding: '8px 10px',
            background: 'var(--bg)', border: '1px solid var(--card-border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 11,
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
          Notas (coach → atleta)
        </p>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value.slice(0, 2000))}
          placeholder="Ej. 'Foco en gymnastics · OHS 90kg para Open 26'"
          rows={2}
          style={{
            width: '100%', padding: '8px 10px',
            background: 'var(--bg)', border: '1px solid var(--card-border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 11,
            fontFamily: 'inherit', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        onClick={handlePromote}
        disabled={submitting}
        className="btn-press"
        style={{
          width: '100%', padding: '10px 0', borderRadius: 10,
          background: VOLTA_CYAN, color: '#000', border: 'none',
          fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
          cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit',
          opacity: submitting ? 0.6 : 1,
        }}
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
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--card-border)',
      borderRadius: 14, padding: 12, marginTop: 10,
    }}>
      {/* Templates */}
      <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
        Template rápido
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => applyTemplate(t.id)}
            className="btn-press"
            style={{
              padding: '4px 8px', borderRadius: 6,
              background: 'transparent', color: 'var(--text-secondary)',
              border: `1px solid ${HO_PURPLE}55`,
              fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Fila 1: fecha + tipo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
            Fecha
          </p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px',
              background: 'var(--bg)', border: '1px solid var(--card-border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 11,
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
            Tipo
          </p>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CustomWodType)}
            style={{
              width: '100%', padding: '6px 8px',
              background: 'var(--bg)', border: '1px solid var(--card-border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 11,
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          >
            {WOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Fila 2: duración + intensidad */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
            Duración (min)
          </p>
          <input
            type="number"
            min={1}
            max={180}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value) || 20)}
            style={{
              width: '100%', padding: '6px 8px',
              background: 'var(--bg)', border: '1px solid var(--card-border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 11,
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
            Intensidad
          </p>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as CustomWodIntensity)}
            style={{
              width: '100%', padding: '6px 8px',
              background: 'var(--bg)', border: '1px solid var(--card-border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 11,
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
          Título
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder='Ej. "AMRAP 20 · gymnastics focus"'
          style={{
            width: '100%', padding: '6px 8px',
            background: 'var(--bg)', border: '1px solid var(--card-border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 11,
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Movements editable */}
      <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
        Movimientos · {movements.length}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {movements.map((m, idx) => (
          <div key={idx} style={{
            background: 'var(--bg)', border: '1px solid var(--card-border)',
            borderRadius: 10, padding: 8,
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                value={m.name}
                onChange={(e) => updateMovement(idx, { name: e.target.value.slice(0, 80) })}
                placeholder="Movimiento"
                style={{
                  flex: 1, padding: '5px 8px',
                  background: 'var(--surface)', border: '1px solid var(--card-border)',
                  borderRadius: 6, color: 'var(--text)', fontSize: 11,
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              {movements.length > 1 && (
                <button
                  onClick={() => removeMovement(idx)}
                  className="btn-press"
                  style={{
                    padding: '5px 8px', borderRadius: 6,
                    background: 'transparent', color: VOLTA_RED,
                    border: `1px solid ${VOLTA_RED}55`,
                    fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >×</button>
              )}
            </div>
            {(['rx', 'scaled', 'beginner'] as const).map(scale => (
              <div key={scale} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)',
                  width: 50, textTransform: 'uppercase', letterSpacing: '.06em',
                }}>{scale}</span>
                <input
                  value={m.scaling[scale]}
                  onChange={(e) => updateMovement(idx, { scaling: { [scale]: e.target.value.slice(0, 80) } as any })}
                  placeholder={scale === 'rx' ? '5 reps @ 60kg' : scale === 'scaled' ? '5 @ 45kg' : '5 @ 30kg'}
                  style={{
                    flex: 1, padding: '5px 8px',
                    background: 'var(--surface)', border: '1px solid var(--card-border)',
                    borderRadius: 6, color: 'var(--text)', fontSize: 10,
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={addMovement}
        className="btn-press"
        style={{
          width: '100%', padding: '6px 0', borderRadius: 8,
          background: 'transparent', color: 'var(--text-secondary)',
          border: '1px dashed var(--card-border)',
          fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 10,
        }}
      >+ Movimiento</button>

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
          Notas (opcional)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
          placeholder='Ej. "Foco en pacing · sub-13min"'
          rows={2}
          style={{
            width: '100%', padding: '6px 8px',
            background: 'var(--bg)', border: '1px solid var(--card-border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 11,
            fontFamily: 'inherit', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !valid}
        className="btn-press"
        style={{
          width: '100%', padding: '10px 0', borderRadius: 10,
          background: valid ? HO_GOLD : 'var(--card-border)',
          color: valid ? '#000' : 'var(--text-secondary)',
          border: 'none',
          fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
          cursor: submitting ? 'wait' : valid ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          opacity: submitting ? 0.6 : 1,
        }}
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
    <section>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
      }}>
        <p style={{
          fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase',
        }}>
          Tier competidor · Volta
        </p>
        {profile?.is_competitor && (
          <span style={{
            fontSize: 9, fontWeight: 800, color: VOLTA_CYAN,
            background: `${VOLTA_CYAN}18`, border: `1px solid ${VOLTA_CYAN}55`,
            borderRadius: 8, padding: '3px 8px', letterSpacing: '.04em',
          }}>
            ✦ {profile.category}
          </span>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cargando…</p>
      ) : error ? (
        <p style={{ fontSize: 11, color: '#f87171' }}>{error}</p>
      ) : !profile || !profile.is_competitor ? (
        <PromoteForm
          athlete={athlete}
          onPromoted={(p) => { setProfile(p); setShowForm(false); }}
        />
      ) : (
        <>
          {/* Profile summary */}
          <div style={{
            background: 'var(--surface)', border: `1px solid ${VOLTA_CYAN}33`,
            borderRadius: 14, padding: 12, marginBottom: 10,
            boxShadow: `0 0 12px ${VOLTA_CYAN}11`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>
                  {profile.target_event ?? 'Sin target event'}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {profile.category} · {profile.weekly_sessions_target} sesiones/sem
                  {profile.weekly_volume_target_kg ? ` · ${profile.weekly_volume_target_kg}kg target` : ''}
                </p>
                {(profile.open_rank_worldwide || profile.open_rank_regional) && (
                  <p style={{ fontSize: 10, color: VOLTA_CYAN, marginTop: 4, fontWeight: 700 }}>
                    Open {profile.open_year ?? ''}: {profile.open_rank_worldwide ? `#${profile.open_rank_worldwide} worldwide` : ''}
                    {profile.open_rank_regional ? ` · #${profile.open_rank_regional} regional` : ''}
                  </p>
                )}
                {profile.coach_notes && (
                  <p style={{
                    fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4,
                    fontStyle: 'italic',
                  }}>
                    "{profile.coach_notes}"
                  </p>
                )}
              </div>
              <button
                onClick={handleDemote}
                className="btn-press"
                style={{
                  padding: '4px 8px', borderRadius: 6,
                  background: 'transparent', color: VOLTA_RED,
                  border: `1px solid ${VOLTA_RED}55`,
                  fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >desactivar</button>
            </div>
          </div>

          {/* Toggle de form WOD */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn-press"
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'transparent', color: HO_GOLD,
                border: `1px solid ${HO_GOLD}66`,
                fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
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
              <p style={{
                fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
                letterSpacing: '.12em', textTransform: 'uppercase', margin: '14px 0 6px',
              }}>
                Custom WODs recientes · {recentWods.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentWods.slice(0, 8).map(w => (
                  <div key={w.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--card-border)',
                    borderRadius: 10, padding: '8px 10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)' }}>
                        {w.title}
                      </p>
                      <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {w.date} · {w.type} · {w.movements.length} mov
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteWod(w.id)}
                      className="btn-press"
                      style={{
                        background: 'transparent', color: 'var(--text-secondary)',
                        border: '1px solid var(--card-border)', borderRadius: 6,
                        padding: '4px 8px', fontSize: 9, fontWeight: 800,
                        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                      }}
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

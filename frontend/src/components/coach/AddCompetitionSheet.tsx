import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import type { CompetitionLevel } from '../../data/competitions';

/**
 * AddCompetitionSheet · form para agendar una competencia objetivo (input del coach).
 * No inventa nada: el coach carga nombre/fecha/nivel/objetivo/prioridad.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  athleteName: string;
  onSave: (input: { name: string; date: string; level?: CompetitionLevel; objective?: string; priority?: boolean }) => void;
}
const ACCENT = 'var(--engine-macro)';
const LEVELS: { id: CompetitionLevel; label: string }[] = [
  { id: 'local', label: 'Local' }, { id: 'nacional', label: 'Nacional' }, { id: 'internacional', label: 'Internacional' },
];

const AddCompetitionSheet: React.FC<Props> = ({ open, onClose, athleteName, onSave }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [level, setLevel] = useState<CompetitionLevel>('nacional');
  const [objective, setObjective] = useState('');
  const [priority, setPriority] = useState(true);

  const reset = () => { setName(''); setDate(''); setLevel('nacional'); setObjective(''); setPriority(true); };
  const close = () => { onClose(); setTimeout(reset, 250); };
  const canSave = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const save = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), date, level, objective: objective.trim() || undefined, priority });
    close();
  };

  return (
    <BottomSheet open={open} onClose={close} title={`Agregar competencia · ${athleteName.split(' ')[0]}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nombre"><input value={name} onChange={e => setName(e.target.value)} placeholder="Campeonato Argentino" style={inp()} /></Field>
        <Field label="Fecha"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp()} /></Field>
        <Field label="Nivel">
          <div style={{ display: 'flex', gap: 6 }}>
            {LEVELS.map(l => <button key={l.id} onClick={() => setLevel(l.id)} style={chip(level === l.id)}>{l.label}</button>)}
          </div>
        </Field>
        <Field label="Objetivo (opcional)"><input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Clasificar · PR total" style={inp()} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={priority} onChange={e => setPriority(e.target.checked)} /> Competencia prioritaria (pico principal)
        </label>
        <button onClick={save} disabled={!canSave} style={cta(canSave)}>Agendar competencia</button>
      </div>
    </BottomSheet>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
    {children}
  </div>
);
function inp(): React.CSSProperties {
  return { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--card-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' };
}
function chip(active: boolean): React.CSSProperties {
  return { padding: '7px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: active ? `color-mix(in oklab, ${ACCENT} 20%, transparent)` : 'transparent', border: `1px solid ${active ? ACCENT : 'var(--card-border)'}`, color: active ? ACCENT : 'var(--text-secondary)' };
}
function cta(enabled: boolean): React.CSSProperties {
  return { marginTop: 4, width: '100%', padding: '11px 0', borderRadius: 10, background: enabled ? ACCENT : 'var(--card-border)', color: enabled ? '#0a0a0a' : 'var(--text-secondary)', border: 'none', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit' };
}
export default AddCompetitionSheet;

import React, { useState, useEffect } from 'react';
import BottomSheet from '../BottomSheet';

/**
 * AddWeighInSheet · registrar un pesaje (input del coach o del atleta).
 * Reusado desde BodyweightCard (coach) y AtletaHomeV2 (atleta).
 */
interface Props {
  open: boolean;
  onClose: () => void;
  athleteName: string;
  defaultKg?: number;
  onSave: (input: { date: string; kg: number }) => void;
}
const ACCENT = 'var(--engine-stress)';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const AddWeighInSheet: React.FC<Props> = ({ open, onClose, athleteName, defaultKg, onSave }) => {
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState('');
  useEffect(() => { if (open) { setDate(todayISO()); setKg(defaultKg != null ? String(defaultKg) : ''); } }, [open, defaultKg]);

  const kgNum = parseFloat(kg);
  const canSave = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(kgNum) && kgNum > 0;
  const save = () => { if (!canSave) return; onSave({ date, kg: Math.round(kgNum * 10) / 10 }); onClose(); };

  return (
    <BottomSheet open={open} onClose={onClose} title={`Registrar pesaje · ${athleteName.split(' ')[0]}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Fecha"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp()} /></Field>
        <Field label="Peso (kg)"><input type="number" inputMode="decimal" step="0.1" value={kg} onChange={e => setKg(e.target.value)} placeholder="72.4" style={inp()} /></Field>
        <button onClick={save} disabled={!canSave} style={cta(canSave)}>Guardar pesaje</button>
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
function cta(enabled: boolean): React.CSSProperties {
  return { marginTop: 4, width: '100%', padding: '11px 0', borderRadius: 10, background: enabled ? ACCENT : 'var(--card-border)', color: enabled ? '#0a0a0a' : 'var(--text-secondary)', border: 'none', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit' };
}
export default AddWeighInSheet;

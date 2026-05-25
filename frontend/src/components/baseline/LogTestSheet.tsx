import React, { useEffect, useState } from 'react';
import BottomSheet from '../BottomSheet';
import Button from '../Button';
import type { BaselineTest, BaselineResult } from '../../data/baseline';
import { formatValue } from '../../data/baseline';

interface Props {
  test: BaselineTest | null;
  existing: BaselineResult | null;
  onClose: () => void;
  onSave: (result: BaselineResult) => void;
  onDelete?: () => void;
}

const LogTestSheet: React.FC<Props> = ({ test, existing, onClose, onSave, onDelete }) => {
  const [valueStr, setValueStr] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  useEffect(() => {
    if (!test) return;
    if (existing) {
      if (test.unit === 'seconds') {
        setMinutes(String(Math.floor(existing.value / 60)));
        setSeconds(String(Math.round(existing.value % 60)));
      } else {
        setValueStr(String(existing.value));
      }
    } else {
      setValueStr('');
      setMinutes('');
      setSeconds('');
    }
  }, [test, existing]);

  if (!test) return null;

  const isTime = test.unit === 'seconds';

  const handleSave = () => {
    let value: number;
    if (isTime) {
      const m = parseInt(minutes || '0', 10);
      const s = parseInt(seconds || '0', 10);
      value = m * 60 + s;
    } else {
      value = parseFloat(valueStr);
    }
    if (!isFinite(value) || value <= 0) return;
    onSave({ value, unit: test.unit, date: new Date().toISOString() });
  };

  const canSave = isTime
    ? (parseInt(minutes || '0', 10) * 60 + parseInt(seconds || '0', 10)) > 0
    : parseFloat(valueStr) > 0;

  return (
    <BottomSheet open={!!test} onClose={onClose} title={test.name}>
      <div style={{ padding: '0 4px 8px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.5, marginBottom: 14 }}>
          {test.protocol}
        </p>
        {test.reference && (
          <div style={{
            fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 10,
            background: 'rgba(124,92,255,0.10)', color: '#A88BFF',
            border: '1px solid rgba(124,92,255,0.25)', marginBottom: 16, display: 'inline-block',
          }}>📊 {test.reference}</div>
        )}

        <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase' }}>
          Resultado · {test.unit}
        </label>

        {isTime ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input
              type="number" inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)}
              placeholder="min" autoFocus
              style={inputStyle}
            />
            <span style={{ fontSize: 24, fontWeight: 900 }}>:</span>
            <input
              type="number" inputMode="numeric" value={seconds} onChange={e => setSeconds(e.target.value)}
              placeholder="seg" max={59}
              style={inputStyle}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input
              type="number" inputMode="decimal" value={valueStr} onChange={e => setValueStr(e.target.value)}
              placeholder={`Tu mejor ${test.unit}`} autoFocus
              style={{ ...inputStyle, flex: 1, textAlign: 'left', paddingLeft: 16 }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', minWidth: 70 }}>{test.unit}</span>
          </div>
        )}

        {existing && (
          <p style={{ fontSize: 11, color: 'var(--text-secondary, #94A3B8)', marginTop: 10 }}>
            Último registro: {formatValue(existing.value, existing.unit)} · {new Date(existing.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          {existing && onDelete && (
            <Button variant="secondary" size="md" onClick={onDelete}>Borrar</Button>
          )}
          <Button variant="primary" size="md" fullWidth onClick={handleSave} disabled={!canSave}>
            {existing ? 'Actualizar' : 'Guardar test'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '12px', borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text, #EAEAF5)',
  fontSize: 22, fontWeight: 900, textAlign: 'center',
  outline: 'none', fontFamily: 'inherit',
};

export default LogTestSheet;

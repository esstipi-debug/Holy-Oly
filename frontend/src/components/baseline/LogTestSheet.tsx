import React, { useEffect, useState } from 'react';
import BottomSheet from '../BottomSheet';
import type { BaselineTest, BaselineResult } from '../../data/baseline';
import { formatValue } from '../../data/baseline';

/**
 * Sheet para registrar el valor de un test de referencia.
 *
 * Usado SOLO por BaselineAssessment. Se renderiza dentro del BottomSheet
 * compartido (portal fixed) → no se puede garantizar scoping de clases, por
 * eso el contenido usa estilos inline alineados a tokens V2 (--text-hi /
 * --text / --text-mid, --surface-*, --border-soft, --font-*, --r-*). Acento
 * cyan (--engine-stress, identidad medición). Lógica intacta: parsing de
 * tiempo (min:seg) vs valor decimal, validación canSave y handlers.
 */

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
        <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 14 }}>
          {test.protocol}
        </p>
        {test.reference && (
          <div style={{
            fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-mono)',
            background: 'color-mix(in oklab, var(--engine-stress) 12%, transparent)',
            color: 'var(--engine-stress)',
            border: '1px solid color-mix(in oklab, var(--engine-stress) 32%, transparent)',
            marginBottom: 16, display: 'inline-block',
          }}>📊 {test.reference}</div>
        )}

        <label style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.1em', fontFamily: 'var(--font-mono)',
          color: 'var(--text-mid)', textTransform: 'uppercase',
        }}>
          Resultado · {test.unit}
        </label>

        {isTime ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input
              type="number" inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)}
              placeholder="min" autoFocus
              style={inputStyle}
            />
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-hi)', fontFamily: 'var(--font-display)' }}>:</span>
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
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-mid)', minWidth: 70, fontFamily: 'var(--font-mono)' }}>{test.unit}</span>
          </div>
        )}

        {existing && (
          <p style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
            Último registro: {formatValue(existing.value, existing.unit)} · {new Date(existing.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          {existing && onDelete && (
            <button type="button" className="btn-press" style={deleteBtnStyle} onClick={onDelete}>Borrar</button>
          )}
          <button
            type="button"
            className="btn-press"
            style={{ ...saveBtnStyle, opacity: canSave ? 1 : 0.5, pointerEvents: canSave ? 'auto' : 'none' }}
            onClick={handleSave}
            disabled={!canSave}
          >
            {existing ? 'Actualizar' : 'Guardar test'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '12px', borderRadius: 'var(--r-md)',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-soft)',
  color: 'var(--text-hi)',
  fontSize: 22, fontWeight: 700, textAlign: 'center',
  outline: 'none', fontFamily: 'var(--font-display)',
};

const saveBtnStyle: React.CSSProperties = {
  flex: 1, padding: '13px 20px', borderRadius: 'var(--r-md)',
  background: 'var(--engine-stress)',
  color: 'var(--bg)',
  border: 'none',
  fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 0 20px -6px color-mix(in oklab, var(--engine-stress) 60%, transparent)',
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '13px 20px', borderRadius: 'var(--r-md)',
  background: 'rgba(239,68,68,0.1)',
  color: 'var(--engine-pulse)',
  border: '1px solid rgba(239,68,68,0.3)',
  fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
  cursor: 'pointer',
};

export default LogTestSheet;

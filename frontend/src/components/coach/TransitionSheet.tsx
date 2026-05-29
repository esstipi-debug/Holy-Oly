import React, { useState, useMemo } from 'react';
import BottomSheet from '../BottomSheet';
import {
  availableTargetFreqs, affineMacros, suggestStartWeek, macroFreq,
  type AffineMacro,
} from '../../data/macroTransition';

/**
 * TransitionSheet · asistente de transición de días/semana (decisión del Boss:
 * "el coach decide + week picker"). Flujo: elegir frecuencia objetivo → macro
 * afín (misma escuela primero) → semana de arranque (continuar en la semana
 * proporcional al progreso, o reiniciar en S1) → confirmar.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  athleteName: string;
  currentProgramId: string;
  currentProgramName: string;
  currentWeek: number;
  currentTotal: number;
}

const ACCENT = 'var(--engine-stress)';

const TransitionSheet: React.FC<Props> = ({
  open, onClose, athleteName, currentProgramId, currentProgramName, currentWeek, currentTotal,
}) => {
  const curFreq = macroFreq(currentProgramId);
  const freqs = useMemo(() => availableTargetFreqs(currentProgramId), [currentProgramId]);
  const [targetFreq, setTargetFreq] = useState<number | null>(null);
  const [picked, setPicked] = useState<AffineMacro | null>(null);
  const [mode, setMode] = useState<'continue' | 'restart'>('continue');
  const [startWeek, setStartWeek] = useState(1);
  const [applied, setApplied] = useState(false);

  const affine = useMemo(
    () => (targetFreq != null ? affineMacros(currentProgramId, targetFreq) : []),
    [currentProgramId, targetFreq],
  );
  const firstName = athleteName.split(' ')[0];
  const effectiveWeek = mode === 'restart' ? 1 : startWeek;

  const reset = () => { setTargetFreq(null); setPicked(null); setMode('continue'); setApplied(false); };
  const close = () => { onClose(); setTimeout(reset, 250); };
  const pickMacro = (a: AffineMacro) => {
    setPicked(a);
    setStartWeek(suggestStartWeek(currentWeek, currentTotal, a.weeks));
    setMode('continue');
  };

  return (
    <BottomSheet open={open} onClose={close} title={`Cambiar días · ${firstName}`}>
      {applied ? (
        <div style={{ textAlign: 'center', padding: '12px 4px' }}>
          <div style={{ fontSize: 30 }}>✓</div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: '8px 0 4px' }}>Transición lista</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {firstName} pasa de <strong style={{ color: 'var(--text)' }}>{currentProgramName}</strong> ({curFreq}d)
            a <strong style={{ color: ACCENT }}>{picked?.macro.name}</strong> ({targetFreq}d) ·
            arranca en <strong style={{ color: 'var(--text)' }}>S{effectiveWeek}/{picked?.weeks}</strong>
            {mode === 'restart' ? ' (reinicio)' : ' (continúa su progreso)'}.
          </p>
          <button onClick={close} style={cta(ACCENT, true)}>Cerrar</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Estado actual */}
          <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Hoy</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{currentProgramName}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{curFreq} días/semana · semana {currentWeek}/{currentTotal}</p>
          </div>

          {/* Paso 1 · frecuencia objetivo */}
          <div>
            <p style={step()}>1 · Nueva frecuencia</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {freqs.map(f => (
                <button key={f} onClick={() => { setTargetFreq(f); setPicked(null); }}
                  style={chip(targetFreq === f, f > curFreq ? '#22C55E' : ACCENT)}>
                  {f}d/sem {f > curFreq ? '↑' : '↓'}
                </button>
              ))}
            </div>
          </div>

          {/* Paso 2 · macro afín */}
          {targetFreq != null && (
            <div>
              <p style={step()}>2 · Macro afín ({affine.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {affine.length === 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>No hay macro a {targetFreq}d en el catálogo · conseguir fuente.</p>
                )}
                {affine.map(a => (
                  <button key={a.macro.id} onClick={() => pickMacro(a)}
                    style={{
                      textAlign: 'left', padding: 10, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                      background: picked?.macro.id === a.macro.id ? `color-mix(in oklab, ${ACCENT} 16%, transparent)` : 'var(--surface)',
                      border: `1px solid ${picked?.macro.id === a.macro.id ? ACCENT : (a.sameFamily ? '#22C55E55' : 'var(--card-border)')}`,
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{a.macro.name}</span>
                      {a.sameFamily && <span style={{ fontSize: 9, fontWeight: 800, color: '#22C55E', textTransform: 'uppercase' }}>★ misma escuela</span>}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{a.weeks} sem · {a.reason}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 3 · semana de arranque (week picker) */}
          {picked && (
            <div>
              <p style={step()}>3 · ¿Desde qué semana?</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setMode('continue')} style={chip(mode === 'continue', ACCENT)}>
                  Continuar · S{suggestStartWeek(currentWeek, currentTotal, picked.weeks)}
                </button>
                <button onClick={() => setMode('restart')} style={chip(mode === 'restart', 'var(--text-secondary)')}>
                  Reiniciar · S1
                </button>
              </div>
              {mode === 'continue' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <button onClick={() => setStartWeek(w => Math.max(1, w - 1))} style={stepBtn()}>−</button>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: ACCENT }}>S{startWeek}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>de {picked.weeks} · {Math.round((startWeek / picked.weeks) * 100)}%</div>
                  </div>
                  <button onClick={() => setStartWeek(w => Math.min(picked.weeks, w + 1))} style={stepBtn()}>+</button>
                </div>
              )}
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 10, textAlign: 'center' }}>
                {mode === 'continue'
                  ? `Sugerido por su progreso actual (${Math.round((currentWeek / currentTotal) * 100)}% del macro).`
                  : 'Base limpia desde la semana 1.'}
              </p>
              <button onClick={() => setApplied(true)} style={cta(ACCENT, true)}>
                Asignar {picked.macro.name} · {targetFreq}d desde S{effectiveWeek}
              </button>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
};

// ── estilos ──
function step(): React.CSSProperties {
  return { fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 };
}
function chip(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '7px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? `color-mix(in oklab, ${color} 20%, transparent)` : 'transparent',
    border: `1px solid ${active ? color : 'var(--card-border)'}`,
    color: active ? color : 'var(--text-secondary)',
  };
}
function stepBtn(): React.CSSProperties {
  return { width: 36, height: 36, borderRadius: 10, border: '1px solid var(--card-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 18, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
}
function cta(color: string, full: boolean): React.CSSProperties {
  return {
    marginTop: 14, width: full ? '100%' : undefined, padding: '11px 0', borderRadius: 10,
    background: color, color: '#0a0a0a', border: 'none', fontSize: 12, fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer', fontFamily: 'inherit',
  };
}

export default TransitionSheet;

import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';

/**
 * Sesión activa CrossFit (Volta) · pantalla de score sheet.
 *
 * SIN timer en la app · vetado por usuario · "los atletas no usan celular
 * mientras entrenan". El atleta hace el WOD en el gym y vuelve a la app
 * solo para anotar el score.
 *
 * Esta sección es solo para anotar el score (scale + rondas + extra reps).
 * Para el log completo con auto-PR check vs benchmarks, finalizar → VOLTA_WOD_LOG.
 */

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  cyan: '#00E5FF',
  amber: '#FFB300',
  green: '#00E676',
};

type Scale = 'Rx' | 'Scaled' | 'Beginner';

const WOD = {
  type: 'AMRAP' as 'AMRAP' | 'EMOM' | 'For Time',
  durationLabel: '20 min',
  title: 'AMRAP 20',
  movements: [
    { name: '5 Power Clean', detail: '@ 60kg (Rx) / 50kg (Scaled) / 40kg (Beginner)' },
    { name: '10 Pull-ups', detail: 'Strict (Rx) / Kipping (Scaled) / Banda (Beginner)' },
    { name: '15 Box Jumps', detail: '24" (Rx) / 20" (Scaled) / 16" (Beginner)' },
  ],
};

const VoltaActiveWod: React.FC = () => {
  const { navigate } = useNav();
  const [scale, setScale] = useState<Scale>('Rx');
  const [rounds, setRounds] = useState(0);
  const [extraReps, setExtraReps] = useState(0);

  const incRound = () => setRounds(r => r + 1);
  const decRound = () => setRounds(r => Math.max(0, r - 1));
  const incRep = () => setExtraReps(r => r + 1);
  const decRep = () => setExtraReps(r => Math.max(0, r - 1));

  const handleFinish = () => {
    // Persistir score parcial para que VOLTA_WOD_LOG pre-rellene
    try {
      localStorage.setItem('volta_wod:score_draft', JSON.stringify({
        scale, rounds, extra_reps: extraReps, wod_name: WOD.title,
      }));
    } catch { /* ignore */ }
    navigate('SUMMARY');
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '52px 16px 16px', borderBottom: `1px solid ${C.line}` }}>
        <p style={{ fontSize: 10, color: C.cyan, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {WOD.type} · {WOD.durationLabel} · CrossFit
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>{WOD.title}</h1>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
          Hacé el WOD en el box. Cuando termines, anotá tu score acá y pasá al log final.
        </p>
      </div>

      {/* SCALING TOGGLE */}
      <div style={{ padding: '16px 16px 0' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          Escala
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['Rx', 'Scaled', 'Beginner'] as Scale[]).map(s => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className="btn-press"
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                background: scale === s ? C.cyan : C.surface,
                color: scale === s ? '#07070F' : C.muted,
                border: `1px solid ${scale === s ? C.cyan : C.line}`,
                fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* MOVEMENTS · referencia, no checkable */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          Movimientos
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {WOD.movements.map((m, i) => (
            <div key={i} style={{
              background: C.surface, border: `1px solid ${C.line}`,
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: C.surface2, color: C.cyan,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 900, flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.name}</p>
                <p style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{m.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SCORE INPUTS · sin timer · solo contadores manuales */}
      <div style={{ padding: '8px 16px 0' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Tu score
        </p>

        {/* Rondas */}
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.text }}>Rondas completas</p>
            <p style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>Toques manuales · sin timer</p>
          </div>
          <button
            onClick={decRound}
            className="btn-press"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.surface2, color: C.muted, border: `1px solid ${C.line}`,
              fontSize: 18, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >−</button>
          <span style={{
            minWidth: 50, textAlign: 'center',
            fontSize: 28, fontWeight: 900, color: C.green,
            fontVariantNumeric: 'tabular-nums',
          }}>{rounds}</span>
          <button
            onClick={incRound}
            className="btn-press"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.green, color: '#07070F', border: 'none',
              fontSize: 18, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >+</button>
        </div>

        {/* Extra reps */}
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.text }}>Reps extra</p>
            <p style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>De la ronda incompleta</p>
          </div>
          <button
            onClick={decRep}
            className="btn-press"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.surface2, color: C.muted, border: `1px solid ${C.line}`,
              fontSize: 18, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >−</button>
          <span style={{
            minWidth: 50, textAlign: 'center',
            fontSize: 24, fontWeight: 900, color: C.cyan,
            fontVariantNumeric: 'tabular-nums',
          }}>+{extraReps}</span>
          <button
            onClick={incRep}
            className="btn-press"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.cyan, color: '#07070F', border: 'none',
              fontSize: 18, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >+</button>
        </div>

        {/* Resumen */}
        <p style={{
          textAlign: 'center', marginTop: 16,
          fontSize: 12, color: C.muted, fontWeight: 700,
        }}>
          Tu score: <strong style={{ color: C.text }}>{rounds} rondas + {extraReps} reps</strong> · <span style={{ color: C.cyan }}>{scale}</span>
        </p>
      </div>

      {/* CTA */}
      <div style={{
        position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)', left: 0, right: 0, zIndex: 30,
        padding: '14px 16px 12px',
        background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg} 65%, transparent 100%)`,
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={handleFinish}
          className="btn-press"
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14,
            background: C.cyan, color: '#07070F', border: 'none',
            fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(0,229,255,0.3)',
          }}
        >Anotar score completo →</button>
      </div>
    </div>
  );
};

export default VoltaActiveWod;

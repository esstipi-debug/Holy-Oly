import React, { useState, useEffect, useRef } from 'react';
import { useNav } from '../context/NavigationContext';

/**
 * Sesión activa CrossFit (Volta).
 *
 * Timer countdown para AMRAP/EMOM/For Time, contador de rondas/reps,
 * scaling RX/Scaled/Beginner. Reemplaza ActiveSession (que es olímpico).
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
  red: '#FF3D00',
  green: '#00E676',
};

type Scale = 'Rx' | 'Scaled' | 'Beginner';

const WOD = {
  type: 'AMRAP' as 'AMRAP' | 'EMOM' | 'For Time',
  durationSec: 20 * 60, // 20 min
  title: 'AMRAP 20',
  movements: [
    { name: '5 Power Clean', detail: '@ 60kg (Rx) / 50kg (Scaled) / 40kg (Beginner)' },
    { name: '10 Pull-ups', detail: 'Strict (Rx) / Kipping (Scaled) / Banda (Beginner)' },
    { name: '15 Box Jumps', detail: '24" (Rx) / 20" (Scaled) / 16" (Beginner)' },
  ],
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const VoltaActiveWod: React.FC = () => {
  const { navigate } = useNav();
  const [scale, setScale] = useState<Scale>('Rx');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [extraReps, setExtraReps] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const remaining = Math.max(0, WOD.durationSec - elapsed);
  const finished = remaining === 0;

  useEffect(() => {
    if (running && !finished) {
      intervalRef.current = window.setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, finished]);

  useEffect(() => {
    if (finished) setRunning(false);
  }, [finished]);

  const addRound = () => {
    if (!running || finished) return;
    setRounds(r => r + 1);
    setExtraReps(0);
  };

  const addRep = () => {
    if (!running || finished) return;
    setExtraReps(r => r + 1);
  };

  const handleFinish = () => navigate('SUMMARY');

  const pct = (remaining / WOD.durationSec) * 100;
  const timeColor = pct > 50 ? C.green : pct > 25 ? C.amber : C.red;

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 110, color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '52px 16px 16px', borderBottom: `1px solid ${C.line}` }}>
        <p style={{ fontSize: 10, color: C.cyan, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {WOD.type} · CrossFit
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>{WOD.title}</h1>
      </div>

      {/* SCALING TOGGLE */}
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 6 }}>
        {(['Rx', 'Scaled', 'Beginner'] as Scale[]).map(s => (
          <button
            key={s}
            onClick={() => !running && setScale(s)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 12,
              background: scale === s ? C.cyan : C.surface,
              color: scale === s ? '#07070F' : C.muted,
              border: `1px solid ${scale === s ? C.cyan : C.line}`,
              fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
              cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: running ? 0.6 : 1,
            }}
          >{s}</button>
        ))}
      </div>

      {/* MOVEMENTS */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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

      {/* TIMER */}
      <div style={{ padding: '8px 16px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {running ? 'Tiempo restante' : finished ? 'WOD finalizado' : 'Listo para empezar'}
        </p>
        <div style={{
          fontSize: 64, fontWeight: 900, color: timeColor, lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-.04em',
          marginTop: 4,
        }}>
          {formatTime(remaining)}
        </div>
      </div>

      {/* SCORE COUNTERS */}
      <div style={{ padding: '16px', display: 'flex', gap: 8 }}>
        <button
          onClick={addRound}
          disabled={!running}
          style={{
            flex: 2, padding: '14px 0', borderRadius: 14,
            background: running ? C.green : C.surface,
            color: running ? '#07070F' : C.muted,
            border: 'none', fontSize: 14, fontWeight: 900,
            cursor: running ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.04em',
            opacity: running ? 1 : 0.5,
          }}
        >
          + Ronda<br/>
          <span style={{ fontSize: 24, fontWeight: 900 }}>{rounds}</span>
        </button>
        <button
          onClick={addRep}
          disabled={!running}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            background: C.surface, color: running ? C.cyan : C.muted,
            border: `1px solid ${running ? C.cyan : C.line}`,
            fontSize: 12, fontWeight: 800,
            cursor: running ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.04em',
            opacity: running ? 1 : 0.5,
          }}
        >
          + Rep<br/>
          <span style={{ fontSize: 20 }}>+{extraReps}</span>
        </button>
      </div>

      {/* CTAS */}
      <div style={{
        position: 'absolute', bottom: 76, left: 0, right: 0, zIndex: 30,
        padding: '14px 16px 12px',
        background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg} 65%, transparent 100%)`,
        backdropFilter: 'blur(8px)',
        display: 'flex', gap: 8,
      }}>
        {!running && !finished && (
          <button
            onClick={() => setRunning(true)}
            style={{
              flex: 1, padding: '15px 0', borderRadius: 14,
              background: C.cyan, color: '#07070F', border: 'none',
              fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(0,229,255,0.3)',
            }}
          >▶ Iniciar timer</button>
        )}
        {running && !finished && (
          <button
            onClick={() => setRunning(false)}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14,
              background: C.surface2, color: C.amber, border: `1px solid ${C.amber}`,
              fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >⏸ Pausar</button>
        )}
        {(finished || elapsed > 0) && (
          <button
            onClick={handleFinish}
            style={{
              flex: finished ? 1 : 1, padding: finished ? '15px 0' : '14px 0', borderRadius: 14,
              background: finished ? C.green : C.surface, color: finished ? '#07070F' : C.muted,
              border: finished ? 'none' : `1px solid ${C.line}`,
              fontSize: finished ? 14 : 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: finished ? '0 6px 20px rgba(0,230,118,0.3)' : 'none',
            }}
          >{finished ? '✓ Ver resumen' : 'Terminar'}</button>
        )}
      </div>
    </div>
  );
};

export default VoltaActiveWod;

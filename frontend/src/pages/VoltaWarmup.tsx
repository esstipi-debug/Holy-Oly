import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';

/**
 * Calentamiento CrossFit (Volta).
 *
 * 3 fases: Movilidad (general) → Activación (dinámica) → Ramp-up (al WOD).
 * Diseñado para preparar el cuerpo para AMRAP/EMOM/For Time.
 */

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  cyan: '#00E5FF',
  green: '#00E676',
  amber: '#FFB300',
};

type Phase = 'MOBILITY' | 'ACTIVATION' | 'RAMP_UP';

interface Movement {
  name: string;
  info: string;
  duration?: string;
}

const PHASES: Record<Phase, { label: string; movements: Movement[]; tag: string }> = {
  MOBILITY: {
    label: 'Movilidad general',
    tag: '3 min',
    movements: [
      { name: 'Foam roll espalda alta', info: '30 seg · presión sostenida' },
      { name: 'World\'s greatest stretch', info: '5 reps × lado · profundo' },
      { name: 'Cat-cow + thoracic rotation', info: '10 reps · flow lento' },
    ],
  },
  ACTIVATION: {
    label: 'Activación dinámica',
    tag: '4 min',
    movements: [
      { name: 'Air squat + reach', info: '15 reps · profundo y controlado' },
      { name: 'PVC pass-through + OHS', info: '10 + 10 reps · activar hombros' },
      { name: 'Inchworm + push-up', info: '8 reps · cadena posterior' },
      { name: 'Banded glute walk', info: '10 pasos × dirección' },
    ],
  },
  RAMP_UP: {
    label: 'Ramp-up al WOD',
    tag: '5 min',
    movements: [
      { name: 'Box jumps 16" → 24"', info: '5 + 5 reps · progresión' },
      { name: 'Pull-ups (50% RM)', info: '5 reps · escalado del WOD' },
      { name: 'Power Clean ligero', info: '3 + 2 reps · técnica' },
    ],
  },
};

const PHASE_ORDER: Phase[] = ['MOBILITY', 'ACTIVATION', 'RAMP_UP'];

const VoltaWarmup: React.FC = () => {
  const { navigate } = useNav();
  const [phase, setPhase] = useState<Phase>('MOBILITY');
  const [done, setDone] = useState<Set<string>>(new Set());

  const current = PHASES[phase];
  const totalDone = done.size;
  const totalMovs = Object.values(PHASES).reduce((s, p) => s + p.movements.length, 0);

  const toggle = (name: string) => {
    const next = new Set(done);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setDone(next);
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 110, color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '52px 16px 12px', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 10, color: C.cyan, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Pre-WOD · CrossFit
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>Calentamiento</h1>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              {totalDone}/{totalMovs} movs completados · {Object.values(PHASES).reduce((s, p) => s + parseInt(p.tag), 0)} min total
            </p>
          </div>
          <button
            onClick={() => navigate('SESSION')}
            style={{
              fontSize: 10, color: C.muted, fontWeight: 800,
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '.06em',
            }}
          >OMITIR</button>
        </div>
      </div>

      {/* PHASE TABS */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {PHASE_ORDER.map(p => {
          const active = phase === p;
          const doneCount = PHASES[p].movements.filter(m => done.has(m.name)).length;
          const total = PHASES[p].movements.length;
          return (
            <button
              key={p}
              onClick={() => setPhase(p)}
              style={{
                padding: '8px 14px', borderRadius: 12, flexShrink: 0,
                background: active ? C.cyan : C.surface,
                color: active ? '#07070F' : C.muted,
                border: `1px solid ${active ? C.cyan : C.line}`,
                fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {PHASES[p].label.toUpperCase()} {doneCount}/{total}
            </button>
          );
        })}
      </div>

      {/* PHASE TITLE */}
      <div style={{ padding: '20px 16px 12px' }}>
        <p style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>
          {current.label} · <span style={{ color: C.cyan }}>{current.tag}</span>
        </p>
      </div>

      {/* MOVEMENT LIST */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {current.movements.map(mov => {
          const isDone = done.has(mov.name);
          return (
            <button
              key={mov.name}
              onClick={() => toggle(mov.name)}
              style={{
                background: isDone ? `${C.green}10` : C.surface,
                border: `1px solid ${isDone ? `${C.green}40` : C.line}`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left', width: '100%',
                transition: 'background .15s ease',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: isDone ? C.green : 'transparent',
                border: `2px solid ${isDone ? C.green : C.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 12, color: '#07070F', fontWeight: 900,
              }}>{isDone ? '✓' : ''}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: isDone ? C.muted : C.text, textDecoration: isDone ? 'line-through' : 'none' }}>
                  {mov.name}
                </p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{mov.info}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* PROGRESS BAR */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ height: 4, background: C.surface, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(totalDone / totalMovs) * 100}%`,
            background: C.cyan, transition: 'width .3s ease',
          }} />
        </div>
      </div>

      {/* FOOTER CTA */}
      <div style={{
        position: 'absolute', bottom: 76, left: 0, right: 0, zIndex: 30,
        padding: '14px 16px 12px',
        background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg} 65%, transparent 100%)`,
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={() => navigate('SESSION')}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14,
            background: C.cyan, color: '#07070F',
            border: 'none', fontSize: 13, fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(0,229,255,0.25)',
          }}
        >Empezar WOD →</button>
      </div>
    </div>
  );
};

export default VoltaWarmup;

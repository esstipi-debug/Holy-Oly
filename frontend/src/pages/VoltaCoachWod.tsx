import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import WiseAssistant from '../components/WiseAssistant';

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

type WodType = 'AMRAP' | 'EMOM' | 'For Time' | 'Strength' | 'Skill';
type Scale = 'Rx' | 'Scaled' | 'Beginner';

interface Movement {
  name: string;
  reps: string;
}

const MOVEMENT_LIBRARY = [
  'Thrusters', 'Pull-ups', 'Burpees', 'Box Jumps', 'Wall Balls',
  'Power Cleans', 'Clean & Jerk', 'Snatch', 'Back Squat', 'Front Squat',
  'Deadlift', 'Push Press', 'Toes to Bar', 'Double Unders', 'Row',
  'Bike', 'Run', 'HSPU', 'Muscle-ups', 'KB Swings',
];

const VoltaCoachWod: React.FC = () => {
  const { navigate } = useNav();
  const [type, setType] = useState<WodType>('AMRAP');
  const [duration, setDuration] = useState('20');
  const [scale, setScale] = useState<Scale>('Rx');
  const [movements, setMovements] = useState<Movement[]>([
    { name: 'Power Cleans', reps: '5 @ 60kg' },
    { name: 'Pull-ups', reps: '10' },
    { name: 'Box Jumps', reps: '15 @ 24"' },
  ]);
  const [showLibrary, setShowLibrary] = useState(false);

  const addMovement = (name: string) => {
    setMovements([...movements, { name, reps: '10' }]);
    setShowLibrary(false);
  };

  const removeMovement = (i: number) => setMovements(movements.filter((_, idx) => idx !== i));

  const updateMovementReps = (i: number, reps: string) => {
    setMovements(movements.map((m, idx) => idx === i ? { ...m, reps } : m));
  };

  const intensityScore = type === 'AMRAP' || type === 'For Time' ? 5 : type === 'EMOM' ? 4 : type === 'Strength' ? 3 : 2;

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 200px)', color: C.text }}>

      {/* HEADER */}
      <div style={{ padding: '48px 20px 12px' }}>
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '.08em' }}>COACH · WOD BUILDER</p>
        <h1 style={{ fontSize: 21, fontWeight: 900, color: C.text, letterSpacing: '-.02em', marginTop: 2 }}>
          Planificador de WOD
        </h1>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* WOD TYPE */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
          Tipo de WOD
        </p>
        <div className="scroll-x-no-bar" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 18 }}>
          {(['AMRAP', 'EMOM', 'For Time', 'Strength', 'Skill'] as WodType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 12,
                background: type === t ? C.cyan : C.surface,
                color: type === t ? '#07070F' : C.text,
                border: `1px solid ${type === t ? C.cyan : C.line}`,
                fontSize: 11, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{t}</button>
          ))}
        </div>

        {/* DURATION + SCALE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              {type === 'Strength' || type === 'Skill' ? 'Sets' : 'Duración (min)'}
            </p>
            <input
              type="number"
              inputMode="numeric"
              min={type === 'Strength' || type === 'Skill' ? 1 : 1}
              max={type === 'Strength' || type === 'Skill' ? 20 : 60}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onFocus={(e) => { e.target.select(); }}
              style={{
                width: '100%', padding: '12px',
                background: 'rgba(0,229,255,0.06)',
                border: `2px solid ${C.cyan}55`,
                borderRadius: 12, fontSize: 18, fontWeight: 800, color: C.text,
                fontFamily: 'inherit', textAlign: 'center', outline: 'none',
                cursor: 'text',
              }}
              aria-label={type === 'Strength' || type === 'Skill' ? 'Cantidad de sets' : 'Duración en minutos'}
            />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Escala default
            </p>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12 }}>
              {(['Rx', 'Scaled', 'Beginner'] as Scale[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 9,
                    background: scale === s ? C.cyan : 'transparent',
                    color: scale === s ? '#07070F' : C.muted,
                    border: 'none', fontSize: 10, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* MOVIMIENTOS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted }}>
            Movimientos · {movements.length}
          </p>
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            style={{
              fontSize: 11, fontWeight: 800, color: C.cyan,
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{showLibrary ? 'Cerrar' : '+ Agregar'}</button>
        </div>

        {showLibrary && (
          <div style={{
            background: C.surface2,
            border: `1px solid ${C.line}`,
            borderRadius: 12, padding: 10, marginBottom: 12,
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {MOVEMENT_LIBRARY.map(m => (
              <button
                key={m}
                onClick={() => addMovement(m)}
                style={{
                  padding: '6px 10px', borderRadius: 10,
                  background: 'rgba(0,229,255,0.08)', color: C.cyan,
                  border: '1px solid rgba(0,229,255,0.2)',
                  fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >+ {m}</button>
            ))}
          </div>
        )}

        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
          {movements.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderBottom: i < movements.length - 1 ? `1px solid ${C.line}` : 'none',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: C.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: C.cyan,
                flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.name}</p>
                <input
                  value={m.reps}
                  onChange={(e) => updateMovementReps(i, e.target.value)}
                  style={{
                    width: '100%', padding: '4px 0',
                    background: 'transparent', border: 'none',
                    fontSize: 11, color: C.cyan,
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`¿Eliminar movimiento "${m.name || 'sin nombre'}" del WOD?`)) {
                    removeMovement(i);
                  }
                }}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(255,61,0,0.08)', color: C.red,
                  border: '1px solid rgba(255,61,0,0.2)',
                  cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                }}
              >×</button>
            </div>
          ))}
          {movements.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 11 }}>
              Sin movimientos. Tap "+ Agregar" para empezar.
            </div>
          )}
        </div>

        {/* PREVIEW */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
          Preview · Lo que verá el atleta
        </p>
        <div style={{
          background: 'rgba(0,229,255,0.04)',
          border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: 14, padding: 14, marginBottom: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: C.cyan }}>{type} {duration}{type === 'Strength' || type === 'Skill' ? ' sets' : 'min'}</p>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((x) => (
                <div key={x} style={{
                  width: 4, height: 12, borderRadius: 1,
                  background: x <= intensityScore ? (intensityScore >= 4 ? C.red : intensityScore >= 3 ? C.amber : C.cyan) : C.line,
                }} />
              ))}
            </div>
          </div>
          {movements.length === 0 ? (
            <p style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>Agregá movimientos…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {movements.map((m, i) => (
                <p key={i} style={{ fontSize: 12, color: C.text }}>
                  <span style={{ color: C.cyan, fontWeight: 700 }}>{m.reps}</span> {m.name}
                </p>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: C.muted }}>Escala: <strong style={{ color: C.cyan }}>{scale}</strong></span>
            <span style={{ fontSize: 10, color: C.muted }}>{movements.length} mov · Intensidad {intensityScore}/5</span>
          </div>
        </div>

      </div>

      {/* FOOTER (sticky con backdrop para evitar overlay con preview) */}
      <div style={{
        position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)', left: 0, right: 0, zIndex: 40,
        padding: '14px 16px 12px',
        background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg} 65%, transparent 100%)`,
        backdropFilter: 'blur(8px)',
        display: 'flex', gap: 8,
      }}>
        <button
          onClick={() => navigate('VOLTA_COACH')}
          style={{
            flex: 1, padding: '13px 0', borderRadius: 14,
            background: C.surface2,
            color: C.muted, border: `1px solid ${C.line}`,
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Borrador</button>
        <button
          onClick={() => navigate('VOLTA_COACH')}
          style={{
            flex: 2, padding: '13px 0', borderRadius: 14,
            background: C.cyan, color: '#07070F',
            border: 'none',
            fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(0,229,255,.25)',
          }}
        >Publicar al box</button>
      </div>

      <WiseAssistant context="Coach · WOD Builder" bottomOffset={170} />
    </div>
  );
};

export default VoltaCoachWod;

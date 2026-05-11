import React, { useState, useEffect } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

interface SetLog {
  weight: number;
  reps: number;
  result: 'completed' | 'failed';
}

interface ExerciseDef {
  name: string;
  targetSets: number;
  targetReps: number;
  pct: number;
  max: number;
  coachNote: string;
}

const ActiveSession: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();

  // Build exercises from athlete maxes
  const exercises: ExerciseDef[] = athlete ? [
    { name: 'Arrancada',          targetSets: 4, targetReps: 2, pct: 0.85, max: athlete.maxes.snatch,       coachNote: 'Mantené el pecho alto en el catch. No te precipites en la subida.' },
    { name: 'Dos Tiempos',        targetSets: 4, targetReps: 2, pct: 0.80, max: athlete.maxes.jerk,         coachNote: 'Dip vertical, dirige los codos rápido. Sin perder el eje.' },
    { name: 'Sentadilla Frontal', targetSets: 4, targetReps: 4, pct: 0.75, max: athlete.maxes.front_squat,  coachNote: 'Codos arriba, mantén la barra alta en hombros.' },
  ] : [];

  const [exIdx, setExIdx] = useState(0);
  const [logs, setLogs] = useState<Record<number, SetLog[]>>({});
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [seconds, setSeconds] = useState(0);

  // Crono
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const current = exercises[exIdx];
  const currentLogs = logs[exIdx] ?? [];
  const setNumber = currentLogs.length + 1;
  const targetWeight = current ? Math.round(current.max * current.pct) : 0;

  // Auto-fill targets when changing exercise
  useEffect(() => {
    if (!current) return;
    setWeight(String(targetWeight));
    setReps(String(current.targetReps));
  }, [exIdx, current, targetWeight]);

  if (!athlete || !current) {
    return (
      <div style={{ background: 'var(--bg)', padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        No hay sesión activa.
      </div>
    );
  }

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  const logSet = (result: 'completed' | 'failed') => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    if (w === 0 || r === 0) return;
    setLogs(prev => ({
      ...prev,
      [exIdx]: [...(prev[exIdx] ?? []), { weight: w, reps: r, result }],
    }));
    setWeight(String(targetWeight));
    setReps(String(current.targetReps));
  };

  const goNextExercise = () => {
    if (exIdx < exercises.length - 1) setExIdx(exIdx + 1);
    else navigate('VICTORY');
  };

  const goPrevExercise = () => {
    if (exIdx > 0) setExIdx(exIdx - 1);
  };

  const setsDone = currentLogs.filter(l => l.result === 'completed').length;
  const allDone = setsDone >= current.targetSets;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 200 }}>

      {/* HEADER */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '52px 20px 14px',
        background: 'rgba(7,7,15,0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{current.name}</p>
            <p style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, letterSpacing: '.08em' }}>
              Bloque {exIdx + 1}/{exercises.length} · Serie {Math.min(setNumber, current.targetSets)}/{current.targetSets}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '.08em' }}>CRONO</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
            {mm}:{ss}
          </p>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {Array.from({ length: current.targetSets }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 8, borderRadius: 4,
                background: i < setsDone ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                boxShadow: i < setsDone ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                transition: 'background .3s ease, box-shadow .3s ease',
              }}
            />
          ))}
        </div>

        {/* Coach note */}
        <div style={{
          background: 'rgba(34,197,94,0.05)',
          border: '1px solid rgba(34,197,94,0.18)',
          borderRadius: 14, padding: 12, marginBottom: 20,
        }}>
          <p style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--primary)' }}>Coach: </strong>
            {current.coachNote}
          </p>
        </div>

        {/* Logging */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Logging
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 10,
              background: 'var(--surface)', color: 'var(--primary)',
              border: '1px solid var(--card-border)',
            }}>
              Target {targetWeight}kg · {current.targetReps}r · {Math.round(current.pct * 100)}% 1RM
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Peso (kg)
              </p>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                style={{
                  width: '100%', padding: '14px 12px',
                  background: 'var(--surface)', border: '1px solid var(--card-border)',
                  borderRadius: 12, fontSize: 18, fontWeight: 800, color: 'var(--text)',
                  fontFamily: 'inherit', textAlign: 'center', outline: 'none',
                }}
              />
            </div>
            <div>
              <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Reps
              </p>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                style={{
                  width: '100%', padding: '14px 12px',
                  background: 'var(--surface)', border: '1px solid var(--card-border)',
                  borderRadius: 12, fontSize: 18, fontWeight: 800, color: 'var(--text)',
                  fontFamily: 'inherit', textAlign: 'center', outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => logSet('failed')}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Fallo</button>
            <button
              onClick={() => logSet('completed')}
              style={{
                flex: 2, padding: '12px 0', borderRadius: 12,
                background: 'var(--cta-bg)', color: 'var(--cta-text)',
                border: 'none',
                fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Completar serie</button>
          </div>
        </div>

        {/* History */}
        {currentLogs.length > 0 && (
          <>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Historial · {current.name}
            </p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              {currentLogs.map((log, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: i < currentLogs.length - 1 ? '1px solid var(--card-border)' : 'none',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '.06em' }}>
                    Set {i + 1}
                  </span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {log.weight} kg
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: log.result === 'completed' ? 'var(--primary)' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                      {log.reps} reps
                    </span>
                    <span style={{ fontSize: 14 }}>
                      {log.result === 'completed' ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        position: 'absolute', bottom: 84, left: 16, right: 16, zIndex: 40,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {allDone ? (
          <button
            onClick={goNextExercise}
            style={{
              padding: '14px 0', borderRadius: 14,
              background: 'linear-gradient(135deg, #F59E0B, #B8860B)',
              color: '#07070F', border: 'none',
              fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(245,158,11,0.3)',
            }}
          >
            {exIdx < exercises.length - 1 ? 'Siguiente ejercicio →' : 'Finalizar sesión 🏆'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={goPrevExercise}
              disabled={exIdx === 0}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--card-border)',
                fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: exIdx === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: exIdx === 0 ? 0.4 : 1,
              }}
            >← Anterior</button>
            <button
              onClick={() => navigate('VICTORY')}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
                color: 'var(--text)',
                border: '1px solid var(--card-border)',
                fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Terminar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSession;

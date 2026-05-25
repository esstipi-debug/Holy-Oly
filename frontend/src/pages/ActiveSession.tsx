import React, { useState, useEffect } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

interface SetLog {
  weight: number;
  reps: number;
  result: 'completed' | 'failed';
}

interface WarmupSet {
  pct: number;        // % de 1RM
  reps: number;
  note?: string;      // ej. "Barra vacía", "Técnica"
}

interface ExerciseDef {
  name: string;
  targetSets: number;
  targetReps: number;
  pct: number;
  max: number;
  coachNote: string;
  /** Sets de calentamiento técnico antes de los sets de trabajo. */
  warmupSets: WarmupSet[];
}

/** Redondea al múltiplo de 2.5 kg más cercano (resolución típica de discos). */
const roundToPlate = (kg: number) => Math.round(kg / 2.5) * 2.5;

const ActiveSession: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();

  // Build exercises from athlete maxes
  // Olympic lifts: ramp-up técnico extendido (4 sets pre-trabajo).
  // Accessory: ramp-up corto (2 sets).
  const OLYMPIC_RAMPUP: WarmupSet[] = [
    { pct: 0,    reps: 5, note: 'Barra vacía · técnica' },
    { pct: 0.40, reps: 3 },
    { pct: 0.55, reps: 2 },
    { pct: 0.70, reps: 1 },
  ];
  const ACCESSORY_RAMPUP: WarmupSet[] = [
    { pct: 0.40, reps: 5 },
    { pct: 0.60, reps: 3 },
  ];

  const exercises: ExerciseDef[] = athlete ? [
    { name: 'Arrancada',          targetSets: 4, targetReps: 2, pct: 0.85, max: athlete.maxes.snatch,       coachNote: 'Mantené el pecho alto en el catch. No te precipites en la subida.', warmupSets: OLYMPIC_RAMPUP },
    { name: 'Dos Tiempos',        targetSets: 4, targetReps: 2, pct: 0.80, max: athlete.maxes.jerk,         coachNote: 'Dip vertical, dirige los codos rápido. Sin perder el eje.',           warmupSets: OLYMPIC_RAMPUP },
    { name: 'Sentadilla Frontal', targetSets: 4, targetReps: 4, pct: 0.75, max: athlete.maxes.front_squat,  coachNote: 'Codos arriba, mantén la barra alta en hombros.',                       warmupSets: ACCESSORY_RAMPUP },
  ] : [];

  const [exIdx, setExIdx] = useState(0);
  const [logs, setLogs] = useState<Record<number, SetLog[]>>({});
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [seconds, setSeconds] = useState(0);
  /** Tracking de warmup sets completados por ejercicio. */
  const [warmupDone, setWarmupDone] = useState<Record<number, Set<number>>>({});

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

  // Warmup helpers
  const currentWarmupDone = warmupDone[exIdx] ?? new Set<number>();
  const warmupComplete = currentWarmupDone.size >= current.warmupSets.length;
  const toggleWarmup = (i: number) => {
    setWarmupDone(prev => {
      const set = new Set(prev[exIdx] ?? []);
      if (set.has(i)) set.delete(i);
      else set.add(i);
      return { ...prev, [exIdx]: set };
    });
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: allDone ? 180 : 100 }}>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '.08em' }}>CRONO</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
              {mm}:{ss}
            </p>
          </div>
          {/* Mini nav (← anterior / terminar) en header para no solapar logging buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 6 }}>
            <button
              onClick={goPrevExercise}
              disabled={exIdx === 0}
              title="Ejercicio anterior"
              style={{
                padding: '4px 8px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-secondary)',
                fontSize: 9, fontWeight: 800, letterSpacing: '.04em',
                cursor: exIdx === 0 ? 'not-allowed' : 'pointer',
                opacity: exIdx === 0 ? 0.4 : 1, fontFamily: 'inherit',
              }}
            >← Ant</button>
            <button
              onClick={() => navigate('VICTORY')}
              title="Terminar sesión"
              style={{
                padding: '4px 8px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
                fontSize: 9, fontWeight: 800, letterSpacing: '.04em',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Fin</button>
          </div>
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

        {/* RAMP-UP TÉCNICO (calentamiento de pesos) */}
        {current.warmupSets.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Ramp-up técnico
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '3px 8px', borderRadius: 10,
                background: warmupComplete ? 'rgba(34,197,94,0.12)' : 'var(--surface)',
                color: warmupComplete ? '#22C55E' : 'var(--text-secondary)',
                border: `1px solid ${warmupComplete ? 'rgba(34,197,94,0.3)' : 'var(--card-border)'}`,
              }}>
                {currentWarmupDone.size}/{current.warmupSets.length} {warmupComplete ? '✓' : ''}
              </span>
            </div>

            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--card-border)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              {current.warmupSets.map((ws, i) => {
                const w = ws.pct === 0 ? 20 : roundToPlate(current.max * ws.pct); // 20kg = barra olímpica vacía
                const done = currentWarmupDone.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleWarmup(i)}
                    style={{
                      width: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderBottom: i < current.warmupSets.length - 1 ? '1px solid var(--card-border)' : 'none',
                      background: done ? 'rgba(34,197,94,0.06)' : 'transparent',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: done ? '#22C55E' : 'transparent',
                        border: `2px solid ${done ? '#22C55E' : 'var(--card-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#07070F', fontSize: 12, fontWeight: 900,
                      }}>{done ? '✓' : ''}</div>
                      <div>
                        <p style={{
                          fontSize: 11, fontWeight: 700,
                          color: done ? 'var(--text-secondary)' : 'var(--text)',
                          textDecoration: done ? 'line-through' : 'none',
                        }}>
                          {ws.pct === 0 ? 'Barra vacía' : `${Math.round(ws.pct * 100)}% 1RM`}
                          {ws.note && ws.pct > 0 && <span style={{ color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 6 }}>· {ws.note}</span>}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {w} kg
                      </p>
                      <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.04em' }}>
                        × {ws.reps} reps
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {!warmupComplete && (
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                Completá el ramp-up antes de empezar las series de trabajo.
              </p>
            )}
          </div>
        )}

        {/* Logging */}
        <div style={{ marginBottom: 20, opacity: warmupComplete ? 1 : 0.55, transition: 'opacity .25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Series de trabajo
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
              disabled={!warmupComplete}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: warmupComplete ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              }}
            >Fallo</button>
            <button
              onClick={() => logSet('completed')}
              disabled={!warmupComplete}
              style={{
                flex: 2, padding: '12px 0', borderRadius: 12,
                background: 'var(--cta-bg)', color: 'var(--cta-text)',
                border: 'none',
                fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: warmupComplete ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
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

      {/* FOOTER · solo aparece cuando todas las series completadas (Siguiente ejercicio) */}
      {allDone && (
        <div style={{
          position: 'absolute', bottom: 76, left: 0, right: 0, zIndex: 40,
          padding: '14px 16px 12px',
          background: 'linear-gradient(to top, var(--bg) 0%, var(--bg) 70%, transparent 100%)',
          backdropFilter: 'blur(8px)',
        }}>
          <button
            onClick={goNextExercise}
            style={{
              width: '100%',
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
        </div>
      )}
    </div>
  );
};

export default ActiveSession;

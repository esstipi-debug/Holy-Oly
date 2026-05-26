import React, { useState, useEffect } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useToast } from '../components/Toast';

/**
 * Mapea nombre de ejercicio (UI) → clave de `athlete.maxes` y celebration id.
 * Retorna null si no es un lift trackeable para PR.
 */
function exerciseToPRTarget(name: string, maxes: { snatch: number; clean: number; jerk: number; back_squat: number; front_squat: number }):
  | { maxKey: 'snatch' | 'clean' | 'jerk' | 'back_squat' | 'front_squat'; max: number; celebrationId: 'pr_snatch' | 'pr_clean'; label: string }
  | null {
  switch (name) {
    case 'Arrancada':
    case 'Snatch':
      return { maxKey: 'snatch', max: maxes.snatch, celebrationId: 'pr_snatch', label: 'Snatch' };
    case 'Clean & Jerk': {
      // Comparar contra el mayor de los dos (clean o jerk)
      const useJerk = maxes.jerk >= maxes.clean;
      return {
        maxKey: useJerk ? 'jerk' : 'clean',
        max: useJerk ? maxes.jerk : maxes.clean,
        celebrationId: 'pr_clean',
        label: 'Clean & Jerk',
      };
    }
    case 'Envión':
      return { maxKey: 'jerk', max: maxes.jerk, celebrationId: 'pr_clean', label: 'Envión' };
    case 'Sentadilla Frontal':
      return { maxKey: 'front_squat', max: maxes.front_squat, celebrationId: 'pr_clean', label: 'Front Squat' };
    case 'Sentadilla':
    case 'Back Squat':
      return { maxKey: 'back_squat', max: maxes.back_squat, celebrationId: 'pr_clean', label: 'Back Squat' };
    default:
      return null;
  }
}

interface SetLog {
  weight: number;
  reps: number;
  result: 'completed' | 'failed';
  edited_at?: string;
  /** Si este set disparó un PR (para idempotencia al anular). */
  pr_celebration_id?: 'pr_snatch' | 'pr_clean';
}

/** Formato corto en español: "vie 23 may". */
const formatShortDate = (iso: string): string => {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
  } catch {
    return iso;
  }
};

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
  const { showToast } = useToast();
  /** PRs detectados en esta sesión, para evitar disparar la misma celebration dos veces. */
  const [prFiredFor, setPrFiredFor] = useState<Set<string>>(new Set());

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
    { name: 'Clean & Jerk',       targetSets: 4, targetReps: 2, pct: 0.80, max: athlete.maxes.jerk,         coachNote: 'Dip vertical, dirige los codos rápido. Sin perder el eje.',           warmupSets: OLYMPIC_RAMPUP },
    { name: 'Sentadilla Frontal', targetSets: 4, targetReps: 4, pct: 0.75, max: athlete.maxes.front_squat,  coachNote: 'Codos arriba, mantén la barra alta en hombros.',                       warmupSets: ACCESSORY_RAMPUP },
  ] : [];

  const [exIdx, setExIdx] = useState(0);
  const [logs, setLogs] = useState<Record<number, SetLog[]>>({});
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [seconds, setSeconds] = useState(0);
  /** Tracking de warmup sets completados por ejercicio. */
  const [warmupDone, setWarmupDone] = useState<Record<number, Set<number>>>({});
  /** Calentamientos que el atleta saltó explícitamente (persistido en summary). */
  const [skippedWarmup, setSkippedWarmup] = useState<Record<number, boolean>>({});
  /** Set actualmente en modo edición (inline). Formato: "exIdx:setIdx" o null. */
  const [editingSet, setEditingSet] = useState<string | null>(null);
  /** Set con menú de acciones abierto (inline toggle). Formato: "exIdx:setIdx" o null. */
  const [setMenuOpen, setSetMenuOpen] = useState<string | null>(null);
  /** Valores temporales del editor inline. */
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  /** Fechas del entreno (banner fuera-de-fecha). */
  const todayISO = new Date().toISOString().slice(0, 10);
  const [plannedDate] = useState<string>(() => {
    try {
      return localStorage.getItem('active_session:planned_date') || todayISO;
    } catch {
      return todayISO;
    }
  });
  const [bannerVisible, setBannerVisible] = useState(true);
  const outOfDate = plannedDate !== todayISO;

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
    // PR detection (computado antes para poder marcar el set con pr_celebration_id)
    let prCelebrationId: 'pr_snatch' | 'pr_clean' | undefined;
    let prDelta = 0;
    if (result === 'completed' && athlete && r >= 1) {
      const pr = exerciseToPRTarget(current.name, athlete.maxes);
      if (pr && w > pr.max && !prFiredFor.has(pr.celebrationId)) {
        prCelebrationId = pr.celebrationId;
        prDelta = Math.round((w - pr.max) * 10) / 10;
      }
    }

    let inserted = false;
    // Guard race-condition-safe: lee dentro del updater, no del closure.
    // Sin esto, clicks rápidos (programatic o doble-tap) en el mismo frame
    // bypasean el límite porque todos leen el mismo `logs` stale.
    setLogs(prev => {
      const existing = prev[exIdx] ?? [];
      const completedSoFar = existing.filter(l => l.result === 'completed').length;
      if (result === 'completed' && completedSoFar >= current.targetSets) {
        return prev; // no-op
      }
      inserted = true;
      const newSet: SetLog = { weight: w, reps: r, result };
      if (prCelebrationId) newSet.pr_celebration_id = prCelebrationId;
      return { ...prev, [exIdx]: [...existing, newSet] };
    });
    if (!inserted) return;
    setWeight(String(targetWeight));
    setReps(String(current.targetReps));

    if (prCelebrationId && athlete) {
      const pr = exerciseToPRTarget(current.name, athlete.maxes)!;
      setPrFiredFor(prev => new Set(prev).add(prCelebrationId!));
      try {
        localStorage.setItem('social:preferred_celebration', prCelebrationId);
        localStorage.setItem('social:preferred_variant', 'stadium');
        localStorage.setItem('social:pr_value', String(w));
        localStorage.setItem('social:pr_delta', String(prDelta));
      } catch { /* ignore */ }
      showToast({
        message: `🔥 NUEVO PR · ${pr.label} ${w}kg (+${prDelta}kg)`,
        variant: 'success',
        duration: 3500,
      });
    }
  };

  /** Toggle completed ↔ failed sobre un set ya logueado. */
  const toggleSetResult = (setIdx: number) => {
    setLogs(prev => {
      const existing = prev[exIdx] ?? [];
      if (setIdx < 0 || setIdx >= existing.length) return prev;
      const next = existing.slice();
      const old = next[setIdx];
      next[setIdx] = {
        ...old,
        result: old.result === 'completed' ? 'failed' : 'completed',
        edited_at: new Date().toISOString(),
      };
      return { ...prev, [exIdx]: next };
    });
    setSetMenuOpen(null);
  };

  /** Comenzar edición inline de peso/reps. */
  const beginEditSet = (setIdx: number) => {
    const existing = logs[exIdx] ?? [];
    const s = existing[setIdx];
    if (!s) return;
    setEditWeight(String(s.weight));
    setEditReps(String(s.reps));
    setEditingSet(`${exIdx}:${setIdx}`);
    setSetMenuOpen(null);
  };

  const commitEditSet = (setIdx: number) => {
    const w = parseFloat(editWeight) || 0;
    const r = parseInt(editReps) || 0;
    if (w === 0 || r === 0) {
      setEditingSet(null);
      return;
    }
    setLogs(prev => {
      const existing = prev[exIdx] ?? [];
      if (setIdx < 0 || setIdx >= existing.length) return prev;
      const next = existing.slice();
      next[setIdx] = {
        ...next[setIdx],
        weight: w,
        reps: r,
        edited_at: new Date().toISOString(),
      };
      return { ...prev, [exIdx]: next };
    });
    setEditingSet(null);
  };

  /** Anula (elimina) un set. Si era el set que disparó un PR, limpia el localStorage social:* y libera el guard. */
  const deleteSet = (setIdx: number) => {
    const existing = logs[exIdx] ?? [];
    const target = existing[setIdx];
    if (!target) return;
    if (!window.confirm('¿Eliminar este set? Esta acción no se puede deshacer.')) return;

    setLogs(prev => {
      const ex = prev[exIdx] ?? [];
      if (setIdx < 0 || setIdx >= ex.length) return prev;
      return { ...prev, [exIdx]: ex.filter((_, i) => i !== setIdx) };
    });

    // Si el set anulado había disparado un PR, limpiar idempotentemente.
    if (target.pr_celebration_id) {
      setPrFiredFor(prev => {
        const next = new Set(prev);
        next.delete(target.pr_celebration_id!);
        return next;
      });
      try {
        const stored = localStorage.getItem('social:preferred_celebration');
        if (stored === target.pr_celebration_id) {
          localStorage.removeItem('social:preferred_celebration');
          localStorage.removeItem('social:preferred_variant');
          localStorage.removeItem('social:pr_value');
          localStorage.removeItem('social:pr_delta');
        }
      } catch { /* ignore */ }
    }
    setSetMenuOpen(null);
    setEditingSet(null);
  };

  /** Saltar el ramp-up técnico: marca todos los warmup sets como done. */
  const skipWarmup = () => {
    if (!window.confirm('¿Saltar el ramp-up? El coach lo recomienda hacer.')) return;
    setWarmupDone(prev => {
      const all = new Set<number>();
      for (let i = 0; i < current.warmupSets.length; i++) all.add(i);
      return { ...prev, [exIdx]: all };
    });
    setSkippedWarmup(prev => ({ ...prev, [exIdx]: true }));
  };

  /**
   * Persiste el resumen de la sesión a localStorage con métricas pre-calculadas
   * para que VictoryScreen las consuma sin replicar lógica.
   *
   * IMR (Intensidad Media Relativa) = avg(weight / max_for_lift) * 100,
   * promediado sobre los sets COMPLETADOS de toda la sesión. Sets fallidos
   * no cuentan (no son trabajo efectivo).
   *
   * Tonelaje = Σ weight * reps (solo sets completados).
   *
   * Distribución por zona: cada set completado se asigna a una zona según
   * % 1RM (Liviano <60 · Técnico 60-75 · Fuerza 75-90 · Máximo >90).
   */
  const persistSessionSummary = () => {
    const ZONE_BOUNDS = { liviano: [0, 60], tecnico: [60, 75], fuerza: [75, 90], maximo: [90, Infinity] } as const;
    const summaryExercises = exercises.map((ex, i) => {
      const exLogs = logs[i] ?? [];
      const sets_completed = exLogs.filter(l => l.result === 'completed').length;
      const sets_failed = exLogs.filter(l => l.result === 'failed').length;
      return {
        name: ex.name,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        pct: Math.round(ex.pct * 100),
        max: ex.max,
        sets_completed,
        sets_failed,
        skipped_warmup: !!skippedWarmup[i],
        sets: exLogs.map(l => ({
          weight: l.weight,
          reps: l.reps,
          result: l.result,
          ...(l.edited_at ? { edited_at: l.edited_at } : {}),
        })),
      };
    });

    let total_tonelaje = 0;
    let imrSum = 0;
    let imrCount = 0;
    const zone_distribution = { liviano: 0, tecnico: 0, fuerza: 0, maximo: 0 };

    exercises.forEach((ex, i) => {
      const exLogs = logs[i] ?? [];
      exLogs.forEach(l => {
        if (l.result !== 'completed') return;
        total_tonelaje += l.weight * l.reps;
        if (ex.max > 0) {
          const pct = (l.weight / ex.max) * 100;
          imrSum += pct;
          imrCount += 1;
          if (pct < ZONE_BOUNDS.liviano[1]) zone_distribution.liviano += 1;
          else if (pct < ZONE_BOUNDS.tecnico[1]) zone_distribution.tecnico += 1;
          else if (pct < ZONE_BOUNDS.fuerza[1]) zone_distribution.fuerza += 1;
          else zone_distribution.maximo += 1;
        }
      });
    });

    const imr_pct = imrCount > 0 ? Math.round(imrSum / imrCount) : 0;

    // PRs detectados: leídos del localStorage social:* que setea logSet
    const prs_detected: Array<{ label: string; weight: number; delta: number }> = [];
    try {
      const cel = localStorage.getItem('social:preferred_celebration');
      const w = parseFloat(localStorage.getItem('social:pr_value') || '0');
      const d = parseFloat(localStorage.getItem('social:pr_delta') || '0');
      if (cel && w > 0) {
        const label = cel === 'pr_snatch' ? 'Snatch' : cel === 'pr_clean' ? 'Clean & Jerk' : 'PR';
        prs_detected.push({ label, weight: w, delta: d });
      }
    } catch { /* ignore */ }

    const summary = {
      date: new Date().toISOString(),
      planned_date: plannedDate,
      actual_date: todayISO,
      product: 'holy-oly' as const,
      duration_seconds: seconds,
      exercises: summaryExercises,
      total_tonelaje: Math.round(total_tonelaje),
      imr_pct,
      zone_distribution,
      prs_detected,
    };

    try {
      localStorage.setItem('last_session:summary', JSON.stringify(summary));
      localStorage.setItem(`active_session:${Date.now()}`, JSON.stringify(summary));
    } catch { /* ignore quota */ }

    return summary;
  };

  const finishSession = () => {
    const summary = persistSessionSummary();
    const mmFin = Math.floor(summary.duration_seconds / 60).toString().padStart(2, '0');
    const ssFin = (summary.duration_seconds % 60).toString().padStart(2, '0');
    showToast({
      message: `✓ Sesión guardada · ${summary.total_tonelaje.toLocaleString('es')}kg en ${mmFin}:${ssFin}`,
      variant: 'success',
      duration: 3000,
    });
    navigate('VICTORY');
  };

  const goNextExercise = () => {
    if (exIdx < exercises.length - 1) setExIdx(exIdx + 1);
    else finishSession();
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

  const showBanner = outOfDate && bannerVisible;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: allDone ? 180 : 100 }}>

      {/* BANNER · entrenando fuera de fecha */}
      {showBanner && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 11,
          height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
          background: 'rgba(245,158,11,0.10)',
          borderBottom: '1px solid rgba(245,158,11,0.30)',
          color: '#F59E0B',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: '.01em', overflow: 'hidden' }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Entrenando fuera de fecha · esperado: {formatShortDate(plannedDate)} · hoy: {formatShortDate(todayISO)}
            </span>
          </div>
          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Cerrar banner"
            style={{
              background: 'transparent', border: 'none',
              color: '#F59E0B', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', padding: '0 6px', fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >×</button>
        </div>
      )}

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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.01em' }}>{current.name}</p>
              <p style={{
                fontSize: 15, fontWeight: 900, color: 'var(--primary)',
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em',
              }}>
                {current.targetSets}×{current.targetReps}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 800,
                padding: '2px 6px', borderRadius: 6,
                background: 'rgba(245,158,11,0.10)', color: '#F59E0B',
                border: '1px solid rgba(245,158,11,0.20)',
              }}>{Math.round(current.pct * 100)}%</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.06em', marginTop: 4 }}>
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
              onClick={finishSession}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!warmupComplete && (
                  <button
                    onClick={skipWarmup}
                    style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--card-border)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      letterSpacing: '.02em',
                    }}
                  >⏩ Saltar calentamiento</button>
                )}
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

          {allDone ? (
            /* Ejercicio terminado · prescripción cumplida · invitar a avanzar */
            <div style={{
              padding: '16px',
              background: 'rgba(34,197,94,0.10)',
              border: '1px solid rgba(34,197,94,0.40)',
              borderRadius: 14, textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', letterSpacing: '.06em', textTransform: 'uppercase', margin: 0 }}>
                ✓ {current.targetSets}×{current.targetReps} completado
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '4px 0 12px' }}>
                Prescripción cumplida · pasá al siguiente ejercicio
              </p>
              <button
                onClick={goNextExercise}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12,
                  background: 'var(--cta-bg)', color: 'var(--cta-text)',
                  border: 'none',
                  fontSize: 13, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {exIdx < exercises.length - 1 ? 'Siguiente ejercicio →' : 'Finalizar sesión 🏆'}
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {/* History */}
        {currentLogs.length > 0 && (
          <>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Historial · {current.name}
            </p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              {currentLogs.map((log, i) => {
                const rowKey = `${exIdx}:${i}`;
                const isEditing = editingSet === rowKey;
                const isMenuOpen = setMenuOpen === rowKey;
                const isEdited = !!log.edited_at;
                return (
                  <div key={i} style={{
                    borderBottom: i < currentLogs.length - 1 ? '1px solid var(--card-border)' : 'none',
                  }}>
                    {isEditing ? (
                      /* Editor inline · peso + reps + confirmar/cancelar */
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '.06em' }}>
                            Editar Set {i + 1}
                          </span>
                          <button
                            onClick={() => setEditingSet(null)}
                            style={{
                              background: 'transparent', border: 'none',
                              color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700,
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >Cancelar</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input
                            type="number"
                            step="0.5"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            placeholder="kg"
                            style={{
                              padding: '10px 8px', background: 'var(--bg)',
                              border: '1px solid var(--card-border)', borderRadius: 10,
                              fontSize: 14, fontWeight: 800, color: 'var(--text)',
                              fontFamily: 'inherit', textAlign: 'center', outline: 'none',
                            }}
                          />
                          <input
                            type="number"
                            value={editReps}
                            onChange={(e) => setEditReps(e.target.value)}
                            placeholder="reps"
                            style={{
                              padding: '10px 8px', background: 'var(--bg)',
                              border: '1px solid var(--card-border)', borderRadius: 10,
                              fontSize: 14, fontWeight: 800, color: 'var(--text)',
                              fontFamily: 'inherit', textAlign: 'center', outline: 'none',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => toggleSetResult(i)}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 10,
                              background: log.result === 'completed' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.10)',
                              color: log.result === 'completed' ? '#f87171' : 'var(--primary)',
                              border: `1px solid ${log.result === 'completed' ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.30)'}`,
                              fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >{log.result === 'completed' ? '→ Marcar fallo' : '→ Marcar completado'}</button>
                          <button
                            onClick={() => commitEditSet(i)}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 10,
                              background: 'var(--cta-bg)', color: 'var(--cta-text)',
                              border: 'none',
                              fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setSetMenuOpen(isMenuOpen ? null : rowKey)}
                          style={{
                            width: '100%', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 14px',
                            background: isMenuOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
                            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Set {i + 1}
                            {isEdited && (
                              <span style={{
                                fontSize: 8, fontWeight: 800, color: '#F59E0B',
                                background: 'rgba(245,158,11,0.10)', padding: '1px 5px',
                                borderRadius: 4, letterSpacing: '.04em',
                              }}>EDIT</span>
                            )}
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
                        </button>
                        {isMenuOpen && (
                          <div style={{
                            display: 'flex', gap: 6,
                            padding: '0 14px 12px',
                            background: 'rgba(255,255,255,0.02)',
                          }}>
                            <button
                              onClick={() => beginEditSet(i)}
                              style={{
                                flex: 1, padding: '8px 0', borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text)',
                                border: '1px solid var(--card-border)',
                                fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >✏️ Editar</button>
                            <button
                              onClick={() => toggleSetResult(i)}
                              style={{
                                flex: 1, padding: '8px 0', borderRadius: 10,
                                background: log.result === 'completed' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.10)',
                                color: log.result === 'completed' ? '#f87171' : 'var(--primary)',
                                border: `1px solid ${log.result === 'completed' ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.30)'}`,
                                fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >{log.result === 'completed' ? '✗ Fallo' : '✓ Completado'}</button>
                            <button
                              onClick={() => deleteSet(i)}
                              style={{
                                flex: 1, padding: '8px 0', borderRadius: 10,
                                background: 'rgba(239,68,68,0.08)',
                                color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.25)',
                                fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >🗑 Anular</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
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

import React, { useState, useEffect } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useToast } from '../components/Toast';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/active-session.css';

/**
 * Mapea la intensidad relativa (peso / 1RM) de un set a un tier de disco
 * para la visualización de carga. Sigue la semántica de PlateBadge:
 * liviano = verde · técnico = amarillo · fuerza = azul · máximo = rojo.
 * Halterofilia · el disco refleja qué tan pesada es la barra cargada.
 */
const loadToTier = (weight: number, max: number): PlateTier => {
  if (max <= 0) return 'white';
  const pct = (weight / max) * 100;
  if (pct < 50) return 'green';
  if (pct < 70) return 'yellow';
  if (pct < 88) return 'blue';
  return 'red';
};

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
      <div className="as-root">
        <p className="as-empty">No hay sesión activa.</p>
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

  // Tier de disco para la barra cargada del set actual (peso ingresado vs 1RM).
  const currentWeightNum = parseFloat(weight) || 0;
  const loadTier = loadToTier(currentWeightNum, current.max);

  return (
    <div className="as-root">

      {/* BANNER · entrenando fuera de fecha */}
      {showBanner && (
        <div className="as-banner">
          <div className="as-banner-text">
            <span aria-hidden="true">📅</span>
            <span>
              Fuera de fecha · esperado {formatShortDate(plannedDate)} · hoy {formatShortDate(todayISO)}
            </span>
          </div>
          <button
            className="as-banner-close"
            onClick={() => setBannerVisible(false)}
            aria-label="Cerrar banner"
          >×</button>
        </div>
      )}

      {/* HEADER */}
      <div className="as-header">
        <div className="as-head-titles">
          <div className="as-head-row">
            <p className="as-head-name">{current.name}</p>
            <p className="as-head-scheme">{current.targetSets}×{current.targetReps}</p>
            <span className="as-head-pct">{Math.round(current.pct * 100)}%</span>
          </div>
          <p className="as-head-sub">
            Bloque {exIdx + 1}/{exercises.length} · Serie {Math.min(setNumber, current.targetSets)}/{current.targetSets}
          </p>
        </div>
        <div className="as-head-right">
          <div className="as-crono">
            <p className="as-crono-label">CRONO</p>
            <p className="as-crono-value">{mm}:{ss}</p>
          </div>
          {/* Mini nav (← anterior / terminar) en header para no solapar logging buttons */}
          <div className="as-head-nav">
            <button
              className="as-mini-btn"
              onClick={goPrevExercise}
              disabled={exIdx === 0}
              title="Ejercicio anterior"
            >← Ant</button>
            <button
              className="as-mini-btn danger"
              onClick={finishSession}
              title="Terminar sesión"
            >Fin</button>
          </div>
        </div>
      </div>

      <div className="as-body">

        {/* Progress dots */}
        <div className="as-progress">
          {Array.from({ length: current.targetSets }).map((_, i) => (
            <div key={i} className={`dot${i < setsDone ? ' on' : ''}`} />
          ))}
        </div>

        {/* Coach note */}
        <div className="as-coach">
          <p>
            <strong>Coach · </strong>
            {current.coachNote}
          </p>
        </div>

        {/* RAMP-UP TÉCNICO (calentamiento de pesos) */}
        {current.warmupSets.length > 0 && (
          <div>
            <div className="as-section-head">
              <p className="as-eyebrow">Ramp-up técnico</p>
              <div className="as-section-tools">
                {!warmupComplete && (
                  <button className="as-skip-btn" onClick={skipWarmup}>⏩ Saltar</button>
                )}
                <span className={`as-pill${warmupComplete ? ' done' : ''}`}>
                  {currentWarmupDone.size}/{current.warmupSets.length} {warmupComplete ? '✓' : ''}
                </span>
              </div>
            </div>

            <div className="as-list">
              {current.warmupSets.map((ws, i) => {
                const w = ws.pct === 0 ? 20 : roundToPlate(current.max * ws.pct); // 20kg = barra olímpica vacía
                const done = currentWarmupDone.has(i);
                return (
                  <button
                    key={i}
                    className={`as-warmup-row${done ? ' done' : ''}`}
                    onClick={() => toggleWarmup(i)}
                  >
                    <div className="as-warmup-left">
                      <div className="as-check">{done ? '✓' : ''}</div>
                      <p className="as-warmup-label">
                        {ws.pct === 0 ? 'Barra vacía' : `${Math.round(ws.pct * 100)}% 1RM`}
                        {ws.note && ws.pct > 0 && <span className="note"> · {ws.note}</span>}
                      </p>
                    </div>
                    <div className="as-warmup-right">
                      <div className="as-warmup-figs">
                        <p className="as-warmup-kg">{w} kg</p>
                        <p className="as-warmup-reps">× {ws.reps} reps</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!warmupComplete && (
              <p className="as-hint">Completá el ramp-up antes de empezar las series de trabajo.</p>
            )}
          </div>
        )}

        {/* Logging */}
        <div className="as-log" data-locked={!warmupComplete}>
          <div className="as-section-head">
            <p className="as-eyebrow">Series de trabajo</p>
            <span className="as-pill target">
              Target {targetWeight}kg · {current.targetReps}r · {Math.round(current.pct * 100)}%
            </span>
          </div>

          <div className="as-inputs">
            <div>
              <p className="as-field-label">Peso (kg)</p>
              <input
                className="as-input"
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <p className="as-field-label">Reps</p>
              <input
                className="as-input"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
          </div>

          {/* Disco · visualiza la barra cargada del set actual (halterofilia) */}
          {currentWeightNum > 0 && (
            <div className="as-load">
              <span className="as-load-disc" aria-hidden="true">
                <PlateBadge tier={loadTier} size={48} />
              </span>
              <div className="as-load-meta">
                <p className="as-load-kg">Barra cargada · <b>{currentWeightNum} kg</b></p>
                <p className="as-load-sub">
                  {current.max > 0 ? `${Math.round((currentWeightNum / current.max) * 100)}% 1RM` : 'Carga de trabajo'}
                </p>
              </div>
            </div>
          )}

          {allDone ? (
            /* Ejercicio terminado · prescripción cumplida · invitar a avanzar */
            <div className="as-done-card">
              <p className="as-done-title">✓ {current.targetSets}×{current.targetReps} completado</p>
              <p className="as-done-sub">Prescripción cumplida · pasá al siguiente ejercicio</p>
              <button className="as-cta" onClick={goNextExercise}>
                {exIdx < exercises.length - 1 ? 'Siguiente ejercicio →' : 'Finalizar sesión 🏆'}
              </button>
            </div>
          ) : (
          <div className="as-actions">
            <button
              className="as-btn as-btn-fail"
              onClick={() => logSet('failed')}
              disabled={!warmupComplete}
            >Fallo</button>
            <button
              className="as-btn as-btn-done"
              onClick={() => logSet('completed')}
              disabled={!warmupComplete}
            >Completar serie</button>
          </div>
          )}
        </div>

        {/* History */}
        {currentLogs.length > 0 && (
          <div>
            <p className="as-eyebrow" style={{ marginBottom: 10 }}>Historial · {current.name}</p>
            <div className="as-list">
              {currentLogs.map((log, i) => {
                const rowKey = `${exIdx}:${i}`;
                const isEditing = editingSet === rowKey;
                const isMenuOpen = setMenuOpen === rowKey;
                const isEdited = !!log.edited_at;
                const ok = log.result === 'completed';
                return (
                  <div key={i} className="as-history-row">
                    {isEditing ? (
                      /* Editor inline · peso + reps + confirmar/cancelar */
                      <div className="as-editor">
                        <div className="as-editor-head">
                          <span className="as-editor-title">Editar Set {i + 1}</span>
                          <button className="as-editor-cancel" onClick={() => setEditingSet(null)}>Cancelar</button>
                        </div>
                        <div className="as-editor-inputs">
                          <input
                            className="as-editor-input"
                            type="number"
                            step="0.5"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            placeholder="kg"
                          />
                          <input
                            className="as-editor-input"
                            type="number"
                            value={editReps}
                            onChange={(e) => setEditReps(e.target.value)}
                            placeholder="reps"
                          />
                        </div>
                        <div className="as-editor-actions">
                          <button
                            className={`as-act ${ok ? 'toggle-fail' : 'toggle-done'}`}
                            onClick={() => toggleSetResult(i)}
                          >{ok ? '→ Marcar fallo' : '→ Marcar completado'}</button>
                          <button className="as-editor-save" onClick={() => commitEditSet(i)}>Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          className="as-row-toggle"
                          data-open={isMenuOpen}
                          onClick={() => setSetMenuOpen(isMenuOpen ? null : rowKey)}
                        >
                          <span className="as-row-label">
                            Set {i + 1}
                            {isEdited && <span className="as-edit-tag">EDIT</span>}
                          </span>
                          <div className="as-row-figs">
                            <span className="as-row-kg">{log.weight} kg</span>
                            <span className={`as-row-reps ${ok ? 'ok' : 'fail'}`}>{log.reps} reps</span>
                            <span className={`as-row-mark ${ok ? 'ok' : 'fail'}`}>{ok ? '✓' : '✗'}</span>
                          </div>
                        </button>
                        {isMenuOpen && (
                          <div className="as-row-menu">
                            <button className="as-act neutral" onClick={() => beginEditSet(i)}>✏️ Editar</button>
                            <button
                              className={`as-act ${ok ? 'toggle-fail' : 'toggle-done'}`}
                              onClick={() => toggleSetResult(i)}
                            >{ok ? '✗ Fallo' : '✓ Completado'}</button>
                            <button className="as-act delete" onClick={() => deleteSet(i)}>🗑 Anular</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER · solo aparece cuando todas las series completadas (Siguiente ejercicio) */}
      {allDone && (
        <div className="as-footer">
          <button className="as-cta" onClick={goNextExercise}>
            {exIdx < exercises.length - 1 ? 'Siguiente ejercicio →' : 'Finalizar sesión 🏆'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveSession;

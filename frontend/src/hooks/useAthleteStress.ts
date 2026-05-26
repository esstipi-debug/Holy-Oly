import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AthleteProfile } from '../data/athletes';

/**
 * Shape devuelto por POST /v1/stress/calculate (Banister engine).
 * Coincide con StressResult interno de AthleteContext.
 */
export interface StressResult {
  fitness: number;
  fatigue: number;
  readiness: number;            // 0-10
  readiness_category: string;
  cns_score: number | null;
  cns_zone: string | null;
}

/**
 * Calcula localmente un readiness (0-10) si la API falla.
 * Misma fórmula proxy usada históricamente en pantallas del coach.
 */
export function fallbackReadiness(a: AthleteProfile): number {
  return Math.max(0, Math.min(10, ((a.prior_fitness - a.prior_fatigue) / 12 + 0.5) * 10));
}

/**
 * Arma el payload StressInputRequest a partir de un AthleteProfile.
 * Si el atleta no tiene sesiones recientes, usa defaults conservadores
 * para que el engine pueda al menos calcular Banister sobre prior_fitness/fatigue.
 */
function buildStressPayload(a: AthleteProfile) {
  const today = a.sessions_last_7.at(-1);
  return {
    athlete_id: a.id,
    gender: a.gender,
    age: a.age,
    session_load: today?.load ?? 0,
    sleep_hours: today?.sleep_hours ?? 7,
    rpe_reported: today?.rpe_reported || undefined,
    rpe_expected: today?.rpe_expected || undefined,
    completed_sessions: a.sessions_last_7.filter(s => s.completed).length,
    planned_sessions: Math.max(1, a.sessions_last_7.length),
    soreness: today?.soreness ?? 3,
    motivation: today?.motivation ?? 7,
    life_stress: today?.life_stress ?? 3,
    prior_fitness: a.prior_fitness,
    prior_fatigue: a.prior_fatigue,
  };
}

/**
 * Fetch real stress (Banister + CNS) por cada atleta del roster.
 * Mapa por id; loading global mientras alguna está pendiente.
 * Si una request falla → ese atleta queda en null y el caller usa fallback.
 */
export function useRosterStress(roster: AthleteProfile[]) {
  const [stressByAthlete, setStressByAthlete] = useState<Record<string, StressResult>>({});
  const [loading, setLoading] = useState(false);

  // dep stable: ids ordenados. Si el roster muta solo en orden no refetcheamos.
  const idsKey = roster.map(a => a.id).sort().join(',');

  useEffect(() => {
    if (roster.length === 0) {
      setStressByAthlete({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      roster.map(a =>
        api.post<StressResult>('/v1/stress/calculate', buildStressPayload(a))
          .catch(() => null),
      ),
    )
      .then(results => {
        if (cancelled) return;
        const m: Record<string, StressResult> = {};
        roster.forEach((a, i) => {
          const r = results[i];
          if (r) m[a.id] = r;
        });
        setStressByAthlete(m);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return { stressByAthlete, loading };
}

/**
 * Fetch para UN atleta puntual. Útil en deep-dives donde el coach
 * selecciona un atleta y queremos engines reales.
 */
export function useAthleteStress(athlete: AthleteProfile | null) {
  const [stress, setStress] = useState<StressResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!athlete) { setStress(null); return; }
    let cancelled = false;
    setLoading(true);
    api.post<StressResult>('/v1/stress/calculate', buildStressPayload(athlete))
      .then(res => { if (!cancelled) setStress(res); })
      .catch(() => { if (!cancelled) setStress(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [athlete?.id]);

  return { stress, loading };
}

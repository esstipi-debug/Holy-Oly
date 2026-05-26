import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { athleteByEmail, athletes, type AthleteProfile } from '../data/athletes';
import { api } from '../lib/api';

interface StressResult {
  fitness: number;
  fatigue: number;
  readiness: number;
  readiness_category: string;
  cns_score: number | null;
  cns_zone: string | null;
}

export type RiskZone = 'green' | 'yellow' | 'orange' | 'red';

export interface AdaptationDegradation {
  exercise: string;
  sets: number;
  reps: number;
  weight: string;
  degradation: number;
  reasoning: string;
}

export interface AdaptationResult {
  risk_score: number;
  risk_zone: RiskZone;
  recommendation: string;
  warnings: string[];
  adapted_plan: AdaptationDegradation[];
  /** True cuando se calcula localmente (API falló o no disponible) */
  client_side_fallback?: boolean;
}

interface AthleteContextType {
  athlete: AthleteProfile | null;
  stress: StressResult | null;
  stressLoading: boolean;
  adaptation: AdaptationResult | null;
  adaptationLoading: boolean;
  allAthletes: AthleteProfile[];
  selectedAthlete: AthleteProfile | null;
  selectAthlete: (id: string) => void;
  addAthlete: (input: NewAthleteInput) => AthleteProfile;
}

export interface NewAthleteInput {
  name: string;
  email: string;
  age: number;
  gender: 'M' | 'F';
  weight_class: string;
  body_weight: number;
}

const AthleteContext = createContext<AthleteContextType | null>(null);

// Stub profile vacío para usuarios reales que aún no tienen data seedeada.
// Evita mostrar a Matías Guerrero como si fueran ellos.
function buildStubProfile(user: { id: string; email: string; name?: string }): AthleteProfile {
  return {
    id: user.id,
    email: user.email,
    password: '',
    name: user.name || user.email.split('@')[0],
    age: 0,
    gender: 'M',
    weight_class: '—',
    club: 'Sin asignar',
    province: '—',
    coach_id: '',
    role: 'athlete',
    subscription: 'FREE',
    macrocycle: {
      program_id: '', program_name: 'Sin programa',
      week: 0, day: 0, total_weeks: 0, focus: 'Por definir',
    },
    maxes: { snatch: 0, clean: 0, jerk: 0, back_squat: 0, front_squat: 0, body_weight: 0 },
    injuries: [],
    sessions_last_7: [],
    prior_fitness: 50,
    prior_fatigue: 30,
  };
}

// ─── Helpers de mapeo 1-10 (data del athlete) → 1-5 (engine input) ───
// soreness 1-10 (alto=peor) → soreness_level 1-5 (alto=peor)
const to5 = (v: number) => Math.max(1, Math.min(5, Math.round((v / 10) * 4 + 1)));
// motivation 1-10 (alto=mejor) → mental_focus 1-5 (alto=mejor)
const motivationTo5 = (v: number) => Math.max(1, Math.min(5, Math.round((v / 10) * 4 + 1)));
// fatigue derivada de soreness + (10-motivation) + life_stress, normalizada
const deriveFatigue = (s: { soreness: number; motivation: number; life_stress: number; sleep_hours: number }) => {
  const fatigueRaw = (s.soreness + (10 - s.motivation) + s.life_stress + Math.max(0, 8 - s.sleep_hours)) / 4;
  return to5(fatigueRaw);
};

// Default plan usado si el athlete no tiene programa cargado.
// Refleja una sesión típica de oly weightlifting.
const DEFAULT_PLAN = [
  { exercise_id: 'snatch', exercise_name: 'Snatch', sets: 5, reps: 3, weight_pct: 80, complexity: 9, cns_demand: 9 },
  { exercise_id: 'cleanjerk', exercise_name: 'Clean & Jerk', sets: 4, reps: 2, weight_pct: 80, complexity: 9, cns_demand: 9 },
  { exercise_id: 'frontsquat', exercise_name: 'Front Squat', sets: 4, reps: 4, weight_pct: 75, complexity: 5, cns_demand: 6 },
];

// Fallback local: replica conceptual de la engine (mismos weights/zones).
function computeAdaptationLocally(input: {
  soreness: number; motivation: number; life_stress: number; sleep_hours: number;
  rpe_reported?: number; rpe_expected?: number;
}): AdaptationResult {
  const coord = motivationTo5(input.motivation);           // proxy coord
  const fatigue = deriveFatigue(input);
  const soreness = to5(input.soreness);
  const mental = motivationTo5(input.motivation);
  const sleep = input.sleep_hours;
  // Mismos pesos que la engine (coord .30 / fat .25 / sleep .20 / sor .15 / men .10)
  const coordRisk = ((5 - coord) / 4) * 100;
  const fatigueRisk = ((fatigue - 1) / 4) * 100;
  const sorenessRisk = ((soreness - 1) / 4) * 100;
  const mentalRisk = ((5 - mental) / 4) * 100;
  const sleepRisk = sleep == null ? 50 : Math.max(0, Math.min(100, ((8 - sleep) / 4) * 100));
  const score = Math.round(
    coordRisk * 0.30 + fatigueRisk * 0.25 + sleepRisk * 0.20 + sorenessRisk * 0.15 + mentalRisk * 0.10
  );
  const zone: RiskZone = score <= 25 ? 'green' : score <= 50 ? 'yellow' : score <= 75 ? 'orange' : 'red';
  const recommendation = zone === 'green' ? 'Ejecutar como planeado'
    : zone === 'yellow' ? 'Reducir volumen 15%, mantener intensidad'
    : zone === 'orange' ? 'Reducir intensidad 25%, sustituir movimientos técnicos'
    : 'Descanso activo o sesión de movilidad recomendado';
  return {
    risk_score: score,
    risk_zone: zone,
    recommendation,
    warnings: [],
    adapted_plan: [],
    client_side_fallback: true,
  };
}

export function AthleteProvider({ children }: { children: ReactNode }) {
  const { user, demoMode } = useAuth();
  const [stress, setStress] = useState<StressResult | null>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [adaptation, setAdaptation] = useState<AdaptationResult | null>(null);
  const [adaptationLoading, setAdaptationLoading] = useState(false);
  const [roster, setRoster] = useState<AthleteProfile[]>(athletes);

  // Resolución de perfil:
  // 1. demoMode → Matías (roster[0]) para reviewers
  // 2. user con seed match → usar seed (devs internos: user@example.com, etc.)
  // 3. user real registrado → stub derivado del user (NO usar Matías como fallback)
  const athlete = !user
    ? null
    : demoMode
      ? (roster[0] ?? buildStubProfile(user))
      : (athleteByEmail[user.email] ?? buildStubProfile(user));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAthlete = selectedId ? (roster.find(a => a.id === selectedId) ?? null) : null;
  const selectAthlete = (id: string) => setSelectedId(id);

  const addAthlete = (input: NewAthleteInput): AthleteProfile => {
    const id = `ath_${Date.now().toString(36)}`;
    const profile: AthleteProfile = {
      id,
      email: input.email,
      password: '',
      name: input.name,
      age: input.age,
      gender: input.gender,
      weight_class: input.weight_class,
      club: 'Sin asignar',
      province: 'Sin asignar',
      coach_id: 'coach_001',
      role: 'athlete',
      macrocycle: {
        program_id: '', program_name: 'Sin asignar',
        week: 0, day: 0, total_weeks: 0, focus: 'Por definir',
      },
      maxes: {
        snatch: 0, clean: 0, jerk: 0,
        back_squat: 0, front_squat: 0,
        body_weight: input.body_weight,
      },
      injuries: [],
      sessions_last_7: [],
      prior_fitness: 50,
      prior_fatigue: 30,
      subscription: 'FREE',
    };
    setRoster(prev => [...prev, profile]);
    return profile;
  };

  useEffect(() => {
    if (!athlete) return;

    const today = athlete.sessions_last_7.at(-1);
    if (!today) return;

    setStressLoading(true);
    api.post<StressResult>('/v1/stress/calculate', {
      athlete_id: athlete.id,
      gender: athlete.gender,
      age: athlete.age,
      session_load: today.load,
      sleep_hours: today.sleep_hours,
      rpe_reported: today.rpe_reported || undefined,
      rpe_expected: today.rpe_expected || undefined,
      completed_sessions: athlete.sessions_last_7.filter(s => s.completed).length,
      planned_sessions: athlete.sessions_last_7.length,
      soreness: today.soreness,
      motivation: today.motivation,
      life_stress: today.life_stress,
      prior_fitness: athlete.prior_fitness,
      prior_fatigue: athlete.prior_fatigue,
    })
      .then(setStress)
      .catch(() => setStress(null))
      .finally(() => setStressLoading(false));
  }, [athlete?.id]);

  // ─── Session Adaptation ───
  useEffect(() => {
    if (!athlete) { setAdaptation(null); return; }
    const today = athlete.sessions_last_7.at(-1);
    if (!today) { setAdaptation(null); return; }

    setAdaptationLoading(true);

    const preCheck = {
      coordination_score: motivationTo5(today.motivation),
      fatigue_level: deriveFatigue(today),
      soreness_level: to5(today.soreness),
      mental_focus: motivationTo5(today.motivation),
      sleep_hours: today.sleep_hours,
    };

    api.post<{
      risk_score: number;
      risk_zone: RiskZone;
      recommendation: string;
      warnings: string[];
      adapted_plan: AdaptationDegradation[];
    }>('/v1/session/adapt', { pre_check: preCheck, original_plan: DEFAULT_PLAN })
      .then(res => setAdaptation({
        risk_score: res.risk_score,
        risk_zone: res.risk_zone,
        recommendation: res.recommendation,
        warnings: res.warnings ?? [],
        adapted_plan: res.adapted_plan ?? [],
      }))
      .catch(() => {
        // Fallback client-side con la misma lógica conceptual
        setAdaptation(computeAdaptationLocally(today));
      })
      .finally(() => setAdaptationLoading(false));
  }, [athlete?.id]);

  return (
    <AthleteContext.Provider value={{ athlete, stress, stressLoading, adaptation, adaptationLoading, allAthletes: roster, selectedAthlete, selectAthlete, addAthlete }}>
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthlete() {
  const ctx = useContext(AthleteContext);
  if (!ctx) throw new Error('useAthlete must be used within AthleteProvider');
  return ctx;
}

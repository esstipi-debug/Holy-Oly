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

interface AthleteContextType {
  athlete: AthleteProfile | null;
  stress: StressResult | null;
  stressLoading: boolean;
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

export function AthleteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stress, setStress] = useState<StressResult | null>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [roster, setRoster] = useState<AthleteProfile[]>(athletes);

  // Match real user; fallback al primer atleta seeded para usuarios demo / nuevos
  const athlete = user
    ? (athleteByEmail[user.email] ?? roster[0] ?? null)
    : null;
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

  return (
    <AthleteContext.Provider value={{ athlete, stress, stressLoading, allAthletes: roster, selectedAthlete, selectAthlete, addAthlete }}>
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthlete() {
  const ctx = useContext(AthleteContext);
  if (!ctx) throw new Error('useAthlete must be used within AthleteProvider');
  return ctx;
}

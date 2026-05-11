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
}

const AthleteContext = createContext<AthleteContextType | null>(null);

export function AthleteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stress, setStress] = useState<StressResult | null>(null);
  const [stressLoading, setStressLoading] = useState(false);

  const athlete = user ? (athleteByEmail[user.email] ?? null) : null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAthlete = selectedId ? (athletes.find(a => a.id === selectedId) ?? null) : null;
  const selectAthlete = (id: string) => setSelectedId(id);

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
    <AthleteContext.Provider value={{ athlete, stress, stressLoading, allAthletes: athletes, selectedAthlete, selectAthlete }}>
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthlete() {
  const ctx = useContext(AthleteContext);
  if (!ctx) throw new Error('useAthlete must be used within AthleteProvider');
  return ctx;
}

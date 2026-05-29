import { createContext, useContext, useState, type ReactNode } from 'react';
import { loadCompetitions, saveCompetitions, type Competition } from '../data/competitions';

/**
 * CompetitionContext · competencias objetivo por atleta (input del coach).
 * Persiste en sessionStorage (ho:competitions), mismo patrón que el override de
 * macro de Wave 1: sobrevive navegación/reload dentro de la sesión demo.
 */
interface CompetitionContextType {
  competitions: Competition[];
  addCompetition: (c: Omit<Competition, 'id'>) => Competition;
  updateCompetition: (id: string, patch: Partial<Omit<Competition, 'id'>>) => void;
  removeCompetition: (id: string) => void;
}
const CompetitionContext = createContext<CompetitionContextType | null>(null);

export function CompetitionProvider({ children }: { children: ReactNode }) {
  const [competitions, setCompetitions] = useState<Competition[]>(() => loadCompetitions());
  const persist = (list: Competition[]) => { setCompetitions(list); saveCompetitions(list); };
  const addCompetition = (c: Omit<Competition, 'id'>): Competition => {
    const comp: Competition = { ...c, id: `comp_${Date.now().toString(36)}` };
    persist([...competitions, comp]);
    return comp;
  };
  const updateCompetition = (id: string, patch: Partial<Omit<Competition, 'id'>>) =>
    persist(competitions.map(c => (c.id === id ? { ...c, ...patch } : c)));
  const removeCompetition = (id: string) =>
    persist(competitions.filter(c => c.id !== id));
  return (
    <CompetitionContext.Provider value={{ competitions, addCompetition, updateCompetition, removeCompetition }}>
      {children}
    </CompetitionContext.Provider>
  );
}

export function useCompetitions() {
  const ctx = useContext(CompetitionContext);
  if (!ctx) throw new Error('useCompetitions must be used within CompetitionProvider');
  return ctx;
}

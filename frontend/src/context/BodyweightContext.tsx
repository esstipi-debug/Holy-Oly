import { createContext, useContext, useState, type ReactNode } from 'react';
import { loadWeighIns, saveWeighIns, type WeighIn } from '../data/bodyweight';

/**
 * BodyweightContext · pesajes por atleta (input del coach/atleta).
 * Persiste en sessionStorage (ho:weighins), mismo patrón que CompetitionContext.
 */
interface BodyweightContextType {
  weighIns: WeighIn[];
  addWeighIn: (w: Omit<WeighIn, 'id'>) => WeighIn;
  removeWeighIn: (id: string) => void;
}
const BodyweightContext = createContext<BodyweightContextType | null>(null);

export function BodyweightProvider({ children }: { children: ReactNode }) {
  const [weighIns, setWeighIns] = useState<WeighIn[]>(() => loadWeighIns());
  const persist = (list: WeighIn[]) => { setWeighIns(list); saveWeighIns(list); };
  const addWeighIn = (w: Omit<WeighIn, 'id'>): WeighIn => {
    const wi: WeighIn = { ...w, id: `wi_${Date.now().toString(36)}` };
    persist([...weighIns, wi]);
    return wi;
  };
  const removeWeighIn = (id: string) => persist(weighIns.filter(w => w.id !== id));
  return (
    <BodyweightContext.Provider value={{ weighIns, addWeighIn, removeWeighIn }}>
      {children}
    </BodyweightContext.Provider>
  );
}

export function useBodyweight() {
  const ctx = useContext(BodyweightContext);
  if (!ctx) throw new Error('useBodyweight must be used within BodyweightProvider');
  return ctx;
}

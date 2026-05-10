import { createContext, useContext, useState, type ReactNode } from 'react';

export type View =
  | 'LOGIN' | 'ONBOARDING' | 'PREMIUM'
  | 'HOME' | 'SUMMARY' | 'WARMUP' | 'SESSION' | 'VICTORY'
  | 'PERFORMANCE' | 'INDEX' | 'SCHEDULE' | 'PULSE' | 'PILLS' | 'SOCIAL' | 'PROFILE'
  | 'COACH_DASH' | 'ATHLETE_DETAIL' | 'ASSIGN_MACRO';

interface NavContextType {
  currentView: View;
  navigate: (v: View) => void;
}

const NavContext = createContext<NavContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('HOME');
  return (
    <NavContext.Provider value={{ currentView, navigate: setCurrentView }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavigationProvider');
  return ctx;
}

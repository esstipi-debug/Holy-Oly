import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type View =
  | 'LOGIN' | 'REGISTER' | 'ONBOARDING' | 'PREMIUM'
  | 'HOME' | 'SUMMARY' | 'WARMUP' | 'SESSION' | 'VICTORY'
  | 'PERFORMANCE' | 'INDEX' | 'SCHEDULE' | 'PULSE' | 'PILLS' | 'SOCIAL' | 'SOCIAL_GALLERY' | 'PROFILE'
  | 'COACH_DASH' | 'COACH_STATS' | 'ATHLETE_DETAIL' | 'ASSIGN_MACRO' | 'NEW_ATHLETE' | 'COACH_MACRO_VIEW'
  | 'VOLTA_HOME' | 'VOLTA_PREWOD' | 'VOLTA_COACH' | 'VOLTA_COACH_WOD' | 'VOLTA_COACH_MACRO' | 'VOLTA_COACH_INVENTORY' | 'VOLTA_COACH_TOOLS'
  | 'PROGRESSION' | 'BASELINE' | 'VOLTA_STATS' | 'VOLTA_WOD_LOG' | 'HO_STATS' | 'LEADERBOARD' | 'BELT_CEREMONY' | 'PREWOD_SHARE' | 'COACH_VIRAL_TOOLS'
  | 'PRIVACY' | 'TERMS' | 'HORMONAL' | 'PLATE_DEMO' | 'DESIGN_V2'
  | 'V2_HOME' | 'V2_CHECKIN' | 'V2_COACH' | 'V2_SKILL_TREE' | 'CARDS_COMPARE'
  | 'HO_MACRO_CATALOG' | 'HO_MACRO_DETAIL' | 'HO_MACRO_ATHLETE' | 'VOLTA_MACRO_ATHLETE'
  | 'CONTROL_DANIOS_V2';

interface NavContextType {
  currentView: View;
  navigate: (v: View) => void;
  back: () => void;
  canGoBack: boolean;
}

const NavContext = createContext<NavContextType | null>(null);

const STORAGE_KEY = 'nav:currentView';

const VALID_VIEWS: View[] = [
  'LOGIN','REGISTER','ONBOARDING','PREMIUM',
  'HOME','SUMMARY','WARMUP','SESSION','VICTORY',
  'PERFORMANCE','INDEX','SCHEDULE','PULSE','PILLS','SOCIAL','SOCIAL_GALLERY','PROFILE',
  'COACH_DASH','COACH_STATS','ATHLETE_DETAIL','ASSIGN_MACRO','NEW_ATHLETE','COACH_MACRO_VIEW',
  'VOLTA_HOME','VOLTA_PREWOD','VOLTA_COACH','VOLTA_COACH_WOD','VOLTA_COACH_MACRO','VOLTA_COACH_INVENTORY','VOLTA_COACH_TOOLS',
  'PROGRESSION','BASELINE','VOLTA_STATS','VOLTA_WOD_LOG','HO_STATS','LEADERBOARD','BELT_CEREMONY','PREWOD_SHARE','COACH_VIRAL_TOOLS',
  'PRIVACY','TERMS','HORMONAL','PLATE_DEMO','DESIGN_V2',
  'V2_HOME','V2_CHECKIN','V2_COACH','V2_SKILL_TREE','CARDS_COMPARE',
  'HO_MACRO_CATALOG','HO_MACRO_DETAIL','HO_MACRO_ATHLETE','VOLTA_MACRO_ATHLETE',
  'CONTROL_DANIOS_V2',
];

function readInitial(): View {
  try {
    const hash = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#/, '').toUpperCase();
    if (hash) {
      const match = VALID_VIEWS.find((v) => v === hash);
      if (match) return match;
    }
    const stored = localStorage.getItem(STORAGE_KEY) as View | null;
    return stored ?? 'HOME';
  } catch {
    return 'HOME';
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<View[]>([readInitial()]);
  const currentView = stack[stack.length - 1];

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, currentView); } catch { /* ignore */ }
    if (window.history.state?.view !== currentView) {
      window.history.pushState({ view: currentView }, '', `#${currentView.toLowerCase()}`);
    }
  }, [currentView]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const v = e.state?.view as View | undefined;
      if (v) setStack((s) => (s[s.length - 1] === v ? s : [...s.slice(0, -1), v]));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((v: View) => {
    setStack((s) => (s[s.length - 1] === v ? s : [...s, v]));
  }, []);

  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  return (
    <NavContext.Provider value={{ currentView, navigate, back, canGoBack: stack.length > 1 }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavigationProvider');
  return ctx;
}

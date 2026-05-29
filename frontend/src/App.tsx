import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AthleteProvider, useAthlete } from './context/AthleteContext';
import { CompetitionProvider } from './context/CompetitionContext';
import { BodyweightProvider } from './context/BodyweightContext';
import { NavigationProvider, useNav } from './context/NavigationContext';
import { ProductProvider, useProduct } from './context/ProductContext';
import { RoleProvider, useRole } from './context/RoleContext';
import { ToastProvider } from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import PhoneLayout, { type NavTab } from './layouts/PhoneLayout';
import ActiveSession from './pages/ActiveSession';
import WarmupGenerator from './pages/WarmupGenerator';
import SessionSummaryPreview from './pages/SessionSummaryPreview';
import VictoryScreen from './pages/VictoryScreen';
import OlyIndex from './pages/OlyIndex';
import CoachStatsHO from './pages/CoachStatsHO';
import AthleteDeepDive from './pages/AthleteDeepDive';
import AssignMacrocycle from './pages/AssignMacrocycle';
import NewAthlete from './pages/NewAthlete';
import Premium from './pages/PreMium';
import PulseHub from './pages/PulseHub';
import Profile from './pages/Profile';
import PerformanceDeepDive from './pages/PerformanceDeepDive';
import SessionSchedule from './pages/SessionSchedule';
import KnowledgePills from './pages/KnowledgePills';
import SocialCard from './pages/SocialCard';
import SocialCardsGallery from './pages/SocialCardsGallery';
import BaselineAssessment from './pages/BaselineAssessment';
import HoStats from './pages/HoStats';
import Leaderboard from './pages/Leaderboard';
import BeltCeremony from './pages/BeltCeremony';
import CoachViralTools from './pages/CoachViralTools';
import CoachMacroView from './pages/CoachMacroView';
import MovementProgression from './pages/MovementProgression';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import HormonalSetup from './pages/HormonalSetup';
import PlateDemo from './pages/_dev/PlateDemo';
import DesignV2 from './pages/_dev/DesignV2';
import CardsCompareDemo from './pages/_dev/CardsCompareDemo';
// V2 PARCIALES · lazy-load para que su CSS con resets globales no contamine las
// pantallas activas. Solo cargan su CSS cuando se navega explícitamente a ellas.
type NoProps = Record<string, never>;
const AtletaHomeV2 = React.lazy(() => import('./pages/v2/AtletaHomeV2') as Promise<{ default: React.ComponentType<NoProps> }>);
const CheckinV2 = React.lazy(() => import('./pages/v2/CheckinV2') as Promise<{ default: React.ComponentType<NoProps> }>);
const CoachDashV2 = React.lazy(() => import('./pages/v2/CoachDashV2') as Promise<{ default: React.ComponentType<NoProps> }>);
const SkillTreeV2 = React.lazy(() => import('./pages/v2/SkillTreeV2') as Promise<{ default: React.ComponentType<NoProps> }>);
import HolyOlyCatalogV2 from './pages/v2/HolyOlyCatalogV2';
import HolyOlyDetailV2 from './pages/v2/HolyOlyDetailV2';
import HolyOlyMacrocycleV2 from './pages/v2/HolyOlyMacrocycleV2';
import ControlDaniosV2 from './pages/v2/ControlDaniosV2';
import DemoHubV2 from './pages/v2/DemoHubV2';
import LoginV3 from './pages/v2/LoginV3';
import RegisterV3 from './pages/v2/RegisterV3';
import OnboardingV3 from './pages/v2/OnboardingV3';
import type { View } from './context/NavigationContext';

const NAV_MAP_HO: Record<string, NavTab> = {
  HOME: 'home',
  WARMUP: 'train', SESSION: 'train', SUMMARY: 'train', VICTORY: 'train',
  PERFORMANCE: 'stats', INDEX: 'stats', SCHEDULE: 'stats', PULSE: 'stats', PILLS: 'stats', SOCIAL: 'stats', SOCIAL_GALLERY: 'stats',
  PROGRESSION: 'stats', HO_STATS: 'stats', LEADERBOARD: 'stats', COACH_VIRAL_TOOLS: 'stats',
  PROFILE: 'profile', ONBOARDING: 'profile', PREMIUM: 'profile',
  COACH_DASH: 'home', ATHLETE_DETAIL: 'home', ASSIGN_MACRO: 'home', NEW_ATHLETE: 'home',
  COACH_STATS: 'stats',
  COACH_MACRO_VIEW: 'stats',
};

// Vistas exclusivas por rol — al cambiar de rol, redirige al home apropiado
const ATHLETE_ONLY: View[] = ['WARMUP', 'SESSION', 'SUMMARY', 'VICTORY', 'PULSE', 'PILLS', 'INDEX', 'SCHEDULE', 'ONBOARDING', 'PREMIUM', 'SOCIAL', 'PERFORMANCE'];
const COACH_ONLY: View[]   = ['COACH_DASH', 'COACH_STATS', 'ATHLETE_DETAIL', 'ASSIGN_MACRO', 'NEW_ATHLETE', 'COACH_MACRO_VIEW'];

// Home-set: vistas que NO deben mostrar back (destinos primarios de tabs del nav)
const HOME_VIEWS = new Set<View>([
  'LOGIN', 'REGISTER',
  // HO Atleta tabs
  'HOME', 'WARMUP', 'PERFORMANCE', 'PROFILE',
  // HO Coach tabs
  'COACH_DASH', 'COACH_STATS',
]);

// Vistas accesibles sin autenticar (preview/WIP · revertir antes de prod)
const PUBLIC_VIEWS = new Set<View>([
  'LOGIN', 'REGISTER', 'PRIVACY', 'TERMS',
  'HO_MACRO_CATALOG', 'HO_MACRO_DETAIL', 'HO_MACRO_ATHLETE',
  'CONTROL_DANIOS_V2',
  'LOGIN_V3', 'REGISTER_V3', 'ONBOARDING_V3',
  'DEMO_HUB',
]);

const navGroups = [
  { title: 'Core',      views: ['LOGIN', 'REGISTER', 'ONBOARDING', 'PREMIUM'] },
  { title: 'HO Atleta', views: ['HOME', 'SUMMARY', 'WARMUP', 'SESSION', 'VICTORY'] },
  { title: 'HO Stats',  views: ['PERFORMANCE', 'INDEX', 'SCHEDULE', 'PULSE', 'PILLS', 'SOCIAL', 'PROFILE'] },
  { title: 'HO Coach',  views: ['COACH_DASH', 'ATHLETE_DETAIL', 'ASSIGN_MACRO', 'NEW_ATHLETE'] },
];

/** Lee el último view "home-set" que el usuario visitó para el rol activo. */
function readLastView(r: string): View | null {
  try {
    const v = localStorage.getItem(`nav:last:holy-oly:${r}`);
    return v ? (v as View) : null;
  } catch { return null; }
}

function RoleSwitcher() {
  const { role, setRole } = useRole();
  const { navigate } = useNav();

  const goHome = (r: typeof role) => {
    const last = readLastView(r);
    if (last && HOME_VIEWS.has(last)) { navigate(last); return; }
    navigate(r === 'coach' ? 'COACH_DASH' : 'HOME');
  };

  return (
    <div style={{
      position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 55,
      display: 'flex', gap: 6, alignItems: 'center',
    }}>
      {/* Role pill */}
      <div style={{
        display: 'flex', gap: 4, padding: 3,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={() => { setRole('atleta'); goHome('atleta'); }}
          style={{
            padding: '3px 8px', borderRadius: 10,
            fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
            background: role === 'atleta' ? 'rgba(255,255,255,0.95)' : 'transparent',
            color: role === 'atleta' ? '#07070F' : 'rgba(255,255,255,0.7)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >ATL</button>
        <button
          onClick={() => { setRole('coach'); goHome('coach'); }}
          style={{
            padding: '3px 8px', borderRadius: 10,
            fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
            background: role === 'coach' ? 'rgba(255,255,255,0.95)' : 'transparent',
            color: role === 'coach' ? '#07070F' : 'rgba(255,255,255,0.7)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >COACH</button>
      </div>
    </div>
  );
}

function AppInner() {
  const { currentView, navigate } = useNav();
  const { product } = useProduct();
  const { role } = useRole();
  const { isAuthenticated } = useAuth();
  const { athlete, selectedAthlete } = useAthlete();
  const [devNavOpen, setDevNavOpen] = useState<boolean>(() => localStorage.getItem('devNav:open') === '1');
  const toggleDevNav = () => {
    const next = !devNavOpen;
    setDevNavOpen(next);
    localStorage.setItem('devNav:open', next ? '1' : '0');
  };

  // Gate: forzar LOGIN si no autenticado y la vista actual no es pública
  useEffect(() => {
    if (!isAuthenticated && !PUBLIC_VIEWS.has(currentView) && currentView !== 'LOGIN') {
      navigate('LOGIN');
    }
  }, [isAuthenticated, currentView, navigate]);

  // Role-guard: si la vista actual no aplica al rol activo, redirigir al home apropiado
  useEffect(() => {
    if (!isAuthenticated) return;
    if (role === 'coach' && ATHLETE_ONLY.includes(currentView)) {
      navigate('COACH_DASH');
    } else if (role === 'atleta' && COACH_ONLY.includes(currentView)) {
      navigate('HOME');
    }
  }, [role, currentView, isAuthenticated, navigate]);

  // Persistir último view "home-set" por rol. Permite que el switcher y el login restauren la ubicación.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!HOME_VIEWS.has(currentView)) return;
    if (currentView === 'LOGIN' || currentView === 'REGISTER') return;
    try { localStorage.setItem(`nav:last:holy-oly:${role}`, currentView); } catch { /* ignore */ }
  }, [currentView, role, isAuthenticated]);

  // Skin mujer: auto por género del atleta en foco. Re-tinta accents/glows vía
  // [data-skin="women"]; los discos (--tier-*) y el fondo del theme no se tocan.
  const focusAthlete = role === 'coach'
    ? ((currentView === 'ATHLETE_DETAIL' || currentView === 'ASSIGN_MACRO') ? selectedAthlete : null)
    : athlete;
  const skin = focusAthlete?.gender === 'F' ? 'women' : 'default';
  useEffect(() => {
    if (skin === 'women') document.documentElement.setAttribute('data-skin', 'women');
    else document.documentElement.removeAttribute('data-skin');
  }, [skin]);

  const isPublic = PUBLIC_VIEWS.has(currentView);
  // Vistas fullscreen ceremoniales: ocultan nav inferior + switcher
  const isImmersive = currentView === 'BELT_CEREMONY';

  // Switcher de rol · solo en modo demo (?demo=1) · útil para QA.
  const demoMode = (() => { try { return localStorage.getItem('app:demo_mode') === '1'; } catch { return false; } })();
  const showSwitcher = demoMode;

  const renderView = () => {
    // PUBLIC views (sin auth)
    if (currentView === 'PRIVACY') return <PrivacyPolicy />;
    if (currentView === 'TERMS') return <Terms />;
    if (currentView === 'HORMONAL') return <HormonalSetup />;
    if (currentView === 'PLATE_DEMO') return <PlateDemo />;
    if (currentView === 'DESIGN_V2') return <DesignV2 />;
    if (currentView === 'V2_HOME') return <React.Suspense fallback={null}><AtletaHomeV2 /></React.Suspense>;
    if (currentView === 'V2_CHECKIN') return <React.Suspense fallback={null}><CheckinV2 /></React.Suspense>;
    if (currentView === 'V2_COACH') return <React.Suspense fallback={null}><CoachDashV2 /></React.Suspense>;
    if (currentView === 'V2_SKILL_TREE') return <React.Suspense fallback={null}><SkillTreeV2 /></React.Suspense>;
    if (currentView === 'CARDS_COMPARE') return <CardsCompareDemo />;
    if (currentView === 'HO_MACRO_CATALOG') return <HolyOlyCatalogV2 />;
    if (currentView === 'HO_MACRO_DETAIL') return <HolyOlyDetailV2 />;
    if (currentView === 'HO_MACRO_ATHLETE') return <HolyOlyMacrocycleV2 />;
    if (currentView === 'CONTROL_DANIOS_V2') return <ControlDaniosV2 />;
    if (currentView === 'DEMO_HUB') return <DemoHubV2 />;
    if (currentView === 'LOGIN_V3') return <LoginV3 />;
    if (currentView === 'REGISTER_V3') return <RegisterV3 />;
    if (currentView === 'ONBOARDING_V3') return <OnboardingV3 />;
    if (currentView === 'LOGIN') {
      return <LoginV3 onSuccess={() => {
        const last = readLastView(role);
        if (last && HOME_VIEWS.has(last)) { navigate(last); return; }
        navigate(role === 'coach' ? 'COACH_DASH' : 'HOME');
      }} />;
    }
    if (currentView === 'REGISTER') return <RegisterV3 />;

    // HOLY OLY (único producto de este repo)
    switch (currentView) {
      case 'ONBOARDING':     return <OnboardingV3 />;
      case 'PREMIUM':        return <Premium />;
      case 'SUMMARY':        return <SessionSummaryPreview />;
      case 'WARMUP':         return <WarmupGenerator />;
      case 'SESSION':        return <ActiveSession />;
      case 'VICTORY':        return <VictoryScreen />;
      case 'PERFORMANCE':    return <PerformanceDeepDive />;
      case 'INDEX':          return <OlyIndex />;
      case 'SCHEDULE':       return <SessionSchedule />;
      case 'PULSE':          return <PulseHub />;
      case 'PILLS':          return <KnowledgePills />;
      case 'SOCIAL':         return <SocialCard />;
      case 'SOCIAL_GALLERY': return <SocialCardsGallery />;
      case 'BASELINE':       return <BaselineAssessment />;
      case 'PROFILE':        return <Profile />;
      case 'COACH_DASH':     return <React.Suspense fallback={null}><CoachDashV2 /></React.Suspense>;
      case 'COACH_STATS':    return <CoachStatsHO />;
      case 'COACH_MACRO_VIEW': return <CoachMacroView />;
      case 'ATHLETE_DETAIL': return <AthleteDeepDive />;
      case 'ASSIGN_MACRO':   return <AssignMacrocycle />;
      case 'NEW_ATHLETE':    return <NewAthlete />;
      case 'PROGRESSION':    return <MovementProgression />;
      case 'HO_STATS':       return <HoStats />;
      case 'LEADERBOARD':    return <Leaderboard />;
      case 'BELT_CEREMONY':  return <BeltCeremony />;
      case 'COACH_VIRAL_TOOLS': return <CoachViralTools />;
      case 'HOME':
      default:
        return <React.Suspense fallback={null}>{role === 'coach' ? <CoachDashV2 /> : <AtletaHomeV2 />}</React.Suspense>;
    }
  };

  const handleNavChange = (tab: NavTab) => {
    if (tab === 'home') navigate(role === 'coach' ? 'COACH_DASH' : 'HOME');
    else if (tab === 'train') navigate(role === 'coach' ? 'COACH_DASH' : 'WARMUP');
    else if (tab === 'stats') navigate(role === 'coach' ? 'COACH_STATS' : 'HO_STATS');
    else if (tab === 'profile') navigate('PROFILE');
  };

  const showBack = !HOME_VIEWS.has(currentView);

  return (
    <div className="relative">
      <PhoneLayout
        activeNav={NAV_MAP_HO[currentView] ?? 'home'}
        onNavChange={handleNavChange}
        product={product}
        role={role}
        showBack={showBack && !isPublic && !isImmersive}
        hideNav={isPublic || isImmersive}
      >
        {!isPublic && !isImmersive && showSwitcher && <RoleSwitcher />}
        {renderView()}
      </PhoneLayout>

      <InstallPrompt />

      {/* Dev sidebar — solo cuando autenticado y en DEV */}
      {import.meta.env.DEV && !isPublic && (
      <div
        className="hidden 2xl:flex fixed right-10 top-10 bottom-10 w-56 flex-col gap-4 overflow-y-auto z-50 p-5 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}
      >
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
          UI Explorer · HOLY OLY · {role === 'coach' ? 'COACH' : 'ATLETA'}
        </p>
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-tighter pb-1" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--card-border)' }}>
              {group.title}
            </p>
            {group.views.map(v => (
              <button
                key={v}
                onClick={() => navigate(v as View)}
                className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: currentView === v ? 'rgba(34,197,94,0.08)' : 'transparent',
                  color: currentView === v ? 'var(--primary)' : 'var(--text-secondary)',
                  border: currentView === v ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        ))}
      </div>

      )}

      {/* Mobile dev nav — solo cuando autenticado y en DEV. Colapsable. */}
      {import.meta.env.DEV && !isPublic && (
        <>
          <button
            onClick={toggleDevNav}
            className="2xl:hidden fixed z-[60] rounded-full text-[10px] font-black"
            style={{
              top: 8, right: 8,
              width: 28, height: 28,
              background: devNavOpen ? 'var(--primary)' : 'rgba(0,0,0,0.7)',
              color: devNavOpen ? 'var(--bg)' : 'var(--text-secondary)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(8px)',
            }}
            title="Dev navigator"
          >
            {devNavOpen ? '×' : '⋯'}
          </button>

          {devNavOpen && (
            <div className="2xl:hidden fixed z-50 flex flex-wrap gap-1 p-2 rounded-xl backdrop-blur-md"
              style={{
                top: 44, right: 8, left: 8,
                maxHeight: '60vh', overflowY: 'auto',
                background: 'rgba(0,0,0,0.92)', border: '1px solid var(--card-border)',
              }}>
              {navGroups.flatMap(g => g.views).map(v => (
                <button
                  key={v}
                  onClick={() => { navigate(v as View); toggleDevNav(); }}
                  className="flex-shrink-0 px-2 py-1 rounded-lg text-[9px] font-black transition-all"
                  style={{
                    background: currentView === v ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: currentView === v ? 'var(--bg)' : 'var(--text-secondary)',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AthleteProvider>
          <CompetitionProvider>
            <BodyweightProvider>
              <ProductProvider>
                <RoleProvider>
                  <NavigationProvider>
                    <ToastProvider>
                      <AppInner />
                    </ToastProvider>
                  </NavigationProvider>
                </RoleProvider>
              </ProductProvider>
            </BodyweightProvider>
          </CompetitionProvider>
        </AthleteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

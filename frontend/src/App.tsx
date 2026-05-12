import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AthleteProvider } from './context/AthleteContext';
import { NavigationProvider, useNav } from './context/NavigationContext';
import { ProductProvider, useProduct } from './context/ProductContext';
import { RoleProvider, useRole } from './context/RoleContext';
import PhoneLayout, { type NavTab } from './layouts/PhoneLayout';
import AtletaHome from './pages/AtletaHome';
import Login from './pages/Login';
import Register from './pages/Register';
import ActiveSession from './pages/ActiveSession';
import WarmupGenerator from './pages/WarmupGenerator';
import SessionSummaryPreview from './pages/SessionSummaryPreview';
import VictoryScreen from './pages/VictoryScreen';
import OlyIndex from './pages/OlyIndex';
import CommandCenter from './pages/CommandCenter';
import AthleteDeepDive from './pages/AthleteDeepDive';
import AssignMacrocycle from './pages/AssignMacrocycle';
import NewAthlete from './pages/NewAthlete';
import Onboarding from './pages/Onboarding';
import Premium from './pages/PreMium';
import PulseHub from './pages/PulseHub';
import Profile from './pages/Profile';
import PerformanceDeepDive from './pages/PerformanceDeepDive';
import SessionSchedule from './pages/SessionSchedule';
import KnowledgePills from './pages/KnowledgePills';
import SocialCard from './pages/SocialCard';
import VoltaDashboard from './pages/VoltaDashboard';
import VoltaPreWod from './pages/VoltaPreWod';
import VoltaCoachDash from './pages/VoltaCoachDash';
import VoltaCoachWod from './pages/VoltaCoachWod';
import VoltaCoachTools from './pages/VoltaCoachTools';
import MovementProgression from './pages/MovementProgression';
import type { View } from './context/NavigationContext';

const NAV_MAP_HO: Record<string, NavTab> = {
  HOME: 'home',
  WARMUP: 'train', SESSION: 'train', SUMMARY: 'train', VICTORY: 'train',
  PERFORMANCE: 'stats', INDEX: 'stats', SCHEDULE: 'stats', PULSE: 'stats', PILLS: 'stats', SOCIAL: 'stats',
  PROGRESSION: 'stats',
  PROFILE: 'profile', ONBOARDING: 'profile', PREMIUM: 'profile',
  COACH_DASH: 'home', ATHLETE_DETAIL: 'home', ASSIGN_MACRO: 'home', NEW_ATHLETE: 'home',
};

// Vistas exclusivas por rol — al cambiar de rol, redirige al home apropiado
const ATHLETE_ONLY: View[] = ['WARMUP', 'SESSION', 'SUMMARY', 'VICTORY', 'PULSE', 'PILLS', 'INDEX', 'SCHEDULE', 'ONBOARDING', 'PREMIUM', 'VOLTA_PREWOD', 'SOCIAL'];
const COACH_ONLY: View[]   = ['COACH_DASH', 'ATHLETE_DETAIL', 'ASSIGN_MACRO', 'NEW_ATHLETE', 'VOLTA_COACH', 'VOLTA_COACH_WOD', 'VOLTA_COACH_TOOLS', 'VOLTA_COACH_MACRO', 'VOLTA_COACH_INVENTORY'];

const NAV_MAP_VOLTA: Record<string, NavTab> = {
  VOLTA_HOME: 'home', VOLTA_COACH: 'home',
  VOLTA_PREWOD: 'wod', VOLTA_COACH_WOD: 'wod', WARMUP: 'wod', SESSION: 'wod', SUMMARY: 'wod', VICTORY: 'wod',
  // Stats slot en coach es Macro (eval macrociclo); Tools genérico también cae acá
  VOLTA_COACH_MACRO: 'stats', VOLTA_COACH_TOOLS: 'stats',
  // Logros slot en coach es Box (inventario)
  VOLTA_COACH_INVENTORY: 'logros',
  PROGRESSION: 'stats',
  PERFORMANCE: 'stats', INDEX: 'stats', SCHEDULE: 'stats', PULSE: 'stats', PILLS: 'stats',
  SOCIAL: 'logros',
  PROFILE: 'profile',
};

// Home-set: vistas que NO deben mostrar back
const HOME_VIEWS = new Set<View>(['HOME', 'COACH_DASH', 'VOLTA_HOME', 'VOLTA_COACH', 'LOGIN', 'REGISTER']);

// Vistas accesibles sin autenticar
const PUBLIC_VIEWS = new Set<View>(['LOGIN', 'REGISTER']);

const navGroups = [
  { title: 'Core',         views: ['LOGIN', 'REGISTER', 'ONBOARDING', 'PREMIUM'] },
  { title: 'HO Atleta',    views: ['HOME', 'SUMMARY', 'WARMUP', 'SESSION', 'VICTORY'] },
  { title: 'HO Stats',     views: ['PERFORMANCE', 'INDEX', 'SCHEDULE', 'PULSE', 'PILLS', 'SOCIAL', 'PROFILE'] },
  { title: 'HO Coach',     views: ['COACH_DASH', 'ATHLETE_DETAIL', 'ASSIGN_MACRO', 'NEW_ATHLETE'] },
  { title: 'Volta Atleta', views: ['VOLTA_HOME', 'VOLTA_PREWOD'] },
  { title: 'Volta Coach',  views: ['VOLTA_COACH', 'VOLTA_COACH_WOD', 'VOLTA_COACH_TOOLS', 'VOLTA_COACH_MACRO', 'VOLTA_COACH_INVENTORY'] },
];

function ProductRoleSwitcher() {
  const { product, setProduct } = useProduct();
  const { role, setRole } = useRole();
  const { navigate } = useNav();

  const goHome = (p: typeof product, r: typeof role) => {
    if (p === 'volta') navigate(r === 'coach' ? 'VOLTA_COACH' : 'VOLTA_HOME');
    else navigate(r === 'coach' ? 'COACH_DASH' : 'HOME');
  };

  return (
    <div style={{
      position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 55,
      display: 'flex', gap: 6, alignItems: 'center',
    }}>
      {/* Product pill */}
      <div style={{
        display: 'flex', gap: 4, padding: 3,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={() => { setProduct('holy-oly'); goHome('holy-oly', role); }}
          style={{
            padding: '3px 9px', borderRadius: 10,
            fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
            background: product === 'holy-oly' ? 'linear-gradient(135deg,#FFD700,#B8860B)' : 'transparent',
            color: product === 'holy-oly' ? '#07070F' : '#FFD700',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >HO</button>
        <button
          onClick={() => { setProduct('volta'); goHome('volta', role); }}
          style={{
            padding: '3px 9px', borderRadius: 10,
            fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
            background: product === 'volta' ? 'linear-gradient(135deg,#00E5FF,#0070FF)' : 'transparent',
            color: product === 'volta' ? '#07070F' : '#00E5FF',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >VOL</button>
      </div>

      {/* Role pill */}
      <div style={{
        display: 'flex', gap: 4, padding: 3,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={() => { setRole('atleta'); goHome(product, 'atleta'); }}
          style={{
            padding: '3px 8px', borderRadius: 10,
            fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
            background: role === 'atleta' ? 'rgba(255,255,255,0.95)' : 'transparent',
            color: role === 'atleta' ? '#07070F' : 'rgba(255,255,255,0.7)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >ATL</button>
        <button
          onClick={() => { setRole('coach'); goHome(product, 'coach'); }}
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
      navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH');
    } else if (role === 'atleta' && COACH_ONLY.includes(currentView)) {
      navigate(product === 'volta' ? 'VOLTA_HOME' : 'HOME');
    }
  }, [role, currentView, product, isAuthenticated, navigate]);

  const isPublic = PUBLIC_VIEWS.has(currentView);

  const renderView = () => {
    // PUBLIC views (sin auth)
    if (currentView === 'LOGIN') {
      return <Login onSuccess={() => navigate(role === 'coach'
        ? (product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH')
        : (product === 'volta' ? 'VOLTA_HOME' : 'HOME'))} />;
    }
    if (currentView === 'REGISTER') return <Register />;

    // VOLTA
    if (product === 'volta') {
      switch (currentView) {
        case 'VOLTA_COACH':           return <VoltaCoachDash />;
        case 'VOLTA_COACH_WOD':       return <VoltaCoachWod />;
        case 'VOLTA_COACH_TOOLS':     return <VoltaCoachTools />;
        case 'VOLTA_COACH_MACRO':     return <VoltaCoachTools initialTab="macro" />;
        case 'VOLTA_COACH_INVENTORY': return <VoltaCoachTools initialTab="inventario" />;
        case 'PROGRESSION':           return <MovementProgression />;
        case 'VOLTA_PREWOD':          return <VoltaPreWod />;
        case 'ATHLETE_DETAIL':        return <AthleteDeepDive />;
        case 'ASSIGN_MACRO':          return <AssignMacrocycle />;
        case 'NEW_ATHLETE':           return <NewAthlete />;
        case 'PROFILE':               return <Profile />;
        case 'PERFORMANCE':           return <PerformanceDeepDive />;
        case 'SOCIAL':                return <SocialCard />;
        case 'VOLTA_HOME':
        case 'HOME':
        default:
          return role === 'coach' ? <VoltaCoachDash /> : <VoltaDashboard />;
      }
    }
    // HOLY OLY
    switch (currentView) {
      case 'ONBOARDING':     return <Onboarding />;
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
      case 'PROFILE':        return <Profile />;
      case 'COACH_DASH':     return <CommandCenter />;
      case 'ATHLETE_DETAIL': return <AthleteDeepDive />;
      case 'ASSIGN_MACRO':   return <AssignMacrocycle />;
      case 'NEW_ATHLETE':    return <NewAthlete />;
      case 'PROGRESSION':    return <MovementProgression />;
      case 'HOME':
      default:
        return role === 'coach' ? <CommandCenter /> : <AtletaHome />;
    }
  };

  const handleNavChange = (tab: NavTab) => {
    if (product === 'volta') {
      if (tab === 'home') navigate(role === 'coach' ? 'VOLTA_COACH' : 'VOLTA_HOME');
      else if (tab === 'wod') navigate(role === 'coach' ? 'VOLTA_COACH_WOD' : 'VOLTA_PREWOD');
      // Stats slot: atleta → progresión movs · coach → eval macrociclo
      else if (tab === 'stats') navigate(role === 'coach' ? 'VOLTA_COACH_MACRO' : 'PROGRESSION');
      // Logros slot: atleta → social card · coach → inventario del box
      else if (tab === 'logros') navigate(role === 'coach' ? 'VOLTA_COACH_INVENTORY' : 'SOCIAL');
      else if (tab === 'profile') navigate('PROFILE');
      return;
    }
    if (tab === 'home') navigate(role === 'coach' ? 'COACH_DASH' : 'HOME');
    else if (tab === 'train') navigate('WARMUP');
    else if (tab === 'stats') navigate('PERFORMANCE');
    else if (tab === 'profile') navigate('PROFILE');
  };

  const showBack = !HOME_VIEWS.has(currentView);

  return (
    <div className="relative">
      <PhoneLayout
        activeNav={(product === 'volta' ? NAV_MAP_VOLTA : NAV_MAP_HO)[currentView] ?? 'home'}
        onNavChange={handleNavChange}
        product={product}
        role={role}
        showBack={showBack && !isPublic}
        hideNav={isPublic}
      >
        {!isPublic && <ProductRoleSwitcher />}
        {renderView()}
      </PhoneLayout>

      {/* Dev sidebar — solo cuando autenticado y en DEV */}
      {import.meta.env.DEV && !isPublic && (
      <div
        className="hidden 2xl:flex fixed right-10 top-10 bottom-10 w-56 flex-col gap-4 overflow-y-auto z-50 p-5 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}
      >
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
          UI Explorer · {product === 'volta' ? 'VOLTA' : 'HOLY OLY'} · {role === 'coach' ? 'COACH' : 'ATLETA'}
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

      {/* Mobile switcher — solo cuando autenticado y en DEV */}
      {import.meta.env.DEV && !isPublic && (
      <div className="2xl:hidden fixed bottom-2 left-2 right-2 flex gap-1 z-50 overflow-x-auto p-2 rounded-xl backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid var(--card-border)' }}>
        {navGroups.flatMap(g => g.views).map(v => (
          <button
            key={v}
            onClick={() => navigate(v as View)}
            className="flex-shrink-0 px-2 py-1 rounded-lg text-[8px] font-black transition-all"
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
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AthleteProvider>
          <ProductProvider>
            <RoleProvider>
              <NavigationProvider>
                <AppInner />
              </NavigationProvider>
            </RoleProvider>
          </ProductProvider>
        </AthleteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

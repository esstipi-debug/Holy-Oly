import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AthleteProvider } from './context/AthleteContext';
import { NavigationProvider, useNav } from './context/NavigationContext';
import { ProductProvider, useProduct } from './context/ProductContext';
import PhoneLayout, { type NavTab } from './layouts/PhoneLayout';
import AtletaHome from './pages/AtletaHome';
import Login from './pages/Login';
import ActiveSession from './pages/ActiveSession';
import WarmupGenerator from './pages/WarmupGenerator';
import SessionSummaryPreview from './pages/SessionSummaryPreview';
import VictoryScreen from './pages/VictoryScreen';
import OlyIndex from './pages/OlyIndex';
import CommandCenter from './pages/CommandCenter';
import AthleteDeepDive from './pages/AthleteDeepDive';
import AssignMacrocycle from './pages/AssignMacrocycle';
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
import type { View } from './context/NavigationContext';

const NAV_MAP: Record<string, NavTab> = {
  HOME: 'home',
  WARMUP: 'train', SESSION: 'train', SUMMARY: 'train', VICTORY: 'train',
  PERFORMANCE: 'stats', INDEX: 'stats', SCHEDULE: 'stats', PULSE: 'stats', PILLS: 'stats', SOCIAL: 'stats',
  PROFILE: 'profile', ONBOARDING: 'profile', PREMIUM: 'profile',
  VOLTA_HOME: 'home', VOLTA_PREWOD: 'wod',
};

const navGroups = [
  { title: 'Core',     views: ['ONBOARDING', 'PREMIUM'] },
  { title: 'HO Atleta', views: ['HOME', 'SUMMARY', 'WARMUP', 'SESSION', 'VICTORY'] },
  { title: 'HO Stats',  views: ['PERFORMANCE', 'INDEX', 'SCHEDULE', 'PULSE', 'PILLS', 'SOCIAL', 'PROFILE'] },
  { title: 'HO Coach',  views: ['COACH_DASH', 'ATHLETE_DETAIL', 'ASSIGN_MACRO'] },
  { title: 'Volta',     views: ['VOLTA_HOME', 'VOLTA_PREWOD'] },
];

function ProductSwitcher() {
  const { product, setProduct } = useProduct();
  const { navigate } = useNav();
  return (
    <div style={{
      position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      display: 'flex', gap: 4, padding: 3,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <button
        onClick={() => { setProduct('holy-oly'); navigate('HOME'); }}
        style={{
          padding: '4px 11px', borderRadius: 11,
          fontSize: 10, fontWeight: 800, letterSpacing: '.06em',
          background: product === 'holy-oly' ? 'linear-gradient(135deg,#FFD700,#B8860B)' : 'transparent',
          color: product === 'holy-oly' ? '#07070F' : '#FFD700',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >HOLY OLY</button>
      <button
        onClick={() => { setProduct('volta'); navigate('VOLTA_HOME'); }}
        style={{
          padding: '4px 11px', borderRadius: 11,
          fontSize: 10, fontWeight: 800, letterSpacing: '.06em',
          background: product === 'volta' ? 'linear-gradient(135deg,#00E5FF,#0070FF)' : 'transparent',
          color: product === 'volta' ? '#07070F' : '#00E5FF',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >VOLTA</button>
    </div>
  );
}

function AppInner() {
  const { currentView, navigate } = useNav();
  const { product } = useProduct();

  const renderView = () => {
    // Volta routes
    if (product === 'volta') {
      switch (currentView) {
        case 'VOLTA_PREWOD': return <VoltaPreWod />;
        case 'VOLTA_HOME':
        case 'HOME':
        default:             return <VoltaDashboard />;
      }
    }
    // Holy Oly routes
    switch (currentView) {
      case 'LOGIN':           return <Login onSuccess={() => navigate('HOME')} />;
      case 'ONBOARDING':     return <Onboarding />;
      case 'PREMIUM':        return <Premium />;
      case 'HOME':           return <AtletaHome />;
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
      default:               return <AtletaHome />;
    }
  };

  const handleNavChange = (tab: NavTab) => {
    if (product === 'volta') {
      if (tab === 'home') navigate('VOLTA_HOME');
      else if (tab === 'wod') navigate('VOLTA_PREWOD');
      // stats/logros/profile: future
      return;
    }
    const map: Partial<Record<NavTab, View>> = {
      home: 'HOME', train: 'WARMUP', stats: 'PERFORMANCE', profile: 'PROFILE',
    };
    const dest = map[tab];
    if (dest) navigate(dest);
  };

  return (
    <div className="relative">
      <PhoneLayout
        activeNav={NAV_MAP[currentView] ?? 'home'}
        onNavChange={handleNavChange}
        product={product}
      >
        <ProductSwitcher />
        {renderView()}
      </PhoneLayout>

      {/* Dev sidebar */}
      <div
        className="hidden 2xl:flex fixed right-10 top-10 bottom-10 w-56 flex-col gap-4 overflow-y-auto z-50 p-5 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}
      >
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
          UI Explorer · {product === 'volta' ? 'VOLTA' : 'HOLY OLY'}
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

      {/* Mobile switcher */}
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
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AthleteProvider>
          <ProductProvider>
            <NavigationProvider>
              <AppInner />
            </NavigationProvider>
          </ProductProvider>
        </AthleteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

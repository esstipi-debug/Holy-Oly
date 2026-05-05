import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AthleteProvider } from './context/AthleteContext';
import PhoneLayout from './layouts/PhoneLayout';
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

type View =
  | 'LOGIN' | 'ONBOARDING' | 'PREMIUM'
  | 'HOME' | 'SUMMARY' | 'WARMUP' | 'SESSION' | 'VICTORY'
  | 'PERFORMANCE' | 'INDEX' | 'SCHEDULE' | 'PULSE' | 'PILLS' | 'SOCIAL' | 'PROFILE'
  | 'COACH_DASH' | 'ATHLETE_DETAIL' | 'ASSIGN_MACRO';

const NAV_MAP: Record<string, 'home' | 'train' | 'stats' | 'profile'> = {
  HOME: 'home',
  WARMUP: 'train', SESSION: 'train', SUMMARY: 'train', VICTORY: 'train',
  PERFORMANCE: 'stats', INDEX: 'stats', SCHEDULE: 'stats', PULSE: 'stats', PILLS: 'stats', SOCIAL: 'stats',
  PROFILE: 'profile', ONBOARDING: 'profile', PREMIUM: 'profile',
};

const navGroups = [
  { title: 'Core Flow', views: ['ONBOARDING', 'PREMIUM'] },
  { title: 'Atleta', views: ['HOME', 'SUMMARY', 'WARMUP', 'SESSION', 'VICTORY'] },
  { title: 'Stats & Social', views: ['PERFORMANCE', 'INDEX', 'SCHEDULE', 'PULSE', 'PILLS', 'SOCIAL', 'PROFILE'] },
  { title: 'Coach', views: ['COACH_DASH', 'ATHLETE_DETAIL', 'ASSIGN_MACRO'] },
];

function AppInner() {
  const { isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('HOME');

  const go = (v: View) => setCurrentView(v);

  if (!isAuthenticated) {
    return (
      <PhoneLayout>
        <Login onSuccess={() => go('HOME')} />
      </PhoneLayout>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'LOGIN':         return <Login onSuccess={() => go('HOME')} />;
      case 'ONBOARDING':   return <Onboarding />;
      case 'PREMIUM':      return <Premium />;
      case 'HOME':         return <AtletaHome />;
      case 'SUMMARY':      return <SessionSummaryPreview />;
      case 'WARMUP':       return <WarmupGenerator />;
      case 'SESSION':      return <ActiveSession />;
      case 'VICTORY':      return <VictoryScreen />;
      case 'PERFORMANCE':  return <PerformanceDeepDive />;
      case 'INDEX':        return <OlyIndex />;
      case 'SCHEDULE':     return <SessionSchedule />;
      case 'PULSE':        return <PulseHub />;
      case 'PILLS':        return <KnowledgePills />;
      case 'SOCIAL':       return <SocialCard />;
      case 'PROFILE':      return <Profile />;
      case 'COACH_DASH':   return <CommandCenter />;
      case 'ATHLETE_DETAIL': return <AthleteDeepDive />;
      case 'ASSIGN_MACRO': return <AssignMacrocycle />;
      default:             return <AtletaHome />;
    }
  };

  const handleNavChange = (tab: 'home' | 'train' | 'stats' | 'profile') => {
    const map: Record<typeof tab, View> = {
      home: 'HOME', train: 'WARMUP', stats: 'PERFORMANCE', profile: 'PROFILE',
    };
    go(map[tab]);
  };

  return (
    <div className="relative">
      <PhoneLayout
        activeNav={NAV_MAP[currentView] ?? 'home'}
        onNavChange={handleNavChange}
      >
        {renderView()}
      </PhoneLayout>

      {/* Dev sidebar — desktop only */}
      <div
        className="hidden 2xl:flex fixed right-10 top-10 bottom-10 w-56 flex-col gap-4 overflow-y-auto z-50 p-5 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
            UI Explorer
          </p>
        </div>
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-tighter pb-1" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--card-border)' }}>
              {group.title}
            </p>
            {group.views.map(v => (
              <button
                key={v}
                onClick={() => go(v as View)}
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
        <button
          onClick={logout}
          className="mt-auto text-[10px] font-bold transition-colors text-left"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          CERRAR SESIÓN
        </button>
      </div>

      {/* Mobile switcher — below phone on small screens */}
      <div className="2xl:hidden fixed bottom-2 left-2 right-2 flex gap-1 z-50 overflow-x-auto p-2 rounded-xl backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid var(--card-border)' }}>
        {navGroups.flatMap(g => g.views).map(v => (
          <button
            key={v}
            onClick={() => go(v as View)}
            className="flex-shrink-0 px-2 py-1 rounded-lg text-[8px] font-black transition-all"
            style={{
              background: currentView === v ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: currentView === v ? 'var(--primary-text)' : 'var(--text-secondary)',
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
          <AppInner />
        </AthleteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

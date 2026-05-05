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

function AppInner() {
  const { isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('HOME');

  if (!isAuthenticated) {
    return (
      <PhoneLayout>
        <Login onSuccess={() => setCurrentView('HOME')} />
      </PhoneLayout>
    );
  }

  const renderView = () => {
    switch(currentView) {
      case 'LOGIN': return <Login onSuccess={() => setCurrentView('HOME')} />;
      case 'ONBOARDING': return <Onboarding />;
      case 'PREMIUM': return <Premium />;
      case 'HOME': return <AtletaHome />;
      case 'SUMMARY': return <SessionSummaryPreview />;
      case 'WARMUP': return <WarmupGenerator />;
      case 'SESSION': return <ActiveSession />;
      case 'VICTORY': return <VictoryScreen />;
      case 'PERFORMANCE': return <PerformanceDeepDive />;
      case 'INDEX': return <OlyIndex />;
      case 'SCHEDULE': return <SessionSchedule />;
      case 'PULSE': return <PulseHub />;
      case 'PILLS': return <KnowledgePills />;
      case 'SOCIAL': return <SocialCard />;
      case 'PROFILE': return <Profile />;
      case 'COACH_DASH': return <CommandCenter />;
      case 'ATHLETE_DETAIL': return <AthleteDeepDive />;
      case 'ASSIGN_MACRO': return <AssignMacrocycle />;
      default: return <AtletaHome />;
    }
  };

  const navGroups = [
    { title: 'Core Flow', views: ['ONBOARDING', 'PREMIUM'] },
    { title: 'Athlete', views: ['HOME', 'SUMMARY', 'WARMUP', 'SESSION', 'VICTORY'] },
    { title: 'Stats & Social', views: ['PERFORMANCE', 'INDEX', 'SCHEDULE', 'PULSE', 'PILLS', 'SOCIAL', 'PROFILE'] },
    { title: 'Coach Portal', views: ['COACH_DASH', 'ATHLETE_DETAIL', 'ASSIGN_MACRO'] },
  ];

  return (
    <div className="relative">
      <PhoneLayout>
        {renderView()}
      </PhoneLayout>

      {/* Sidebar navigation — desktop only */}
      <div className="hidden 2xl:flex fixed right-10 top-10 bottom-10 w-64 bg-[var(--surface)]/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex-col gap-6 overflow-y-auto z-50 shadow-2xl">
        <div>
          <h2 className="text-white text-xs font-black italic mb-1">BECCTOR UI EXPLORER</h2>
          <p className="text-[var(--primary)] text-[9px] font-bold uppercase tracking-widest">PROTOTIPO 100% REACT</p>
        </div>

        {navGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-slate-600 text-[9px] font-black uppercase tracking-tighter border-b border-white/5 pb-1">{group.title}</h3>
            <div className="flex flex-col gap-1">
              {group.views.map(v => (
                <button
                  key={v}
                  onClick={() => setCurrentView(v as View)}
                  className={`text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                    currentView === v ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={logout}
          className="mt-auto text-[10px] font-bold text-slate-600 hover:text-red-400 transition-colors text-left"
        >
          CERRAR SESIÓN
        </button>
      </div>

      {/* Mobile view switcher */}
      <div className="2xl:hidden fixed bottom-4 left-4 right-4 flex gap-2 z-50 overflow-x-auto bg-black/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        {navGroups.flatMap(g => g.views).map(v => (
          <button
            key={v}
            onClick={() => setCurrentView(v as View)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black ${
              currentView === v ? 'bg-[var(--primary)] text-white' : 'bg-white/5 text-slate-500'
            }`}
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

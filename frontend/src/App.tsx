import React, { useState } from 'react';
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
import Premium from './pages/Premium';
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

function App() {
  const [currentView, setCurrentView] = useState<View>('HOME');

  const renderView = () => {
    switch(currentView) {
      case 'LOGIN': return <Login />;
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
    { title: 'Core Flow', views: ['LOGIN', 'ONBOARDING', 'PREMIUM'] },
    { title: 'Athlete', views: ['HOME', 'SUMMARY', 'WARMUP', 'SESSION', 'VICTORY'] },
    { title: 'Stats & Social', views: ['PERFORMANCE', 'INDEX', 'SCHEDULE', 'PULSE', 'PILLS', 'SOCIAL', 'PROFILE'] },
    { title: 'Coach Portal', views: ['COACH_DASH', 'ATHLETE_DETAIL', 'ASSIGN_MACRO'] },
  ];

  return (
    <div className="relative">
      <PhoneLayout>
        {renderView()}
      </PhoneLayout>

      {/* Extreme Prototyper - Sidebar navigation for all implemented screens */}
      <div className="hidden 2xl:flex fixed right-10 top-10 bottom-10 w-64 bg-holy-surface/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex-col gap-6 overflow-y-auto z-50 shadow-2xl">
         <div>
            <h2 className="text-white text-xs font-black italic mb-1">BECCTTOR UI EXPLORER</h2>
            <p className="text-holy-primary text-[9px] font-bold uppercase tracking-widest">PROTOTIPO 100% REACT</p>
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
                      currentView === v ? 'bg-holy-primary/10 text-holy-primary border border-holy-primary/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                   >
                     {v}
                   </button>
                 ))}
              </div>
           </div>
         ))}
      </div>

      {/* Mobile view switcher (visible on smaller screens) */}
      <div className="2xl:hidden fixed bottom-4 left-4 right-4 flex gap-2 z-50 overflow-x-auto bg-black/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
         {navGroups.flatMap(g => g.views).map(v => (
           <button 
            key={v}
            onClick={() => setCurrentView(v as View)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black ${
              currentView === v ? 'bg-holy-primary text-white' : 'bg-white/5 text-slate-500'
            }`}
           >
             {v}
           </button>
         ))}
      </div>
    </div>
  );
}

export default App;

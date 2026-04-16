import React, { useState } from 'react';
import PhoneLayout from './layouts/PhoneLayout';
import AtletaHome from './pages/AtletaHome';
import Login from './pages/Login';
import ActiveSession from './pages/ActiveSession';
import WarmupGenerator from './pages/WarmupGenerator';
import SessionSummaryPreview from './pages/SessionSummaryPreview';
import VictoryScreen from './pages/VictoryScreen';
import OlyIndex from './pages/OlyIndex';

type View = 'LOGIN' | 'HOME' | 'SUMMARY' | 'WARMUP' | 'SESSION' | 'VICTORY' | 'INDEX';

function App() {
  const [currentView, setCurrentView] = useState<View>('HOME');

  const renderView = () => {
    switch(currentView) {
      case 'LOGIN': return <Login />;
      case 'HOME': return <AtletaHome />;
      case 'SUMMARY': return <SessionSummaryPreview />;
      case 'WARMUP': return <WarmupGenerator />;
      case 'SESSION': return <ActiveSession />;
      case 'VICTORY': return <VictoryScreen />;
      case 'INDEX': return <OlyIndex />;
      default: return <AtletaHome />;
    }
  };

  return (
    <div className="relative">
      <PhoneLayout>
        {renderView()}
      </PhoneLayout>

      {/* Vertical Slice Navigator (Floating) */}
      <div className="fixed bottom-4 left-4 right-4 flex gap-2 z-50 overflow-x-auto bg-black/70 p-3 rounded-2xl backdrop-blur-xl border border-white/10 lg:left-auto lg:right-10 lg:bottom-10 lg:w-[400px]">
        {[
          { id: 'LOGIN', label: 'Auth' },
          { id: 'HOME', label: 'Dash' },
          { id: 'SUMMARY', label: 'B4' },
          { id: 'WARMUP', label: 'B5' },
          { id: 'SESSION', label: 'B6' },
          { id: 'VICTORY', label: 'B7' },
          { id: 'INDEX', label: 'B11' }
        ].map((view) => (
          <button 
            key={view.id}
            onClick={() => setCurrentView(view.id as View)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
              currentView === view.id ? 'bg-holy-primary text-white scale-110' : 'bg-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="hidden lg:block fixed left-10 top-10 border-l-2 border-holy-primary pl-4 py-3">
        <p className="text-white text-sm font-black italic">PHASE_2_V_SLICE</p>
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Athlete Journey: Clickable Prototype</p>
      </div>
    </div>
  );
}

export default App;

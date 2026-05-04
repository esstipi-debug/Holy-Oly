import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';

const wod = {
  name: 'Fran',
  description: '21-15-9 · Thrusters (43kg) + Pull-ups',
  estimatedTime: '~8 min',
  type: 'For Time',
};

const VoltaDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full bg-[#04040D]">
      {/* Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-[#00E5FF] text-3xl font-black tracking-tighter">VOLTA</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase">CrossFit Intelligence</p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-xl bg-[#0A0A1A] border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] text-lg"
        >
          ⚡
        </button>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* WOD del día */}
        <Card variant="solid" className="bg-[#00E5FF]/5 border-[#00E5FF]/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#00E5FF] text-[10px] font-black uppercase bg-[#00E5FF]/10 px-3 py-1 rounded-full">
              WOD del día
            </span>
            <span className="text-slate-500 text-[10px] font-bold">{wod.type}</span>
          </div>

          <div>
            <h2 className="text-white text-3xl font-black tracking-tight">{wod.name}</h2>
            <p className="text-slate-400 text-sm mt-1">{wod.description}</p>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span>⏱</span>
              <span>{wod.estimatedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span>🔥</span>
              <span>Alta intensidad</span>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={() => navigate('/volta/session')}
            className="bg-[#00E5FF] hover:bg-[#00C8E0] text-[#04040D] font-black rounded-2xl"
          >
            Iniciar WOD →
          </Button>
        </Card>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'WODs semana', value: '3' },
            { label: 'PR este mes', value: '2' },
            { label: 'Racha', value: '5d' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0A0A1A] border border-[#0F0F2A] rounded-2xl p-3 text-center">
              <p className="text-white text-xl font-black">{s.value}</p>
              <p className="text-slate-600 text-[9px] font-bold uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* WODs recientes */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-slate-400 text-[10px] font-black uppercase">Historial reciente</p>
            <button onClick={() => navigate('/volta/log')} className="text-[#00E5FF] text-[10px] font-bold">Ver todo</button>
          </div>
          <div className="space-y-2">
            {['Helen — 12:34', 'Cindy — 20 rondas', 'Grace — 3:21'].map((entry) => (
              <div key={entry} className="bg-[#0A0A1A] border border-[#0F0F2A] rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-white text-sm font-semibold">{entry.split('—')[0].trim()}</span>
                <span className="text-slate-500 text-xs">{entry.split('—')[1].trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="px-6 py-4 border-t border-[#0F0F2A] flex justify-around">
        {[
          { icon: '🏠', label: 'Inicio', path: '/volta' },
          { icon: '📋', label: 'WOD Log', path: '/volta/log' },
          { icon: '🤖', label: 'Chat IA', path: '/chat' },
          { icon: '👤', label: 'Perfil', path: '/profile' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#00E5FF] transition"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[9px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default VoltaDashboard;

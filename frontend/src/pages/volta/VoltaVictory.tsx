import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';

const VoltaVictory: React.FC = () => {
  const navigate = useNavigate();
  const time = sessionStorage.getItem('volta_time') || '08:42';
  const rounds = sessionStorage.getItem('volta_rounds') || '3';

  return (
    <div className="flex flex-col min-h-full bg-[#04040D] overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#00E5FF]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#00E5FF]/5 rounded-full blur-[100px]" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 space-y-8">
        {/* Trophy */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#00E5FF]/20 blur-3xl rounded-full" />
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#00E5FF] to-[#0099B0] flex items-center justify-center text-5xl shadow-2xl shadow-[#00E5FF]/30 relative border border-white/20">
            ⚡
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-white text-4xl font-black italic tracking-tighter uppercase">WOD COMPLETADO</h1>
          <p className="text-[#00E5FF] text-sm font-bold tracking-[0.15em]">FRAN · FOR TIME</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <Card variant="solid" className="bg-[#00E5FF]/5 border-[#00E5FF]/20 text-center py-4">
            <p className="text-slate-500 text-[9px] font-black uppercase mb-1">Tiempo final</p>
            <p className="text-[#00E5FF] text-3xl font-black font-mono">{time}</p>
          </Card>
          <Card variant="solid" className="bg-white/5 border-white/5 text-center py-4">
            <p className="text-slate-500 text-[9px] font-black uppercase mb-1">Rondas</p>
            <p className="text-white text-3xl font-black">{rounds}</p>
          </Card>
        </div>

        {/* XP earned */}
        <Card variant="glass" className="w-full text-center py-4">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">XP ganada</p>
          <p className="text-white text-2xl font-black">+320 XP</p>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#00E5FF] w-[35%] transition-all duration-1000" />
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="px-6 pb-8 space-y-3 relative z-10">
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/social')}
          className="bg-[#00E5FF] hover:bg-[#00C8E0] text-[#04040D] font-black rounded-2xl"
        >
          Compartir resultado 📱
        </Button>
        <Button fullWidth variant="ghost" className="text-slate-500" onClick={() => navigate('/volta')}>
          Volver al inicio
        </Button>
      </footer>
    </div>
  );
};

export default VoltaVictory;

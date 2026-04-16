import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const AtletaHome: React.FC = () => {
  return (
    <div className="px-6 py-4 space-y-8">
      {/* Header Section */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-black">Hola, Juan</h2>
          <p className="text-slate-500 text-xs font-bold uppercase mt-0.5">Semana 4 · Día 3</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-holy-gold/20 flex items-center justify-center border border-holy-gold/30">
          <span className="text-holy-gold text-sm font-black">74</span>
        </div>
      </header>

      {/* Main Action Card */}
      <Card variant="solid" className="relative border-holy-primary/30 bg-holy-primary/5">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Badge variant="success" dot>Entrenamiento Hoy</Badge>
            <span className="text-slate-500 text-[10px] font-bold uppercase">10:00 — 12:00</span>
          </div>
          
          <div>
            <h3 className="text-white text-xl font-bold">Snatch Complex + Overhaul</h3>
            <p className="text-slate-500 text-sm mt-1">Énfasis: Velocidad de pies y estabilidad.</p>
          </div>

          <div className="pt-2">
            <Button fullWidth variant="primary" size="lg">
              INICIAR SESIÓN →
            </Button>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md" variant="glass" className="space-y-2">
          <p className="text-slate-500 text-[10px] font-black uppercase">Readiness</p>
          <div className="flex items-end gap-1">
            <span className="text-white text-2xl font-black">8.4</span>
            <span className="text-green-500 text-[9px] font-bold mb-1.5">+0.2</span>
          </div>
        </Card>
        <Card padding="md" variant="glass" className="space-y-2">
          <p className="text-slate-500 text-[10px] font-black uppercase">Fatiga (Banister)</p>
          <div className="flex items-end gap-1">
            <span className="text-white text-2xl font-black">Lows</span>
            <span className="text-slate-600 text-[9px] font-bold mb-1.5">SAFE</span>
          </div>
        </Card>
      </div>

      {/* Secondary Section - Shield */}
      <Card variant="solid" className="border-red-500/20 bg-red-500/[0.02] flex gap-4 items-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-xl">
          🛡️
        </div>
        <div className="flex-1">
          <h4 className="text-white text-sm font-bold">Injury Shield</h4>
          <p className="text-slate-500 text-[11px]">Tendón de Aquiles (L) cargado.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-400">Ver</Button>
      </Card>

      {/* Social / Motivation */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h4 className="text-slate-400 text-xs font-black uppercase">Actividad Club</h4>
          <span className="text-holy-primary text-[10px] font-bold cursor-pointer">Ver todo</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[140px] h-40 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-end">
              <div className="w-8 h-8 rounded-lg bg-slate-800 mb-auto" />
              <p className="text-white text-xs font-bold">Miguel A.</p>
              <p className="text-slate-600 text-[10px]">C&J 145kg ✅</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AtletaHome;

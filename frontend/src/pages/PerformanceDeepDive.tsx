import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';

const PerformanceDeepDive: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#07070F]">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
           <div>
              <h1 className="text-white text-2xl font-black italic tracking-tighter">PERFORMANCE</h1>
              <p className="text-holy-primary text-[10px] font-black uppercase mt-1">ANÁLISIS DE DATOS HISTÓRICOS</p>
           </div>
           <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
              <button className="px-3 py-1 bg-slate-800 text-white text-[9px] font-bold rounded-md">W</button>
              <button className="px-3 py-1 text-slate-500 text-[9px] font-bold rounded-md">M</button>
              <button className="px-3 py-1 text-slate-500 text-[9px] font-bold rounded-md">Y</button>
           </div>
        </header>

        {/* Big Metric Card */}
        <Card variant="solid" className="bg-gradient-to-br from-holy-primary/10 to-transparent border-holy-primary/30 mb-8 overflow-hidden relative">
           <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-holy-primary/10 rounded-full blur-3xl" />
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Volume Load (Semanal)</p>
           <div className="flex items-baseline gap-2">
              <span className="text-white text-5xl font-black italic">14.2k</span>
              <span className="text-holy-primary text-sm font-bold">KG</span>
           </div>
           <p className="text-green-500 text-[10px] font-bold mt-2 uppercase tracking-wide">▲ 12% vs Semana Pasada</p>
        </Card>

        {/* Intensity Chart Mockup */}
        <div className="space-y-4 mb-10">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Intensidad Media Relativa</h3>
           <Card variant="glass" className="h-48 flex items-end justify-between px-6 pb-2">
              {[40, 75, 60, 85, 95, 70, 50].map((h, i) => (
                <div key={i} className="w-6 space-y-2">
                   <p className="text-center text-[8px] text-slate-500 font-bold">{h}%</p>
                   <div 
                    className={`w-full rounded-t-lg transition-all duration-1000 ${h > 80 ? 'bg-red-500' : 'bg-holy-primary'}`} 
                    style={{ height: `${(h/100) * 120}px` }} 
                   />
                   <p className="text-center text-[8px] text-slate-700 font-bold">D{i+1}</p>
                </div>
              ))}
           </Card>
        </div>

        {/* PR Distribution */}
        <div className="space-y-4 mb-20">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Distribución de Levantamientos</h3>
           <div className="grid grid-cols-2 gap-4">
              <Card variant="solid" className="p-4 bg-holy-surface border-slate-800">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">🏋️</span>
                    <Badge variant="info">SNATCH</Badge>
                 </div>
                 <p className="text-white text-xs font-bold">Best: 112 kg</p>
                 <p className="text-slate-600 text-[10px]">Ratio S/C: 78%</p>
              </Card>
              <Card variant="solid" className="p-4 bg-holy-surface border-slate-800">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">💥</span>
                    <Badge variant="info">C&J</Badge>
                 </div>
                 <p className="text-white text-xs font-bold">Best: 145 kg</p>
                 <p className="text-slate-600 text-[10px]">Rep. Max: 130x3</p>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDeepDive;

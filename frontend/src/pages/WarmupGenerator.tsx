import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const WarmupGenerator: React.FC = () => {
  const [phase, setPhase] = useState<'MOBILITY' | 'SPECIFIC' | 'RAMP'>('SPECIFIC');

  const items = [
    { name: 'Muscle Snatch', info: '2 series × 10 reps (Barra vacía)', status: 'done' },
    { name: 'Snatch Balance', info: '3 series × 5 reps (Control de pies)', status: 'active' },
    { name: 'Power Snatch + OHS', info: '2 series × 3+3 reps (Fluidez)', status: 'pending' },
  ];

  return (
    <div className="flex flex-col h-full bg-holy-bg">
      <div className="px-6 py-4 flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-holy-surface border border-slate-800 flex items-center justify-center text-slate-400">←</div>
             <div>
               <h2 className="text-white text-lg font-black">Calentamiento</h2>
               <p className="text-holy-primary text-[10px] font-bold">READYNESS_AWARE</p>
             </div>
          </div>
          <button className="text-slate-500 text-xs font-bold hover:text-white transition-colors">OMITIR</button>
        </header>

        {/* Phase Tabs */}
        <div className="flex gap-1 bg-holy-surface p-1 rounded-xl mb-6">
          {(['MOBILITY', 'SPECIFIC', 'RAMP'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                phase === p ? 'bg-slate-800 text-white' : 'text-slate-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Phase Info */}
        <div className="mb-6">
          <p className="text-slate-400 text-sm leading-relaxed">
            Preparamos el patrón de <span className="text-white font-bold">Arrancada</span> con ejercicios técnicos de baja carga.
          </p>
        </div>

        {/* List */}
        <div className="space-y-4">
           {items.map((item, i) => (
             <Card 
               key={i} 
               variant={item.status === 'active' ? 'glass' : 'solid'} 
               padding="sm"
               className={`flex items-center gap-4 transition-all ${item.status === 'done' ? 'opacity-40' : ''} ${item.status === 'active' ? 'border-holy-primary/40 ring-1 ring-holy-primary/10' : ''}`}
             >
               <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                 item.status === 'done' ? 'bg-holy-primary border-holy-primary' : 'border-slate-800'
               }`}>
                 {item.status === 'done' && <span className="text-white text-[10px]">✓</span>}
               </div>
               <div className="flex-1">
                 <p className="text-white text-sm font-bold">{item.name}</p>
                 <p className="text-slate-500 text-[11px]">{item.info}</p>
               </div>
               {item.status === 'active' && <span className="animate-spin text-holy-primary text-xs">🔄</span>}
             </Card>
           ))}

           {/* Ramp-up Indicator */}
           <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Aproximación</span>
              <div className="h-px flex-1 bg-slate-800" />
           </div>

           <Card variant="solid" padding="sm" className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-slate-800" />
              <div className="flex-1">
                <p className="text-slate-200 text-sm font-bold">Serie 1</p>
                <p className="text-slate-500 text-[11px]">3 reps · 45% 1RM</p>
              </div>
              <p className="text-holy-primary font-black text-lg">40 kg</p>
           </Card>
        </div>

        {/* Timer Rest */}
        <div className="mt-8 mb-24 bg-holy-primary/10 border border-holy-primary/20 rounded-2xl p-4 flex items-center gap-4">
           <span className="text-2xl">⏱️</span>
           <div>
             <p className="text-white text-xs font-bold">Siguiente: Descanso 45s</p>
             <p className="text-holy-primary/60 text-[10px]">Mantén pulsaciones en Zona 2</p>
           </div>
        </div>
      </div>

      {/* Footer CTA */}
      <footer className="absolute bottom-6 left-6 right-6">
        <Button fullWidth variant="primary" size="lg">FINALIZAR CALENTAMIENTO →</Button>
      </footer>
    </div>
  );
};

export default WarmupGenerator;

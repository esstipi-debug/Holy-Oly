import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';

const ActiveSession: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header / Timer */}
      <header className="px-6 py-4 flex justify-between items-center bg-holy-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-holy-surface border border-slate-800 flex items-center justify-center">
             <span className="text-slate-400 text-xs">←</span>
          </div>
          <div>
            <h2 className="text-white text-sm font-bold">Snatch + OHS</h2>
            <p className="text-holy-primary text-[10px] font-black uppercase">Bloque A · Serie 1/4</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-[10px] font-bold">CRONO</p>
          <p className="text-white text-lg font-black tabular-nums">42:15</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-32">
        {/* Exercise Info */}
        <div className="space-y-4">
          <Card variant="outline" padding="sm" className="border-holy-primary/10">
            <p className="text-slate-400 text-xs leading-relaxed">
              <span className="text-holy-primary font-bold">Coach Note:</span> Mantén el pecho alto en el catch. No te precipites en la subida del OHS.
            </p>
          </Card>
        </div>

        {/* Logging Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-white text-base font-black">LOGGING</h3>
            <Badge variant="ghost">Target: 85kg</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Peso (KG)" 
              placeholder="85"
              step="0.5"
              type="number"
            />
            <Input 
              label="Reps" 
              placeholder="2"
              type="number"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth>FALLO</Button>
            <Button variant="primary" fullWidth>COMPLETAR</Button>
          </div>
        </div>

        {/* History / Previous Sets */}
        <div className="space-y-3">
          <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Historial Bloque A</h4>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/50">
              <span className="text-slate-400 text-xs font-bold">Set {i}</span>
              <div className="flex gap-4">
                <span className="text-white text-xs font-black">80 kg</span>
                <span className="text-holy-primary text-xs font-black">2 reps</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Persistence Bar / Footer CTA */}
      <footer className="absolute bottom-20 left-6 right-6 pb-4">
        <Button variant="gold" fullWidth size="lg">
          SIGUIENTE EJERCICIO →
        </Button>
      </footer>
    </div>
  );
};

export default ActiveSession;

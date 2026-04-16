import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const CommandCenter: React.FC = () => {
  const athletes = [
    { name: 'Miguel Arias', readiness: 9.4, status: 'TRAINING', block: 'Snatch 85%', mood: '🔥' },
    { name: 'Lorena C.', readiness: 4.2, status: 'FATIGUED', block: 'Rest Advised', mood: '😴' },
    { name: 'Juan Pérez', readiness: 7.8, status: 'WARMUP', block: 'C&J Tech', mood: '⚡' },
    { name: 'Dani G.', readiness: 6.5, status: 'IDLE', block: '-', mood: '😐' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#07070F]">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-white text-2xl font-black">Command Center</h1>
            <p className="text-holy-cyan text-[10px] font-black uppercase tracking-widest mt-1">VISTA GLOBAL DEL EQUIPO</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
            📡
          </div>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
           <Card variant="glass" padding="sm" className="text-center">
              <p className="text-white text-lg font-black italic">14</p>
              <p className="text-slate-600 text-[8px] font-black uppercase">Atletas</p>
           </Card>
           <Card variant="glass" padding="sm" className="text-center">
              <p className="text-holy-primary text-lg font-black italic">8</p>
              <p className="text-slate-600 text-[8px] font-black uppercase">Activos</p>
           </Card>
           <Card variant="glass" padding="sm" className="text-center">
              <p className="text-red-500 text-lg font-black italic">2</p>
              <p className="text-slate-600 text-[8px] font-black uppercase">Fatiga High</p>
           </Card>
        </div>

        {/* Athlete List / Pulse */}
        <div className="space-y-4">
           <div className="flex justify-between items-center mb-2">
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Estado en Tiempo Real</h3>
              <Badge variant="ghost">Live 📹</Badge>
           </div>

           {athletes.map((athlete, i) => (
             <Card 
               key={i} 
               variant="solid" 
               padding="sm" 
               className="hover:border-holy-cyan/30 cursor-pointer group"
             >
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-black text-sm">
                         {athlete.name[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-holy-bg flex items-center justify-center text-[8px] ${
                        athlete.status === 'FATIGUED' ? 'bg-red-500' : 'bg-holy-primary'
                      }`}>
                         {athlete.mood}
                      </div>
                   </div>
                   
                   <div className="flex-1">
                      <p className="text-white text-sm font-bold group-hover:text-holy-cyan transition-colors">{athlete.name}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">{athlete.block}</p>
                   </div>

                   <div className="text-right">
                      <p className={`text-lg font-black italic leading-none ${
                        athlete.readiness > 8 ? 'text-holy-primary' : athlete.readiness < 5 ? 'text-red-500' : 'text-holy-gold'
                      }`}>
                        {athlete.readiness}
                      </p>
                      <p className="text-slate-600 text-[8px] font-black uppercase">Ready</p>
                   </div>
                </div>
                
                {athlete.status === 'FATIGUED' && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                     <Button variant="danger" size="sm" className="flex-1 text-[9px]">Sugerir Descanso</Button>
                     <Button variant="secondary" size="sm" className="flex-1 text-[9px]">Ver Deep Dive</Button>
                  </div>
                )}
             </Card>
           ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <footer className="p-6 bg-holy-surface/80 backdrop-blur-xl border-t border-slate-800/50 flex gap-3">
         <Button variant="ghost" fullWidth className="text-holy-cyan font-black italic">PROG. MASIVA</Button>
         <Button variant="primary" fullWidth className="shadow-holy-cyan/20 bg-holy-cyan">NUEVO ATLETA +</Button>
      </footer>
    </div>
  );
};

export default CommandCenter;

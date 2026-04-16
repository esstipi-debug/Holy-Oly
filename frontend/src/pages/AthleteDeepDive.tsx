import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const AthleteDeepDive: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#07070F]">
      {/* Top Profile Header */}
      <div className="bg-holy-surface px-6 pt-12 pb-8 rounded-b-[40px] border-b border-slate-800">
         <header className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">←</div>
            <Badge variant="success">ACTIVO</Badge>
         </header>
         
         <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-holy-cyan/20 border-2 border-holy-cyan/30 flex items-center justify-center text-3xl">🧘‍♂️</div>
            <div>
               <h1 className="text-white text-2xl font-black italic">David "Beast" G.</h1>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Escuela: Bulgarian (Weightlifting)</p>
               <div className="flex gap-2 mt-2">
                  <span className="text-holy-cyan text-[10px] font-black uppercase">Lv. 32</span>
                  <span className="text-slate-700 text-[10px] font-black uppercase">·</span>
                  <span className="text-slate-500 text-[10px] font-black uppercase">Weight: 84.5kg</span>
               </div>
            </div>
         </div>
      </div>

      <div className="px-6 py-8 space-y-8 flex-1 overflow-y-auto pb-32">
         {/* Critical Metrics Grid */}
         <div className="grid grid-cols-2 gap-4">
            <Card variant="glass" className="border-red-500/20">
               <p className="text-slate-500 text-[9px] font-black uppercase mb-1">Fatiga (Banister)</p>
               <p className="text-red-500 text-2xl font-black italic">CRASH</p>
               <p className="text-[10px] text-slate-400 mt-1">Descanso sugerido: 48h</p>
            </Card>
            <Card variant="glass" className="border-holy-primary/20">
               <p className="text-slate-500 text-[9px] font-black uppercase mb-1">Readiness Avg</p>
               <p className="text-holy-primary text-2xl font-black italic">8.2</p>
               <p className="text-[10px] text-slate-400 mt-1">Consistencia: 94%</p>
            </Card>
         </div>

         {/* Chart Mockup (Volume/Intensity) */}
         <div className="space-y-4">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">Carga Semanal (ATL/CTL)</h3>
            <Card variant="solid" className="h-40 flex items-end gap-2 px-6">
               {[40, 60, 45, 90, 80, 55, 30].map((h, i) => (
                 <div key={i} className="flex-1 space-y-1">
                    <div className="w-full bg-holy-cyan/10 rounded-t-sm relative" style={{ height: `${h}%` }}>
                       <div className="absolute inset-x-0 bottom-0 bg-holy-cyan rounded-t-sm" style={{ height: '30%' }} />
                    </div>
                    <p className="text-center text-[8px] text-slate-700 font-bold">{['L','M','X','J','V','S','D'][i]}</p>
                 </div>
               ))}
            </Card>
         </div>

         {/* RM List */}
         <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
               <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">RM's Registradas</h3>
               <span className="text-holy-cyan text-[10px] font-bold">Ver Todo</span>
            </div>
            <div className="space-y-2">
               {[
                 { lift: 'Clean & Jerk', rm: '145 kg', change: '+5kg', date: '2d ago' },
                 { lift: 'Back Squat', rm: '190 kg', change: '0kg', date: '1w ago' },
                 { lift: 'Snatch', rm: '112 kg', change: '+2kg', date: '5d ago' },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-holy-surface rounded-2xl border border-slate-800/50">
                    <div>
                       <p className="text-white text-sm font-bold">{item.lift}</p>
                       <p className="text-slate-600 text-[10px] uppercase font-bold">{item.date}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-white text-base font-black italic">{item.rm}</p>
                       <p className="text-holy-primary text-[10px] font-bold">{item.change}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Floating Action Buttons */}
      <footer className="fixed bottom-10 left-10 right-10 flex gap-3">
         <Button variant="danger" fullWidth size="lg">RESET MACRO</Button>
         <Button variant="gold" fullWidth size="lg">ENVIAR FEEDBACK</Button>
      </footer>
    </div>
  );
};

export default AthleteDeepDive;

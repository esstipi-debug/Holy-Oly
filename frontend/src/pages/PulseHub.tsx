import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const PulseHub: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#07070F]">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
           <div>
              <h1 className="text-white text-2xl font-black italic tracking-tighter">PULSE HUB</h1>
              <Badge variant="danger" dot>8 Atletas Online</Badge>
           </div>
           <div className="w-10 h-10 rounded-full bg-holy-primary/10 border border-holy-primary/20 flex items-center justify-center animate-pulse">
              <span className="text-holy-primary text-lg">📡</span>
           </div>
        </header>

        {/* Live Challenges */}
        <section className="space-y-4 mb-10">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Retos Globales (EMOM/AMRAP)</h3>
           <Card variant="glass" padding="none" className="border-holy-primary/30 overflow-hidden">
              <div className="bg-holy-primary/10 p-5 border-b border-holy-primary/20 flex justify-between items-center">
                 <div>
                    <h4 className="text-white text-base font-black">THE DROP-OFF CHALLENGE</h4>
                    <p className="text-holy-primary text-[10px] font-bold uppercase">Sincronizado: 12:00 PM</p>
                 </div>
                 <div className="text-right">
                    <p className="text-white text-lg font-black tabular-nums">14:25</p>
                    <p className="text-slate-500 text-[8px] font-bold">PARA CIERRE</p>
                 </div>
              </div>
              <div className="p-5 flex justify-between items-center">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(x => <div key={x} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-holy-bg flex items-center justify-center text-[8px] font-black text-white">U{x}</div>)}
                    <div className="w-8 h-8 rounded-full bg-holy-primary border-2 border-holy-bg flex items-center justify-center text-[8px] font-black text-white">+4</div>
                 </div>
                 <Button variant="primary" size="sm">UNIRSE AL PULSE</Button>
              </div>
           </Card>
        </section>

        {/* Global Shoutouts / Feed */}
        <section className="space-y-4 mb-20">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Actividad Reciente</h3>
           <div className="space-y-3">
             {[
               { user: 'Miguel A.', action: 'completó Mad Russian (W3)', time: '2m', color: 'bg-indigo-500' },
               { user: 'Lorena C.', action: 'alcanzó PR en Snatch Balance (95kg)', time: '15m', color: 'bg-pink-500' },
               { user: 'Dani G.', action: 'inició sesión: Prep. Campeonato', time: '1h', color: 'bg-amber-500' },
             ].map((post, i) => (
               <Card key={i} variant="solid" padding="sm" className="bg-white/[0.02]">
                  <div className="flex gap-4 items-center">
                     <div className={`w-10 h-10 rounded-2xl ${post.color} flex items-center justify-center text-white font-black text-xs shadow-lg shadow-black/40`}>
                        {post.user[0]}
                     </div>
                     <div className="flex-1">
                        <p className="text-white text-xs font-bold leading-tight">
                          {post.user} <span className="text-slate-400 font-normal">{post.action}</span>
                        </p>
                        <p className="text-slate-600 text-[9px] font-bold uppercase mt-1">{post.time} AGO</p>
                     </div>
                     <span className="text-lg">👏</span>
                  </div>
               </Card>
             ))}
           </div>
        </section>
      </div>

      <nav className="h-[76px] bg-holy-surface border-t border-slate-800/50 flex items-center justify-around pb-4">
         <div className="flex flex-col items-center gap-1 opacity-40">
            <div className="w-6 h-6 rounded-lg bg-slate-800" />
            <span className="text-[10px] text-slate-500 font-bold">Home</span>
         </div>
         <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-lg bg-holy-primary/10 border border-holy-primary/20" />
            <span className="text-[10px] text-holy-primary font-bold">Pulse</span>
         </div>
         <div className="flex flex-col items-center gap-1 opacity-40">
            <div className="w-6 h-6 rounded-lg bg-slate-800" />
            <span className="text-[10px] text-slate-500 font-bold">Stats</span>
         </div>
      </nav>
    </div>
  );
};

export default PulseHub;

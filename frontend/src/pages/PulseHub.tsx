import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

const ACTIONS = [
  'completó complejo Arrancada (3+1)',
  'alcanzó PR en Snatch (+2kg)',
  'inició sesión: Prep. Campeonato',
  'logró 12 días de racha',
  'pasó a Cinturón Púrpura',
];
const TIMES = ['2m', '15m', '1h', '3h', '5h'];
const COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500'];

const PulseHub: React.FC = () => {
  const { navigate } = useNav();
  const { athlete, allAthletes } = useAthlete();
  const others = allAthletes.filter(a => a.id !== athlete?.id).slice(0, 5);
  const feed = others.map((a, i) => ({
    user: `${a.name.split(' ')[0]} ${a.name.split(' ')[1]?.[0] ?? ''}.`,
    action: ACTIONS[i % ACTIONS.length],
    time: TIMES[i % TIMES.length],
    color: COLORS[i % COLORS.length],
  }));
  return (
    <div className="flex flex-col h-full bg-holy-bg">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pt-10">
           <div>
              <h1 className="text-holy-text text-2xl font-black italic tracking-tighter">PULSE HUB</h1>
              <Badge variant="danger" dot>{others.length} Atletas Online</Badge>
           </div>
           <div className="w-10 h-10 rounded-full bg-holy-primary/10 border border-holy-primary/20 flex items-center justify-center animate-pulse">
              <span className="text-holy-primary text-lg">📡</span>
           </div>
        </header>

        {/* Live Challenges */}
        <section className="space-y-4 mb-10">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Retos del Club · Halterofilia</h3>
           <Card variant="glass" padding="none" className="border-holy-primary/30 overflow-hidden">
              <div className="bg-holy-primary/10 p-5 border-b border-holy-primary/20 flex justify-between items-center gap-3">
                 <div className="min-w-0 flex-1 overflow-hidden">
                    <h4 className="text-holy-text text-base font-black truncate">MAX SNATCH DEL DÍA</h4>
                    <p className="text-holy-primary text-[10px] font-bold uppercase truncate">Ventana: 12:00 PM – 18:00</p>
                 </div>
                 <div className="text-right flex-shrink-0">
                    <p className="text-holy-text text-lg font-black tabular-nums">14:25</p>
                    <p className="text-holy-text-secondary text-[8px] font-bold">PARA CIERRE</p>
                 </div>
              </div>
              <div className="p-5 flex justify-between items-center">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(x => <div key={x} className="w-8 h-8 rounded-full bg-holy-surface border-2 border-holy-bg flex items-center justify-center text-[8px] font-black text-holy-text">U{x}</div>)}
                    <div className="w-8 h-8 rounded-full bg-holy-primary border-2 border-holy-bg flex items-center justify-center text-[8px] font-black text-holy-text">+4</div>
                 </div>
                 <Button variant="primary" size="sm" onClick={() => navigate('SESSION')}>UNIRSE AL PULSE</Button>
              </div>
           </Card>
        </section>

        {/* Global Shoutouts / Feed */}
        <section className="space-y-4 mb-20">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Actividad Reciente</h3>
           <div className="space-y-3">
             {feed.map((post, i) => (
               <Card key={i} variant="solid" padding="sm" className="bg-white/[0.02]">
                  <div className="flex gap-4 items-center">
                     <div className={`w-10 h-10 rounded-2xl ${post.color} flex items-center justify-center text-holy-text font-black text-xs shadow-lg shadow-black/40`}>
                        {post.user[0]}
                     </div>
                     <div className="flex-1">
                        <p className="text-holy-text text-xs font-bold leading-tight">
                          {post.user} <span className="text-holy-text-secondary font-normal">{post.action}</span>
                        </p>
                        <p className="text-holy-text-secondary text-[9px] font-bold uppercase mt-1">{post.time} AGO</p>
                     </div>
                     <span className="text-lg">👏</span>
                  </div>
               </Card>
             ))}
           </div>
        </section>
      </div>

    </div>
  );
};

export default PulseHub;

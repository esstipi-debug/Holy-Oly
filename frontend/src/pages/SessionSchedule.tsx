import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useNav } from '../context/NavigationContext';

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const SESSIONS = ['Snatch + OHS', 'C&J + Front Squat', 'Snatch Speed', 'Rest Day', 'Max Effort C&J', 'Technique Drills', 'Rest Day'];

const SessionSchedule: React.FC = () => {
  const { navigate } = useNav();
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const days = SESSIONS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isPast = d.toDateString() !== today.toDateString() && d < today;
    const isToday = d.toDateString() === today.toDateString();
    return {
      day: DAY_LABELS[d.getDay()],
      date: d.getDate(),
      month: MONTH_LABELS[d.getMonth()],
      status: isToday ? 'ACTIVE' : isPast ? 'DONE' : 'PENDING',
      label,
    };
  });

  return (
    <div className="flex flex-col h-full bg-holy-bg">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="mb-8 flex items-center gap-3">
           
           <div>
              <h1 className="text-holy-text text-2xl font-black">Planificación</h1>
              <p className="text-holy-primary text-[10px] font-black uppercase mt-1">Semana 4 · Macrociclo Búlgaro</p>
           </div>
        </header>

        {/* Calendar Strip */}
        <div className="flex justify-between items-center mb-10 overflow-x-auto pb-4 scrollbar-hide">
           {days.map((d, i) => (
             <div key={i} className="flex flex-col items-center gap-2 min-w-[50px]">
                <p className="text-holy-text-secondary text-[9px] font-black uppercase">{d.day}</p>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all ${
                  d.status === 'ACTIVE' ? 'bg-holy-primary border-holy-primary text-holy-text shadow-lg shadow-holy-primary/20' : 
                  d.status === 'DONE' ? 'bg-holy-surface/50 border-holy-surface2 text-holy-text-secondary' :
                  'bg-holy-surface border-holy-surface text-holy-text-secondary'
                }`}>
                   {d.date}
                </div>
                {d.status === 'ACTIVE' && <div className="w-1 h-1 rounded-full bg-holy-primary" />}
             </div>
           ))}
        </div>

        {/* Detailed List */}
        <div className="space-y-4 mb-6">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Próximas Sesiones</h3>
           {days.filter(d => d.status === 'PENDING' || d.status === 'ACTIVE').map((d, i) => (
             <Card key={i} variant={d.status === 'ACTIVE' ? 'glass' : 'solid'} className={`${d.status === 'ACTIVE' ? 'border-holy-primary/30' : ''} cursor-pointer`} onClick={() => navigate('WARMUP')}>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${d.label === 'Rest Day' ? 'bg-holy-surface' : 'bg-holy-primary'}`} />
                      <div>
                         <p className="text-holy-text text-sm font-bold">{d.label}</p>
                         <p className="text-holy-text-secondary text-[10px] uppercase font-bold">{d.day} {d.date} {d.month} · 10:00 AM</p>
                      </div>
                   </div>
                   {d.label !== 'Rest Day' ? (
                     <Badge variant="info">LOG</Badge>
                   ) : (
                     <span className="text-lg">💤</span>
                   )}
                </div>
             </Card>
           ))}
        </div>

        <div className="px-1 pb-6">
           <Button
             fullWidth variant="secondary" size="lg"
             className="border-holy-primary/20 text-holy-primary font-black italic"
             onClick={() => navigate('PROFILE')}
           >SOLICITAR REPROGRAMACIÓN</Button>
        </div>
      </div>
    </div>
  );
};

export default SessionSchedule;

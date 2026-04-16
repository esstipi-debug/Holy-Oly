import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const SessionSchedule: React.FC = () => {
  const days = [
    { day: 'LUN', date: 15, status: 'DONE', label: 'Snatch + OHS' },
    { day: 'MAR', date: 16, status: 'DONE', label: 'C&J + Front Squat' },
    { day: 'MIE', date: 17, status: 'ACTIVE', label: 'Snatch Speed' },
    { day: 'JUE', date: 18, status: 'PENDING', label: 'Rest Day' },
    { day: 'VIE', date: 19, status: 'PENDING', label: 'Max Effort C&J' },
    { day: 'SAB', date: 20, status: 'PENDING', label: 'Technique Drills' },
    { day: 'DOM', date: 21, status: 'PENDING', label: 'Rest Day' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#07070F]">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="mb-8">
           <h1 className="text-white text-2xl font-black">Planificación</h1>
           <p className="text-holy-primary text-[10px] font-black uppercase mt-1">Semana 4 · Macrociclo Búlgaro</p>
        </header>

        {/* Calendar Strip */}
        <div className="flex justify-between items-center mb-10 overflow-x-auto pb-4 scrollbar-hide">
           {days.map((d, i) => (
             <div key={i} className="flex flex-col items-center gap-2 min-w-[50px]">
                <p className="text-slate-600 text-[9px] font-black uppercase">{d.day}</p>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all ${
                  d.status === 'ACTIVE' ? 'bg-holy-primary border-holy-primary text-white shadow-lg shadow-holy-primary/20' : 
                  d.status === 'DONE' ? 'bg-slate-800/50 border-slate-700 text-slate-500' :
                  'bg-holy-surface border-slate-800 text-slate-700'
                }`}>
                   {d.date}
                </div>
                {d.status === 'ACTIVE' && <div className="w-1 h-1 rounded-full bg-holy-primary" />}
             </div>
           ))}
        </div>

        {/* Detailed List */}
        <div className="space-y-4 mb-20">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Próximas Sesiones</h3>
           {days.filter(d => d.status === 'PENDING' || d.status === 'ACTIVE').map((d, i) => (
             <Card key={i} variant={d.status === 'ACTIVE' ? 'glass' : 'solid'} className={d.status === 'ACTIVE' ? 'border-holy-primary/30' : ''}>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${d.label === 'Rest Day' ? 'bg-slate-800' : 'bg-holy-primary'}`} />
                      <div>
                         <p className="text-white text-sm font-bold">{d.label}</p>
                         <p className="text-slate-600 text-[10px] uppercase font-bold">{d.day} {d.date} Abr · 10:00 AM</p>
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
      </div>

      <footer className="absolute bottom-6 left-6 right-6">
         <Button fullWidth variant="secondary" size="lg" className="border-holy-primary/20 text-holy-primary font-black italic">SOLICITAR REPROGRAMACIÓN</Button>
      </footer>
    </div>
  );
};

export default SessionSchedule;

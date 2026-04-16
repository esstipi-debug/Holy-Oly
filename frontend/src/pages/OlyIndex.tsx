import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';

const OlyIndex: React.FC = () => {
  const leaderboards = [
    { rank: 1, name: 'Miguel Arias', level: 'Elite', score: 9.8, initials: 'MA', color: 'bg-purple-600' },
    { rank: 2, name: 'Lorena C.', level: 'Elite', score: 9.5, initials: 'LC', color: 'bg-pink-600' },
    { rank: 12, name: 'Juan Pérez (Tú)', level: 'Avanzado', score: 7.4, initials: 'JP', color: 'bg-green-600', me: true },
  ];

  return (
    <div className="flex flex-col h-full bg-[#07070F] overflow-hidden">
      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <header className="mb-8 flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-holy-surface border border-slate-800 flex items-center justify-center text-slate-400">←</div>
           <h1 className="text-white text-xl font-black">OLY Index</h1>
        </header>

        {/* Global Score Card */}
        <Card variant="solid" className="bg-gradient-to-br from-holy-gold/10 to-transparent border-holy-gold/30 text-center py-8 mb-8">
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tu Puntuación Global</p>
           <div className="text-holy-gold text-6xl font-black italic tracking-tighter">7.4</div>
           <Badge variant="gold" className="mt-4 px-4">TOP 14% DEL CLUB</Badge>
           
           <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-holy-gold/10">
              <div>
                 <p className="text-slate-600 text-[9px] font-black uppercase">Ranking</p>
                 <p className="text-white text-lg font-black">#12 / 85</p>
              </div>
              <div>
                 <p className="text-slate-600 text-[9px] font-black uppercase">Nivel</p>
                 <p className="text-white text-lg font-black italic">AVANZADO</p>
              </div>
           </div>
        </Card>

        {/* Breakdown */}
        <div className="space-y-6 mb-10">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Análisis de Rendimiento</h3>
           
           {[
             { label: '🏋️ Fuerza Absoluta', score: 8.2, percent: '82%' },
             { label: '⚡ Eficiencia (S/C)', score: 6.9, percent: '69%' },
             { label: '📉 Consistencia', score: 9.1, percent: '91%' },
           ].map(item => (
             <div key={item.label} className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-slate-200 text-xs font-bold">{item.label}</span>
                   <span className="text-holy-gold text-sm font-black">{item.score}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                   <div className="h-full bg-holy-gold transition-all duration-700" style={{ width: item.percent }} />
                </div>
             </div>
           ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-4 mb-20">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Leaderboard Club</h3>
           <div className="space-y-2">
              {leaderboards.map((user) => (
                <Card 
                  key={user.rank} 
                  variant="solid" 
                  padding="sm" 
                  className={`${user.me ? 'bg-holy-gold/5 border-holy-gold/20' : 'bg-holy-surface'} flex items-center gap-4`}
                >
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${user.rank <= 3 ? 'bg-holy-gold text-holy-bg' : 'bg-slate-800 text-slate-500'}`}>
                      {user.rank}
                   </div>
                   <div className={`w-10 h-10 rounded-full ${user.color} flex items-center justify-center text-white text-xs font-black`}>
                      {user.initials}
                   </div>
                   <div className="flex-1">
                      <p className={`text-sm font-bold ${user.me ? 'text-holy-gold' : 'text-white'}`}>{user.name}</p>
                      <p className="text-slate-600 text-[10px] uppercase font-bold">{user.level}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-white text-base font-black italic">{user.score}</p>
                   </div>
                </Card>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OlyIndex;

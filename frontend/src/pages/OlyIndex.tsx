import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

const olyScore = (a: { maxes: { snatch: number; body_weight: number } }) =>
  a.maxes.body_weight > 0 ? +(a.maxes.snatch / a.maxes.body_weight * 2.5).toFixed(1) : 7.4;

const levelOf = (score: number) =>
  score >= 9 ? 'Elite' : score >= 7 ? 'Avanzado' : score >= 5 ? 'Intermedio' : 'Básico';

const COLORS = ['bg-purple-600', 'bg-pink-600', 'bg-emerald-600', 'bg-amber-600', 'bg-cyan-600'];

const OlyIndex: React.FC = () => {
  useNav();
  const { athlete, allAthletes } = useAthlete();

  const myScore = athlete ? olyScore(athlete) : 7.4;
  const ranked = [...allAthletes]
    .map(a => ({ ...a, score: olyScore(a) }))
    .sort((a, b) => b.score - a.score);
  const myRank = Math.max(1, ranked.findIndex(a => a.id === athlete?.id) + 1);
  const pctTop = Math.max(1, Math.round(myRank / ranked.length * 100));

  const top = ranked.slice(0, 5).map((a, i) => ({
    rank: i + 1,
    name: a.id === athlete?.id ? `${a.name.split(' ')[0]} (Tú)` : a.name,
    level: levelOf(a.score),
    score: a.score,
    initials: a.name.split(' ').slice(0, 2).map(n => n[0]).join(''),
    color: COLORS[i % COLORS.length],
    me: a.id === athlete?.id,
  }));
  const leaderboards = top.some(l => l.me) || !athlete
    ? top
    : [...top, {
        rank: myRank,
        name: `${athlete.name.split(' ')[0]} (Tú)`,
        level: levelOf(myScore),
        score: myScore,
        initials: athlete.name.split(' ').slice(0, 2).map(n => n[0]).join(''),
        color: 'bg-green-600',
        me: true,
      }];

  return (
    <div className="flex flex-col h-full bg-holy-bg overflow-hidden">
      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <header className="mb-8 flex items-center gap-3">
           
           <h1 className="text-holy-text text-xl font-black">OLY Index</h1>
        </header>

        {/* Global Score Card */}
        <Card variant="solid" className="bg-gradient-to-br from-holy-gold/10 to-transparent border-holy-gold/30 text-center py-8 mb-8">
           <p className="text-holy-text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tu Puntuación Global</p>
           <div className="text-holy-gold text-6xl font-black italic tracking-tighter">{myScore}</div>
           <Badge variant="gold" className="mt-4 px-4">TOP {pctTop}% DEL CLUB</Badge>

           <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-holy-gold/10">
              <div>
                 <p className="text-holy-text-secondary text-[9px] font-black uppercase">Ranking</p>
                 <p className="text-holy-text text-lg font-black">#{myRank} / {ranked.length}</p>
              </div>
              <div>
                 <p className="text-holy-text-secondary text-[9px] font-black uppercase">Nivel</p>
                 <p className="text-holy-text text-lg font-black italic">{levelOf(myScore).toUpperCase()}</p>
              </div>
           </div>
        </Card>

        {/* Breakdown */}
        <div className="space-y-6 mb-10">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Análisis de Rendimiento</h3>
           
           {(() => {
             const m = athlete?.maxes;
             const bw = m?.body_weight ?? 80;
             const strength = m ? Math.min(10, (m.clean + m.jerk - m.clean + m.snatch) / bw / 2 * 10) : 8.2;
             const eff = m ? Math.min(10, (m.snatch / m.clean) * 12) : 6.9;
             const sess = athlete?.sessions_last_7 ?? [];
             const cons = sess.length > 0 ? +(sess.filter(s => s.completed).length / sess.length * 10).toFixed(1) : 9.1;
             return [
               { label: '🏋️ Fuerza Absoluta', score: +strength.toFixed(1), percent: `${Math.round(strength * 10)}%` },
               { label: '⚡ Eficiencia (S/C)', score: +eff.toFixed(1),     percent: `${Math.round(eff * 10)}%` },
               { label: '📉 Consistencia',     score: cons,                  percent: `${Math.round(cons * 10)}%` },
             ];
           })().map(item => (
             <div key={item.label} className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-holy-text-secondary text-xs font-bold">{item.label}</span>
                   <span className="text-holy-gold text-sm font-black">{item.score}</span>
                </div>
                <div className="h-1.5 w-full bg-holy-surface rounded-full overflow-hidden">
                   <div className="h-full bg-holy-gold transition-all duration-700" style={{ width: item.percent }} />
                </div>
             </div>
           ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-4 mb-20">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Leaderboard Club</h3>
           <div className="space-y-2">
              {leaderboards.map((user) => (
                <Card 
                  key={user.rank} 
                  variant="solid" 
                  padding="sm" 
                  className={`${user.me ? 'bg-holy-gold/5 border-holy-gold/20' : 'bg-holy-surface'} flex items-center gap-4`}
                >
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${user.rank <= 3 ? 'bg-holy-gold text-holy-bg' : 'bg-holy-surface text-holy-text-secondary'}`}>
                      {user.rank}
                   </div>
                   <div className={`w-10 h-10 rounded-full ${user.color} flex items-center justify-center text-holy-text text-xs font-black`}>
                      {user.initials}
                   </div>
                   <div className="flex-1">
                      <p className={`text-sm font-bold ${user.me ? 'text-holy-gold' : 'text-holy-text'}`}>{user.name}</p>
                      <p className="text-holy-text-secondary text-[10px] uppercase font-bold">{user.level}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-holy-text text-base font-black italic">{user.score}</p>
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

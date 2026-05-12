import React, { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

type Range = 'W' | 'M' | 'Y';
const RANGE_DATA: Record<Range, { volume: string; trend: string; bars: number[]; labels: string[] }> = {
  W: { volume: '14.2k', trend: '▲ 12% vs semana pasada', bars: [40, 75, 60, 85, 95, 70, 50], labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] },
  M: { volume: '58.7k', trend: '▲ 8% vs mes pasado',    bars: [60, 70, 85, 78],                  labels: ['Sem1', 'Sem2', 'Sem3', 'Sem4'] },
  Y: { volume: '684k',  trend: '▲ 34% vs año pasado',   bars: [50, 55, 62, 70, 75, 80, 85, 78, 82, 88, 90, 86], labels: ['E','F','M','A','M','J','J','A','S','O','N','D'] },
};

const PerformanceDeepDive: React.FC = () => {
  useNav();
  const { athlete } = useAthlete();
  const [range, setRange] = useState<Range>('W');
  const data = RANGE_DATA[range];
  const snatchBest = athlete?.maxes.snatch ?? 112;
  const cjBest = athlete ? (athlete.maxes.clean + athlete.maxes.jerk - athlete.maxes.clean) : 145;
  const sRatio = athlete ? Math.round((athlete.maxes.snatch / athlete.maxes.clean) * 100) : 78;
  return (
    <div className="flex flex-col h-full bg-holy-bg">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
           <div className="flex items-center gap-3">
              
              <div>
                 <h1 className="text-holy-text text-2xl font-black italic tracking-tighter">PERFORMANCE</h1>
                 <p className="text-holy-primary text-[10px] font-black uppercase mt-1">ANÁLISIS DE DATOS HISTÓRICOS</p>
              </div>
           </div>
           <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
              {(['W', 'M', 'Y'] as Range[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                    range === r ? 'bg-holy-surface text-holy-text' : 'text-holy-text-secondary hover:text-holy-text'
                  }`}
                >{r}</button>
              ))}
           </div>
        </header>

        {/* Big Metric Card */}
        <Card variant="solid" className="bg-gradient-to-br from-holy-primary/10 to-transparent border-holy-primary/30 mb-8 overflow-hidden relative">
           <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-holy-primary/10 rounded-full blur-3xl" />
           <p className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest mb-2">Volume Load ({range === 'W' ? 'Semanal' : range === 'M' ? 'Mensual' : 'Anual'})</p>
           <div className="flex items-baseline gap-2">
              <span className="text-holy-text text-5xl font-black italic">{data.volume}</span>
              <span className="text-holy-primary text-sm font-bold">KG</span>
           </div>
           <p className="text-green-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{data.trend}</p>
        </Card>

        {/* Intensity Chart Mockup */}
        <div className="space-y-4 mb-10">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Intensidad Media Relativa</h3>
           <Card variant="glass" className="h-48 flex items-end justify-between px-4 pb-2 gap-1">
              {data.bars.map((h, i) => (
                <div key={i} className="flex-1 space-y-2">
                   <p className="text-center text-[8px] text-holy-text-secondary font-bold">{h}%</p>
                   <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${h > 80 ? 'bg-red-500' : 'bg-holy-primary'}`}
                    style={{ height: `${(h/100) * 120}px` }}
                   />
                   <p className="text-center text-[8px] text-holy-text-secondary font-bold">{data.labels[i]}</p>
                </div>
              ))}
           </Card>
        </div>

        {/* PR Distribution */}
        <div className="space-y-4 mb-20">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Distribución de Levantamientos</h3>
           <div className="grid grid-cols-2 gap-4">
              <Card variant="solid" className="p-4 bg-holy-surface border-holy-surface">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">🏋️</span>
                    <Badge variant="info">SNATCH</Badge>
                 </div>
                 <p className="text-holy-text text-xs font-bold">Best: {snatchBest} kg</p>
                 <p className="text-holy-text-secondary text-[10px]">Ratio S/C: {sRatio}%</p>
              </Card>
              <Card variant="solid" className="p-4 bg-holy-surface border-holy-surface">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">💥</span>
                    <Badge variant="info">C&J</Badge>
                 </div>
                 <p className="text-holy-text text-xs font-bold">Best: {cjBest} kg</p>
                 <p className="text-holy-text-secondary text-[10px]">Rep. Max: {Math.round(cjBest * 0.9)}x3</p>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDeepDive;

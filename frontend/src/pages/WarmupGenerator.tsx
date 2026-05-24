import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNav } from '../context/NavigationContext';

type Phase = 'MOBILITY' | 'SPECIFIC' | 'RAMP';
type Status = 'done' | 'active' | 'pending';

const PHASE_ITEMS: Record<Phase, { name: string; info: string }[]> = {
  MOBILITY: [
    { name: 'Cat-Cow + T-spine',  info: '2 series × 8 reps · Movilidad torácica' },
    { name: 'Hip 90/90',           info: '6 reps por lado · Apertura cadera' },
    { name: 'Squat to stand',      info: '2 × 8 reps · Cadena posterior' },
  ],
  SPECIFIC: [
    { name: 'Muscle Snatch',       info: '2 series × 10 reps · Barra vacía' },
    { name: 'Snatch Balance',      info: '3 series × 5 reps · Control de pies' },
    { name: 'Power Snatch + OHS',  info: '2 series × 3+3 reps · Fluidez' },
  ],
  RAMP: [
    { name: 'Snatch @ 50% 1RM',    info: '3 reps · Aproximación' },
    { name: 'Snatch @ 65% 1RM',    info: '2 reps · Subida progresiva' },
    { name: 'Snatch @ 75% 1RM',    info: '1 rep · Última antes del work set' },
  ],
};

const WarmupGenerator: React.FC = () => {
  const { navigate } = useNav();
  const [phase, setPhase] = useState<Phase>('SPECIFIC');
  // Track completion per phase
  const [done, setDone] = useState<Record<Phase, number[]>>({ MOBILITY: [], SPECIFIC: [0], RAMP: [] });

  const items = PHASE_ITEMS[phase].map((it, i) => {
    const phaseDone = done[phase];
    let status: Status = 'pending';
    if (phaseDone.includes(i)) status = 'done';
    else if (i === Math.min(...PHASE_ITEMS[phase].map((_, idx) => idx).filter(idx => !phaseDone.includes(idx)))) status = 'active';
    return { ...it, status, idx: i };
  });

  const toggleItem = (i: number) => {
    setDone(prev => {
      const cur = prev[phase];
      const next = cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i];
      return { ...prev, [phase]: next };
    });
  };

  const phaseDoneCount = done[phase].length;
  const phaseTotal = PHASE_ITEMS[phase].length;
  const phaseLabel = phase === 'MOBILITY' ? 'movilidad general' : phase === 'SPECIFIC' ? 'el patrón de Arrancada' : 'ramp-up al peso de trabajo';

  return (
    <div className="flex flex-col h-full bg-holy-bg">
      <div className="px-6 py-4 flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div>
               <h2 className="text-holy-text text-lg font-black">Calentamiento</h2>
               <p className="text-holy-primary text-[10px] font-bold uppercase tracking-wider">Adaptado a tu readiness</p>
             </div>
          </div>
          <button onClick={() => navigate('SESSION')} className="text-holy-text-secondary text-xs font-bold hover:text-holy-text transition-colors">OMITIR</button>
        </header>

        {/* Phase Tabs */}
        <div className="flex gap-1 bg-holy-surface p-1 rounded-xl mb-6">
          {(['MOBILITY', 'SPECIFIC', 'RAMP'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                phase === p ? 'bg-holy-surface text-holy-text' : 'text-holy-text-secondary'
              }`}
            >
              {p} {done[p].length === PHASE_ITEMS[p].length ? '✓' : `${done[p].length}/${PHASE_ITEMS[p].length}`}
            </button>
          ))}
        </div>

        {/* Phase Info */}
        <div className="mb-6">
          <p className="text-holy-text-secondary text-sm leading-relaxed">
            Preparamos <span className="text-holy-text font-bold">{phaseLabel}</span> · {phaseDoneCount}/{phaseTotal} hechos
          </p>
        </div>

        {/* List */}
        <div className="space-y-4">
           {items.map((item) => (
             <Card
               key={item.idx}
               variant={item.status === 'active' ? 'glass' : 'solid'}
               padding="sm"
               className={`flex items-center gap-4 transition-all cursor-pointer ${item.status === 'done' ? 'opacity-40' : ''} ${item.status === 'active' ? 'border-holy-primary/40 ring-1 ring-holy-primary/10' : ''}`}
               onClick={() => toggleItem(item.idx)}
             >
               <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                 item.status === 'done' ? 'bg-holy-primary border-holy-primary' : 'border-holy-surface'
               }`}>
                 {item.status === 'done' && <span className="text-holy-text text-[10px]">✓</span>}
               </div>
               <div className="flex-1">
                 <p className="text-holy-text text-sm font-bold">{item.name}</p>
                 <p className="text-holy-text-secondary text-[11px]">{item.info}</p>
               </div>
               {item.status === 'active' && <span className="text-holy-primary text-xs">●</span>}
             </Card>
           ))}

           {/* Ramp-up Indicator */}
           <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-holy-surface" />
              <span className="text-holy-text-secondary text-[9px] font-black uppercase tracking-widest">Aproximación</span>
              <div className="h-px flex-1 bg-holy-surface" />
           </div>

           <Card variant="solid" padding="sm" className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-holy-surface" />
              <div className="flex-1">
                <p className="text-holy-text-secondary text-sm font-bold">Serie 1</p>
                <p className="text-holy-text-secondary text-[11px]">3 reps · 45% 1RM</p>
              </div>
              <p className="text-holy-primary font-black text-lg">40 kg</p>
           </Card>
        </div>

        {/* Timer Rest */}
        <div className="mt-8 mb-24 bg-holy-primary/10 border border-holy-primary/20 rounded-2xl p-4 flex items-center gap-4">
           <span className="text-2xl">⏱️</span>
           <div>
             <p className="text-holy-text text-xs font-bold">Siguiente: Descanso 45s</p>
             <p className="text-holy-primary/60 text-[10px]">Mantén pulsaciones en Zona 2</p>
           </div>
        </div>
      </div>

      {/* Footer CTA con backdrop */}
      <footer
        className="absolute left-0 right-0 z-30"
        style={{
          bottom: 76,
          padding: '14px 24px 12px',
          background: 'linear-gradient(to top, var(--bg) 0%, var(--bg) 65%, transparent 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Button fullWidth variant="primary" size="lg" onClick={() => navigate('SESSION')}>FINALIZAR CALENTAMIENTO →</Button>
      </footer>
    </div>
  );
};

export default WarmupGenerator;

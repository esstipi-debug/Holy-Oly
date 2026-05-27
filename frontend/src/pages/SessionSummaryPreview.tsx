import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useNav } from '../context/NavigationContext';

const SessionSummaryPreview: React.FC = () => {
  const { navigate } = useNav();
  const workout = {
    title: 'Snatch Day: Speed Focus',
    tags: ['Olympic', 'Technical', 'High Speed'],
    blocks: [
      { id: 'A', name: 'Snatch Balance', details: '3x3 @ 75%', color: 'border-holy-primary' },
      { id: 'B', name: 'Power Snatch', details: '5x2 @ 80%', color: 'border-holy-gold' },
      { id: 'C', name: 'Snatch Drills', details: 'Accessory', color: 'border-holy-cyan' },
    ]
  };

  return (
    <div className="relative flex flex-col h-full bg-holy-bg">
      <div className="px-6 py-6 flex-1 overflow-y-auto" style={{ paddingBottom: 110 }}>
        {/* Header */}
        <header className="mb-8">
          
          <Badge variant="gold" dot className="mb-3">Sesión Programada</Badge>
          <h1 className="text-holy-text text-3xl font-black italic tracking-tighter leading-none">{workout.title}</h1>
          <div className="flex gap-2 mt-4">
             {workout.tags.map(t => <span key={t} className="text-[10px] font-bold text-holy-text-secondary bg-holy-surface px-2 py-0.5 rounded-md">#{t}</span>)}
          </div>
        </header>

        {/* Coach Voice Section */}
        <div className="mb-8">
           <Card variant="solid" className="bg-holy-surface/50 border-holy-surface">
              <div className="flex gap-4 items-center mb-3">
                 <div className="w-10 h-10 rounded-full bg-holy-gold/20 border border-holy-gold/30 flex items-center justify-center text-lg">👨‍🏫</div>
                 <div>
                    <p className="text-holy-text text-sm font-bold">Coach B.</p>
                    <p className="text-holy-text-secondary text-[10px]">INSTRUCCIÓN TÉCNICA</p>
                 </div>
              </div>
              <p className="text-holy-text-secondary text-sm leading-relaxed italic">
                "Hoy no buscamos kilos máximos. Buscamos <span className="text-holy-gold italic">violencia</span> en la extensión. Si la barra no suena al caer, estás yendo lento."
              </p>
           </Card>
        </div>

        {/* Block List */}
        <div className="space-y-4">
           <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">Estructura del MDW</h3>
           {workout.blocks.map(block => (
             <Card key={block.id} variant="glass" padding="sm" className={`border-l-4 ${block.color}`}>
                <div className="flex justify-between items-center">
                   <div>
                      <p className="text-holy-text-secondary text-[10px] font-bold">BLOQUE {block.id}</p>
                      <p className="text-holy-text text-base font-bold">{block.name}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-holy-text font-black text-sm">{block.details}</p>
                      <p className="text-holy-text-secondary text-[9px] font-bold uppercase">Target</p>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        {/* Requirements */}
        <div className="mt-8 grid grid-cols-2 gap-4">
           <div className="p-4 bg-holy-surface rounded-2xl border border-holy-surface">
              <p className="text-2xl mb-2">⏱️</p>
              <p className="text-holy-text text-xs font-bold">90 min</p>
              <p className="text-holy-text-secondary text-[9px] uppercase font-bold">Duración Est.</p>
           </div>
           <div className="p-4 bg-holy-surface rounded-2xl border border-holy-surface">
              <p className="text-2xl mb-2">🔥</p>
              <p className="text-holy-text text-xs font-bold">750 kCal</p>
              <p className="text-holy-text-secondary text-[9px] uppercase font-bold">Esfuerzo Est.</p>
           </div>
        </div>
      </div>

      {/* Footer CTA sticky con backdrop · 76px se reserva para la bottom nav del PhoneLayout */}
      <footer
        className="absolute left-0 right-0 z-30"
        style={{
          bottom: 76,
          padding: '14px 24px calc(env(safe-area-inset-bottom, 0px) + 12px)',
          background: 'linear-gradient(to top, var(--bg) 0%, var(--bg) 65%, transparent 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
         <Button fullWidth variant="primary" size="lg" onClick={() => navigate('WARMUP')}>EMPEZAR CALENTAMIENTO</Button>
      </footer>
    </div>
  );
};

export default SessionSummaryPreview;

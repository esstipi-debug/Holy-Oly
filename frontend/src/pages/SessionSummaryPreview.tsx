import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const SessionSummaryPreview: React.FC = () => {
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
    <div className="flex flex-col h-full bg-holy-bg pb-10">
      <div className="px-6 py-6 flex-1 overflow-y-auto">
        {/* Header */}
        <header className="mb-8">
          <Badge variant="gold" dot className="mb-3">Sesión Programada</Badge>
          <h1 className="text-white text-3xl font-black italic tracking-tighter leading-none">{workout.title}</h1>
          <div className="flex gap-2 mt-4">
             {workout.tags.map(t => <span key={t} className="text-[10px] font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded-md">#{t}</span>)}
          </div>
        </header>

        {/* Coach Voice Section */}
        <div className="mb-8">
           <Card variant="solid" className="bg-slate-900/50 border-slate-800">
              <div className="flex gap-4 items-center mb-3">
                 <div className="w-10 h-10 rounded-full bg-holy-gold/20 border border-holy-gold/30 flex items-center justify-center text-lg">👨‍🏫</div>
                 <div>
                    <p className="text-white text-sm font-bold">Coach B.</p>
                    <p className="text-slate-500 text-[10px]">INSTRUCCIÓN TÉCNICA</p>
                 </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed italic">
                "Hoy no buscamos kilos máximos. Buscamos <span className="text-holy-gold italic">violencia</span> en la extensión. Si la barra no suena al caer, estás yendo lento."
              </p>
           </Card>
        </div>

        {/* Block List */}
        <div className="space-y-4">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Estructura del MDW</h3>
           {workout.blocks.map(block => (
             <Card key={block.id} variant="glass" padding="sm" className={`border-l-4 ${block.color}`}>
                <div className="flex justify-between items-center">
                   <div>
                      <p className="text-slate-500 text-[10px] font-bold">BLOQUE {block.id}</p>
                      <p className="text-white text-base font-bold">{block.name}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-white font-black text-sm">{block.details}</p>
                      <p className="text-slate-600 text-[9px] font-bold uppercase">Target</p>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        {/* Requirements */}
        <div className="mt-8 grid grid-cols-2 gap-4">
           <div className="p-4 bg-holy-surface rounded-2xl border border-slate-800">
              <p className="text-2xl mb-2">⏱️</p>
              <p className="text-white text-xs font-bold">90 min</p>
              <p className="text-slate-600 text-[9px] uppercase font-bold">Duración Est.</p>
           </div>
           <div className="p-4 bg-holy-surface rounded-2xl border border-slate-800">
              <p className="text-2xl mb-2">🔥</p>
              <p className="text-white text-xs font-bold">750 kCal</p>
              <p className="text-slate-600 text-[9px] uppercase font-bold">Esfuerzo Est.</p>
           </div>
        </div>
      </div>

      {/* Footer CTA */}
      <footer className="p-6 pt-2">
         <Button fullWidth variant="primary" size="lg">EMPEZAR CALENTAMIENTO</Button>
      </footer>
    </div>
  );
};

export default SessionSummaryPreview;

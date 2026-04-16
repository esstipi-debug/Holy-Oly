import React, { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const AssignMacrocycle: React.FC = () => {
  const schools = [
    { id: 'bulgarian', name: 'Bulgarian Method', desc: 'Max Intensity, High Frequency.', color: 'border-red-500' },
    { id: 'soviet', name: 'Soviet System', desc: 'Volume based, technical precision.', color: 'border-holy-cyan' },
    { id: 'chinese', name: 'Chinese School', desc: 'Emphasis on pull and stability.', color: 'border-holy-gold' },
    { id: 'catalyst', name: 'Catalyst Athletics', desc: 'American style periodization.', color: 'border-holy-primary' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#07070F]">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="mb-8">
           <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 mb-4">←</div>
           <h1 className="text-white text-2xl font-black">Asignar Macrociclo</h1>
           <p className="text-slate-500 text-xs font-bold uppercase mt-1">Selecciona la escuela filosófica para el atleta</p>
        </header>

        {/* Selected Athlete Mini-Profile */}
        <Card variant="solid" className="bg-holy-cyan/5 border-holy-cyan/20 flex gap-4 items-center mb-8">
           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs text-holy-cyan">MA</div>
           <div>
              <p className="text-white text-sm font-bold">Miguel Arias</p>
              <p className="text-slate-600 text-[10px] font-bold uppercase">Estado: Sin Macro Activo</p>
           </div>
        </Card>

        {/* School Grid */}
        <div className="space-y-4 mb-20">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Escuelas Disponibles</h3>
           
           {schools.map(school => (
             <Card 
               key={school.id} 
               variant="glass" 
               className={`border-l-4 ${school.color} hover:bg-white/[0.08] cursor-pointer group transition-all`}
             >
                <div className="flex justify-between items-start">
                   <div className="flex-1 pr-4">
                      <h4 className="text-white text-lg font-bold group-hover:text-holy-cyan">{school.name}</h4>
                      <p className="text-slate-500 text-xs mt-1">{school.desc}</p>
                   </div>
                   <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-holy-cyan">
                      <div className="w-3 h-3 rounded-full bg-holy-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                </div>
                
                <div className="mt-4 flex gap-4 border-t border-white/5 pt-4">
                   <div>
                      <p className="text-[8px] font-black text-slate-600 uppercase">Intensidad</p>
                      <div className="flex gap-0.5 mt-1">
                         {[1,2,3,4,5].map(x => <div key={x} className={`w-3 h-1 rounded-full ${x <= 4 ? 'bg-red-500' : 'bg-slate-800'}`} />)}
                      </div>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-600 uppercase">Volumen</p>
                      <div className="flex gap-0.5 mt-1">
                         {[1,2,3,4,5].map(x => <div key={x} className={`w-3 h-1 rounded-full ${x <= 2 ? 'bg-holy-cyan' : 'bg-slate-800'}`} />)}
                      </div>
                   </div>
                </div>
             </Card>
           ))}
        </div>
      </div>

      <footer className="p-6">
         <Button fullWidth variant="primary" size="lg" className="bg-holy-cyan hover:brightness-110 shadow-holy-cyan/20 font-black">CONFIRMAR MACROCICLO</Button>
      </footer>
    </div>
  );
};

export default AssignMacrocycle;

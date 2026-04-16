import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const KnowledgePills: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#07070F] relative overflow-hidden">
      {/* Immersive Background (Simulating a Story) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30" />

      {/* Progress Bars (Story style) */}
      <div className="absolute top-12 left-6 right-6 flex gap-1.5 z-50">
         <div className="h-1 flex-1 bg-white/40 rounded-full overflow-hidden">
            <div className="h-full bg-white w-full" />
         </div>
         <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-1/3" />
         </div>
         <div className="h-1 flex-1 bg-white/20 rounded-full" />
      </div>

      <div className="px-8 py-20 flex-1 flex flex-col justify-end relative z-20 pb-40">
        <Badge variant="gold" className="mb-4 self-start">KNOWLEDGE PILL</Badge>
        <h1 className="text-white text-4xl font-black italic tracking-tighter leading-none mb-6">
          EL "HOOK GRIP" Y LA ESTABILIDAD <br/>DEL CODO
        </h1>
        <p className="text-slate-300 text-base leading-relaxed mb-8">
          El agarre de gancho no solo asegura la barra; activa la cadena cinética del brazo para evitar el "arm-bend" prematuro en el segundo tirón.
        </p>
        
        <Card variant="solid" className="bg-white/5 border-white/10 backdrop-blur-md flex items-center gap-4 py-4 px-6">
           <div className="w-10 h-10 rounded-full bg-holy-primary/20 flex items-center justify-center text-holy-primary font-black">
              +50
           </div>
           <div>
              <p className="text-white text-xs font-black uppercase">RECOMPENSA DE LECTURA</p>
              <p className="text-slate-500 text-[10px] font-bold">XP acreditada al finalizar</p>
           </div>
        </Card>
      </div>

      <footer className="absolute bottom-10 left-8 right-8 z-30 space-y-4">
         <Button fullWidth variant="primary" size="lg">SIGUIENTE TIP →</Button>
         <button className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest">CERRAR PÍLDORA</button>
      </footer>
    </div>
  );
};

export default KnowledgePills;

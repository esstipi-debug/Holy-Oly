import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const VictoryScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#07070F] overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-holy-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-holy-gold/10 rounded-full blur-[100px]" />

      <div className="px-6 py-12 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {/* Main Trophy / Icon */}
        <div className="relative mb-10 scale-125">
          <div className="absolute inset-0 bg-holy-gold/20 blur-3xl rounded-full" />
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-holy-gold to-amber-700 flex items-center justify-center text-6xl shadow-2xl shadow-holy-gold/40 relative border border-white/20">
            🏆
          </div>
          <div className="absolute -bottom-4 -right-4 bg-holy-primary text-white text-xs font-black px-3 py-1 rounded-full border-2 border-holy-bg shadow-xl">
            PR!
          </div>
        </div>

        <header className="space-y-2 mb-10">
          <h1 className="text-white text-4xl font-black italic tracking-tighter uppercase leading-none">SESIÓN COMPLETADA</h1>
          <p className="text-holy-gold text-sm font-bold tracking-[0.2em]">RECOMPENSA DE ÉLITE RECLAMADA</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-10">
          <Card variant="solid" className="bg-white/5 border-white/5">
            <p className="text-slate-500 text-[9px] font-black uppercase mb-1">XP GANADA</p>
            <p className="text-white text-2xl font-black">+450 XP</p>
          </Card>
          <Card variant="solid" className="bg-white/5 border-white/5">
            <p className="text-slate-500 text-[9px] font-black uppercase mb-1">TONELAJE TOTAL</p>
            <p className="text-white text-2xl font-black">4,250 kg</p>
          </Card>
        </div>

        {/* Progress Bars */}
        <Card variant="glass" className="w-full space-y-4">
           <div className="space-y-2">
             <div className="flex justify-between items-end">
               <span className="text-white text-[10px] font-bold">NIVEL 14</span>
               <span className="text-slate-400 text-[10px] font-bold">450 / 1000 XP</span>
             </div>
             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-holy-primary w-[45%] transition-all duration-1000" />
             </div>
           </div>
           
           <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                 <span className="text-xl">🔥</span>
                 <div>
                    <p className="text-white text-xs font-bold text-left">Racha de 12 días</p>
                    <p className="text-slate-500 text-[9px] text-left uppercase">Multiplicador 1.2x ACTIVO</p>
                 </div>
              </div>
              <Badge variant="gold">ELITE</Badge>
           </div>
        </Card>
      </div>

      {/* Footer Buttons */}
      <footer className="p-6 pt-0 space-y-3 relative z-10">
         <Button fullWidth variant="gold" size="lg">COMPARTIR VICTORIA 📱</Button>
         <Button fullWidth variant="ghost" className="text-slate-500">Volver al Dashboard</Button>
      </footer>
    </div>
  );
};

export default VictoryScreen;

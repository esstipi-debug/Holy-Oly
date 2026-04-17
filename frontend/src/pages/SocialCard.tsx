import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const SocialCard: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#07070F] px-8 py-10 items-center justify-center">
      {/* Shareable Card Area */}
      <div className="w-full aspect-[4/5] bg-gradient-to-br from-holy-bg to-holy-surface rounded-[40px] border border-white/10 p-8 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group">
         {/* Decorative Elements */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-holy-gold to-transparent opacity-50" />
         <div className="absolute top-10 right-10 text-6xl opacity-10 blur-sm group-hover:blur-none transition-all duration-700">🏋️</div>

         <div className="text-center w-full">
            <h2 className="text-holy-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4">NUEVO RÉCORD PERSONAL</h2>
            <div className="h-0.5 w-12 bg-holy-gold/30 mx-auto mb-8" />
            <h1 className="text-white text-6xl font-black italic tracking-tighter leading-none">145<span className="text-holy-gold text-2xl not-italic ml-1">KG</span></h1>
            <p className="text-slate-500 text-lg font-bold uppercase mt-2">CLEAN & JERK</p>
         </div>

         <div className="w-full space-y-4">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
               <div>
                  <p className="text-slate-600 text-[9px] font-black uppercase">Atleta</p>
                  <p className="text-white text-sm font-bold">JUAN PÉREZ</p>
               </div>
               <div className="text-right">
                  <p className="text-slate-600 text-[9px] font-black uppercase">Lugar</p>
                  <p className="text-white text-sm font-bold">HOLY OLY CLUB</p>
               </div>
            </div>
            
            <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl">
               <div>
                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest leading-none">Holy Score</p>
                  <p className="text-holy-primary text-xl font-black italic">+42 XP</p>
               </div>
               <div className="w-8 h-8 bg-holy-primary rounded-lg flex items-center justify-center text-white text-xs">
                  ✓
               </div>
            </div>
         </div>

         <div className="w-full flex justify-center mt-2">
            <p className="text-slate-700 text-[9px] font-black italic tracking-tighter">HOLY OLY PLATFORM · SMART TRAINING</p>
         </div>
      </div>

      <div className="w-full mt-10 space-y-4">
         <Button fullWidth variant="primary" size="lg" className="bg-indigo-600 shadow-indigo-500/20">INSTAGRAM STORIES</Button>
         <Button fullWidth variant="secondary" size="lg">GUARDAR EN GALERÍA</Button>
      </div>
    </div>
  );
};

export default SocialCard;

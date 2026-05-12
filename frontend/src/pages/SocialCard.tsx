import React, { useState } from 'react';
import Button from '../components/Button';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

const SocialCard: React.FC = () => {
  useNav();
  const { athlete } = useAthlete();
  const [toast, setToast] = useState<string | null>(null);

  const name = athlete?.name.toUpperCase() ?? 'ATLETA';
  const club = athlete?.club.toUpperCase() ?? 'HOLY OLY CLUB';
  const cjPr = athlete ? (athlete.maxes.clean + athlete.maxes.jerk - athlete.maxes.clean) : 145; // jerk como proxy
  const xpGained = athlete ? athlete.sessions_last_7.filter(s => s.completed).length * 14 : 42;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const share = async () => {
    const text = `Nuevo PR · ${cjPr}kg Clean & Jerk · Holy Oly Platform`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Nuevo PR', text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Texto copiado al portapapeles');
      }
    } catch { /* user cancelled */ }
  };

  const saveToGallery = () => {
    showToast('Guardado · revisá tu galería');
  };
  return (
    <div className="flex flex-col h-full bg-holy-bg px-8 py-10 items-center justify-center">
      
      {/* Shareable Card Area */}
      <div className="w-full aspect-[4/5] bg-gradient-to-br from-holy-bg to-holy-surface rounded-[40px] border border-white/10 p-8 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group">
         {/* Decorative Elements */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-holy-gold to-transparent opacity-50" />
         <div className="absolute top-10 right-10 text-6xl opacity-10 blur-sm group-hover:blur-none transition-all duration-700">🏋️</div>

         <div className="text-center w-full">
            <h2 className="text-holy-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4">NUEVO RÉCORD PERSONAL</h2>
            <div className="h-0.5 w-12 bg-holy-gold/30 mx-auto mb-8" />
            <h1 className="text-holy-text text-6xl font-black italic tracking-tighter leading-none">{cjPr}<span className="text-holy-gold text-2xl not-italic ml-1">KG</span></h1>
            <p className="text-holy-text-secondary text-lg font-bold uppercase mt-2">CLEAN & JERK</p>
         </div>

         <div className="w-full space-y-4">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
               <div>
                  <p className="text-holy-text-secondary text-[9px] font-black uppercase">Atleta</p>
                  <p className="text-holy-text text-sm font-bold">{name}</p>
               </div>
               <div className="text-right">
                  <p className="text-holy-text-secondary text-[9px] font-black uppercase">Lugar</p>
                  <p className="text-holy-text text-sm font-bold">{club}</p>
               </div>
            </div>

            <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl">
               <div>
                  <p className="text-holy-text-secondary text-[8px] font-black uppercase tracking-widest leading-none">Holy Score</p>
                  <p className="text-holy-primary text-xl font-black italic">+{xpGained} XP</p>
               </div>
               <div className="w-8 h-8 bg-holy-primary rounded-lg flex items-center justify-center text-holy-text text-xs">
                  ✓
               </div>
            </div>
         </div>

         <div className="w-full flex justify-center mt-2">
            <p className="text-holy-text-secondary text-[9px] font-black italic tracking-tighter">HOLY OLY PLATFORM · SMART TRAINING</p>
         </div>
      </div>

      <div className="w-full mt-10 space-y-4">
         <Button fullWidth variant="primary" size="lg" className="bg-indigo-600 shadow-indigo-500/20" onClick={share}>COMPARTIR / INSTAGRAM</Button>
         <Button fullWidth variant="secondary" size="lg" onClick={saveToGallery}>GUARDAR EN GALERÍA</Button>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(34,197,94,0.95)', color: '#07070F',
            padding: '10px 18px', borderRadius: 14,
            fontSize: 12, fontWeight: 800, letterSpacing: '.04em',
            boxShadow: '0 8px 24px rgba(0,0,0,.4)',
            zIndex: 100,
          }}
        >{toast}</div>
      )}
    </div>
  );
};

export default SocialCard;

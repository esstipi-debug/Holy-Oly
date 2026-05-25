import React from 'react';
import { useAthlete } from '../context/AthleteContext';

/**
 * Social Card — pantalla full-screen optimizada para screenshot.
 *
 * Diseño viral: el atleta toma screenshot y lo comparte en sus redes.
 * NO tiene botones de share/save porque el screenshot ES el share.
 *
 * TODO siguiente iteración:
 * - Múltiples estilos de visualización (rotativos / seleccionables)
 * - Tracking de screenshot events (visibilitychange + screen capture API)
 * - Diferentes "logros celebrables": PR, racha, tier-up, primer muscle-up, etc
 * - A/B testing para medir cuál genera más screenshots
 */

const SocialCard: React.FC = () => {
  const { athlete } = useAthlete();

  const name = athlete?.name.toUpperCase() ?? 'ATLETA';
  const club = athlete?.club.toUpperCase() ?? 'HOLY OLY CLUB';
  const cjPr = athlete ? (athlete.maxes.clean + athlete.maxes.jerk - athlete.maxes.clean) : 145;
  const xpGained = athlete ? athlete.sessions_last_7.filter(s => s.completed).length * 14 : 42;

  return (
    <div className="flex flex-col h-full bg-holy-bg items-stretch justify-stretch p-0">
      {/* Card edge-to-edge · sin padding · sin botones · para screenshot */}
      <div className="flex-1 bg-gradient-to-br from-holy-bg via-holy-bg to-holy-surface flex flex-col items-center justify-between p-8 relative overflow-hidden">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-holy-gold to-transparent opacity-60" />
        {/* Decorative oversized emoji blur */}
        <div className="absolute top-10 right-6 text-9xl opacity-[0.06] blur-md">🏋️</div>
        <div className="absolute bottom-20 left-6 text-9xl opacity-[0.06] blur-md">💪</div>

        {/* TOP · Brand */}
        <div className="w-full flex justify-between items-start z-10 pt-2">
          <div>
            <p className="text-holy-gold text-[10px] font-black uppercase tracking-[0.3em]">HOLY OLY</p>
            <p className="text-holy-text-secondary text-[8px] font-bold uppercase tracking-widest mt-1">SMART TRAINING</p>
          </div>
          <div className="text-right">
            <p className="text-holy-text-secondary text-[9px] font-bold uppercase tracking-wider">{new Date().toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* CENTER · Hero PR */}
        <div className="text-center w-full z-10">
          <p className="text-holy-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4">⭐ NUEVO RÉCORD PERSONAL ⭐</p>
          <div className="h-0.5 w-16 bg-holy-gold/40 mx-auto mb-8" />
          <h1 className="text-holy-text text-8xl font-black italic tracking-tighter leading-none">
            {cjPr}<span className="text-holy-gold text-3xl not-italic ml-1">KG</span>
          </h1>
          <p className="text-holy-text text-xl font-bold uppercase mt-4 tracking-wider">CLEAN &amp; JERK</p>
          <p className="text-holy-text-secondary text-xs font-bold uppercase tracking-widest mt-2">2× peso corporal · zona élite</p>
        </div>

        {/* BOTTOM · Atleta + Holy Score */}
        <div className="w-full space-y-4 z-10">
          <div className="flex justify-between items-end border-b border-white/10 pb-4">
            <div>
              <p className="text-holy-text-secondary text-[9px] font-black uppercase tracking-wider">ATLETA</p>
              <p className="text-holy-text text-base font-black tracking-tight mt-1">{name}</p>
            </div>
            <div className="text-right">
              <p className="text-holy-text-secondary text-[9px] font-black uppercase tracking-wider">CLUB</p>
              <p className="text-holy-text text-base font-black tracking-tight mt-1">{club}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white/[0.04] backdrop-blur p-4 rounded-2xl border border-white/5">
            <div>
              <p className="text-holy-text-secondary text-[8px] font-black uppercase tracking-widest leading-none">HOLY SCORE</p>
              <p className="text-holy-primary text-2xl font-black italic mt-1">+{xpGained} XP</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-holy-gold to-orange-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-holy-gold/30">
              🏆
            </div>
          </div>

          <p className="text-center text-holy-text-secondary text-[9px] font-black italic tracking-tighter pt-2">
            holyoly.app · #HolyOly #PR{cjPr}kg
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialCard;

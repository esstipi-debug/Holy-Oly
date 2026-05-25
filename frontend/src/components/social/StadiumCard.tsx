import React from 'react';
import type { Celebration } from '../../data/celebrations';
import { ACCENT_HEX } from '../../data/celebrations';
import Chart from './Chart';

interface Props {
  celebration: Celebration;
  athleteName: string;
  club: string;
}

const StadiumCard: React.FC<Props> = ({ celebration: c, athleteName, club }) => {
  const accent = ACCENT_HEX[c.accent];
  const bg = `radial-gradient(ellipse at 50% 30%, ${accent}38 0%, transparent 60%), linear-gradient(180deg, #0A0A14 0%, #050509 100%)`;

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-8 relative overflow-hidden" style={{ background: bg }}>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${accent} 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, ${accent} 0 1px, transparent 1px 40px)`,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}99 0%, transparent 55%)` }}
      />

      <div className="w-full flex justify-between items-start z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: accent }}>HOLY OLY</p>
          <p className="text-white/50 text-[8px] font-bold uppercase tracking-widest mt-1">STADIUM</p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}55` }}
        >
          {new Date(c.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
        </span>
      </div>

      <div className="text-center w-full z-10 flex flex-col items-center">
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center text-7xl mb-6 relative"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${accent} 0%, ${accent}44 60%, transparent 100%)`,
            boxShadow: `0 0 80px ${accent}88, inset 0 -10px 20px rgba(0,0,0,0.4), inset 0 10px 20px rgba(255,255,255,0.2)`,
          }}
        >
          <span className="drop-shadow-2xl">{c.icon}</span>
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{ boxShadow: `0 0 40px ${accent}, 0 0 80px ${accent}66` }}
          />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: accent }}>{c.headline}</p>
        <h1 className="text-white text-7xl font-black italic tracking-tighter leading-none drop-shadow-2xl">
          {c.value}
        </h1>
        <p className="text-base font-black uppercase tracking-widest mt-1" style={{ color: accent }}>{c.unit}</p>
        <p className="text-white text-xl font-black uppercase mt-4 tracking-wider">{c.title}</p>
        {c.context && <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-2">{c.context}</p>}
        {c.chart && (
          <div className="mt-5">
            <Chart data={c.chart} color={accent} width={280} height={c.chart.kind === 'ring' ? 120 : 72} scheme="dark" />
          </div>
        )}
      </div>

      <div className="w-full z-10">
        <div
          className="rounded-2xl p-4 flex justify-between items-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${accent}44`, backdropFilter: 'blur(8px)' }}
        >
          <div>
            <p className="text-white/50 text-[9px] font-black uppercase tracking-wider">ATLETA</p>
            <p className="text-white text-base font-black tracking-tight mt-1">{athleteName}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[9px] font-black uppercase tracking-wider">CLUB</p>
            <p className="text-white text-base font-black tracking-tight mt-1">{club}</p>
          </div>
        </div>
        <p className="text-center text-white/40 text-[9px] font-black italic tracking-tighter pt-3">
          holyoly.app · #{c.hashtag}
        </p>
      </div>
    </div>
  );
};

export default StadiumCard;

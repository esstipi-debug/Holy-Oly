import React from 'react';
import type { Celebration } from '../../data/celebrations';
import { ACCENT_HEX } from '../../data/celebrations';
import Chart from './Chart';

interface Props {
  celebration: Celebration;
  athleteName: string;
  club: string;
}

const MinimalistCard: React.FC<Props> = ({ celebration: c, athleteName, club }) => {
  const accent = ACCENT_HEX[c.accent];

  return (
    <div className="flex-1 bg-gradient-to-br from-holy-bg via-holy-bg to-holy-surface flex flex-col items-center justify-between p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }} />
      <div className="absolute top-10 right-6 text-9xl opacity-[0.06] blur-md">{c.icon}</div>
      <div className="absolute bottom-20 left-6 text-9xl opacity-[0.06] blur-md">{c.icon}</div>

      <div className="w-full flex justify-between items-start z-10 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: accent }}>HOLY OLY</p>
          <p className="text-holy-text-secondary text-[8px] font-bold uppercase tracking-widest mt-1">SMART TRAINING</p>
        </div>
        <p className="text-holy-text-secondary text-[9px] font-bold uppercase tracking-wider">
          {new Date(c.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="text-center w-full z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: accent }}>{c.headline}</p>
        <div className="h-0.5 w-16 mx-auto mb-8" style={{ background: `${accent}66` }} />
        <h1 className="text-holy-text text-8xl font-black italic tracking-tighter leading-none">
          {c.value}<span className="text-3xl not-italic ml-1" style={{ color: accent }}>{c.unit}</span>
        </h1>
        <p className="text-holy-text text-xl font-bold uppercase mt-4 tracking-wider">{c.title}</p>
        {c.context && <p className="text-holy-text-secondary text-xs font-bold uppercase tracking-widest mt-2">{c.context}</p>}
        {c.chart && (
          <div className="mt-6 flex justify-center">
            <Chart data={c.chart} color={accent} width={280} height={c.chart.kind === 'ring' ? 110 : 70} scheme="dark" />
          </div>
        )}
      </div>

      <div className="w-full space-y-4 z-10">
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <p className="text-holy-text-secondary text-[9px] font-black uppercase tracking-wider">ATLETA</p>
            <p className="text-holy-text text-base font-black tracking-tight mt-1">{athleteName}</p>
          </div>
          <div className="text-right">
            <p className="text-holy-text-secondary text-[9px] font-black uppercase tracking-wider">CLUB</p>
            <p className="text-holy-text text-base font-black tracking-tight mt-1">{club}</p>
          </div>
        </div>
        <p className="text-center text-holy-text-secondary text-[9px] font-black italic tracking-tighter pt-2">
          holyoly.app · #{c.hashtag}
        </p>
      </div>
    </div>
  );
};

export default MinimalistCard;

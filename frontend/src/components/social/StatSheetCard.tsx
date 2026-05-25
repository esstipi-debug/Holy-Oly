import React from 'react';
import type { Celebration } from '../../data/celebrations';
import { ACCENT_HEX } from '../../data/celebrations';
import Chart from './Chart';

interface Props {
  celebration: Celebration;
  athleteName: string;
  club: string;
}

const StatSheetCard: React.FC<Props> = ({ celebration: c, athleteName, club }) => {
  const accent = ACCENT_HEX[c.accent];
  const dateStr = new Date(c.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="flex-1 flex flex-col p-0 relative overflow-hidden" style={{ background: '#F4F1EA' }}>
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 28px)' }}
      />

      {/* Header tipo "FIGHT CARD" */}
      <div className="px-6 pt-7 pb-4 border-b-2" style={{ borderColor: '#0A0A14' }}>
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#0A0A14' }}>HOLY OLY · OFFICIAL RECORD</p>
          <p className="text-[10px] font-black tracking-wider" style={{ color: '#0A0A14' }}>{dateStr}</p>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div
            className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl"
            style={{ background: accent, boxShadow: '4px 4px 0 #0A0A14' }}
          >
            {c.icon}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent === '#F5C518' ? '#7A5C00' : accent }}>{c.headline}</p>
            <p className="text-2xl font-black uppercase tracking-tight leading-none mt-1" style={{ color: '#0A0A14' }}>{c.title}</p>
          </div>
        </div>
      </div>

      {/* Hero number — half-page */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <p className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: '#0A0A1499' }}>RESULTADO</p>
        <div className="flex items-baseline mt-2">
          <span className="text-[140px] font-black italic tracking-tighter leading-none" style={{ color: '#0A0A14' }}>{c.value}</span>
          <span className="text-3xl font-black ml-2" style={{ color: accent === '#F5C518' ? '#7A5C00' : accent }}>{c.unit}</span>
        </div>
        {c.context && (
          <p className="text-[11px] font-bold uppercase tracking-widest mt-2" style={{ color: '#0A0A1499' }}>{c.context}</p>
        )}
      </div>

      {/* Chart · stat-sheet usa scheme light */}
      {c.chart && (
        <div className="px-6 pb-3 flex justify-center">
          <Chart data={c.chart} color={accent === '#F5C518' ? '#7A5C00' : accent} width={300} height={c.chart.kind === 'ring' ? 110 : 70} scheme="light" />
        </div>
      )}

      {/* Stat sheet table */}
      {c.stats && c.stats.length > 0 && (
        <div className="px-6 py-4 border-t-2 border-b-2" style={{ borderColor: '#0A0A14' }}>
          {c.stats.map((row, i) => (
            <div
              key={row.label}
              className="flex justify-between items-center py-2"
              style={{ borderTop: i === 0 ? 'none' : '1px dashed #0A0A1433' }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#0A0A1499' }}>{row.label}</span>
              <span className="text-sm font-black tracking-tight" style={{ color: '#0A0A14' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer · firmas tipo ficha */}
      <div className="px-6 pt-4 pb-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#0A0A1499' }}>ATLETA</p>
            <p className="text-sm font-black uppercase mt-1" style={{ color: '#0A0A14' }}>{athleteName}</p>
            <div className="h-0.5 w-32 mt-1" style={{ background: '#0A0A14' }} />
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#0A0A1499' }}>CLUB</p>
            <p className="text-sm font-black uppercase mt-1" style={{ color: '#0A0A14' }}>{club}</p>
            <div className="h-0.5 w-32 mt-1 ml-auto" style={{ background: '#0A0A14' }} />
          </div>
        </div>
        <p className="text-center text-[9px] font-black italic tracking-tight pt-4" style={{ color: '#0A0A1466' }}>
          holyoly.app · #{c.hashtag}
        </p>
      </div>
    </div>
  );
};

export default StatSheetCard;

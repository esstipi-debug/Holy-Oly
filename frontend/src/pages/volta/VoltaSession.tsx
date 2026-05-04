import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const VoltaSession: React.FC = () => {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleFinish = () => {
    sessionStorage.setItem('volta_time', fmt(seconds));
    sessionStorage.setItem('volta_rounds', rounds.toString());
    navigate('/volta/victory');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#04040D]">
      {/* Header */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={() => { setRunning(false); navigate('/volta'); }}
          className="w-9 h-9 rounded-xl bg-[#0A0A1A] border border-[#0F0F2A] flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          ✕
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="text-[#00E5FF] text-xs font-black uppercase">Sesión activa</span>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-10">
        {/* WOD Name */}
        <div className="text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase">WOD del día</p>
          <h2 className="text-white text-4xl font-black tracking-tight">FRAN</h2>
          <p className="text-slate-400 text-sm mt-1">21-15-9 · Thrusters + Pull-ups</p>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="relative">
            <div className="w-48 h-48 rounded-full border-4 border-[#00E5FF]/30 flex items-center justify-center bg-[#00E5FF]/5">
              <div className="text-center">
                <span className="text-[#00E5FF] text-5xl font-black font-mono tracking-tighter">{fmt(seconds)}</span>
                <p className="text-slate-600 text-[10px] font-bold uppercase mt-1">Tiempo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rounds counter */}
        <div className="text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-3">Rondas completadas</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setRounds((r) => Math.max(0, r - 1))}
              className="w-12 h-12 rounded-2xl bg-[#0A0A1A] border border-[#0F0F2A] text-white text-xl font-black hover:border-[#00E5FF]/40 transition"
            >
              −
            </button>
            <span className="text-white text-5xl font-black w-16 text-center">{rounds}</span>
            <button
              onClick={() => setRounds((r) => r + 1)}
              className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] text-xl font-black hover:bg-[#00E5FF]/20 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Pause/Resume */}
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition text-sm font-bold"
        >
          {running ? '⏸ Pausar' : '▶ Reanudar'}
        </button>
      </div>

      {/* Footer */}
      <footer className="px-6 pb-8">
        <Button
          fullWidth
          size="lg"
          onClick={handleFinish}
          className="bg-[#00E5FF] hover:bg-[#00C8E0] text-[#04040D] font-black rounded-2xl"
        >
          Terminar WOD
        </Button>
      </footer>
    </div>
  );
};

export default VoltaSession;

import React, { useEffect, useState } from 'react';
import { useStopwatch, useTimer } from 'react-timer-hook';

/**
 * WodTimer · timer central para los WODs de Volta CrossFit.
 *
 * Soporta los 3 modos canónicos:
 *  - AMRAP    · cuenta regresiva fija (ej. 20 min) · al terminar emite onFinish
 *  - EMOM     · intervalos de 60s · cada minuto emite onTick(round) · termina al completar `rounds`
 *  - FOR_TIME · cronómetro count-up · usuario marca finalización con stop()
 *
 * El componente expone start/stop/reset + UI grande screenshot-friendly (para card de resultado al finalizar).
 */

export type WodMode = 'amrap' | 'emom' | 'for_time';

interface Props {
  mode: WodMode;
  /** AMRAP: duración total en segundos · EMOM: segundos por ronda (default 60) · For Time: cap opcional */
  durationSec?: number;
  /** EMOM: cuántas rondas totales */
  totalRounds?: number;
  /** Auto-start al montar */
  autoStart?: boolean;
  /** Color principal · default cyan Volta */
  color?: string;
  onFinish?: (data: { mode: WodMode; elapsedSec: number; rounds?: number }) => void;
  /** EMOM: dispara cada vez que termina una ronda · arg = nro de ronda completada */
  onTick?: (round: number) => void;
}

const formatTime = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const WodTimer: React.FC<Props> = ({
  mode,
  durationSec = 1200,  // 20 min default AMRAP
  totalRounds = 10,
  autoStart = false,
  color = '#00E5FF',
  onFinish,
  onTick,
}) => {
  if (mode === 'amrap')    return <AmrapTimer durationSec={durationSec} autoStart={autoStart} color={color} onFinish={onFinish} />;
  if (mode === 'emom')     return <EmomTimer intervalSec={durationSec || 60} totalRounds={totalRounds} autoStart={autoStart} color={color} onFinish={onFinish} onTick={onTick} />;
  return <ForTimeTimer capSec={durationSec} autoStart={autoStart} color={color} onFinish={onFinish} />;
};

/* -------------------- AMRAP -------------------- */

const AmrapTimer: React.FC<{ durationSec: number; autoStart: boolean; color: string; onFinish?: Props['onFinish'] }> = ({ durationSec, autoStart, color, onFinish }) => {
  const expiryTimestamp = new Date(Date.now() + durationSec * 1000);
  const { seconds, minutes, isRunning, start, pause, restart } = useTimer({
    expiryTimestamp,
    autoStart,
    onExpire: () => onFinish?.({ mode: 'amrap', elapsedSec: durationSec }),
  });

  const totalRemaining = minutes * 60 + seconds;
  const pct = ((durationSec - totalRemaining) / durationSec) * 100;
  const isLastMinute = totalRemaining <= 60 && totalRemaining > 0;

  return (
    <TimerShell
      mode="AMRAP"
      label={`${Math.floor(durationSec / 60)} MIN`}
      mainDisplay={formatTime(totalRemaining)}
      subDisplay={isLastMinute ? '🔥 ÚLTIMO MINUTO' : isRunning ? 'EN CURSO' : 'LISTO'}
      pct={pct}
      color={isLastMinute ? '#FF3D00' : color}
      isRunning={isRunning}
      onStart={() => start()}
      onPause={() => pause()}
      onReset={() => restart(new Date(Date.now() + durationSec * 1000), false)}
    />
  );
};

/* -------------------- EMOM -------------------- */

const EmomTimer: React.FC<{ intervalSec: number; totalRounds: number; autoStart: boolean; color: string; onFinish?: Props['onFinish']; onTick?: Props['onTick'] }> = ({ intervalSec, totalRounds, autoStart, color, onFinish, onTick }) => {
  const [round, setRound] = useState(1);
  const expiryTimestamp = new Date(Date.now() + intervalSec * 1000);
  const { seconds, minutes, isRunning, start, pause, restart } = useTimer({
    expiryTimestamp,
    autoStart,
    onExpire: () => {
      onTick?.(round);
      if (round >= totalRounds) {
        onFinish?.({ mode: 'emom', elapsedSec: intervalSec * totalRounds, rounds: totalRounds });
        return;
      }
      setRound(r => r + 1);
      restart(new Date(Date.now() + intervalSec * 1000), true);
    },
  });

  const totalRemaining = minutes * 60 + seconds;
  const pct = ((intervalSec - totalRemaining) / intervalSec) * 100;

  return (
    <TimerShell
      mode="EMOM"
      label={`RONDA ${round} / ${totalRounds}`}
      mainDisplay={formatTime(totalRemaining)}
      subDisplay={isRunning ? `INTERVALO ${intervalSec}s · GO` : 'LISTO'}
      pct={pct}
      color={color}
      isRunning={isRunning}
      onStart={() => start()}
      onPause={() => pause()}
      onReset={() => { setRound(1); restart(new Date(Date.now() + intervalSec * 1000), false); }}
    />
  );
};

/* -------------------- FOR TIME -------------------- */

const ForTimeTimer: React.FC<{ capSec?: number; autoStart: boolean; color: string; onFinish?: Props['onFinish'] }> = ({ capSec, autoStart, color, onFinish }) => {
  const { seconds, minutes, hours, isRunning, start, pause, reset } = useStopwatch({ autoStart });
  const totalElapsed = hours * 3600 + minutes * 60 + seconds;

  useEffect(() => {
    if (capSec && totalElapsed >= capSec && isRunning) {
      pause();
      onFinish?.({ mode: 'for_time', elapsedSec: totalElapsed });
    }
  }, [totalElapsed, capSec, isRunning, pause, onFinish]);

  const handleFinish = () => {
    pause();
    onFinish?.({ mode: 'for_time', elapsedSec: totalElapsed });
  };

  return (
    <TimerShell
      mode="FOR TIME"
      label={capSec ? `CAP ${Math.floor(capSec / 60)} MIN` : 'SIN CAP'}
      mainDisplay={formatTime(totalElapsed)}
      subDisplay={isRunning ? 'CRONO' : totalElapsed > 0 ? 'TIME!' : 'LISTO'}
      pct={capSec ? Math.min(100, (totalElapsed / capSec) * 100) : 0}
      color={color}
      isRunning={isRunning}
      onStart={() => start()}
      onPause={handleFinish}
      onReset={() => reset(undefined, false)}
      stopLabel="✓ TIME!"
    />
  );
};

/* -------------------- SHELL UI compartida -------------------- */

interface ShellProps {
  mode: string;
  label: string;
  mainDisplay: string;
  subDisplay: string;
  pct: number;
  color: string;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  stopLabel?: string;
}

const TimerShell: React.FC<ShellProps> = ({ mode, label, mainDisplay, subDisplay, pct, color, isRunning, onStart, onPause, onReset, stopLabel }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(0,0,0,0.4) 100%)',
    border: `1px solid ${color}55`,
    borderRadius: 24, padding: 24, textAlign: 'center',
    boxShadow: `0 0 40px ${color}22`,
    color: '#EAEAF5',
  }}>
    {/* Mode label */}
    <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.3em', color, textTransform: 'uppercase', margin: 0 }}>
      {mode}
    </p>

    {/* Round / duration */}
    <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', margin: '4px 0 16px', letterSpacing: '.1em' }}>
      {label}
    </p>

    {/* Main time display · HUGE */}
    <div style={{
      fontSize: 72, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-.04em',
      color: '#EAEAF5', lineHeight: 1, textShadow: `0 0 30px ${color}88`,
      fontFamily: '"Inter", system-ui, monospace',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {mainDisplay}
    </div>

    {/* Sub display */}
    <p style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', margin: '8px 0 18px', letterSpacing: '.15em' }}>
      {subDisplay}
    </p>

    {/* Progress bar */}
    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 18 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 1s linear', boxShadow: `0 0 12px ${color}` }} />
    </div>

    {/* Controls */}
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {!isRunning ? (
        <button onClick={onStart} className="btn-press" style={btnPrimaryStyle(color)}>▶ START</button>
      ) : (
        <button onClick={onPause} className="btn-press" style={btnPrimaryStyle('#FF3D00')}>{stopLabel ?? '⏸ PAUSE'}</button>
      )}
      <button onClick={onReset} className="btn-press" style={btnGhostStyle}>↺ RESET</button>
    </div>
  </div>
);

const btnPrimaryStyle = (color: string): React.CSSProperties => ({
  flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
  background: `linear-gradient(135deg, ${color}, ${color}99)`,
  color: '#07070F', fontSize: 13, fontWeight: 900, letterSpacing: '.1em',
  fontFamily: 'inherit', textTransform: 'uppercase',
  boxShadow: `0 8px 24px ${color}40`,
});

const btnGhostStyle: React.CSSProperties = {
  padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#94A3B8', fontSize: 11, fontWeight: 800, letterSpacing: '.1em',
  fontFamily: 'inherit', textTransform: 'uppercase',
};

export default WodTimer;

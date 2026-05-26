import React, { useEffect, useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

/**
 * Belt Ceremony · pantalla fullscreen para subida de cinturón.
 *
 * Diseñada para ser **screenshot-worthy** (loop viral):
 *  - Cinturón grande en el centro con glow + halo
 *  - Partículas animadas que orbitan/explotan
 *  - Texto grande: "CINTURÓN [X]" + nombre del atleta
 *  - Persistencia: al cerrar marca el cinturón como "celebrado" en localStorage
 *
 * Trigger desde AtletaHome cuando `beltIdx > lastCelebratedBeltIdx`.
 */

const BELTS = [
  { name: 'BLANCO',   next: 'AMARILLO', color: '#E5E7EB', glow: 'rgba(229,231,235,0.55)', tag: 'Inicio del camino' },
  { name: 'AMARILLO', next: 'NARANJA',  color: '#FACC15', glow: 'rgba(250,204,21,0.55)',  tag: 'Energía + intención' },
  { name: 'NARANJA',  next: 'AZUL',     color: '#FB923C', glow: 'rgba(251,146,60,0.55)',  tag: 'Constancia probada' },
  { name: 'AZUL',     next: 'PÚRPURA',  color: '#3B82F6', glow: 'rgba(59,130,246,0.55)',  tag: 'Atleta confiable' },
  { name: 'PÚRPURA',  next: 'MARRÓN',   color: '#A855F7', glow: 'rgba(168,85,247,0.55)',  tag: 'Disciplina élite' },
  { name: 'MARRÓN',   next: 'NEGRO',    color: '#92400E', glow: 'rgba(146,64,14,0.55)',   tag: 'Mentor en formación' },
  { name: 'NEGRO',    next: 'MAESTRO',  color: '#0A0A0A', glow: 'rgba(245,197,24,0.65)',  tag: 'Maestría' },
];

const STORAGE_LAST_CELEBRATED = 'belt:last_celebrated_idx';

interface Particle {
  id: number;
  x: number; y: number;       // % desde centro
  delay: number;              // ms
  size: number;
  hue: 'belt' | 'gold' | 'white';
}

function generateParticles(count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
    const radius = 40 + Math.random() * 50;
    out.push({
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      delay: Math.random() * 1200,
      size: 4 + Math.random() * 6,
      hue: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'belt' : 'white',
    });
  }
  return out;
}

const BeltCeremony: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();

  const fitness = athlete?.prior_fitness ?? 60;
  const beltIdx = Math.min(BELTS.length - 1, Math.floor(fitness / 15));
  const belt = BELTS[beltIdx];
  const prevBelt = beltIdx > 0 ? BELTS[beltIdx - 1] : null;

  const [phase, setPhase] = useState<'enter' | 'reveal' | 'celebrate'>('enter');
  const particles = useMemo(() => generateParticles(28), []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 350);
    const t2 = setTimeout(() => setPhase('celebrate'), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleClose = () => {
    try { localStorage.setItem(STORAGE_LAST_CELEBRATED, String(beltIdx)); } catch { /* ignore */ }
    navigate('HOME');
  };

  const handleShare = () => {
    try {
      localStorage.setItem(STORAGE_LAST_CELEBRATED, String(beltIdx));
      localStorage.setItem('social:preferred_celebration', 'tier_up');
      localStorage.setItem('social:preferred_variant', 'stadium');
    } catch { /* ignore */ }
    navigate('SOCIAL');
  };

  const firstName = athlete?.name?.split(' ')[0] ?? 'Atleta';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: `radial-gradient(circle at 50% 40%, ${belt.color}26 0%, #07070F 60%, #000 100%)`,
        color: '#EAEAF5',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, overflow: 'hidden', padding: 24,
      }}
    >
      {/* Background particles (orbiting / exploding) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
        {particles.map(p => {
          const color = p.hue === 'gold' ? '#F5C518' : p.hue === 'belt' ? belt.color : 'rgba(255,255,255,0.9)';
          return (
            <span
              key={p.id}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                width: p.size, height: p.size,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 ${p.size * 3}px ${color}`,
                transform: phase === 'enter'
                  ? 'translate(-50%,-50%) scale(0)'
                  : `translate(calc(-50% + ${p.x}vmin), calc(-50% + ${p.y}vmin)) scale(1)`,
                opacity: phase === 'celebrate' ? 0.85 : phase === 'reveal' ? 0.6 : 0,
                transition: `transform ${1200 + p.delay}ms cubic-bezier(.16,1,.3,1), opacity 800ms ease`,
                transitionDelay: `${p.delay}ms`,
              }}
            />
          );
        })}
      </div>

      {/* Eyebrow */}
      <p style={{
        position: 'relative', zIndex: 2,
        fontSize: 11, fontWeight: 900, letterSpacing: '.32em',
        color: '#F5C518', textTransform: 'uppercase', margin: 0,
        opacity: phase === 'enter' ? 0 : 1,
        transform: `translateY(${phase === 'enter' ? '10px' : '0'})`,
        transition: 'all 600ms ease 200ms',
      }}>
        ⭐ Subida de cinturón ⭐
      </p>

      {/* Halo + cinturón */}
      <div style={{
        position: 'relative', zIndex: 2,
        marginTop: 24, marginBottom: 12,
        width: 240, height: 240,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Anillo de glow exterior */}
        <div style={{
          position: 'absolute', inset: -40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${belt.glow} 0%, transparent 65%)`,
          filter: 'blur(10px)',
          opacity: phase === 'celebrate' ? 1 : 0.4,
          transition: 'opacity 1.2s ease',
          animation: phase === 'celebrate' ? 'beltHaloPulse 2.4s ease-in-out infinite' : undefined,
        }} />

        {/* Anillo interior */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: `3px solid ${belt.color}`,
          boxShadow: `0 0 60px ${belt.glow}, inset 0 0 30px ${belt.glow}`,
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.6)' : 'scale(1)',
          transition: 'all 700ms cubic-bezier(.16,1,.3,1) 200ms',
        }} />

        {/* Hexágono / "medalla" central */}
        <div style={{
          position: 'relative', zIndex: 3,
          width: 168, height: 168,
          background: `linear-gradient(160deg, ${belt.color} 0%, ${belt.color}cc 60%, ${belt.color}88 100%)`,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 18px 50px ${belt.glow}`,
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.4) rotate(-15deg)' : 'scale(1) rotate(0)',
          transition: 'all 900ms cubic-bezier(.16,1,.3,1) 400ms',
        }}>
          <span style={{ fontSize: 42 }}>🥋</span>
          <span style={{
            fontSize: 11, fontWeight: 900, letterSpacing: '.16em',
            color: belt.name === 'BLANCO' || belt.name === 'AMARILLO' ? '#07070F' : '#FFFFFF',
            marginTop: 2,
          }}>{belt.name}</span>
        </div>
      </div>

      {/* Tier transition · prev → new */}
      {prevBelt && (
        <p style={{
          position: 'relative', zIndex: 2,
          fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.62)',
          letterSpacing: '.06em', margin: '0 0 6px',
          opacity: phase === 'celebrate' ? 1 : 0,
          transition: 'opacity 600ms ease 1300ms',
        }}>
          {prevBelt.name} <span style={{ color: belt.color }}>→</span> {belt.name}
        </p>
      )}

      {/* Título principal */}
      <h1 style={{
        position: 'relative', zIndex: 2,
        fontSize: 30, fontWeight: 900, letterSpacing: '-.02em',
        color: '#EAEAF5', margin: 0, textAlign: 'center',
        opacity: phase === 'celebrate' ? 1 : 0,
        transform: `translateY(${phase === 'celebrate' ? '0' : '10px'})`,
        transition: 'all 700ms ease 1100ms',
      }}>
        {firstName}, sos
      </h1>
      <h2 style={{
        position: 'relative', zIndex: 2,
        fontSize: 34, fontWeight: 900, letterSpacing: '-.02em',
        color: belt.color, margin: '4px 0 8px',
        textShadow: `0 0 24px ${belt.glow}`,
        opacity: phase === 'celebrate' ? 1 : 0,
        transform: `translateY(${phase === 'celebrate' ? '0' : '10px'})`,
        transition: 'all 800ms ease 1300ms',
      }}>
        CINTURÓN {belt.name}
      </h2>
      <p style={{
        position: 'relative', zIndex: 2,
        fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: 600,
        margin: '0 0 28px', textAlign: 'center', maxWidth: 280,
        opacity: phase === 'celebrate' ? 1 : 0,
        transition: 'opacity 700ms ease 1500ms',
      }}>
        {belt.tag} · siguiente meta: <strong style={{ color: '#EAEAF5' }}>{belt.next}</strong>
      </p>

      {/* CTAs */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', gap: 10, width: '100%', maxWidth: 360,
        opacity: phase === 'celebrate' ? 1 : 0,
        transform: `translateY(${phase === 'celebrate' ? '0' : '12px'})`,
        transition: 'all 700ms ease 1700ms',
      }}>
        <button
          onClick={handleClose}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: 'rgba(255,255,255,0.08)', color: '#EAEAF5',
            border: '1px solid rgba(255,255,255,0.18)',
            fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Continuar</button>
        <button
          onClick={handleShare}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 12,
            background: `linear-gradient(135deg, ${belt.color}, ${belt.color}aa)`,
            color: belt.name === 'BLANCO' || belt.name === 'AMARILLO' ? '#07070F' : '#FFFFFF',
            border: 'none',
            fontSize: 12, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: `0 8px 28px ${belt.glow}`,
          }}
        >Compartir cinturón ↗</button>
      </div>

      {/* Keyframes inline */}
      <style>{`
        @keyframes beltHaloPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default BeltCeremony;

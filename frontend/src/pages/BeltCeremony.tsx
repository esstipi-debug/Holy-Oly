import React, { useEffect, useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { progressionApi, type BeltStatus } from '../lib/progression';
import '../styles/v2/belt-ceremony.css';

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
 *
 * Estilo V2 dark "Macrociclos" · scoped bajo `.belt-root` · acento ámbar
 * (--engine-belt) de base, pero el disco/anillos/glow/título se conducen
 * con el color REAL del cinturón ganado (`belt.color` / `belt.glow`) vía
 * `--c` / `--c-glow` inline. Lógica + timing + partículas intactos.
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

  // Fallback al hack viejo si la API falla (resiliente · no rompe la ceremonia)
  const fitnessFallback = athlete?.prior_fitness ?? 60;
  const fallbackBeltIdx = Math.min(BELTS.length - 1, Math.floor(fitnessFallback / 15));

  // Belt real desde el backend Engine 05 · persistido en DB
  const [beltStatus, setBeltStatus] = useState<BeltStatus | null>(null);

  useEffect(() => {
    let alive = true;
    progressionApi.belt()
      .then((bs) => { if (alive) setBeltStatus(bs); })
      .catch(() => { /* silent · usamos fallback */ });
    return () => { alive = false; };
  }, []);

  const beltIdx = Math.min(
    BELTS.length - 1,
    beltStatus ? beltStatus.belt_idx : fallbackBeltIdx,
  );
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
  // Texto de contraste sobre cinturones claros · derivado de la data del belt
  const beltTextDark = belt.name === 'BLANCO' || belt.name === 'AMARILLO';

  return (
    <div
      className="belt-root anim-fade-in"
      style={{ '--c': belt.color, '--c-glow': belt.glow } as React.CSSProperties}
    >
      {/* Backdrop · glow radial tintado con --c + grid (tokens) */}
      <div className="belt-backdrop" aria-hidden />

      {/* Background particles (orbiting / exploding) */}
      <div className="belt-particles" aria-hidden>
        {particles.map(p => {
          const color = p.hue === 'gold' ? '#F5C518' : p.hue === 'belt' ? belt.color : 'rgba(255,255,255,0.9)';
          return (
            <span
              key={p.id}
              className="belt-particle"
              style={{
                width: p.size, height: p.size,
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
      <p className="belt-eyebrow" style={{
        opacity: phase === 'enter' ? 0 : 1,
        transform: `translateY(${phase === 'enter' ? '10px' : '0'})`,
        transition: 'all 600ms ease 200ms',
      }}>
        ⭐ Subida de cinturón ⭐
      </p>

      {/* Halo + cinturón */}
      <div className="belt-disc">
        {/* Anillo de glow exterior */}
        <div className="belt-halo" style={{
          opacity: phase === 'celebrate' ? 1 : 0.4,
          transition: 'opacity 1.2s ease',
          animation: phase === 'celebrate' ? 'beltHaloPulse 2.4s ease-in-out infinite' : undefined,
        }} />

        {/* Anillo interior */}
        <div className="belt-ring" style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.6)' : 'scale(1)',
          transition: 'all 700ms cubic-bezier(.16,1,.3,1) 200ms',
        }} />

        {/* Hexágono / "medalla" central */}
        <div className="belt-medal" style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.4) rotate(-15deg)' : 'scale(1) rotate(0)',
          transition: 'all 900ms cubic-bezier(.16,1,.3,1) 400ms',
        }}>
          <span className="belt-medal-emoji">🥋</span>
          <span className="belt-medal-name" style={{ color: beltTextDark ? '#07070F' : '#FFFFFF' }}>{belt.name}</span>
        </div>
      </div>

      {/* Tier transition · prev → new */}
      {prevBelt && (
        <p className="belt-transition" style={{
          opacity: phase === 'celebrate' ? 1 : 0,
          transition: 'opacity 600ms ease 1300ms',
        }}>
          {prevBelt.name} <span className="arrow">→</span> {belt.name}
        </p>
      )}

      {/* Título principal */}
      <h1 className="belt-name-line" style={{
        opacity: phase === 'celebrate' ? 1 : 0,
        transform: `translateY(${phase === 'celebrate' ? '0' : '10px'})`,
        transition: 'all 700ms ease 1100ms',
      }}>
        {firstName}, sos
      </h1>
      <h2 className="belt-name-belt" style={{
        opacity: phase === 'celebrate' ? 1 : 0,
        transform: `translateY(${phase === 'celebrate' ? '0' : '10px'})`,
        transition: 'all 800ms ease 1300ms',
      }}>
        CINTURÓN {belt.name}
      </h2>
      <p className="belt-tagline" style={{
        opacity: phase === 'celebrate' ? 1 : 0,
        transition: 'opacity 700ms ease 1500ms',
      }}>
        {belt.tag} · siguiente meta: <strong>{belt.next}</strong>
      </p>

      {/* CTAs */}
      <div className="belt-ctas" style={{
        opacity: phase === 'celebrate' ? 1 : 0,
        transform: `translateY(${phase === 'celebrate' ? '0' : '12px'})`,
        transition: 'all 700ms ease 1700ms',
      }}>
        <button className="belt-btn belt-btn-secondary btn-press" onClick={handleClose}>
          Continuar
        </button>
        <button
          className="belt-btn belt-btn-primary btn-press"
          onClick={handleShare}
          style={{
            background: `linear-gradient(135deg, ${belt.color}, ${belt.color}aa)`,
            color: beltTextDark ? '#07070F' : '#FFFFFF',
            boxShadow: `0 8px 28px ${belt.glow}`,
          }}
        >Compartir cinturón ↗</button>
      </div>
    </div>
  );
};

export default BeltCeremony;

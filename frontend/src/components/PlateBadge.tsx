/**
 * PlateBadge · Sistema de tiers Peak Qual
 *
 * Reemplaza el sistema de Belts (cinturones) por DISCOS DE HALTEROFILIA OFICIAL.
 * Los colores siguen el estándar IWF / Competition Bumper Plates:
 *
 *   Blanco  · 0-5kg  · T0 Starter (onboarding)
 *   Verde   · 10kg   · T1 Iniciante
 *   Amarillo · 15kg  · T2 Intermedio
 *   Azul    · 20kg   · T3 Avanzado
 *   Rojo    · 25kg   · T4 Élite (máximo)
 *
 * Visual: anillo color + banda negra (rubber) + hub plateado brillante + agujero central.
 * Inspiración: Rogue Competition Bumper Plates.
 *
 * Usage:
 *   <PlateBadge tier="blue" />                       // chip 48px default
 *   <PlateBadge tier="red" size={120} animate showLabel showWeight />  // hero
 *   <PlateBadge tier="green" size={24} />            // inline mini chip
 */

import React from 'react';

export type PlateTier = 'white' | 'green' | 'yellow' | 'blue' | 'red';

interface TierMeta {
  ring: string;        // color principal del disco
  glow: string;        // halo exterior
  label: string;       // texto sobre el nivel
  weight: string;      // peso real del disco
  nameEs: string;      // nombre en español
}

export const PLATE_TIERS: Record<PlateTier, TierMeta> = {
  white: {
    ring:   '#F8F8F8',
    glow:   'rgba(248,248,248,0.45)',
    label:  'STARTER',
    weight: '0kg',
    nameEs: 'Inicio',
  },
  green: {
    ring:   '#22C55E',
    glow:   'rgba(34,197,94,0.6)',
    label:  'INICIANTE',
    weight: '10kg',
    nameEs: 'Iniciante',
  },
  yellow: {
    ring:   '#FBBF24',
    glow:   'rgba(251,191,36,0.6)',
    label:  'INTERMEDIO',
    weight: '15kg',
    nameEs: 'Intermedio',
  },
  blue: {
    ring:   '#3B82F6',
    glow:   'rgba(59,130,246,0.65)',
    label:  'AVANZADO',
    weight: '20kg',
    nameEs: 'Avanzado',
  },
  red: {
    ring:   '#EF4444',
    glow:   'rgba(239,68,68,0.7)',
    label:  'ÉLITE',
    weight: '25kg',
    nameEs: 'Élite',
  },
};

// Mapeo del belt_idx del backend al tier visual.
// Backend retorna 0-7 (8 belts originales) · lo colapsamos a 5 tiers.
export function beltIdxToTier(belt_idx: number): PlateTier {
  if (belt_idx <= 0) return 'white';
  if (belt_idx <= 2) return 'green';
  if (belt_idx <= 4) return 'yellow';
  if (belt_idx <= 6) return 'blue';
  return 'red';
}

interface PlateBadgeProps {
  tier: PlateTier;
  /** Diámetro en píxeles. Default 48. */
  size?: number;
  /** Halo glow pulsante. Útil para ceremony/celebration. */
  animate?: boolean;
  /** Muestra "INICIANTE" / "ÉLITE" debajo del disco. */
  showLabel?: boolean;
  /** Muestra "10kg" debajo. */
  showWeight?: boolean;
  /** Stack vertical (default) o horizontal (label al lado). */
  layout?: 'vertical' | 'horizontal';
  /** className opcional. */
  className?: string;
}

export const PlateBadge: React.FC<PlateBadgeProps> = ({
  tier,
  size = 48,
  animate = false,
  showLabel = false,
  showWeight = false,
  layout = 'vertical',
  className,
}) => {
  const meta = PLATE_TIERS[tier];
  const uid = React.useId();
  const labelFontSize = Math.max(8, size * 0.16);
  const weightFontSize = Math.max(7, size * 0.13);

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        alignItems: 'center',
        gap: layout === 'horizontal' ? 8 : 4,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          filter: `drop-shadow(0 0 ${Math.max(2, size / 10)}px ${meta.glow})`,
          animation: animate ? 'plateGlowPulse 2.4s ease-in-out infinite' : undefined,
        }}
        aria-label={`Disco ${meta.nameEs}`}
      >
        <defs>
          {/* Silver hub gradient · centro plateado cromado */}
          <radialGradient id={`silver-${uid}`} cx="42%" cy="36%" r="65%">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="35%"  stopColor="#EAEAEA" />
            <stop offset="70%"  stopColor="#A8A8A8" />
            <stop offset="100%" stopColor="#6E6E6E" />
          </radialGradient>
          {/* Highlight reflejo blanco sobre el hub */}
          <radialGradient id={`shine-${uid}`} cx="30%" cy="25%" r="40%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* Color ring gradient · simula bevel del disco real */}
          <radialGradient id={`ring-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="80%"  stopColor={meta.ring} />
            <stop offset="100%" stopColor={shadeColor(meta.ring, -25)} />
          </radialGradient>
        </defs>

        {/* Outer color ring (la pintura del disco) */}
        <circle cx="50" cy="50" r="48" fill={`url(#ring-${uid})`} />
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.7" />

        {/* Inner bevel highlight */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />

        {/* Black rubber band entre color y hub */}
        <circle cx="50" cy="50" r="35" fill="#0A0A0A" />
        <circle cx="50" cy="50" r="35" fill="none" stroke={meta.ring} strokeWidth="0.4" opacity="0.5" />

        {/* Silver hub plateado · el corazón del disco */}
        <circle cx="50" cy="50" r="22" fill={`url(#silver-${uid})`} />
        <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />

        {/* Center hole (donde va la barra) */}
        <circle cx="50" cy="50" r="5" fill="#050505" />
        <circle cx="50" cy="50" r="5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />

        {/* Reflejo brillante en el hub plateado (top-left) */}
        <ellipse cx="42" cy="40" rx="9" ry="4" fill={`url(#shine-${uid})`} transform="rotate(-25 42 40)" />

        {/* Pequeño punto destello extra */}
        <circle cx="38" cy="38" r="1.4" fill="rgba(255,255,255,0.9)" />
      </svg>

      {(showLabel || showWeight) && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: layout === 'horizontal' ? 'flex-start' : 'center',
          lineHeight: 1.2,
        }}>
          {showLabel && (
            <span style={{
              fontSize: labelFontSize,
              fontWeight: 900,
              letterSpacing: '.1em',
              color: meta.ring,
              textTransform: 'uppercase',
              fontFamily: 'inherit',
            }}>
              {meta.label}
            </span>
          )}
          {showWeight && (
            <span style={{
              fontSize: weightFontSize,
              color: 'rgba(255,255,255,0.55)',
              fontFamily: '"JetBrains Mono", "Courier New", monospace',
              marginTop: 2,
            }}>
              {meta.weight}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Helper · oscurece un hex color por % para bevel
function shadeColor(hex: string, percent: number): string {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

export default PlateBadge;

/**
 * PlateBadge · Sistema de tiers Peak Qual · v2 3D perspectiva
 *
 * Discos halterofilia oficial estilo Rogue Competition Bumper Plates en 3D.
 * Vista lateral isométrica · profundidad visible · hub plateado central brilla.
 *
 *   T0 Blanco  · 0kg   · Starter (onboarding)
 *   T1 Verde   · 10kg  · Iniciante
 *   T2 Amarillo· 15kg  · Intermedio
 *   T3 Azul    · 20kg  · Avanzado
 *   T4 Rojo    · 25kg  · Élite
 *
 * Soporta stacking · múltiples discos juntos como visualización de carga.
 *
 * Usage:
 *   <PlateBadge tier="blue" />                       // chip individual 64px
 *   <PlateBadge tier="red" size={120} animate />     // hero ceremony
 *   <PlateStack tiers={['green','green','yellow','blue']} />  // carga acumulada
 */

import React from 'react';

export type PlateTier = 'white' | 'green' | 'yellow' | 'blue' | 'red';

interface TierMeta {
  ring: string;
  glow: string;
  label: string;
  weight: string;
  nameEs: string;
  weightKg: number;
}

export const PLATE_TIERS: Record<PlateTier, TierMeta> = {
  white:  { ring: '#F5F5F7', glow: 'rgba(245,245,247,0.50)', label: 'STARTER',    weight: '0kg',  nameEs: 'Inicio',     weightKg: 0  },
  green:  { ring: '#22C55E', glow: 'rgba(34,197,94,0.65)',   label: 'INICIANTE',  weight: '10kg', nameEs: 'Iniciante',  weightKg: 10 },
  yellow: { ring: '#FBBF24', glow: 'rgba(251,191,36,0.65)',  label: 'INTERMEDIO', weight: '15kg', nameEs: 'Intermedio', weightKg: 15 },
  blue:   { ring: '#3B82F6', glow: 'rgba(59,130,246,0.70)',  label: 'AVANZADO',   weight: '20kg', nameEs: 'Avanzado',   weightKg: 20 },
  red:    { ring: '#EF4444', glow: 'rgba(239,68,68,0.75)',   label: 'ÉLITE',      weight: '25kg', nameEs: 'Élite',      weightKg: 25 },
};

export function beltIdxToTier(belt_idx: number): PlateTier {
  if (belt_idx <= 0) return 'white';
  if (belt_idx <= 2) return 'green';
  if (belt_idx <= 4) return 'yellow';
  if (belt_idx <= 6) return 'blue';
  return 'red';
}

interface PlateBadgeProps {
  tier: PlateTier;
  size?: number;
  animate?: boolean;
  showLabel?: boolean;
  showWeight?: boolean;
  layout?: 'vertical' | 'horizontal';
  /** Ángulo de inclinación · 0-30deg. Default 18 (3/4 isométrica). */
  tilt?: number;
  /** Profundidad lateral del disco. Default size*0.18. */
  depth?: number;
  className?: string;
}

export const PlateBadge: React.FC<PlateBadgeProps> = ({
  tier,
  size = 64,
  animate = false,
  showLabel = false,
  showWeight = false,
  layout = 'vertical',
  tilt = 18,
  depth,
  className,
}) => {
  const meta = PLATE_TIERS[tier];
  const uid = React.useId();
  const ringColor = meta.ring;
  const darkRing = shadeColor(ringColor, -28);
  const lightRing = shadeColor(ringColor, 18);
  const sideDepth = depth ?? size * 0.16;
  const labelFontSize = Math.max(8, size * 0.14);
  const weightFontSize = Math.max(7, size * 0.11);

  // ViewBox amplio para que el disco tilteado no se recorte
  const VW = 130;
  const VH = 130;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        alignItems: 'center',
        gap: layout === 'horizontal' ? 10 : 6,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VW} ${VH}`}
        style={{
          filter: `drop-shadow(0 ${size * 0.08}px ${size * 0.16}px ${meta.glow}) drop-shadow(0 0 ${size * 0.06}px ${meta.glow})`,
          animation: animate ? 'plateGlowPulse 2.4s ease-in-out infinite' : undefined,
          overflow: 'visible',
        }}
        aria-label={`Disco ${meta.nameEs}`}
      >
        <defs>
          {/* Color edge gradient · profundidad lateral del disco */}
          <linearGradient id={`edge-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={lightRing} />
            <stop offset="50%"  stopColor={ringColor} />
            <stop offset="100%" stopColor={darkRing} />
          </linearGradient>

          {/* Color face · gradient radial para volumen frontal */}
          <radialGradient id={`face-${uid}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%"   stopColor={lightRing} />
            <stop offset="55%"  stopColor={ringColor} />
            <stop offset="100%" stopColor={darkRing} />
          </radialGradient>

          {/* Silver hub cromado */}
          <radialGradient id={`silver-${uid}`} cx="38%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="35%"  stopColor="#EAEAEA" />
            <stop offset="70%"  stopColor="#A0A0A0" />
            <stop offset="100%" stopColor="#5A5A5A" />
          </radialGradient>

          {/* Silver edge · costado plateado */}
          <linearGradient id={`silver-edge-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#D5D5D5" />
            <stop offset="50%"  stopColor="#8E8E8E" />
            <stop offset="100%" stopColor="#4A4A4A" />
          </linearGradient>

          {/* Highlight reflejo top-left */}
          <radialGradient id={`shine-${uid}`} cx="28%" cy="22%" r="35%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Bottom shadow oval */}
          <radialGradient id={`shadow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.45)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {/* Sombra debajo · da peso visual */}
        <ellipse
          cx={VW / 2}
          cy={VH * 0.94}
          rx={VW * 0.34}
          ry={VW * 0.05}
          fill={`url(#shadow-${uid})`}
        />

        {/* Grupo del disco · rotado para perspectiva */}
        <g transform={`translate(${VW / 2}, ${VH / 2}) rotate(${tilt - 90})`}>
          {/* COSTADO del disco · banda lateral 3D
              Construido con 2 elipses + rectángulo para simular profundidad */}

          {/* Disco color · profundidad lateral derecha */}
          <path
            d={`
              M -50 0
              A 50 50 0 1 1 50 0
              L 50 ${sideDepth}
              A 50 50 0 1 0 -50 ${sideDepth}
              Z
            `}
            fill={`url(#edge-${uid})`}
            opacity="0.95"
          />

          {/* Hub plateado · costado */}
          <path
            d={`
              M -22 0
              A 22 22 0 1 1 22 0
              L 22 ${sideDepth}
              A 22 22 0 1 0 -22 ${sideDepth}
              Z
            `}
            fill={`url(#silver-edge-${uid})`}
            opacity="0.9"
          />

          {/* Disco color · cara frontal */}
          <circle cx="0" cy="0" r="50" fill={`url(#face-${uid})`} />
          <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="48" fill="none" stroke={lightRing} strokeWidth="0.5" opacity="0.6" />

          {/* Banda negra rubber entre color y hub */}
          <circle cx="0" cy="0" r="35" fill="#0A0A0A" />
          <circle cx="0" cy="0" r="35" fill="none" stroke={ringColor} strokeWidth="0.4" opacity="0.55" />
          <circle cx="0" cy="0" r="33" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

          {/* Hub plateado · cara frontal */}
          <circle cx="0" cy="0" r="22" fill={`url(#silver-${uid})`} />
          <circle cx="0" cy="0" r="22" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="0.6" />
          <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />

          {/* Agujero central · donde va la barra */}
          <ellipse cx="0" cy="0" rx="5" ry="5" fill="#050505" />
          <ellipse cx="0" cy="0" rx="5" ry="5" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="0.4" />
          <ellipse cx="0" cy="-1" rx="3.5" ry="2" fill="rgba(255,255,255,0.08)" />

          {/* Reflection sobre hub plateado */}
          <ellipse cx="-7" cy="-9" rx="9" ry="4" fill={`url(#shine-${uid})`} transform="rotate(-20 -7 -9)" />
          <circle cx="-10" cy="-12" r="1.5" fill="rgba(255,255,255,0.95)" />

          {/* Highlight curvado sobre disco color · arco superior */}
          <path
            d="M -40 -20 A 50 50 0 0 1 40 -20"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
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
              letterSpacing: '.12em',
              color: ringColor,
              textTransform: 'uppercase',
              fontFamily: 'inherit',
              textShadow: `0 0 8px ${meta.glow}`,
            }}>
              {meta.label}
            </span>
          )}
          {showWeight && (
            <span style={{
              fontSize: weightFontSize,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: '"JetBrains Mono", "Courier New", monospace',
              marginTop: 2,
              fontWeight: 700,
            }}>
              {meta.weight}
            </span>
          )}
        </div>
      )}
    </div>
  );
};


// ============================================================================
// PlateStack · múltiples discos juntos como visualización de carga
// ============================================================================

interface PlateStackProps {
  tiers: PlateTier[];
  size?: number;
  /** Spread horizontal entre discos. Default size*0.15 (overlap parcial). */
  spread?: number;
  /** Tilt del stack completo · perspectiva conjunta. */
  tilt?: number;
  showTotal?: boolean;
  animate?: boolean;
  /** Orientación: row = barra horizontal · column = pila vertical. */
  orientation?: 'row' | 'column';
}

/**
 * Stack visual de discos · usado para representar:
 * - Carga total acumulada (varios verdes = poco · varios rojos = mucho)
 * - Progresión histórica (1 disco hoy → 4 discos en 6 meses)
 * - Comparativa atleta vs cohort (montículo vs montículo)
 * - Tonelaje semanal
 */
export const PlateStack: React.FC<PlateStackProps> = ({
  tiers,
  size = 64,
  spread,
  tilt = 18,
  showTotal = false,
  animate = false,
  orientation = 'row',
}) => {
  const overlapX = spread ?? size * 0.18;
  const totalKg = tiers.reduce((sum, t) => sum + PLATE_TIERS[t].weightKg, 0);

  if (orientation === 'row') {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: overlapX * (tiers.length - 1),
        }}>
          {tiers.map((tier, i) => (
            <div
              key={i}
              style={{
                marginLeft: i === 0 ? 0 : -overlapX,
                zIndex: tiers.length - i,
                animation: animate
                  ? `plateStackEnter 600ms cubic-bezier(.16,1,.3,1) both ${i * 80}ms`
                  : undefined,
              }}
            >
              <PlateBadge tier={tier} size={size} tilt={tilt} />
            </div>
          ))}
        </div>
        {showTotal && (
          <div style={{
            fontSize: Math.max(9, size * 0.18),
            fontWeight: 900,
            color: '#F1F5F9',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '.05em',
            marginTop: 6,
          }}>
            {totalKg}kg
          </div>
        )}
      </div>
    );
  }

  // column · pila vertical para visualizar acumulación tipo barra
  const overlapY = size * 0.4;
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        position: 'relative',
        width: size,
        height: size + overlapY * (tiers.length - 1),
      }}>
        {tiers.map((tier, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: overlapY * (tiers.length - 1 - i),
              left: 0,
              zIndex: i,
              animation: animate
                ? `plateStackEnter 600ms cubic-bezier(.16,1,.3,1) both ${i * 80}ms`
                : undefined,
            }}
          >
            <PlateBadge tier={tier} size={size} tilt={tilt} />
          </div>
        ))}
      </div>
      {showTotal && (
        <div style={{
          fontSize: Math.max(9, size * 0.18),
          fontWeight: 900,
          color: '#F1F5F9',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          {totalKg}kg
        </div>
      )}
    </div>
  );
};


// ============================================================================
// Helpers
// ============================================================================

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

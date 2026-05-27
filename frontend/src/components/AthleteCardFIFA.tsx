/**
 * AthleteCardFIFA · Card del atleta estilo FIFA Ultimate Team / Modo Leyenda
 *
 * Concepto: el atleta tiene una CARD personal que evoluciona con su salud +
 * conciencia + entrenamiento. Inspirada en FIFA Career Mode:
 *
 *   ┌────────────────────────────┐
 *   │  ╭───────╮                 │  ← Disco (tier) + overall rating
 *   │  │ ⚪🔵🔵 │       87       │     (87 = OVR derivado de engines)
 *   │  │  ◉    │      OVR        │
 *   │  ╰───────╯                 │
 *   │      AVANZADO              │
 *   │                            │
 *   │     [  AVATAR  ]           │  ← Foto/avatar del atleta
 *   │                            │
 *   │   NOMBRE ATLETA            │
 *   │   Volta · CrossFit         │
 *   │                            │
 *   │   STR ████████████ 92      │  ← 6 stats con bars
 *   │   CND ████████░░░░ 78      │
 *   │   MOB ███████░░░░░ 72      │
 *   │   REC ██████████░░ 88      │
 *   │   CON █████████░░░ 82      │
 *   │   TEC ███████░░░░░ 74      │
 *   │                            │
 *   │   🇨🇱 · Box Buenos Aires   │  ← Nationality + box
 *   └────────────────────────────┘
 *
 * 6 Stats derivados de engines:
 *   STR · Strength    · OLY Index + 1RM ratios
 *   CND · Conditioning · Pulse + benchmarks (Fran, Helen)
 *   MOB · Mobility    · Baselines (overhead squat, etc · pending)
 *   REC · Recovery    · Stress engine + Lifestyle (sleep avg)
 *   CON · Consistency · Smart Streak + macrocycle adherence
 *   TEC · Technique   · Skill Tree mastered count + coach evals
 *
 * Card variants: standard | gold (PR last week) | legend (red tier · all stats ≥80)
 */

import React from 'react';
import { PlateBadge, type PlateTier, PLATE_TIERS } from './PlateBadge';

export interface AthleteStats {
  strength:     number; // 0-99 · OLY Index normalizado
  conditioning: number; // 0-99 · Pulse + benchmarks
  mobility:     number; // 0-99 · baselines (placeholder hasta engine)
  recovery:     number; // 0-99 · Stress + Lifestyle
  consistency:  number; // 0-99 · Streak + adherence
  technique:    number; // 0-99 · Skill mastered + evals
}

export interface AthleteCardData {
  name: string;
  product: 'volta' | 'holy-oly' | 'axon';   // CrossFit · Halterofilia · HYROX
  tier: PlateTier;
  overall: number;          // 0-99 · promedio ponderado de stats
  stats: AthleteStats;
  avatarUrl?: string;
  initials?: string;
  countryCode?: string;     // ISO 2: CL, AR, MX...
  boxName?: string;
}

interface Props {
  data: AthleteCardData;
  size?: 'sm' | 'md' | 'lg';
  /** Halo + shimmer animation. Para celebraciones. */
  hero?: boolean;
}

const PRODUCT_LABEL: Record<AthleteCardData['product'], string> = {
  'volta':    'VOLTA · CROSSFIT',
  'holy-oly': 'HOLY OLY · HALTEROFILIA',
  'axon':     'AXON · HYROX',
};

const STAT_KEYS: { key: keyof AthleteStats; label: string; color: string }[] = [
  { key: 'strength',     label: 'STR', color: '#EF4444' },
  { key: 'conditioning', label: 'CND', color: '#00E5FF' },
  { key: 'mobility',     label: 'MOB', color: '#A855F7' },
  { key: 'recovery',     label: 'REC', color: '#22C55E' },
  { key: 'consistency',  label: 'CON', color: '#FBBF24' },
  { key: 'technique',    label: 'TEC', color: '#EC4899' },
];

export const AthleteCardFIFA: React.FC<Props> = ({ data, size = 'md', hero = false }) => {
  const W = size === 'sm' ? 220 : size === 'lg' ? 340 : 280;
  const H = Math.round(W * 1.52);  // FIFA-like aspect 1:1.52

  const meta = PLATE_TIERS[data.tier];
  const ring = meta.ring;
  const glow = meta.glow;

  // Bg gradient diagonal · tier color a oscuro
  const bg = `linear-gradient(160deg,
    ${shadeColor(ring, -10)} 0%,
    ${shadeColor(ring, -45)} 35%,
    #0A0A14 75%,
    #050510 100%)`;

  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        borderRadius: 16,
        background: bg,
        boxShadow: hero
          ? `0 0 40px ${glow}, 0 0 80px ${glow}, 0 8px 32px rgba(0,0,0,0.7)`
          : `0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
        border: `1.5px solid ${ring}`,
        overflow: 'hidden',
        animation: hero ? 'cardShimmer 3s ease-in-out infinite' : undefined,
        color: '#EAEAF5',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Diagonal sheen overlay (FIFA-like) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(110deg,
          transparent 30%,
          rgba(255,255,255,0.08) 45%,
          rgba(255,255,255,0.18) 50%,
          rgba(255,255,255,0.08) 55%,
          transparent 70%)`,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
      }} />

      {/* HEADER · disco izquierda + overall derecha */}
      <div style={{
        padding: '14px 16px 8px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <PlateBadge tier={data.tier} size={W * 0.22} animate={hero} />
          <span style={{
            marginTop: 6, fontSize: W * 0.038, fontWeight: 900,
            color: ring, letterSpacing: '.12em',
          }}>{meta.label}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: W * 0.18, fontWeight: 900, lineHeight: 0.95,
            color: '#FFFFFF', fontFamily: '"JetBrains Mono", monospace',
            textShadow: `0 0 12px ${glow}`,
          }}>
            {Math.round(data.overall)}
          </div>
          <div style={{
            fontSize: W * 0.04, fontWeight: 700, letterSpacing: '.18em',
            color: 'rgba(255,255,255,0.75)', marginTop: 4,
          }}>OVR</div>
        </div>
      </div>

      {/* AVATAR */}
      <div style={{
        position: 'relative',
        margin: '4px auto 8px',
        width: W * 0.5, height: W * 0.5,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: `2px solid ${ring}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: `0 0 24px ${glow}, inset 0 0 20px rgba(0,0,0,0.4)`,
      }}>
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{
            fontSize: W * 0.16, fontWeight: 900,
            color: ring,
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '-.02em',
          }}>
            {data.initials ?? data.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
          </span>
        )}
      </div>

      {/* NAME + product */}
      <div style={{ textAlign: 'center', padding: '0 16px 8px' }}>
        <div style={{
          fontSize: W * 0.075, fontWeight: 900,
          color: '#FFFFFF',
          textTransform: 'uppercase', letterSpacing: '.04em',
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {data.name}
        </div>
        <div style={{
          fontSize: W * 0.038, fontWeight: 700, letterSpacing: '.16em',
          color: ring,
          marginTop: 2,
        }}>
          {PRODUCT_LABEL[data.product]}
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{
        height: 1, margin: '4px 24px',
        background: `linear-gradient(90deg, transparent, ${ring}, transparent)`,
        opacity: 0.6,
      }} />

      {/* STATS · 6 bars */}
      <div style={{ padding: '6px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {STAT_KEYS.map(s => {
          const val = data.stats[s.key];
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: W * 0.085,
                fontSize: W * 0.038, fontWeight: 800, letterSpacing: '.06em',
                color: 'rgba(255,255,255,0.8)',
                fontFamily: '"JetBrains Mono", monospace',
              }}>{s.label}</span>
              <div style={{
                flex: 1, height: W * 0.022, borderRadius: 999,
                background: 'rgba(0,0,0,0.4)', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  height: '100%', width: `${Math.min(99, val)}%`,
                  background: `linear-gradient(90deg, ${s.color}, ${shadeColor(s.color, 20)})`,
                  borderRadius: 999,
                  boxShadow: `0 0 6px ${s.color}66`,
                  transition: 'width .8s cubic-bezier(.16,1,.3,1)',
                }} />
              </div>
              <span style={{
                width: W * 0.075, textAlign: 'right',
                fontSize: W * 0.042, fontWeight: 900,
                fontFamily: '"JetBrains Mono", monospace',
                color: val >= 85 ? s.color : '#FFFFFF',
                textShadow: val >= 85 ? `0 0 6px ${s.color}` : undefined,
              }}>{Math.round(val)}</span>
            </div>
          );
        })}
      </div>

      {/* FOOTER · flag + box */}
      <div style={{
        position: 'absolute', bottom: 12, left: 16, right: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: W * 0.038, color: 'rgba(255,255,255,0.7)',
      }}>
        <span style={{ fontWeight: 700 }}>
          {flagEmoji(data.countryCode)}{data.countryCode ? ' ' : ''}
          {data.boxName ?? '—'}
        </span>
        <span style={{
          fontSize: W * 0.033, fontWeight: 700, letterSpacing: '.1em',
          color: ring, opacity: 0.7,
        }}>{meta.weight}</span>
      </div>
    </div>
  );
};

// Helper · ISO code → emoji flag
function flagEmoji(iso?: string): string {
  if (!iso || iso.length !== 2) return '';
  return String.fromCodePoint(
    ...iso.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)),
  );
}

// Helper · shade hex color
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

export default AthleteCardFIFA;

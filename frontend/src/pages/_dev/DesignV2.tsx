/**
 * Página DEMO · V2 design components (Claude Design import).
 * Acceso: hash #design_v2 después del login.
 */

import React from 'react';
import { Plate3D, type PlateTier } from '../../components/v2/Plate3D';
import { PlateStack } from '../../components/v2/PlateStack';

const TIERS: PlateTier[] = [0, 1, 2, 3, 4];
const TIER_NAMES = ['STARTER', 'INICIANTE', 'INTERMEDIO', 'AVANZADO', 'ÉLITE'];
const TIER_KG = ['0kg', '10kg', '15kg', '20kg', '25kg'];

const DesignV2: React.FC = () => {
  return (
    <div style={{
      background: 'var(--bg-deep, #050510)',
      minHeight: '100%',
      color: 'var(--text-hi, #F1F5F9)',
      padding: '48px 16px 96px',
      fontFamily: 'var(--font-body, Inter), system-ui, sans-serif',
    }}>
      <h1 style={{
        fontSize: 28, fontWeight: 900,
        fontFamily: 'var(--font-display, "Space Grotesk")',
        letterSpacing: '-.025em',
      }}>
        Peak Qual · V2 Design
      </h1>
      <p style={{
        fontSize: 11, color: 'var(--text-mid, #94A3B8)',
        marginTop: 4, fontFamily: 'var(--font-mono, "JetBrains Mono")',
        letterSpacing: '.16em', textTransform: 'uppercase',
      }}>
        Smart Training · Zero Burnout
      </p>

      <Section title="Plate3D · 5 tiers · 96px">
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {TIERS.map((t, i) => (
            <div key={t} style={{ textAlign: 'center' }}>
              <Plate3D tier={t} size={96} animate={t === 4} />
              <div style={{
                marginTop: 8, fontSize: 11, fontWeight: 800,
                letterSpacing: '.12em',
                color: ['#F5F5F7', '#22C55E', '#FBBF24', '#3B82F6', '#EF4444'][t],
              }}>{TIER_NAMES[i]}</div>
              <div style={{
                marginTop: 2, fontSize: 10,
                fontFamily: 'var(--font-mono, "JetBrains Mono")',
                color: 'var(--text-lo, #64748B)',
              }}>{TIER_KG[i]}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Plate3D · sizes 32-128">
        <div style={{ display: 'flex', gap: 18, alignItems: 'end', flexWrap: 'wrap' }}>
          {[32, 48, 64, 96, 128].map(s => (
            <Plate3D key={s} tier={3} size={s} />
          ))}
        </div>
      </Section>

      <Section title="Plate3D · animate (T4 sparkle)">
        <Plate3D tier={4} size={160} animate />
      </Section>

      <Section title="PlateStack · row · tonelaje sesión">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <PlateStack tiers={[1, 1]} size={64} animate />
          <PlateStack tiers={[1, 1, 2, 3]} size={64} animate />
          <PlateStack tiers={[1, 2, 3, 4, 4]} size={64} animate />
        </div>
      </Section>

      <Section title="PlateStack · column · progresión 4 semanas">
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end' }}>
          <PlateStack tiers={[1, 1, 2]} size={48} orientation="column" />
          <PlateStack tiers={[1, 2, 2, 3]} size={48} orientation="column" />
          <PlateStack tiers={[2, 3, 3, 4]} size={48} orientation="column" />
          <PlateStack tiers={[3, 4, 4, 4]} size={48} orientation="column" />
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginTop: 40 }}>
    <h2 style={{
      fontSize: 11, fontWeight: 800, letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--text-lo, #64748B)',
      margin: '0 0 16px',
      fontFamily: 'var(--font-mono, "JetBrains Mono")',
    }}>{title}</h2>
    {children}
  </section>
);

export default DesignV2;

/**
 * Página DEMO · visualización del sistema de Discos + AthleteCard FIFA.
 * Ruta: agregá a View type 'PLATE_DEMO' temporalmente para verla.
 *
 * Sirve para que el Boss apruebe el visual antes de aplicarlo.
 */

import React from 'react';
import { PlateBadge, type PlateTier } from '../../components/PlateBadge';
import { AthleteCardFIFA, type AthleteCardData } from '../../components/AthleteCardFIFA';

const TIERS: PlateTier[] = ['white', 'green', 'yellow', 'blue', 'red'];

// 3 cards demo · 3 tiers distintos · 3 niveles overall
const CARDS: AthleteCardData[] = [
  {
    name: 'Lucía Ramos',
    product: 'volta',
    tier: 'green',
    overall: 68,
    stats: { strength: 62, conditioning: 75, mobility: 70, recovery: 72, consistency: 65, technique: 60 },
    initials: 'LR',
    countryCode: 'CL',
    boxName: 'Box Santiago',
  },
  {
    name: 'Marco Torres',
    product: 'holy-oly',
    tier: 'blue',
    overall: 84,
    stats: { strength: 92, conditioning: 78, mobility: 72, recovery: 88, consistency: 82, technique: 86 },
    initials: 'MT',
    countryCode: 'AR',
    boxName: 'Buenos Aires Strength',
  },
  {
    name: 'Franco Rizzo',
    product: 'axon',
    tier: 'red',
    overall: 91,
    stats: { strength: 95, conditioning: 92, mobility: 84, recovery: 90, consistency: 94, technique: 88 },
    initials: 'FR',
    countryCode: 'CL',
    boxName: 'Peak Qual Elite',
  },
];

const PlateDemo: React.FC = () => {
  return (
    <div style={{
      background: '#050510',
      minHeight: '100%',
      color: '#EAEAF5',
      padding: '48px 16px 96px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Title */}
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-.02em' }}>
        Peak Qual · Sistema visual
      </h1>
      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
        Smart Training · Zero Burnout
      </p>

      {/* ── Sección 1 · Tamaños del disco ── */}
      <Section title="Disco · tamaños">
        <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
          <PlateBadge tier="blue" size={24} />
          <PlateBadge tier="blue" size={32} />
          <PlateBadge tier="blue" size={48} />
          <PlateBadge tier="blue" size={64} />
          <PlateBadge tier="blue" size={96} />
          <PlateBadge tier="blue" size={128} animate />
        </div>
        <p style={{ fontSize: 10, color: '#64748B', marginTop: 8 }}>
          24/32 → chips inline · 48 → cards · 96/128 → hero/ceremony (animate=true)
        </p>
      </Section>

      {/* ── Sección 2 · Los 5 tiers ── */}
      <Section title="Los 5 tiers · progresión halterofilia">
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {TIERS.map(t => (
            <PlateBadge key={t} tier={t} size={80} showLabel showWeight />
          ))}
        </div>
        <ul style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, lineHeight: 1.7, paddingLeft: 16 }}>
          <li><strong style={{ color: '#F8F8F8' }}>Blanco</strong> · onboarding · &lt;30 días</li>
          <li><strong style={{ color: '#22C55E' }}>Verde</strong> · iniciante · 1 macrocycle + inputs regulares</li>
          <li><strong style={{ color: '#FBBF24' }}>Amarillo</strong> · intermedio · hábito consolidado</li>
          <li><strong style={{ color: '#3B82F6' }}>Azul</strong> · avanzado · 90d + Balance check + alertas resueltas</li>
          <li><strong style={{ color: '#EF4444' }}>Rojo</strong> · élite · 365d + 0 lesiones + macros &gt;85%</li>
        </ul>
      </Section>

      {/* ── Sección 3 · Inline usage ── */}
      <Section title="Uso inline · chips + horizontal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TIERS.map(t => (
            <div key={t} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <PlateBadge tier={t} size={32} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                Atleta {t === 'white' ? 'nuevo' : 'tier ' + t}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748B', fontFamily: '"JetBrains Mono", monospace' }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Sección 4 · Cards FIFA ── */}
      <Section title="Athlete Cards · estilo FIFA Modo Leyenda">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <AthleteCardFIFA data={CARDS[0]} size="md" />
          <AthleteCardFIFA data={CARDS[1]} size="md" />
          <AthleteCardFIFA data={CARDS[2]} size="md" hero />
        </div>
        <p style={{ fontSize: 10, color: '#64748B', marginTop: 12, lineHeight: 1.5 }}>
          6 stats derivados de engines:<br/>
          STR (OLY Index) · CND (Pulse + benchmarks) · MOB (baselines) · REC (Stress + Lifestyle) · CON (Streak + adherencia) · TEC (Skill mastered + evals)
        </p>
      </Section>

      {/* ── Sección 5 · Comparativa visual ── */}
      <Section title="Progresión · 3 cards lado a lado">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <AthleteCardFIFA data={CARDS[0]} size="sm" />
          <AthleteCardFIFA data={CARDS[1]} size="sm" />
          <AthleteCardFIFA data={CARDS[2]} size="sm" hero />
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginTop: 32 }}>
    <h2 style={{
      fontSize: 11, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase',
      color: '#64748B', margin: '0 0 12px',
    }}>{title}</h2>
    {children}
  </section>
);

export default PlateDemo;

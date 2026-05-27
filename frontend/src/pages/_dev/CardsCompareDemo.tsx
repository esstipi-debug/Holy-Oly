/**
 * Demo · compara AthleteCardSimple (atleta · vista B simple) vs
 * AthleteCardV2 FIFA con tooltips expandibles (coach · vista B FIFA pro).
 *
 * Acceso: hash #cards_compare
 */

import React from 'react';
import { AthleteCardSimple, type AthleteCardSimpleData } from '../../components/v2/AthleteCardSimple';
import { AthleteCardV2, type AthleteCardV2Data } from '../../components/v2/AthleteCardV2';

const ATHLETE_SIMPLE: AthleteCardSimpleData = {
  name: 'Lucía Rodríguez',
  initials: 'LR',
  product: 'volta',
  tier: 1,
  overall: 68,
  progressToNextTier: 68,
  stats: {
    fuerza: 66,
    resistencia: 72,
    movilidad: 70,
    recuperacion: 65,
    consistencia: 68,
    tecnica: 67,
  },
  boxName: 'Box Comando',
  todayCta: 'Hoy: AMRAP 20 · Fran',
};

const ATHLETE_FIFA: AthleteCardV2Data = {
  name: 'Marco Vitali',
  initials: 'MV',
  product: 'holy-oly',
  tier: 3,
  overall: 84,
  stats: {
    strength: 91,
    conditioning: 70,
    mobility: 75,
    recovery: 78,
    consistency: 88,
    technique: 92,
  },
  countryFlag: '🇨🇱',
  boxName: 'Box Comando',
};

const CardsCompareDemo: React.FC = () => {
  return (
    <div style={{
      background: 'var(--bg-deep, #050510)',
      minHeight: '100%',
      color: 'var(--text-hi, #F1F5F9)',
      padding: '32px 16px 80px',
      fontFamily: 'var(--font-body, Inter), system-ui, sans-serif',
    }}>
      <h1 style={{
        fontSize: 24, fontWeight: 900, margin: '0 0 4px',
        fontFamily: 'var(--font-display, "Space Grotesk")',
        letterSpacing: '-.02em',
      }}>
        AthleteCard · 2 versiones
      </h1>
      <p style={{
        fontSize: 11, color: 'var(--text-mid, #94A3B8)',
        margin: 0, letterSpacing: '.12em', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono, "JetBrains Mono")',
      }}>
        Opciones B + C · simple para atleta · FIFA con tooltips para coach
      </p>

      <Section title="① Atleta · vista simple (palabras claras · CTA hoy)">
        <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 18, lineHeight: 1.5 }}>
          Stats con palabras + emoji · progress bar visible al próximo tier · CTA del día abajo · insight automático.
          Tap en cualquier stat → descripción expandida.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AthleteCardSimple data={ATHLETE_SIMPLE} expandable />
        </div>
      </Section>

      <Section title="② Coach · vista FIFA con tooltips (B · click stats para entender)">
        <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 18, lineHeight: 1.5 }}>
          Mantiene estética FIFA · pero tap en cualquier stat (STR/CND/MOB...) · OVR · disco · "20kg" → muestra explicación contextual con tu valor actual.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <AthleteCardV2 data={ATHLETE_FIFA} expandable tag="EXPANDABLE" />
        </div>
        <p style={{ marginTop: 14, fontSize: 11, color: 'var(--text-lo)', textAlign: 'center' }}>
          ↑ Tocá un stat · OVR · o el disco para ver explicación.
        </p>
      </Section>

      <Section title="③ Comparativa lado a lado">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <AthleteCardSimple data={ATHLETE_SIMPLE} expandable />
          <AthleteCardV2 data={ATHLETE_FIFA} expandable />
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginTop: 32 }}>
    <h2 style={{
      fontSize: 13, fontWeight: 800, letterSpacing: '.04em',
      color: 'var(--engine-stress, #00E5FF)',
      margin: '0 0 14px',
      paddingBottom: 6,
      borderBottom: '1px dashed rgba(255,255,255,0.06)',
    }}>{title}</h2>
    {children}
  </section>
);

export default CardsCompareDemo;

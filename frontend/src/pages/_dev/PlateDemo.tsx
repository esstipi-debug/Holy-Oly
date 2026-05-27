/**
 * Página DEMO · sistema de Discos 3D + AthleteCard FIFA.
 * Acceso: hash #plate_demo después del login.
 */

import React from 'react';
import { PlateBadge, PlateStack, type PlateTier } from '../../components/PlateBadge';
import { AthleteCardFIFA, type AthleteCardData } from '../../components/AthleteCardFIFA';

const TIERS: PlateTier[] = ['white', 'green', 'yellow', 'blue', 'red'];

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
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-.02em' }}>
        Peak Qual · Sistema Visual 3D
      </h1>
      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
        Smart Training · Zero Burnout
      </p>

      <Section title="Discos 3D · tamaños">
        <div style={{ display: 'flex', gap: 18, alignItems: 'end', flexWrap: 'wrap' }}>
          <PlateBadge tier="blue" size={32} />
          <PlateBadge tier="blue" size={48} />
          <PlateBadge tier="blue" size={64} />
          <PlateBadge tier="blue" size={96} />
          <PlateBadge tier="blue" size={128} animate />
        </div>
        <p style={{ fontSize: 10, color: '#64748B', marginTop: 8 }}>
          Perspectiva 3D · profundidad lateral visible · hub plateado brilla
        </p>
      </Section>

      <Section title="Los 5 tiers · halterofilia IWF">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {TIERS.map(t => (
            <PlateBadge key={t} tier={t} size={100} showLabel showWeight />
          ))}
        </div>
      </Section>

      <Section title="PlateStack · visualización de carga">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <p style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
              Carga ligera (atleta inicial · solo verdes)
            </p>
            <PlateStack tiers={['green', 'green']} size={64} showTotal animate />
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
              Carga media (verde + amarillo + azul)
            </p>
            <PlateStack tiers={['green', 'green', 'yellow', 'blue']} size={64} showTotal animate />
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
              Carga alta (mix completo · élite)
            </p>
            <PlateStack
              tiers={['green', 'yellow', 'blue', 'red', 'red']}
              size={64}
              showTotal
              animate
            />
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
              Tonelaje semanal · cada disco = sesión completada
            </p>
            <PlateStack
              tiers={['green', 'green', 'yellow', 'green', 'blue']}
              size={48}
              showTotal
              animate
            />
          </div>
        </div>
      </Section>

      <Section title="Stack vertical · acumulación visual">
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}>
            <PlateStack
              tiers={['green', 'green', 'yellow']}
              size={48}
              orientation="column"
              showTotal
            />
            <p style={{ fontSize: 10, color: '#64748B', marginTop: 8 }}>Sem 1</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlateStack
              tiers={['green', 'yellow', 'yellow', 'blue']}
              size={48}
              orientation="column"
              showTotal
            />
            <p style={{ fontSize: 10, color: '#64748B', marginTop: 8 }}>Sem 4</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlateStack
              tiers={['yellow', 'blue', 'blue', 'red']}
              size={48}
              orientation="column"
              showTotal
            />
            <p style={{ fontSize: 10, color: '#64748B', marginTop: 8 }}>Sem 8</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlateStack
              tiers={['blue', 'red', 'red', 'red']}
              size={48}
              orientation="column"
              showTotal
            />
            <p style={{ fontSize: 10, color: '#64748B', marginTop: 8 }}>Sem 12 · PR</p>
          </div>
        </div>
        <p style={{ fontSize: 10, color: '#64748B', marginTop: 12 }}>
          Progresión de carga del atleta a lo largo del macrociclo
        </p>
      </Section>

      <Section title="Uso inline · cards con disco">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map(t => (
            <div key={t} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <PlateBadge tier={t} size={48} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                Atleta tier {t}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748B', fontFamily: '"JetBrains Mono", monospace' }}>
                {t.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Athlete Cards · FIFA Modo Leyenda">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <AthleteCardFIFA data={CARDS[0]} size="md" />
          <AthleteCardFIFA data={CARDS[1]} size="md" />
          <AthleteCardFIFA data={CARDS[2]} size="md" hero />
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginTop: 40 }}>
    <h2 style={{
      fontSize: 11, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase',
      color: '#64748B', margin: '0 0 16px',
    }}>{title}</h2>
    {children}
  </section>
);

export default PlateDemo;

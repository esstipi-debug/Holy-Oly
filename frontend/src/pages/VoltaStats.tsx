import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import Chart from '../components/social/Chart';

/**
 * VoltaStats · pantalla de números del atleta CrossFit.
 *
 * Función principal de la app: el atleta ve su VOLUMEN, adherencia, distribución
 * de WODs, y benchmarks. Reemplaza el slot "stats" del bottom nav (antes iba al
 * skill tree directo).
 *
 * Secciones:
 *  1. Hero · Tonelaje semana actual + delta vs anterior
 *  2. Volumen 14d sparkline
 *  3. Adherencia ring (WODs completados vs planificados)
 *  4. Heatmap 4 semanas
 *  5. Distribución por tipo (donut visual con barras)
 *  6. Benchmarks list (Fran/Helen/Grace/Murph)
 *  7. Acceso al Skill Tree como chip secundario
 */

const C = {
  bg: '#07070F', surface: '#0F0F1C', surface2: '#161626', line: '#1E1E32',
  text: '#EAEAF5', muted: '#94A3B8', dim: '#52527A',
  cyan: '#00E5FF', cyanDim: '#00B8CC', amber: '#FFB300', red: '#FF3D00', green: '#22C55E',
  primary: '#7C5CFF',
};

interface BenchmarkEntry { name: string; current: string; previous: string; delta: string; tier: 'rx' | 'scaled' | 'rx_plus'; }

const BENCHMARKS: BenchmarkEntry[] = [
  { name: 'Fran',  current: '3:42', previous: '4:15', delta: '-33s', tier: 'rx' },
  { name: 'Helen', current: '9:18', previous: '10:30', delta: '-72s', tier: 'rx' },
  { name: 'Grace', current: '3:50', previous: '4:20', delta: '-30s', tier: 'rx' },
  { name: 'Murph', current: '42:10', previous: '48:30', delta: '-380s', tier: 'scaled' },
  { name: 'Cindy', current: '24 rounds', previous: '21 rounds', delta: '+3', tier: 'rx' },
];

const WOD_TYPES = [
  { label: 'Cardio',     pct: 38, color: '#56CCF2' },
  { label: 'Strength',   pct: 28, color: '#F5C518' },
  { label: 'Gymnastics', pct: 22, color: '#22C55E' },
  { label: 'Mixed',      pct: 12, color: '#A855F7' },
];

const VoltaStats: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();
  const [tab, setTab] = useState<'volume' | 'benchmarks' | 'profile'>('volume');

  // Volumen real desde sessions_last_7 → expandir a 14d con padding histórico simulado
  const recent = athlete?.sessions_last_7.map(s => Math.round(s.load)) ?? [];
  const avgRecent = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 1200;
  const histPad = 14 - recent.length;
  const historic = Array.from({ length: Math.max(histPad, 0) }, (_, i) =>
    Math.round(avgRecent * (0.55 + (i / Math.max(histPad - 1, 1)) * 0.4) + (i % 2 === 0 ? -80 : 120))
  );
  const volume14d = [...historic, ...recent];

  // Métricas derivadas
  const weekVolume = recent.reduce((a, b) => a + b, 0);
  const prevWeekVolume = historic.slice(-7).reduce((a, b) => a + b, 0);
  const deltaPct = prevWeekVolume > 0 ? Math.round(((weekVolume - prevWeekVolume) / prevWeekVolume) * 100) : 0;
  const wodsDone = recent.filter(v => v > 100).length;
  const wodsPlanned = 5;
  const adherencePct = Math.round((wodsDone / wodsPlanned) * 100);

  return (
    <div className="anim-fade-in" style={{ background: C.bg, minHeight: '100%', color: C.text, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: C.cyan, textTransform: 'uppercase', margin: 0 }}>TUS NÚMEROS</p>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', margin: '2px 0 0' }}>Volumen & Performance</h1>
      </div>

      {/* Tab chips */}
      <div style={{ padding: '6px 16px 14px', display: 'flex', gap: 8 }}>
        <Chip active={tab === 'volume'}     onClick={() => setTab('volume')}     label="Volumen" />
        <Chip active={tab === 'benchmarks'} onClick={() => setTab('benchmarks')} label="Benchmarks" />
        <Chip active={tab === 'profile'}    onClick={() => setTab('profile')}    label="Perfil" />
        <button
          onClick={() => navigate('PROGRESSION')}
          className="btn-press"
          style={{
            marginLeft: 'auto', padding: '6px 12px', borderRadius: 20,
            background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.35)',
            color: '#A88BFF', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Skills →</button>
      </div>

      {/* CTA · Leaderboard del box */}
      <div style={{ padding: '0 16px 12px' }}>
        <button
          onClick={() => navigate('LEADERBOARD')}
          className="btn-press"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.10) 0%, rgba(0,229,255,0.02) 100%)',
            border: '1px solid rgba(0,229,255,0.30)',
            color: C.text, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 900, color: C.text, margin: 0 }}>Top 10 del box</p>
              <p style={{ fontSize: 10, color: C.muted, margin: 0, marginTop: 2 }}>CF Index · ranking semanal</p>
            </div>
          </div>
          <span style={{ fontSize: 14, color: C.cyan, fontWeight: 900 }}>→</span>
        </button>
      </div>

      {tab === 'volume' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* HERO · Tonelaje semanal */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.10) 0%, rgba(0,229,255,0.02) 100%)',
            border: '1px solid rgba(0,229,255,0.30)',
            borderRadius: 20, padding: 18,
            boxShadow: '0 0 28px rgba(0,229,255,0.08)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: C.cyan, textTransform: 'uppercase' }}>
              Esta semana
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.text, letterSpacing: '-.03em', fontStyle: 'italic' }}>
                {(weekVolume / 1000).toFixed(1)}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.cyan }}>toneladas</span>
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              {weekVolume.toLocaleString('es')} kg movidos · {wodsDone}/{wodsPlanned} WODs
            </p>
            <div style={{
              marginTop: 10, padding: '6px 10px', display: 'inline-block',
              borderRadius: 8, fontSize: 11, fontWeight: 800,
              background: deltaPct >= 0 ? 'rgba(34,197,94,0.14)' : 'rgba(255,61,0,0.14)',
              color: deltaPct >= 0 ? C.green : C.red,
              border: `1px solid ${deltaPct >= 0 ? 'rgba(34,197,94,0.35)' : 'rgba(255,61,0,0.35)'}`,
            }}>
              {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct)}% vs semana anterior
            </div>
          </div>

          {/* Volumen 14d sparkline */}
          <Section title="Volumen 14 días" hint="Cada día = tu carga total (kg × reps × sets)">
            <Chart
              data={{ kind: 'bars', values: volume14d, highlight: volume14d.length - 1 }}
              color={C.cyan} width={320} height={110} scheme="dark"
            />
          </Section>

          {/* Adherencia ring */}
          <Section title="Adherencia semanal" hint={`${wodsDone} de ${wodsPlanned} WODs completados`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Chart
                data={{ kind: 'ring', value: wodsDone, max: wodsPlanned, centerLabel: `${adherencePct}%` }}
                color={adherencePct >= 80 ? C.green : adherencePct >= 50 ? C.amber : C.red}
                width={100} height={100} scheme="dark"
              />
              <div style={{ flex: 1 }}>
                <Mini label="Completados" value={`${wodsDone}/${wodsPlanned}`} color={C.green} />
                <Mini label="Promedio club" value="64%" color={C.muted} />
                <Mini label="Tu mejor mes" value="89%" color={C.cyan} />
              </div>
            </div>
          </Section>

          {/* Distribución por tipo · bars horizontal custom */}
          <Section title="Distribución últimos 30 días" hint="Tipo de esfuerzo por WOD">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WOD_TYPES.map(t => (
                <div key={t.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{t.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: t.color }}>{t.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${t.pct}%`, background: t.color,
                      transition: 'width .6s ease', borderRadius: 3,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Heatmap 14d intensidad */}
          <Section title="Intensidad últimas 2 semanas" hint="Días con mayor carga brillan más">
            <Chart
              data={{ kind: 'heatmap14', days: volume14d.map((v, i) => ({
                date: `d-${13 - i}`,
                intensity: v > 100 ? Math.min(v / Math.max(...volume14d), 1) : 0,
              })) }}
              color={C.cyan} width={320} height={50} scheme="dark"
            />
          </Section>

        </div>
      )}

      {tab === 'benchmarks' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('VOLTA_WOD_LOG')}
            className="btn-press"
            style={{
              padding: '12px', borderRadius: 12,
              background: `linear-gradient(135deg, ${C.cyan}, ${C.cyanDim})`,
              color: '#07070F', fontSize: 12, fontWeight: 900, letterSpacing: '.05em',
              textTransform: 'uppercase', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 8px 22px ${C.cyan}40`,
            }}
          >+ Loggear resultado de WOD</button>
          <Section title="Tus benchmarks RX" hint="WODs named · mejor tiempo personal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BENCHMARKS.map(b => (
                <div key={b.name} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: b.tier === 'rx_plus' ? 'rgba(245,197,24,0.18)'
                              : b.tier === 'rx' ? 'rgba(34,197,94,0.14)'
                              : 'rgba(86,204,242,0.14)',
                    border: `1px solid ${b.tier === 'rx_plus' ? '#F5C518' : b.tier === 'rx' ? C.green : C.cyan}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900,
                    color: b.tier === 'rx_plus' ? '#F5C518' : b.tier === 'rx' ? C.green : C.cyan,
                  }}>{b.tier === 'rx_plus' ? 'RX+' : b.tier === 'rx' ? 'RX' : 'SC'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: 0 }}>{b.name}</p>
                    <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0' }}>Anterior: {b.previous}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: C.text, margin: 0, fontStyle: 'italic' }}>{b.current}</p>
                    <p style={{ fontSize: 10, fontWeight: 800, color: C.green, margin: '2px 0 0' }}>▲ {b.delta}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'profile' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Section title="Perfil CrossFit" hint="5 dimensiones · percentil 0-100 vs población">
            {/* Datos estimados desde sesiones + benchmarks · TODO: calcular real cuando haya backend con histórico
                Strength · 1RM Back/Front/Press normalizado a peso corporal
                Engine · tiempos en cardio (Row, Run, Bike)
                Gymnastics · skills unbroken (Pull-ups, MU, HSPU)
                Benchmarks · ranking promedio en WODs named
                Consistency · adherencia 30 días */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Chart
                data={{
                  kind: 'radar',
                  axes: [
                    { label: 'Strength',    value: 78, ideal: 75, max: 100 },
                    { label: 'Engine',      value: 46, ideal: 75, max: 100 },
                    { label: 'Gymnastics',  value: 82, ideal: 75, max: 100 },
                    { label: 'Benchmarks',  value: 70, ideal: 75, max: 100 },
                    { label: 'Consistency', value: 76, ideal: 75, max: 100 },
                  ],
                }}
                color={C.cyan} width={300} height={300} scheme="dark"
              />
            </div>
          </Section>

          <Section title="WISE recomienda" hint="Insight automático de tu perfil">
            <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
              ⚠️ <strong style={{ color: C.amber }}>Engine es tu punto débil</strong> (46/100). Tu Strength
              y Gymnastics están compensando, pero eso tiene un techo. Agregá 1 WOD largo de capacidad
              (20-30 min con Row + Run) por semana durante el próximo mes.
            </p>
          </Section>
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className="btn-press"
    style={{
      padding: '6px 14px', borderRadius: 20,
      background: active ? 'rgba(0,229,255,0.15)' : 'transparent',
      border: `1px solid ${active ? 'rgba(0,229,255,0.45)' : 'rgba(255,255,255,0.10)'}`,
      color: active ? C.cyan : C.muted,
      fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
      letterSpacing: '.04em', textTransform: 'uppercase',
    }}
  >{label}</button>
);

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.line}`,
    borderRadius: 18, padding: 14,
  }}>
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: C.muted, textTransform: 'uppercase', margin: 0 }}>{title}</p>
    {hint && <p style={{ fontSize: 10, color: C.dim, margin: '2px 0 10px' }}>{hint}</p>}
    {!hint && <div style={{ height: 8 }} />}
    {children}
  </div>
);

const Mini: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}</span>
  </div>
);

export default VoltaStats;

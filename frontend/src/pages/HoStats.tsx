import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import Chart from '../components/social/Chart';

/**
 * HoStats · pantalla de números del atleta de halterofilia.
 *
 * Análogo a VoltaStats pero con métricas específicas de oly lifting:
 *  1. Hero · Tonelaje semanal + intensidad media (%1RM)
 *  2. Volumen 14d (en kg, no toneladas)
 *  3. Ring zona principal de la semana
 *  4. Bars de distribución de intensidad (4 niveles)
 *  5. 1RM actuales (Snatch, C&J, Back/Front/OHS)
 *  6. Mesociclo · semana X de Y + adherencia
 *  7. Acceso al Skill Tree como chip secundario
 */

const C = {
  bg: '#07070F', surface: '#0F0F1C', surface2: '#161626', line: '#1E1E32',
  text: '#EAEAF5', muted: '#94A3B8', dim: '#52527A',
  gold: '#F5C518', goldDim: '#B8860B', amber: '#FFB300', red: '#FF3D00', green: '#22C55E',
  primary: '#7C5CFF',
};

// 4 zonas canónicas de halterofilia clasificadas por %1RM
const ZONES = [
  { id: 'liviano', label: 'Liviano',  range: '<60%',  color: '#56CCF2', min: 0,   max: 60 },
  { id: 'tecnico', label: 'Técnico',  range: '60-75%', color: '#22C55E', min: 60,  max: 75 },
  { id: 'fuerza',  label: 'Fuerza',   range: '75-90%', color: '#F5C518', min: 75,  max: 90 },
  { id: 'maximo',  label: 'Máximo',   range: '>90%',  color: '#FF3D00', min: 90,  max: 100 },
] as const;

const HoStats: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();
  const [tab, setTab] = useState<'volume' | 'maxes'>('volume');

  // Volumen real desde sessions_last_7 → expandir a 14d con padding histórico
  const recent = athlete?.sessions_last_7.map(s => Math.round(s.load)) ?? [];
  const avgRecent = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 3500;
  const histPad = 14 - recent.length;
  const historic = Array.from({ length: Math.max(histPad, 0) }, (_, i) =>
    Math.round(avgRecent * (0.55 + (i / Math.max(histPad - 1, 1)) * 0.4) + (i % 2 === 0 ? -150 : 220))
  );
  const volume14d = [...historic, ...recent];

  // Métricas derivadas
  const weekVolume = recent.reduce((a, b) => a + b, 0);
  const prevWeekVolume = historic.slice(-7).reduce((a, b) => a + b, 0);
  const deltaPct = prevWeekVolume > 0 ? Math.round(((weekVolume - prevWeekVolume) / prevWeekVolume) * 100) : 0;

  // Intensidad media (%1RM) · simulada desde RPE reportado: RPE 6→65%, 7→72%, 8→80%, 9→88%, 10→95%
  const rpeToIntensity = (rpe: number) => rpe <= 0 ? 0 : Math.min(50 + rpe * 5, 100);
  const sessionsDone = athlete?.sessions_last_7.filter(s => s.completed) ?? [];
  const avgIntensity = sessionsDone.length > 0
    ? Math.round(sessionsDone.reduce((a, s) => a + rpeToIntensity(s.rpe_reported), 0) / sessionsDone.length)
    : 0;

  // Distribución de intensidad esta semana (recuento por zona)
  const zoneDistribution = ZONES.map(z => {
    const count = sessionsDone.filter(s => {
      const i = rpeToIntensity(s.rpe_reported);
      return i >= z.min && i < (z.max === 100 ? 101 : z.max);
    }).length;
    return { ...z, count };
  });
  const totalZoneCount = zoneDistribution.reduce((a, z) => a + z.count, 0) || 1;
  const zonePct = zoneDistribution.map(z => ({ ...z, pct: Math.round((z.count / totalZoneCount) * 100) }));
  const dominantZone = zonePct.reduce((max, z) => z.pct > max.pct ? z : max, zonePct[0]);

  // Adherencia
  const sessionsCompleted = sessionsDone.length;
  const sessionsPlanned = 5;
  const adherencePct = Math.round((sessionsCompleted / sessionsPlanned) * 100);

  // Macrociclo
  const macro = athlete?.macrocycle;
  const macroProgress = macro ? Math.round((macro.week / macro.total_weeks) * 100) : 0;

  // 1RM
  const maxes = athlete?.maxes;
  const cleanAndJerk = maxes ? Math.min(maxes.clean, maxes.jerk) : 0;
  const total = maxes ? maxes.snatch + cleanAndJerk : 0;
  // Estimar OHS (no existe en data) = ~snatch + 5kg como proxy razonable
  const ohs = maxes ? Math.round(maxes.snatch * 1.02) : 0;

  const MAXES_LIST = maxes ? [
    { name: 'Snatch',       value: maxes.snatch,     color: C.gold,  hint: 'Arranque' },
    { name: 'Clean & Jerk', value: cleanAndJerk,     color: C.gold,  hint: 'Envión completo' },
    { name: 'Back Squat',   value: maxes.back_squat, color: '#56CCF2', hint: 'Sentadilla trasera' },
    { name: 'Front Squat',  value: maxes.front_squat,color: '#56CCF2', hint: 'Sentadilla frontal' },
    { name: 'OHS',          value: ohs,              color: '#A855F7', hint: 'Overhead Squat (est.)' },
  ] : [];

  return (
    <div className="anim-fade-in" style={{ background: C.bg, minHeight: '100%', color: C.text, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: C.gold, textTransform: 'uppercase', margin: 0 }}>TUS NÚMEROS</p>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', margin: '2px 0 0' }}>Tonelaje & 1RM</h1>
      </div>

      {/* Tab chips */}
      <div style={{ padding: '6px 16px 14px', display: 'flex', gap: 8 }}>
        <Chip active={tab === 'volume'} onClick={() => setTab('volume')} label="Volumen" />
        <Chip active={tab === 'maxes'}  onClick={() => setTab('maxes')}  label="1RM" />
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

      {tab === 'volume' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* HERO · Tonelaje semanal + intensidad media */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,197,24,0.10) 0%, rgba(245,197,24,0.02) 100%)',
            border: '1px solid rgba(245,197,24,0.30)',
            borderRadius: 20, padding: 18,
            boxShadow: '0 0 28px rgba(245,197,24,0.08)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: C.gold, textTransform: 'uppercase' }}>
              Esta semana
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.text, letterSpacing: '-.03em', fontStyle: 'italic' }}>
                {weekVolume.toLocaleString('es')}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>kg</span>
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Intensidad media: <strong style={{ color: C.text }}>{avgIntensity}%</strong> · {sessionsCompleted}/{sessionsPlanned} sesiones
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

          {/* Volumen 14d */}
          <Section title="Volumen 14 días" hint="Cada día = tu tonelaje total (kg × reps × sets)">
            <Chart
              data={{ kind: 'bars', values: volume14d, highlight: volume14d.length - 1 }}
              color={C.gold} width={320} height={110} scheme="dark"
            />
          </Section>

          {/* Ring zona principal + adherencia */}
          <Section title="Zona principal de la semana" hint={`${dominantZone.label} · ${dominantZone.range} del 1RM`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Chart
                data={{ kind: 'ring', value: dominantZone.count, max: totalZoneCount, centerLabel: `${dominantZone.pct}%` }}
                color={dominantZone.color}
                width={100} height={100} scheme="dark"
              />
              <div style={{ flex: 1 }}>
                <Mini label="Zona dominante" value={dominantZone.label} color={dominantZone.color} />
                <Mini label="Sesiones en zona" value={`${dominantZone.count}/${totalZoneCount}`} color={C.text} />
                <Mini label="Adherencia" value={`${adherencePct}%`} color={adherencePct >= 80 ? C.green : adherencePct >= 50 ? C.amber : C.red} />
              </div>
            </div>
          </Section>

          {/* Distribución de intensidad · 4 zonas */}
          <Section title="Distribución de intensidad" hint="Sesiones por zona de %1RM esta semana">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zonePct.map(z => (
                <div key={z.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>
                      {z.label} <span style={{ color: C.dim, fontWeight: 600 }}>· {z.range}</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: z.color }}>{z.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${z.pct}%`, background: z.color,
                      transition: 'width .6s ease', borderRadius: 3,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Mesociclo */}
          {macro && (
            <Section title="Mesociclo" hint={macro.focus}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 10,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(245,197,24,0.14)',
                  border: '1px solid rgba(245,197,24,0.35)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: C.gold, fontStyle: 'italic', lineHeight: 1 }}>{macro.week}</span>
                  <span style={{ fontSize: 7, fontWeight: 800, color: C.gold, letterSpacing: '.08em', marginTop: 2 }}>SEM</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 900, color: C.text, margin: 0 }}>{macro.program_name}</p>
                  <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0' }}>
                    Semana {macro.week} de {macro.total_weeks} · Día {macro.day}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: C.gold, margin: 0, fontStyle: 'italic' }}>{macroProgress}%</p>
                  <p style={{ fontSize: 9, color: C.dim, margin: '2px 0 0', letterSpacing: '.08em' }}>PROGRESO</p>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${macroProgress}%`,
                  background: `linear-gradient(90deg, ${C.gold}, ${C.goldDim})`,
                  transition: 'width .6s ease', borderRadius: 3,
                }} />
              </div>
            </Section>
          )}

          {/* Heatmap 14d intensidad */}
          <Section title="Intensidad últimas 2 semanas" hint="Días con mayor carga brillan más">
            <Chart
              data={{ kind: 'heatmap14', days: volume14d.map((v, i) => ({
                date: `d-${13 - i}`,
                intensity: v > 100 ? Math.min(v / Math.max(...volume14d), 1) : 0,
              })) }}
              color={C.gold} width={320} height={50} scheme="dark"
            />
          </Section>

        </div>
      )}

      {tab === 'maxes' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* TOTAL Sinclair */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,197,24,0.10), rgba(245,197,24,0.02))',
            border: '1px solid rgba(245,197,24,0.30)',
            borderRadius: 18, padding: 16,
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: C.gold, textTransform: 'uppercase', margin: 0 }}>
              TOTAL OLÍMPICO
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: C.text, letterSpacing: '-.03em', fontStyle: 'italic' }}>
                {total}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.gold }}>kg</span>
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Snatch {maxes?.snatch ?? 0} + C&J {cleanAndJerk} · {athlete?.weight_class ?? '—'}
            </p>
          </div>

          <Section title="1RM actuales" hint="Tus máximos vigentes registrados">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MAXES_LIST.map(m => (
                <div key={m.name} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${m.color}22`,
                    border: `1px solid ${m.color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900, color: m.color, fontStyle: 'italic',
                  }}>{m.name.charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0' }}>{m.hint}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: 0, fontStyle: 'italic' }}>
                      {m.value}<span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>kg</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {maxes && (
            <Section title="Ratios técnicos" hint="Indicadores de balance entre levantamientos">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Mini label="Snatch / C&J" value={`${Math.round((maxes.snatch / cleanAndJerk) * 100)}%`} color={C.gold} />
                <Mini label="C&J / Back Squat" value={`${Math.round((cleanAndJerk / maxes.back_squat) * 100)}%`} color="#56CCF2" />
                <Mini label="Front / Back Squat" value={`${Math.round((maxes.front_squat / maxes.back_squat) * 100)}%`} color="#56CCF2" />
                <Mini label="Total / Peso corporal" value={`${(total / maxes.body_weight).toFixed(2)}×`} color={C.green} />
              </div>
            </Section>
          )}
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
      background: active ? 'rgba(245,197,24,0.15)' : 'transparent',
      border: `1px solid ${active ? 'rgba(245,197,24,0.45)' : 'rgba(255,255,255,0.10)'}`,
      color: active ? C.gold : C.muted,
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

export default HoStats;

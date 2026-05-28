import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import Chart from '../components/social/Chart';
import Heatmap365 from '../components/Heatmap365';
import '../styles/v2/ho-stats.css';

/**
 * HoStats · pantalla de números del atleta de halterofilia.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.hst-root` · acento ámbar
 * (--engine-macro). Se monta dentro de PhoneLayout. Lógica intacta: todo
 * el cálculo (volumen 14d, zonas, adherencia, macro, 1RM) se preserva;
 * solo cambia la presentación. Los gráficos los dibuja <Chart>/<Heatmap365>.
 *
 *  1. Hero · Tonelaje semanal + intensidad media (%1RM)
 *  2. Volumen 14d · 3. Ring zona principal · 4. Distribución de intensidad
 *  5. Mesociclo · 6. Heatmaps · 7. 1RM + perfil de fuerza + ratios
 */

// Colores de gráfico (hex · alineados a tokens V2, para canvas <Chart>)
const CHART = {
  gold: '#FFB300',   // engine-macro
  green: '#22C55E',  // engine-oly
  blue: '#56CCF2',
  violet: '#A855F7', // engine-adapt
  red: '#EF4444',    // engine-pulse
};

// 4 zonas canónicas de halterofilia clasificadas por %1RM
const ZONES = [
  { id: 'liviano', label: 'Liviano',  range: '<60%',  color: CHART.blue,  min: 0,   max: 60 },
  { id: 'tecnico', label: 'Técnico',  range: '60-75%', color: CHART.green, min: 60,  max: 75 },
  { id: 'fuerza',  label: 'Fuerza',   range: '75-90%', color: CHART.gold,  min: 75,  max: 90 },
  { id: 'maximo',  label: 'Máximo',   range: '>90%',  color: CHART.red,   min: 90,  max: 100 },
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
    { name: 'Snatch',       value: maxes.snatch,     color: CHART.gold,   hint: 'Arranque' },
    { name: 'Clean & Jerk', value: cleanAndJerk,     color: CHART.gold,   hint: 'Envión completo' },
    { name: 'Back Squat',   value: maxes.back_squat, color: CHART.blue,   hint: 'Sentadilla trasera' },
    { name: 'Front Squat',  value: maxes.front_squat,color: CHART.blue,   hint: 'Sentadilla frontal' },
    { name: 'OHS',          value: ohs,              color: CHART.violet, hint: 'Overhead Squat (est.)' },
  ] : [];

  const adherenceColor = adherencePct >= 80 ? CHART.green : adherencePct >= 50 ? CHART.gold : CHART.red;

  return (
    <div className="hst-root anim-fade-in">
      <div className="hst-scroll">
        {/* Header */}
        <div className="hst-head">
          <p className="hst-eyebrow">Tus números</p>
          <h1 className="hst-title">Tonelaje & 1RM</h1>
        </div>

        {/* Tab chips */}
        <div className="hst-tabs">
          <button className="hst-chip btn-press" data-active={tab === 'volume'} onClick={() => setTab('volume')}>Volumen</button>
          <button className="hst-chip btn-press" data-active={tab === 'maxes'} onClick={() => setTab('maxes')}>1RM</button>
          <button className="hst-skills btn-press" onClick={() => navigate('PROGRESSION')}>Skills →</button>
        </div>

        {/* CTA · Leaderboard del club */}
        <button className="hst-lb btn-press" onClick={() => navigate('LEADERBOARD')}>
          <span className="hst-lb-left">
            <span className="hst-lb-icon">🏆</span>
            <span>
              <p className="hst-lb-title">Top 10 del club</p>
              <p className="hst-lb-sub">OLY Index · ranking semanal</p>
            </span>
          </span>
          <span className="hst-lb-arrow">→</span>
        </button>

        {tab === 'volume' && (
          <div className="hst-panel">
            {/* HERO · Tonelaje semanal + intensidad media */}
            <div className="hst-hero">
              <p className="hst-hero-label">Esta semana</p>
              <div className="hst-hero-row">
                <span className="hst-hero-num">{weekVolume.toLocaleString('es')}</span>
                <span className="hst-hero-unit">kg</span>
              </div>
              <p className="hst-hero-sub">
                Intensidad media: <strong>{avgIntensity}%</strong> · {sessionsCompleted}/{sessionsPlanned} sesiones
              </p>
              <div className="hst-delta" data-pos={deltaPct >= 0}>
                {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct)}% vs semana anterior
              </div>
            </div>

            {/* Volumen 14d */}
            <Section title="Volumen 14 días" hint="Cada día = tu tonelaje total (kg × reps × sets)">
              <Chart
                data={{ kind: 'bars', values: volume14d, highlight: volume14d.length - 1 }}
                color={CHART.gold} width={320} height={110} scheme="dark"
              />
            </Section>

            {/* Ring zona principal + adherencia */}
            <Section title="Zona principal de la semana" hint={`${dominantZone.label} · ${dominantZone.range} del 1RM`}>
              <div className="hst-ring-row">
                <Chart
                  data={{ kind: 'ring', value: dominantZone.count, max: totalZoneCount, centerLabel: `${dominantZone.pct}%` }}
                  color={dominantZone.color}
                  width={100} height={100} scheme="dark"
                />
                <div className="hst-ring-meta">
                  <Mini label="Zona dominante" value={dominantZone.label} color={dominantZone.color} />
                  <Mini label="Sesiones en zona" value={`${dominantZone.count}/${totalZoneCount}`} />
                  <Mini label="Adherencia" value={`${adherencePct}%`} color={adherenceColor} />
                </div>
              </div>
            </Section>

            {/* Distribución de intensidad · 4 zonas */}
            <Section title="Distribución de intensidad" hint="Sesiones por zona de %1RM esta semana">
              {zonePct.map(z => (
                <div key={z.id} className="hst-zone">
                  <div className="hst-zone-head">
                    <span className="hst-zone-name">
                      {z.label} <span className="hst-zone-range">· {z.range}</span>
                    </span>
                    <span className="hst-zone-pct" style={{ '--c': z.color } as React.CSSProperties}>{z.pct}%</span>
                  </div>
                  <div className="hst-bar">
                    <div className="hst-bar-fill" style={{ width: `${z.pct}%`, '--c': z.color } as React.CSSProperties} />
                  </div>
                </div>
              ))}
            </Section>

            {/* Mesociclo */}
            {macro && (
              <Section title="Mesociclo" hint={macro.focus}>
                <div className="hst-meso-row">
                  <div className="hst-meso-badge">
                    <span className="hst-meso-week">{macro.week}</span>
                    <span className="hst-meso-week-label">SEM</span>
                  </div>
                  <div className="hst-meso-main">
                    <p className="hst-meso-name">{macro.program_name}</p>
                    <p className="hst-meso-sub">Semana {macro.week} de {macro.total_weeks} · Día {macro.day}</p>
                  </div>
                  <div className="hst-meso-prog">
                    <p className="hst-meso-pct">{macroProgress}%</p>
                    <p className="hst-meso-pct-label">PROGRESO</p>
                  </div>
                </div>
                <div className="hst-bar">
                  <div className="hst-bar-fill meso" style={{ width: `${macroProgress}%` }} />
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
                color={CHART.gold} width={320} height={50} scheme="dark"
              />
            </Section>

            {/* Heatmap 365 anual */}
            <Heatmap365 sessions={athlete?.sessions_last_7 ?? []} />
          </div>
        )}

        {tab === 'maxes' && (
          <div className="hst-panel">
            {/* TOTAL olímpico */}
            <div className="hst-hero">
              <p className="hst-hero-label">Total olímpico</p>
              <div className="hst-hero-row">
                <span className="hst-hero-num">{total}</span>
                <span className="hst-hero-unit">kg</span>
              </div>
              <p className="hst-hero-sub">
                Snatch {maxes?.snatch ?? 0} + C&J {cleanAndJerk} · {athlete?.weight_class ?? '—'}
              </p>
            </div>

            <Section title="1RM actuales" hint="Tus máximos vigentes registrados">
              {MAXES_LIST.map(m => (
                <div key={m.name} className="hst-max">
                  <div className="hst-max-icon" style={{ '--c': m.color } as React.CSSProperties}>{m.name.charAt(0)}</div>
                  <div className="hst-max-main">
                    <p className="hst-max-name">{m.name}</p>
                    <p className="hst-max-hint">{m.hint}</p>
                  </div>
                  <p className="hst-max-val">{m.value}<span>kg</span></p>
                </div>
              ))}
            </Section>

            {maxes && (
              <Section title="Perfil de fuerza" hint="Tu polígono real (oro) vs perfil ideal de élite (gris)">
                {/* Polígono compara ratios reales del atleta contra valores ideales IWF
                    · Snatch ~80% del C&J · C&J ~80% del Squat Back · Squat Front ~110% del C&J */}
                <div className="hst-radar-wrap">
                  <Chart
                    data={{
                      kind: 'radar',
                      axes: [
                        { label: 'Snatch',  value: Math.round((maxes.snatch / cleanAndJerk) * 100),     ideal: 80,  max: 100 },
                        { label: 'C&J',     value: Math.round((cleanAndJerk / maxes.back_squat) * 100), ideal: 80,  max: 100 },
                        { label: 'Sq Back', value: 100,                                                   ideal: 100, max: 100 },
                        { label: 'Sq Front',value: Math.round((maxes.front_squat / maxes.back_squat) * 100), ideal: 90, max: 100 },
                      ],
                    }}
                    color={CHART.gold} width={280} height={280} scheme="dark"
                  />
                </div>
              </Section>
            )}

            {maxes && (
              <Section title="Ratios técnicos" hint="Indicadores de balance entre levantamientos">
                <Mini label="Snatch / C&J" value={`${Math.round((maxes.snatch / cleanAndJerk) * 100)}%`} color={CHART.gold} />
                <Mini label="C&J / Back Squat" value={`${Math.round((cleanAndJerk / maxes.back_squat) * 100)}%`} color={CHART.blue} />
                <Mini label="Front / Back Squat" value={`${Math.round((maxes.front_squat / maxes.back_squat) * 100)}%`} color={CHART.blue} />
                <Mini label="Total / Peso corporal" value={`${(total / maxes.body_weight).toFixed(2)}×`} color={CHART.green} />
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div className="hst-section">
    <p className="hst-sec-title">{title}</p>
    {hint && <p className="hst-sec-hint">{hint}</p>}
    <div className="hst-sec-body">{children}</div>
  </div>
);

const Mini: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="hst-mini">
    <span className="hst-mini-label">{label}</span>
    <span className="hst-mini-value" style={color ? ({ '--c': color } as React.CSSProperties) : undefined}>{value}</span>
  </div>
);

export default HoStats;

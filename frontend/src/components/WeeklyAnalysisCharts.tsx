import React, { useEffect, useMemo, useState } from 'react';
import {
  analyticsApi,
  type AnalyticsTrend,
  type WeeklyAnalyticsResponse,
  type WeekAnalytics,
} from '../lib/api';
import Chart from './social/Chart';
import BottomSheet from './BottomSheet';

/**
 * WeeklyAnalysisCharts · "Análisis semanal del atleta" para el coach.
 *
 * Fetcha /v1/analytics/athlete/{athleteId}/weekly y renderiza 6 mini-gráficos
 * en grid 2-col (mobile-first). Tap → fullscreen con histograma detallado.
 *
 * Props:
 *   - athleteId · UUID
 *   - weeks     · default 8
 */

interface Props {
  athleteId: string;
  weeks?: number;
}

type MetricKey =
  | 'tonelaje'
  | 'intensity'
  | 'adherence'
  | 'rpe'
  | 'zones'
  | 'focus';

const TREND_ARROW: Record<AnalyticsTrend, string> = {
  up: '↗',
  down: '↘',
  flat: '→',
};

const TREND_COLOR: Record<AnalyticsTrend, string> = {
  up: '#22C55E',
  down: '#EF4444',
  flat: '#94A3B8',
};

const COLORS = {
  tonelaje: '#F59E0B',   // gold
  intensity: '#22D3EE',  // cyan
  adherence: '#22C55E',  // green
  rpe: '#F59E0B',        // amber
  zones: '#A855F7',      // violet
  focus: '#3B82F6',      // blue
};

const FOCUS_LABEL: Record<string, string> = {
  olympic: 'Olímpico',
  strength: 'Fuerza',
  accessory: 'Accesorios',
  metcon: 'Metcon',
  rest: 'Descanso',
};

const ZONE_LABEL: Record<string, string> = {
  liviano: 'Liviano <60%',
  tecnico: 'Técnico 60-75%',
  fuerza: 'Fuerza 75-90%',
  maximo: 'Máximo >90%',
};

/** Formatea "2026-05-04" → "4 may" para labels chiquitos del eje x. */
const shortDate = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso.slice(5);
  const m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()];
  return `${d.getDate()} ${m}`;
};

const WeeklyAnalysisCharts: React.FC<Props> = ({ athleteId, weeks = 8 }) => {
  const [data, setData] = useState<WeeklyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<MetricKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsApi
      .weekly(athleteId, weeks)
      .then(res => { if (!cancelled) setData(res); })
      .catch(e => { if (!cancelled) setError(e?.message ?? 'Error de red'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [athleteId, weeks]);

  const lastWeek = useMemo<WeekAnalytics | null>(() => {
    if (!data || data.weeks.length === 0) return null;
    return data.weeks[data.weeks.length - 1];
  }, [data]);

  const previousWeeksAvg = useMemo(() => {
    if (!data || data.weeks.length < 2) return null;
    const prior = data.weeks.slice(0, -1);
    const avg = (vals: number[]) => {
      const filt = vals.filter(v => v > 0);
      return filt.length ? filt.reduce((s, v) => s + v, 0) / filt.length : 0;
    };
    return {
      tonelaje: avg(prior.map(w => w.tonelaje_kg)),
      intensity: avg(prior.map(w => w.avg_intensity_pct)),
      adherence: avg(prior.map(w => w.adherence_pct)),
      rpe: avg(prior.map(w => w.avg_rpe)),
    };
  }, [data]);

  // ----- Loading -----
  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 16, padding: 14, marginBottom: 20, minHeight: 160,
      }}>
        <p style={{
          fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800,
          letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8,
        }}>Análisis semanal · cargando…</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              height: 80, background: 'var(--card-border)', borderRadius: 10, opacity: 0.4,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ----- Error -----
  if (error || !data) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 16, padding: 14, marginBottom: 20,
      }}>
        <p style={{
          fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800,
          letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6,
        }}>Análisis semanal</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {error ?? 'No pudimos cargar el análisis.'}
        </p>
      </div>
    );
  }

  // ----- Empty (sin datos en ninguna semana) -----
  const hasAnyData = data.weeks.some(w => w.sessions_planned > 0);
  if (!hasAnyData) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 16, padding: 14, marginBottom: 20,
      }}>
        <p style={{
          fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800,
          letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6,
        }}>Análisis semanal</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Sin sesiones registradas en las últimas {weeks} semanas. Los gráficos
          aparecerán cuando el atleta complete entrenamientos.
        </p>
      </div>
    );
  }

  const tonelajeSeries = data.weeks.map(w => w.tonelaje_kg);
  const intensitySeries = data.weeks.map(w => w.avg_intensity_pct);
  const rpeSeries = data.weeks.map(w => w.avg_rpe);
  const dateLabels = data.weeks.map(w => shortDate(w.week_start));

  const trends = data.trends;

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 10,
        }}>
          <p style={{
            fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
            letterSpacing: '.12em', textTransform: 'uppercase',
          }}>
            Análisis semanal · últimas {data.weeks_analyzed} semanas
          </p>
        </div>

        {/* ALERT BANNER */}
        {trends.alert && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 12, padding: '10px 12px', marginBottom: 12,
          }}>
            <span style={{ fontSize: 16 }} aria-hidden>⚠</span>
            <p style={{ fontSize: 11.5, color: '#FBBF24', fontWeight: 700, lineHeight: 1.4 }}>
              {trends.alert}
            </p>
          </div>
        )}

        {/* GRID DE MINI-CHARTS · 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* 1. TONELAJE · bars */}
          <MiniCard
            label="Tonelaje"
            value={`${Math.round(lastWeek?.tonelaje_kg ?? 0).toLocaleString('es-AR')} kg`}
            trend={trends.tonelaje_trend}
            color={COLORS.tonelaje}
            onClick={() => setExpanded('tonelaje')}
          >
            <Chart
              data={{ kind: 'bars', values: tonelajeSeries, highlight: tonelajeSeries.length - 1 }}
              color={COLORS.tonelaje}
              width={140}
              height={56}
            />
          </MiniCard>

          {/* 2. INTENSIDAD · sparkline */}
          <MiniCard
            label="Intensidad"
            value={`${Math.round(lastWeek?.avg_intensity_pct ?? 0)}%`}
            trend={trends.intensity_trend}
            color={COLORS.intensity}
            onClick={() => setExpanded('intensity')}
          >
            <Chart
              data={{ kind: 'sparkline', values: intensitySeries }}
              color={COLORS.intensity}
              width={140}
              height={56}
            />
          </MiniCard>

          {/* 3. ADHERENCIA · ring */}
          <MiniCard
            label="Adherencia"
            value={`${Math.round(lastWeek?.adherence_pct ?? 0)}%`}
            trend={trends.adherence_trend}
            color={COLORS.adherence}
            onClick={() => setExpanded('adherence')}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Chart
                data={{
                  kind: 'ring',
                  value: lastWeek?.adherence_pct ?? 0,
                  max: 100,
                  centerLabel: `${Math.round(lastWeek?.adherence_pct ?? 0)}`,
                }}
                color={COLORS.adherence}
                width={60}
                height={60}
              />
            </div>
          </MiniCard>

          {/* 4. RPE · sparkline */}
          <MiniCard
            label="RPE promedio"
            value={(lastWeek?.avg_rpe ?? 0).toFixed(1)}
            trend={trends.rpe_trend}
            color={COLORS.rpe}
            onClick={() => setExpanded('rpe')}
          >
            <Chart
              data={{ kind: 'sparkline', values: rpeSeries }}
              color={COLORS.rpe}
              width={140}
              height={56}
            />
          </MiniCard>

          {/* 5. ZONAS · stacked-ish bars de la semana actual */}
          <MiniCard
            label="Zonas (semana)"
            value={`${(lastWeek?.zone_distribution.fuerza ?? 0) + (lastWeek?.zone_distribution.maximo ?? 0)}/${lastWeek?.sessions_completed ?? 0} fuertes`}
            trend="flat"
            color={COLORS.zones}
            onClick={() => setExpanded('zones')}
            hideTrend
          >
            <Chart
              data={{
                kind: 'bars',
                values: [
                  lastWeek?.zone_distribution.liviano ?? 0,
                  lastWeek?.zone_distribution.tecnico ?? 0,
                  lastWeek?.zone_distribution.fuerza ?? 0,
                  lastWeek?.zone_distribution.maximo ?? 0,
                ],
                labels: ['L', 'T', 'F', 'M'],
              }}
              color={COLORS.zones}
              width={140}
              height={60}
            />
          </MiniCard>

          {/* 6. FOCOS · bars por categoría */}
          <MiniCard
            label="Focos (semana)"
            value={`${(lastWeek?.sessions_planned ?? 0)} ses.`}
            trend="flat"
            color={COLORS.focus}
            onClick={() => setExpanded('focus')}
            hideTrend
          >
            <Chart
              data={{
                kind: 'bars',
                values: [
                  lastWeek?.focus_distribution.olympic ?? 0,
                  lastWeek?.focus_distribution.strength ?? 0,
                  lastWeek?.focus_distribution.accessory ?? 0,
                  lastWeek?.focus_distribution.metcon ?? 0,
                  lastWeek?.focus_distribution.rest ?? 0,
                ],
                labels: ['Ol', 'Fz', 'Ac', 'Mc', 'Rs'],
              }}
              color={COLORS.focus}
              width={140}
              height={60}
            />
          </MiniCard>
        </div>

        {data.data_source === 'empty' && (
          <p style={{
            fontSize: 10, color: 'var(--text-secondary)', opacity: 0.7,
            marginTop: 8, textAlign: 'center',
          }}>
            Datos de demo · sin Postgres conectado
          </p>
        )}
      </div>

      {/* EXPANDED DETAIL · histograma por semana */}
      <BottomSheet
        open={expanded !== null}
        onClose={() => setExpanded(null)}
        title={
          expanded === 'tonelaje' ? 'Tonelaje por semana' :
          expanded === 'intensity' ? 'Intensidad por semana' :
          expanded === 'adherence' ? 'Adherencia por semana' :
          expanded === 'rpe' ? 'RPE por semana' :
          expanded === 'zones' ? 'Zonas de intensidad' :
          expanded === 'focus' ? 'Distribución de focos' :
          'Detalle'
        }
      >
        {expanded && (
          <ExpandedDetail
            metric={expanded}
            weeks={data.weeks}
            dateLabels={dateLabels}
            previousAvg={previousWeeksAvg}
          />
        )}
      </BottomSheet>
    </>
  );
};

/* ------------------------------------------------------------------ */

interface MiniCardProps {
  label: string;
  value: string;
  trend: AnalyticsTrend;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
  hideTrend?: boolean;
}

const MiniCard: React.FC<MiniCardProps> = ({
  label, value, trend, color, onClick, children, hideTrend,
}) => (
  <button
    onClick={onClick}
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--card-border)',
      borderRadius: 14, padding: 12, cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{
        fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800,
        letterSpacing: '.08em', textTransform: 'uppercase',
      }}>{label}</span>
      {!hideTrend && (
        <span style={{
          fontSize: 11, fontWeight: 900, color: TREND_COLOR[trend],
        }} aria-label={`tendencia ${trend}`}>{TREND_ARROW[trend]}</span>
      )}
    </div>
    <div style={{
      fontSize: 15, fontWeight: 900, color, letterSpacing: '-.02em', lineHeight: 1,
    }}>{value}</div>
    <div>{children}</div>
  </button>
);

/* ------------------------------------------------------------------ */

interface ExpandedDetailProps {
  metric: MetricKey;
  weeks: WeekAnalytics[];
  dateLabels: string[];
  previousAvg: { tonelaje: number; intensity: number; adherence: number; rpe: number } | null;
}

const ExpandedDetail: React.FC<ExpandedDetailProps> = ({
  metric, weeks, dateLabels, previousAvg,
}) => {
  const getValue = (w: WeekAnalytics): number => {
    switch (metric) {
      case 'tonelaje': return w.tonelaje_kg;
      case 'intensity': return w.avg_intensity_pct;
      case 'adherence': return w.adherence_pct;
      case 'rpe': return w.avg_rpe;
      default: return 0;
    }
  };
  const formatValue = (v: number): string => {
    switch (metric) {
      case 'tonelaje': return `${Math.round(v).toLocaleString('es-AR')} kg`;
      case 'intensity': return `${Math.round(v)}%`;
      case 'adherence': return `${Math.round(v)}%`;
      case 'rpe': return v.toFixed(1);
      default: return String(v);
    }
  };

  const color =
    metric === 'tonelaje' ? COLORS.tonelaje :
    metric === 'intensity' ? COLORS.intensity :
    metric === 'adherence' ? COLORS.adherence :
    metric === 'rpe' ? COLORS.rpe :
    metric === 'zones' ? COLORS.zones :
    COLORS.focus;

  // Zonas/focos: render distinto · breakdown de la semana más reciente + totales
  if (metric === 'zones' || metric === 'focus') {
    const last = weeks[weeks.length - 1];
    const dist = metric === 'zones'
      ? last.zone_distribution
      : last.focus_distribution;
    const labels = metric === 'zones' ? ZONE_LABEL : FOCUS_LABEL;
    const total = Object.values(dist).reduce((s, v) => s + v, 0);

    // sumar también acumulado de todas las semanas para contexto
    const totalAll: Record<string, number> = {};
    weeks.forEach(w => {
      const src = metric === 'zones' ? w.zone_distribution : w.focus_distribution;
      Object.entries(src).forEach(([k, v]) => {
        totalAll[k] = (totalAll[k] ?? 0) + v;
      });
    });
    const sumAll = Object.values(totalAll).reduce((s, v) => s + v, 0) || 1;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Semana actual: {total} sesión{total === 1 ? '' : 'es'}.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(dist).map(([k, n]) => {
            const pct = total > 0 ? (n / total) * 100 : 0;
            return (
              <div key={k}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, fontWeight: 700, marginBottom: 4,
                }}>
                  <span style={{ color: 'var(--text)' }}>{labels[k] ?? k}</span>
                  <span style={{ color }}>
                    {n} {pct > 0 ? `· ${Math.round(pct)}%` : ''}
                  </span>
                </div>
                <div style={{
                  height: 6, background: 'var(--card-border)',
                  borderRadius: 3, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: color, borderRadius: 3,
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 8, paddingTop: 12,
          borderTop: '1px solid var(--card-border)',
        }}>
          <p style={{
            fontSize: 10, color: 'var(--text-secondary)', fontWeight: 800,
            letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Promedio últimas {weeks.length} semanas
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(totalAll).map(([k, n]) => {
              const pct = (n / sumAll) * 100;
              return (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, color: 'var(--text-secondary)',
                }}>
                  <span>{labels[k] ?? k}</span>
                  <span style={{ fontWeight: 700 }}>
                    {n} ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Métricas numéricas · histograma + tabla
  const series = weeks.map(getValue);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--card-border)',
        borderRadius: 12, padding: 14,
      }}>
        <Chart
          data={{ kind: 'bars', values: series, labels: dateLabels, highlight: series.length - 1 }}
          color={color}
          width={300}
          height={140}
        />
      </div>

      {previousAvg && (
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4,
        }}>
          Promedio de las {weeks.length - 1} semanas previas:{' '}
          <strong style={{ color }}>
            {formatValue(
              metric === 'tonelaje' ? previousAvg.tonelaje :
              metric === 'intensity' ? previousAvg.intensity :
              metric === 'adherence' ? previousAvg.adherence :
              previousAvg.rpe,
            )}
          </strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{
          fontSize: 10, color: 'var(--text-secondary)', fontWeight: 800,
          letterSpacing: '.08em', textTransform: 'uppercase',
        }}>Detalle por semana</p>
        {weeks.map((w, i) => (
          <div key={w.week_start} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', borderRadius: 8,
            background: i === weeks.length - 1 ? 'var(--surface)' : 'transparent',
            border: i === weeks.length - 1 ? `1px solid ${color}40` : '1px solid transparent',
          }}>
            <span style={{
              fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700,
            }}>{dateLabels[i]}</span>
            <span style={{
              fontSize: 12, color: 'var(--text)', fontWeight: 800,
            }}>
              {formatValue(getValue(w))}
              {w.sessions_planned > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600,
                }}>
                  {w.sessions_completed}/{w.sessions_planned} ses
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyAnalysisCharts;

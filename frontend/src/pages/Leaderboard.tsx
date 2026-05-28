import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';
import '../styles/v2/leaderboard.css';

/**
 * Leaderboard · ranking del club/box para HO y VOL.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.lb-root`. Acento
 * product-aware via data-accent: ámbar (--engine-macro, HO) o
 * cyan/stress (--engine-stress, Volta). Se monta dentro de
 * PhoneLayout. Lógica intacta: ranking, filtros, branching por
 * producto y navegación se preservan; solo cambia la presentación.
 * Mirror de los idiomas del leaderboard de OlyIndex.
 *
 * Resuelve el feedback de audit: el "Top 23%" del OLY/CF Index estaba aislado
 * sin comparación social. Esta pantalla muestra el ranking real con:
 *  - Podio top 3 con coronas
 *  - Lista top 10 con tendencia
 *  - Usuario logueado destacado (borde acento)
 *  - Si está fuera del top 10, fila separada con "subí X para entrar"
 *  - Filtro temporal (semana/mes/all-time) y tabs de métrica por producto
 *  - CTA compartir → SOCIAL con celebration leaderboard
 */

// Medallas/rangos · hex alineados a tokens V2, aplicados via `--c` inline
const RANK_C: Record<number, string> = {
  1: '#FFB300', // oro
  2: '#94A3B8', // plata
  3: '#FF6B35', // bronce
};

type Period = 'week' | 'month' | 'all';
type Trend = 'up' | 'down' | 'flat';

interface LbRow {
  id: string;
  name: string;
  trend: Trend;
}

const HO_NAMES: Omit<LbRow, never>[] = [
  { id: 'a1', name: 'Marco Torres', trend: 'up' },
  { id: 'a2', name: 'Lucía Ramos', trend: 'up' },
  { id: 'a3', name: 'Diego Suárez', trend: 'flat' },
  { id: 'a4', name: 'Camila Vega', trend: 'down' },
  { id: 'a5', name: 'Pablo Iglesias', trend: 'up' },
  { id: 'a6', name: 'Sofía Méndez', trend: 'flat' },
  { id: 'a7', name: 'Franco Rizzo', trend: 'down' },
  { id: 'a8', name: 'Daniela Moreno', trend: 'up' },
  { id: 'a9', name: 'Nicolás Paredes', trend: 'flat' },
  { id: 'a10', name: 'Renata Bianchi', trend: 'up' },
  { id: 'a11', name: 'Iván Castillo', trend: 'down' },
  { id: 'a12', name: 'Valentina Cruz', trend: 'flat' },
  { id: 'a13', name: 'Tomás Aguirre', trend: 'up' },
  { id: 'a14', name: 'Carla Fuentes', trend: 'down' },
];

// Deterministic pseudo-random by seed (string)
function seedNum(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

interface MetricSpec {
  id: string;
  label: string;
  unit: string;
  /** Si true, valores más bajos son mejores (ej tiempo de Fran) */
  lowerIsBetter?: boolean;
  /** Genera el valor numérico para mostrar (no para ordenar) */
  gen: (seed: string) => number;
  /** Formato visual del valor */
  format: (v: number) => string;
}

// ───── HO metrics ─────
const HO_METRICS: MetricSpec[] = [
  {
    id: 'oly_index', label: 'OLY Index', unit: '',
    gen: (s) => 2.5 + seedNum(s, 1) * 2.0,
    format: (v) => v.toFixed(2),
  },
  {
    id: 'tonelaje', label: 'Tonelaje', unit: 't',
    gen: (s) => 18 + seedNum(s, 2) * 16,
    format: (v) => `${v.toFixed(1)}t`,
  },
  {
    id: 'snatch', label: 'Snatch', unit: 'kg',
    gen: (s) => 80 + Math.round(seedNum(s, 3) * 50),
    format: (v) => `${Math.round(v)}kg`,
  },
  {
    id: 'cj', label: 'C&J', unit: 'kg',
    gen: (s) => 100 + Math.round(seedNum(s, 4) * 60),
    format: (v) => `${Math.round(v)}kg`,
  },
  {
    id: 'racha', label: 'Racha', unit: 'd',
    gen: (s) => 3 + Math.round(seedNum(s, 5) * 40),
    format: (v) => `${Math.round(v)}d`,
  },
];

// ───── VOL metrics ─────
const VOL_METRICS: MetricSpec[] = [
  {
    id: 'cf_index', label: 'CF Index', unit: '',
    gen: (s) => 50 + seedNum(s, 1) * 45,
    format: (v) => Math.round(v).toString(),
  },
  {
    id: 'wods_rx', label: 'WODs Rx', unit: '',
    gen: (s) => 5 + Math.round(seedNum(s, 2) * 35),
    format: (v) => `${Math.round(v)}`,
  },
  {
    id: 'fran', label: 'Fran', unit: '', lowerIsBetter: true,
    gen: (s) => 180 + seedNum(s, 3) * 180, // 3:00–6:00 en segundos
    format: (v) => `${Math.floor(v / 60)}:${Math.floor(v % 60).toString().padStart(2, '0')}`,
  },
  {
    id: 'helen', label: 'Helen', unit: '', lowerIsBetter: true,
    gen: (s) => 480 + seedNum(s, 4) * 360, // 8:00–14:00
    format: (v) => `${Math.floor(v / 60)}:${Math.floor(v % 60).toString().padStart(2, '0')}`,
  },
  {
    id: 'murph', label: 'Murph', unit: '', lowerIsBetter: true,
    gen: (s) => 2100 + seedNum(s, 5) * 1500, // 35:00–60:00
    format: (v) => `${Math.floor(v / 60)}:${Math.floor(v % 60).toString().padStart(2, '0')}`,
  },
];

// Period multiplier para variar valores entre semana/mes/all
const PERIOD_FACTOR: Record<Period, number> = { week: 0.95, month: 1.05, all: 1.18 };

const Leaderboard: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();
  const { product } = useProduct();

  const isVolta = product === 'volta';

  const metrics = isVolta ? VOL_METRICS : HO_METRICS;
  const [metricIdx, setMetricIdx] = useState(0);
  const [period, setPeriod] = useState<Period>('week');

  const metric = metrics[metricIdx];

  const userName = athlete?.name ?? 'Tu nombre';

  // Build rows: 14 atletas mock + el user logueado
  const rows = useMemo(() => {
    const base: LbRow[] = HO_NAMES.slice(0, 14);
    const me: LbRow = { id: '__me__', name: userName, trend: 'up' };
    const all = [...base, me];

    const factor = PERIOD_FACTOR[period];
    const scored = all.map(r => {
      const raw = metric.gen(`${r.id}|${metric.id}|${period}`);
      const value = raw * factor;
      return { ...r, value };
    });

    scored.sort((a, b) => metric.lowerIsBetter ? a.value - b.value : b.value - a.value);
    return scored.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [metric, period, userName]);

  const myRow = rows.find(r => r.id === '__me__')!;
  const top10 = rows.slice(0, 10);
  const userInTop10 = myRow.rank <= 10;
  const gapToTop10 = userInTop10 ? 0 : myRow.rank - 10;

  const periodLabel = period === 'week' ? 'Esta semana' : period === 'month' ? 'Este mes' : 'Todo el tiempo';

  const handleShare = () => {
    try {
      // La celebration 'leaderboard_top10' está en el catalog (celebrations.ts).
      localStorage.setItem('social:preferred_celebration', 'leaderboard_top10');
      localStorage.setItem('social:preferred_variant', 'stadium');
      // Datos para que el celebration builder los lea
      localStorage.setItem('social:lb_rank', String(myRow.rank));
      localStorage.setItem('social:lb_total', String(rows.length));
      localStorage.setItem('social:lb_metric', metric.label);
      localStorage.setItem('social:lb_value', metric.format(myRow.value));
      localStorage.setItem('social:lb_period_label', periodLabel);
      if (athlete?.club) localStorage.setItem('social:lb_club', athlete.club);
    } catch { /* ignore */ }
    navigate('SOCIAL');
  };

  return (
    <div className="lb-root anim-fade-in" data-accent={isVolta ? 'volta' : 'ho'}>
      <div className="lb-scroll">

        {/* Header */}
        <div className="lb-head">
          <p className="lb-eyebrow">{isVolta ? 'Ranking del box' : 'Ranking del club'}</p>
          <h1 className="lb-title">Top 10 atletas</h1>
        </div>

        {/* Period filter */}
        <div className="lb-period">
          {([
            { id: 'week', label: 'Esta semana' },
            { id: 'month', label: 'Este mes' },
            { id: 'all', label: 'Todo el tiempo' },
          ] as Array<{ id: Period; label: string }>).map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className="lb-period-btn btn-press"
              data-active={period === p.id}
            >{p.label}</button>
          ))}
        </div>

        {/* Metric tabs */}
        <div className="lb-metrics scroll-x-no-bar">
          {metrics.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setMetricIdx(i)}
              className="lb-metric-chip btn-press"
              data-active={metricIdx === i}
            >{m.label}</button>
          ))}
        </div>

        {/* Podio top 3 */}
        <Podium
          top3={rows.slice(0, 3)}
          metric={metric}
          myId={myRow.id}
        />

        {/* Top 10 list */}
        <p className="lb-list-label">Top 10 · {metric.label}</p>
        <div className="lb-list">
          {top10.map((r, i) => (
            <Row
              key={r.id}
              rank={r.rank}
              name={r.name}
              value={metric.format(r.value)}
              trend={r.trend}
              isMe={r.id === myRow.id}
              last={i === top10.length - 1}
            />
          ))}
        </div>

        {/* Si user fuera del top 10 → mostrar su posición */}
        {!userInTop10 && (
          <div className="lb-me-card">
            <Row
              rank={myRow.rank}
              name={myRow.name}
              value={metric.format(myRow.value)}
              trend={myRow.trend}
              isMe
              last
            />
            <div className="lb-me-hint">
              Tu posición: <strong>#{myRow.rank}</strong> · subí{' '}
              <strong>{gapToTop10}</strong>{' '}
              {gapToTop10 === 1 ? 'puesto' : 'puestos'} para entrar al top 10
            </div>
          </div>
        )}

        {/* CTA compartir */}
        <button onClick={handleShare} className="lb-share btn-press">
          Compartir tu posición →
        </button>

        <p className="lb-footnote">
          Los rankings se actualizan diariamente · {isVolta ? 'box' : 'club'} {athlete?.club ?? '—'}
        </p>
      </div>
    </div>
  );
};

/* ────────────────────────── Podium ────────────────────────── */

interface PodiumProps {
  top3: Array<{ id: string; name: string; rank: number; value: number; trend: Trend }>;
  metric: MetricSpec;
  myId: string;
}

const PODIUM_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const Podium: React.FC<PodiumProps> = ({ top3, metric, myId }) => {
  // Orden visual: 2 · 1 · 3
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="lb-podium">
      {order.map(p => {
        if (!p) return <div key="empty" />;
        const isMe = p.id === myId;
        const c = RANK_C[p.rank];
        const medal = PODIUM_MEDALS[p.rank] ?? '';
        const initial = p.name.charAt(0).toUpperCase();
        return (
          <div key={p.id} className="lb-pod-col" data-me={isMe} style={{ '--c': c } as React.CSSProperties}>
            {/* Avatar + medalla */}
            <div className="lb-pod-avatar-wrap">
              <div className="lb-pod-avatar">{initial}</div>
              <div className="lb-pod-medal">{medal}</div>
            </div>
            {/* Nombre */}
            <p className="lb-pod-name">{p.name.split(' ')[0]}</p>
            {/* Valor */}
            <p className="lb-pod-value">{metric.format(p.value)}</p>
            {/* Bloque del podio */}
            <div className="lb-pod-block" data-rank={p.rank}>
              <span className="lb-pod-rank">#{p.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ────────────────────────── Row ────────────────────────── */

interface RowProps {
  rank: number;
  name: string;
  value: string;
  trend: Trend;
  isMe: boolean;
  last: boolean;
}

const TREND_GLYPH: Record<Trend, { sym: string; color?: string }> = {
  up: { sym: '▲', color: '#22C55E' },
  down: { sym: '▼', color: '#EF4444' },
  flat: { sym: '→' },
};

const Row: React.FC<RowProps> = ({ rank, name, value, trend, isMe, last }) => {
  const initial = name.charAt(0).toUpperCase();
  const tg = TREND_GLYPH[trend];
  const isPodium = rank <= 3;
  return (
    <div className="lb-row" data-me={isMe} data-divider={!last && !isMe}>
      {/* Rank */}
      <div className="lb-rank" data-top={isPodium} data-medal={isPodium}>
        {isPodium ? PODIUM_MEDALS[rank] : `#${rank}`}
      </div>
      {/* Avatar */}
      <div className="lb-avatar">{initial}</div>
      {/* Name */}
      <div className="lb-name-wrap">
        <p className="lb-name">{name}{isMe && <span className="lb-name-me">· Tú</span>}</p>
      </div>
      {/* Trend */}
      <span className="lb-trend" style={tg.color ? ({ '--c': tg.color } as React.CSSProperties) : undefined}>
        {tg.sym}
      </span>
      {/* Value */}
      <div className="lb-value">{value}</div>
    </div>
  );
};

export default Leaderboard;

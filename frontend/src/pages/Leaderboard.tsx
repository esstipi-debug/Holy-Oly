import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';

/**
 * Leaderboard · ranking del club/box para HO y VOL.
 *
 * Resuelve el feedback de audit: el "Top 23%" del OLY/CF Index estaba aislado
 * sin comparación social. Esta pantalla muestra el ranking real con:
 *  - Podio top 3 con coronas
 *  - Lista top 10 con tendencia
 *  - Usuario logueado destacado (borde dorado/cyan)
 *  - Si está fuera del top 10, fila separada con "subí X para entrar"
 *  - Filtro temporal (semana/mes/all-time) y tabs de métrica por producto
 *  - CTA compartir → SOCIAL con celebration leaderboard
 */

const C = {
  bg: '#07070F', surface: '#0F0F1C', surface2: '#161626', line: '#1E1E32',
  text: '#EAEAF5', muted: '#94A3B8', dim: '#52527A',
  gold: '#F5C518', goldDim: '#B8860B',
  cyan: '#00E5FF', cyanDim: '#00B8CC',
  green: '#22C55E', red: '#FF3D00', amber: '#FFB300',
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
  const accent = isVolta ? C.cyan : C.gold;
  const accentDim = isVolta ? C.cyanDim : C.goldDim;
  const accentRgba = isVolta ? '0,229,255' : '245,197,24';

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
    <div className="anim-fade-in" style={{ background: C.bg, minHeight: '100%', color: C.text, paddingBottom: 110 }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: accent, textTransform: 'uppercase', margin: 0 }}>
          {isVolta ? 'Ranking del box' : 'Ranking del club'}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', margin: '2px 0 0' }}>
          Top 10 atletas
        </h1>
      </div>

      {/* Period filter */}
      <div style={{ padding: '6px 16px 10px', display: 'flex', gap: 8 }}>
        {([
          { id: 'week', label: 'Esta semana' },
          { id: 'month', label: 'Este mes' },
          { id: 'all', label: 'Todo el tiempo' },
        ] as Array<{ id: Period; label: string }>).map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="btn-press"
            style={{
              flex: 1, padding: '7px 0', borderRadius: 12,
              background: period === p.id ? `rgba(${accentRgba},0.14)` : 'transparent',
              border: `1px solid ${period === p.id ? `rgba(${accentRgba},0.45)` : 'rgba(255,255,255,0.10)'}`,
              color: period === p.id ? accent : C.muted,
              fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}
          >{p.label}</button>
        ))}
      </div>

      {/* Metric tabs */}
      <div
        className="scroll-x-no-bar"
        style={{ padding: '6px 16px 14px', display: 'flex', gap: 8, overflowX: 'auto' }}
      >
        {metrics.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setMetricIdx(i)}
            className="btn-press"
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              background: metricIdx === i ? `rgba(${accentRgba},0.15)` : 'transparent',
              border: `1px solid ${metricIdx === i ? `rgba(${accentRgba},0.45)` : 'rgba(255,255,255,0.10)'}`,
              color: metricIdx === i ? accent : C.muted,
              fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}
          >{m.label}</button>
        ))}
      </div>

      {/* Podio top 3 */}
      <div style={{ padding: '0 16px 12px' }}>
        <Podium
          top3={rows.slice(0, 3)}
          metric={metric}
          accent={accent}
          accentRgba={accentRgba}
          myId={myRow.id}
        />
      </div>

      {/* Top 10 list */}
      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: C.muted, textTransform: 'uppercase', margin: '6px 0 8px' }}>
          Top 10 · {metric.label}
        </p>
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 18, padding: 6,
        }}>
          {top10.map((r, i) => (
            <Row
              key={r.id}
              rank={r.rank}
              name={r.name}
              value={metric.format(r.value)}
              trend={r.trend}
              isMe={r.id === myRow.id}
              accent={accent}
              accentRgba={accentRgba}
              last={i === top10.length - 1}
            />
          ))}
        </div>

        {/* Si user fuera del top 10 → mostrar su posición */}
        {!userInTop10 && (
          <div style={{
            marginTop: 12,
            background: `linear-gradient(135deg, rgba(${accentRgba},0.10), rgba(${accentRgba},0.02))`,
            border: `1px solid rgba(${accentRgba},0.45)`,
            borderRadius: 18, padding: 6,
            boxShadow: `0 0 24px rgba(${accentRgba},0.10)`,
          }}>
            <Row
              rank={myRow.rank}
              name={myRow.name}
              value={metric.format(myRow.value)}
              trend={myRow.trend}
              isMe
              accent={accent}
              accentRgba={accentRgba}
              last
            />
            <div style={{
              padding: '8px 12px 4px',
              fontSize: 11, color: accentDim, fontWeight: 700, textAlign: 'center',
            }}>
              Tu posición: <strong style={{ color: accent }}>#{myRow.rank}</strong> · subí{' '}
              <strong style={{ color: accent }}>{gapToTop10}</strong>{' '}
              {gapToTop10 === 1 ? 'puesto' : 'puestos'} para entrar al top 10
            </div>
          </div>
        )}

        {/* CTA compartir */}
        <button
          onClick={handleShare}
          className="btn-press"
          style={{
            width: '100%', marginTop: 16, padding: '14px 0',
            background: `linear-gradient(135deg, ${accent}, ${accentDim})`,
            color: '#07070F', fontSize: 14, fontWeight: 900,
            border: 'none', borderRadius: 14,
            cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '.04em', textTransform: 'uppercase',
            boxShadow: `0 4px 24px rgba(${accentRgba},0.30)`,
          }}
        >
          Compartir tu posición →
        </button>

        <p style={{ fontSize: 10, color: C.dim, textAlign: 'center', marginTop: 10 }}>
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
  accent: string;
  accentRgba: string;
  myId: string;
}

const PODIUM_HEIGHTS: Record<number, number> = { 1: 86, 2: 66, 3: 50 };
const PODIUM_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const PODIUM_GLOW: Record<number, string> = {
  1: 'rgba(245,197,24,0.45)',
  2: 'rgba(192,192,192,0.40)',
  3: 'rgba(205,127,50,0.40)',
};
const PODIUM_RING: Record<number, string> = {
  1: '#F5C518', 2: '#C0C0C0', 3: '#CD7F32',
};

const Podium: React.FC<PodiumProps> = ({ top3, metric, accent, accentRgba, myId }) => {
  // Orden visual: 2 · 1 · 3
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end',
      gap: 8, padding: '14px 4px 6px',
      background: `linear-gradient(180deg, rgba(${accentRgba},0.04) 0%, transparent 80%)`,
      borderRadius: 18,
    }}>
      {order.map(p => {
        if (!p) return <div key="empty" />;
        const isMe = p.id === myId;
        const height = PODIUM_HEIGHTS[p.rank] ?? 50;
        const ring = PODIUM_RING[p.rank] ?? accent;
        const glow = PODIUM_GLOW[p.rank] ?? `rgba(${accentRgba},0.30)`;
        const medal = PODIUM_MEDALS[p.rank] ?? '';
        const initial = p.name.charAt(0).toUpperCase();
        return (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {/* Avatar + medalla */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: `${ring}22`,
                border: `2px solid ${ring}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: ring,
                boxShadow: `0 0 18px ${glow}`,
              }}>{initial}</div>
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                fontSize: 20,
              }}>{medal}</div>
            </div>
            {/* Nombre */}
            <p style={{
              fontSize: 10, fontWeight: 800, color: isMe ? accent : '#EAEAF5',
              margin: 0, textAlign: 'center', maxWidth: 90,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.name.split(' ')[0]}</p>
            {/* Valor */}
            <p style={{
              fontSize: 13, fontWeight: 900, color: ring, margin: 0,
              fontStyle: 'italic', fontVariantNumeric: 'tabular-nums',
            }}>{metric.format(p.value)}</p>
            {/* Bloque del podio */}
            <div style={{
              width: '100%', height,
              background: `linear-gradient(180deg, ${ring}22 0%, ${ring}05 100%)`,
              border: `1px solid ${ring}55`,
              borderRadius: '10px 10px 0 0',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              paddingTop: 6,
            }}>
              <span style={{
                fontSize: 16, fontWeight: 900, color: ring,
                fontStyle: 'italic',
              }}>#{p.rank}</span>
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
  accent: string;
  accentRgba: string;
  last: boolean;
}

const TREND_GLYPH: Record<Trend, { sym: string; color: string }> = {
  up: { sym: '▲', color: C.green },
  down: { sym: '▼', color: C.red },
  flat: { sym: '→', color: C.dim },
};

const Row: React.FC<RowProps> = ({ rank, name, value, trend, isMe, accent, accentRgba, last }) => {
  const initial = name.charAt(0).toUpperCase();
  const tg = TREND_GLYPH[trend];
  const isPodium = rank <= 3;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 10px',
      borderBottom: last ? 'none' : `1px solid ${C.line}`,
      background: isMe ? `rgba(${accentRgba},0.10)` : 'transparent',
      border: isMe ? `1px solid rgba(${accentRgba},0.50)` : '1px solid transparent',
      borderRadius: 12,
      margin: 2,
    }}>
      {/* Rank */}
      <div style={{
        width: 28, textAlign: 'center',
        fontSize: 14, fontWeight: 900,
        color: isMe ? accent : isPodium ? accent : C.muted,
        fontStyle: 'italic', fontVariantNumeric: 'tabular-nums',
      }}>
        {isPodium ? PODIUM_MEDALS[rank] : `#${rank}`}
      </div>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: isMe ? `rgba(${accentRgba},0.20)` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isMe ? accent : 'rgba(255,255,255,0.10)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900, color: isMe ? accent : C.text,
      }}>{initial}</div>
      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: isMe ? 900 : 700,
          color: isMe ? accent : C.text,
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}{isMe && <span style={{ fontSize: 9, marginLeft: 6, color: accent, fontWeight: 800 }}>· TÚ</span>}</p>
      </div>
      {/* Trend */}
      <span style={{ fontSize: 12, color: tg.color, fontWeight: 900, width: 14, textAlign: 'center' }}>
        {tg.sym}
      </span>
      {/* Value */}
      <div style={{
        minWidth: 60, textAlign: 'right',
        fontSize: 14, fontWeight: 900,
        color: isMe ? accent : C.text,
        fontStyle: 'italic', fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
};

export default Leaderboard;

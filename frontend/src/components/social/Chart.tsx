import React from 'react';

/**
 * Gráficos SVG inline para social cards.
 * Sin dependencias · ligeros · screenshot-friendly.
 *
 * Tipos:
 * - sparkline: línea con área para tendencias (volumen 14d, intensidad)
 * - bars: barras verticales (sesiones por día, set count)
 * - ring: anillo progress (adherencia %, completion %)
 * - heatmap14: matriz 14 días estilo GitHub (días consecutivos)
 * - comparison: antes/después horizontal (Snatch 6 meses atrás vs hoy)
 */

export type ChartData =
  | { kind: 'sparkline'; values: number[]; labels?: string[] }
  | { kind: 'bars'; values: number[]; labels?: string[]; highlight?: number }
  | { kind: 'ring'; value: number; max: number; centerLabel?: string }
  | { kind: 'heatmap14'; days: Array<{ date: string; intensity: number }> }
  | { kind: 'comparison'; before: number; after: number; unit?: string }
  | { kind: 'radar'; axes: Array<{ label: string; value: number; ideal?: number; max?: number }> };

interface Props {
  data: ChartData;
  color: string;
  width?: number;
  height?: number;
  /** dark | light · cambia colores secundarios (grid, labels) */
  scheme?: 'dark' | 'light';
}

const Chart: React.FC<Props> = ({ data, color, width = 280, height = 80, scheme = 'dark' }) => {
  const mute = scheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(10,10,20,0.18)';
  const muteText = scheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(10,10,20,0.55)';

  if (data.kind === 'sparkline') return <Sparkline {...data} color={color} mute={mute} muteText={muteText} width={width} height={height} />;
  if (data.kind === 'bars') return <Bars {...data} color={color} mute={mute} muteText={muteText} width={width} height={height} />;
  if (data.kind === 'ring') return <Ring {...data} color={color} mute={mute} width={Math.min(width, height)} />;
  if (data.kind === 'heatmap14') return <Heatmap14 {...data} color={color} mute={mute} width={width} />;
  if (data.kind === 'comparison') return <Comparison {...data} color={color} mute={mute} muteText={muteText} width={width} height={height} />;
  if (data.kind === 'radar') return <Radar {...data} color={color} mute={mute} muteText={muteText} width={Math.min(width, height)} />;
  return null;
};

/* ------------------------------------------------------------------ */

const Sparkline: React.FC<{ values: number[]; labels?: string[]; color: string; mute: string; muteText: string; width: number; height: number }> = ({ values, labels, color, mute, muteText, width, height }) => {
  if (values.length === 0) return null;
  const pad = 6;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => [pad + i * stepX, height - pad - ((v - min) / range) * (height - pad * 2 - 12)]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]},${height - pad} L${pts[0][0]},${height - pad} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke={mute} strokeWidth="0.5" />
      <path d={area} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} stroke={scheme(mute)} strokeWidth="1.5" />
      {labels && labels.length === values.length && (
        <>
          <text x={pad} y={height - 0.5} fontSize="7" fontWeight="800" fill={muteText} textAnchor="start">{labels[0]}</text>
          <text x={width - pad} y={height - 0.5} fontSize="7" fontWeight="800" fill={muteText} textAnchor="end">{labels[labels.length - 1]}</text>
        </>
      )}
    </svg>
  );
};

// helper: pick stroke color for the data point circle
const scheme = (mute: string) => (mute.includes('255') ? '#0A0A14' : '#F4F1EA');

/* ------------------------------------------------------------------ */

const Bars: React.FC<{ values: number[]; labels?: string[]; highlight?: number; color: string; mute: string; muteText: string; width: number; height: number }> = ({ values, labels, highlight, color, mute, muteText, width, height }) => {
  if (values.length === 0) return null;
  const pad = 8;
  const gap = 4;
  const barW = (width - pad * 2 - gap * (values.length - 1)) / values.length;
  const max = Math.max(...values, 1);
  const baseY = height - pad - 10;
  const usableH = baseY - pad;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <line x1={pad} x2={width - pad} y1={baseY} y2={baseY} stroke={mute} strokeWidth="0.5" />
      {values.map((v, i) => {
        const h = (v / max) * usableH;
        const x = pad + i * (barW + gap);
        const isHi = highlight === i;
        return (
          <g key={i}>
            <rect
              x={x}
              y={baseY - h}
              width={barW}
              height={h}
              rx={Math.min(barW / 2, 2)}
              fill={isHi ? color : `${color}66`}
            />
            {labels && labels[i] && (
              <text x={x + barW / 2} y={height - 1} fontSize="7" fontWeight="800" fill={muteText} textAnchor="middle">{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ */

const Ring: React.FC<{ value: number; max: number; centerLabel?: string; color: string; mute: string; width: number }> = ({ value, max, centerLabel, color, mute, width }) => {
  const size = width;
  const stroke = Math.max(size * 0.09, 6);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const off = c * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={mute} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {centerLabel && (
        <text x={size / 2} y={size / 2 + size * 0.08} fontSize={size * 0.28} fontWeight="900" fill={color} textAnchor="middle" fontStyle="italic">
          {centerLabel}
        </text>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------ */

const Heatmap14: React.FC<{ days: Array<{ date: string; intensity: number }>; color: string; mute: string; width: number }> = ({ days, color, mute, width }) => {
  const cols = 14;
  const data = days.slice(-cols);
  const cellGap = 4;
  const cellW = (width - cellGap * (cols - 1)) / cols;
  const size = Math.min(cellW, 22);
  const total = size * cols + cellGap * (cols - 1);
  const offsetX = (width - total) / 2;
  const height = size + 14;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      {data.map((d, i) => {
        const x = offsetX + i * (size + cellGap);
        const intensity = Math.min(Math.max(d.intensity, 0), 1);
        const fill = intensity === 0 ? mute : color;
        const opacity = intensity === 0 ? 1 : 0.3 + intensity * 0.7;
        return (
          <rect key={i} x={x} y={0} width={size} height={size} rx={3} fill={fill} opacity={opacity} />
        );
      })}
      <text x={offsetX} y={height - 2} fontSize="7" fontWeight="800" fill={mute.includes('255') ? 'rgba(255,255,255,0.5)' : 'rgba(10,10,20,0.55)'}>−13d</text>
      <text x={offsetX + total} y={height - 2} fontSize="7" fontWeight="800" fill={mute.includes('255') ? 'rgba(255,255,255,0.5)' : 'rgba(10,10,20,0.55)'} textAnchor="end">HOY</text>
    </svg>
  );
};

/* ------------------------------------------------------------------ */

const Comparison: React.FC<{ before: number; after: number; unit?: string; color: string; mute: string; muteText: string; width: number; height: number }> = ({ before, after, unit, color, mute, muteText, width, height }) => {
  const max = Math.max(before, after, 1);
  const pad = 8;
  const barH = (height - pad * 2 - 10) / 2;
  const usableW = width - pad * 2 - 60;

  const beforeW = (before / max) * usableW;
  const afterW = (after / max) * usableW;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <text x={pad} y={pad + barH / 2 + 3} fontSize="8" fontWeight="800" fill={muteText}>ANTES</text>
      <rect x={pad + 38} y={pad} width={beforeW} height={barH} rx={3} fill={`${color}55`} />
      <text x={pad + 38 + beforeW + 4} y={pad + barH / 2 + 3} fontSize="9" fontWeight="900" fill={muteText}>{before}{unit}</text>

      <text x={pad} y={pad + barH + 4 + barH / 2 + 3} fontSize="8" fontWeight="800" fill={color}>HOY</text>
      <rect x={pad + 38} y={pad + barH + 4} width={afterW} height={barH} rx={3} fill={color} />
      <text x={pad + 38 + afterW + 4} y={pad + barH + 4 + barH / 2 + 3} fontSize="9" fontWeight="900" fill={color}>{after}{unit}</text>

      <line x1={pad + 38} x2={pad + 38} y1={pad - 2} y2={pad + barH * 2 + 6} stroke={mute} strokeWidth="0.5" />
    </svg>
  );
};

/* ------------------------------------------------------------------ */

const Radar: React.FC<{ axes: Array<{ label: string; value: number; ideal?: number; max?: number }>; color: string; mute: string; muteText: string; width: number }> = ({ axes, color, mute, muteText, width }) => {
  const size = width;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 22;  // padding para labels

  const n = axes.length;
  if (n < 3) return null;

  // Cada eje a normalizado [0..1] usando max o el max del eje (default 100)
  const norm = axes.map(a => Math.min(1, Math.max(0, a.value / (a.max ?? 100))));
  const normIdeal = axes.map(a => a.ideal != null ? Math.min(1, Math.max(0, a.ideal / (a.max ?? 100))) : null);

  // Coords en círculo: ángulo i = -π/2 + 2π*i/n (empezando arriba)
  const pointAt = (i: number, factor: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + Math.cos(angle) * r * factor, cy + Math.sin(angle) * r * factor];
  };

  // Grid (4 anillos: 0.25, 0.5, 0.75, 1.0)
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const buildPath = (factors: number[]) => factors.map((f, i) => {
    const [x, y] = pointAt(i, f);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';

  const valuePath = buildPath(norm);
  const idealPath = normIdeal.every(v => v != null) ? buildPath(normIdeal as number[]) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <defs>
        <radialGradient id={`radar-fill-${color.replace('#','')}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </radialGradient>
      </defs>

      {/* Grid anillos */}
      {gridLevels.map((level, li) => (
        <path
          key={li}
          d={buildPath(Array(n).fill(level))}
          fill="none"
          stroke={mute}
          strokeWidth={level === 1 ? 1 : 0.5}
          strokeDasharray={level === 1 ? '' : '2 2'}
        />
      ))}

      {/* Spokes (líneas de centro a vértices) */}
      {axes.map((_, i) => {
        const [x, y] = pointAt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={mute} strokeWidth="0.5" />;
      })}

      {/* Ideal polygon (referencia, opcional) */}
      {idealPath && (
        <path d={idealPath} fill="none" stroke={muteText} strokeWidth="1.5" strokeDasharray="3 3" />
      )}

      {/* Value polygon (perfil real) */}
      <path d={valuePath} fill={`url(#radar-fill-${color.replace('#','')})`} stroke={color} strokeWidth="2" strokeLinejoin="round" />

      {/* Dots en vértices */}
      {norm.map((f, i) => {
        const [x, y] = pointAt(i, f);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}

      {/* Labels en cada eje (afuera) */}
      {axes.map((a, i) => {
        const [x, y] = pointAt(i, 1.18);
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const anchor = Math.cos(angle) > 0.3 ? 'start' : Math.cos(angle) < -0.3 ? 'end' : 'middle';
        return (
          <g key={`label-${i}`}>
            <text
              x={x} y={y}
              fontSize="8.5" fontWeight="800" fill={muteText}
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {a.label.toUpperCase()}
            </text>
            <text
              x={x} y={y + 10}
              fontSize="9" fontWeight="900" fill={color}
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {Math.round(a.value)}{a.max && a.max <= 100 ? '%' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default Chart;

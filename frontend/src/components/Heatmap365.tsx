import React, { useMemo, useState } from 'react';
import { useProduct } from '../context/ProductContext';

/**
 * Heatmap365 · grid 53×7 estilo GitHub contributions.
 *
 * Muestra un año completo de sesiones del atleta. Mobile-first con scroll
 * horizontal (el grid total mide ~742px, más ancho que un viewport mobile).
 * Las stats al pie quedan FUERA del scroll, en el container fijo.
 *
 * Niveles (0-4) derivados de session:
 *   0 → !completed                 · gris sutil
 *   1 → completed && rpe <= 6      · accent 25%
 *   2 → completed && rpe == 7      · accent 50%
 *   3 → completed && rpe == 8      · accent 75%
 *   4 → completed && rpe >= 9      · accent 100% saturado
 *
 * Si `sessions` no aporta suficiente data para llenar el año, el componente
 * genera mock determinista por día (semana activos, weekends variables, 2-3
 * deload weeks por año) para que la pantalla nunca se vea vacía.
 */

interface SessionShape {
  date: string;
  volume?: number;
  load?: number;
  completed: boolean;
  rpe_reported?: number;
}

interface Props {
  sessions?: SessionShape[];
  /** Año a mostrar · default = año actual */
  year?: number;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_LABELS = ['Lun', '', 'Mié', '', 'Vie', '', ''];

const CELL_SIZE = 10;
const CELL_GAP = 2;
const COLS = 53;
const ROWS = 7;

// ─────────────────────────────────────────────────────────
// Mock determinista por día del año
// ─────────────────────────────────────────────────────────

/** PRNG simple determinista (Mulberry32-ish) sembrado por año + día */
function seededRand(seed: number): number {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function mockYearData(year: number): Map<string, { level: number; volume: number }> {
  const map = new Map<string, { level: number; volume: number }>();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  // 2-3 deload weeks repartidas (semanas 9, 22, 38 aproximadamente)
  const deloadWeeks = new Set([9, 22, 38]);

  let d = new Date(start);
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
    const week = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000));
    const rand = seededRand(year * 10000 + (d.getMonth() + 1) * 100 + d.getDate());

    let level = 0;
    let volume = 0;

    if (deloadWeeks.has(week)) {
      // Deload: pocos días, intensidad baja
      if (dayOfWeek === 1 || dayOfWeek === 4) {
        level = rand > 0.4 ? 1 : 0;
      }
    } else if (dayOfWeek === 0) {
      // Domingo: descanso casi siempre
      level = rand > 0.85 ? 1 : 0;
    } else if (dayOfWeek === 6) {
      // Sábado: variable
      level = rand > 0.55 ? (rand > 0.85 ? 3 : 2) : 0;
    } else {
      // Lun-Vie: activos
      const r = rand;
      if (r < 0.15) level = 0;
      else if (r < 0.35) level = 1;
      else if (r < 0.60) level = 2;
      else if (r < 0.85) level = 3;
      else level = 4;
    }

    if (level > 0) volume = Math.round(2000 + level * 1200 + rand * 800);

    map.set(iso, { level, volume });
    d.setDate(d.getDate() + 1);
  }
  return map;
}

// ─────────────────────────────────────────────────────────
// Lógica de level desde session real
// ─────────────────────────────────────────────────────────

function sessionToLevel(s: SessionShape): number {
  if (!s.completed) return 0;
  const rpe = s.rpe_reported ?? 0;
  if (rpe <= 6) return 1;
  if (rpe === 7) return 2;
  if (rpe === 8) return 3;
  return 4; // rpe >= 9
}

// ─────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────

const Heatmap365: React.FC<Props> = ({ sessions = [], year }) => {
  const { product } = useProduct();
  const accent = product === 'volta' ? '#00E5FF' : '#F5C518';
  const currentYear = year ?? new Date().getFullYear();

  // Construir mapa día → {level, volume} mezclando data real + mock fallback
  const dataMap = useMemo(() => {
    const base = mockYearData(currentYear);
    // Override con data real (sessions) si entra en el año
    for (const s of sessions) {
      if (!s.date || s.date.slice(0, 4) !== String(currentYear)) continue;
      const level = sessionToLevel(s);
      const volume = s.volume ?? s.load ?? 0;
      base.set(s.date.slice(0, 10), { level, volume });
    }
    return base;
  }, [sessions, currentYear]);

  // Construir grid 53×7 desde 1 enero
  // El primer día del año cae en algún día de la semana; alineamos lunes-arriba
  const grid = useMemo(() => {
    const start = new Date(currentYear, 0, 1);
    // weekIndex 0 a 52, dayIndex 0 (Lun) a 6 (Dom)
    // JS getDay: 0=Dom; mapeamos: Lun=0, Mar=1, ... Dom=6
    const cells: Array<{ date: string; level: number; volume: number; col: number; row: number; inYear: boolean } | null> = [];

    // Pre-pad días antes del 1-ene (quedan vacíos)
    const startDay = (start.getDay() + 6) % 7; // Mon=0
    let cursor = new Date(start);
    cursor.setDate(cursor.getDate() - startDay);

    for (let i = 0; i < COLS * ROWS; i++) {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;
      const iso = cursor.toISOString().slice(0, 10);
      const inYear = cursor.getFullYear() === currentYear;
      const data = dataMap.get(iso);
      cells.push({
        date: iso,
        level: inYear && data ? data.level : 0,
        volume: inYear && data ? data.volume : 0,
        col,
        row,
        inYear,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [currentYear, dataMap]);

  // Stats
  const stats = useMemo(() => {
    // Solo días dentro del año
    const yearCells = grid.filter((c): c is NonNullable<typeof c> => c !== null && c.inYear);
    const total = yearCells.filter(c => c.level > 0).length;

    // Mejor racha: máximo run de days con level > 0
    let bestStreak = 0;
    let curStreak = 0;
    for (const c of yearCells) {
      if (c.level > 0) {
        curStreak++;
        if (curStreak > bestStreak) bestStreak = curStreak;
      } else {
        curStreak = 0;
      }
    }

    // Racha actual: hacia atrás desde hoy (o último día del año si ya pasó)
    const today = new Date();
    const cutoff = today.getFullYear() === currentYear ? today : new Date(currentYear, 11, 31);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    let currentStreak = 0;
    for (let i = yearCells.length - 1; i >= 0; i--) {
      const c = yearCells[i];
      if (c.date > cutoffIso) continue;
      if (c.level > 0) currentStreak++;
      else break;
    }

    // Adherencia: completed / esperado (4 sesiones/semana)
    const today2 = new Date();
    const refDate = today2.getFullYear() === currentYear ? today2 : new Date(currentYear, 11, 31);
    const startDate = new Date(currentYear, 0, 1);
    const daysSoFar = Math.max(1, Math.floor((refDate.getTime() - startDate.getTime()) / 86400000) + 1);
    const expected = Math.round((daysSoFar / 7) * 4);
    const adherence = expected > 0 ? Math.round((total / expected) * 100) : 0;

    return { total, currentStreak, bestStreak, adherence };
  }, [grid, currentYear]);

  // Hovered cell
  const [hoveredCell, setHoveredCell] = useState<{ date: string; level: number; volume: number } | null>(null);

  // Dimensiones del SVG
  const labelLeftWidth = 24;
  const labelTopHeight = 14;
  const gridWidth = COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const gridHeight = ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const svgWidth = labelLeftWidth + gridWidth;
  const svgHeight = labelTopHeight + gridHeight;

  // Posiciones aprox de cada mes (primera columna del mes)
  const monthPositions = useMemo(() => {
    const positions: Array<{ label: string; x: number }> = [];
    const seenMonth = new Set<number>();
    for (const cell of grid) {
      if (!cell || !cell.inYear) continue;
      const d = new Date(cell.date);
      const m = d.getMonth();
      if (!seenMonth.has(m) && d.getDate() <= 7) {
        seenMonth.add(m);
        positions.push({ label: MONTH_LABELS[m], x: labelLeftWidth + cell.col * (CELL_SIZE + CELL_GAP) });
      }
    }
    return positions;
  }, [grid, labelLeftWidth]);

  // Color por nivel
  const cellColor = (level: number): string => {
    if (level === 0) return 'rgba(255,255,255,0.06)';
    if (level === 1) return `${accent}40`; // 25%
    if (level === 2) return `${accent}80`; // 50%
    if (level === 3) return `${accent}BF`; // 75%
    return accent; // 100%
  };

  const formatDateEs = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div style={{
      background: 'var(--surface, #0F0F1C)',
      border: `1px solid ${accent}22`,
      borderRadius: 16,
      padding: 16,
      boxShadow: `0 0 20px ${accent}08`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
            color: accent, textTransform: 'uppercase', margin: 0,
          }}>Año {currentYear}</p>
          <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--text, #EAEAF5)', margin: '2px 0 0', letterSpacing: '-.01em' }}>
            Heatmap de actividad
          </p>
        </div>
        {/* Legenda compacta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--text-secondary, #94A3B8)', marginRight: 4 }}>−</span>
          {[0, 1, 2, 3, 4].map(l => (
            <span key={l} style={{
              width: 10, height: 10, borderRadius: 2,
              background: cellColor(l),
            }} />
          ))}
          <span style={{ fontSize: 9, color: 'var(--text-secondary, #94A3B8)', marginLeft: 4 }}>+</span>
        </div>
      </div>

      {/* Grid scrollable horizontal */}
      <div className="scroll-x-no-bar" style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ display: 'block' }}
        >
          {/* Month labels */}
          {monthPositions.map((m, i) => (
            <text
              key={i}
              x={m.x}
              y={9}
              fontSize="8"
              fontWeight="800"
              fill="var(--text-secondary, #94A3B8)"
            >{m.label}</text>
          ))}

          {/* Day labels (Lun, Mié, Vie en filas 0, 2, 4) */}
          {DAY_LABELS.map((label, row) => {
            if (!label) return null;
            const y = labelTopHeight + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 1;
            return (
              <text
                key={row}
                x={0}
                y={y}
                fontSize="7"
                fontWeight="800"
                fill="var(--text-secondary, #94A3B8)"
              >{label}</text>
            );
          })}

          {/* Cells */}
          {grid.map((cell, i) => {
            if (!cell) return null;
            const x = labelLeftWidth + cell.col * (CELL_SIZE + CELL_GAP);
            const y = labelTopHeight + cell.row * (CELL_SIZE + CELL_GAP);
            const fill = cell.inYear ? cellColor(cell.level) : 'transparent';
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                fill={fill}
                stroke={cell.inYear && cell.level === 0 ? 'rgba(255,255,255,0.03)' : 'none'}
                strokeWidth="0.5"
                style={{ cursor: cell.inYear ? 'pointer' : 'default' }}
                onMouseEnter={() => cell.inYear && setHoveredCell({ date: cell.date, level: cell.level, volume: cell.volume })}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => cell.inYear && setHoveredCell({ date: cell.date, level: cell.level, volume: cell.volume })}
              />
            );
          })}
        </svg>
      </div>

      {/* Tooltip (mobile-friendly · texto fijo abajo del grid) */}
      <div style={{
        marginTop: 10,
        minHeight: 18,
        fontSize: 11,
        color: hoveredCell ? 'var(--text, #EAEAF5)' : 'var(--text-secondary, #94A3B8)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {hoveredCell ? (
          <span>
            <strong style={{ color: accent }}>{formatDateEs(hoveredCell.date)}</strong>
            {' · '}
            {hoveredCell.level === 0 ? 'descanso' : `nivel ${hoveredCell.level}`}
            {hoveredCell.volume > 0 && ` · ${hoveredCell.volume.toLocaleString('es')} kg`}
          </span>
        ) : (
          <span>Tocá un día para ver detalles</span>
        )}
      </div>

      {/* Stats al pie (FUERA del scroll horizontal) */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
      }}>
        <StatBlock label="Total" value={String(stats.total)} hint="sesiones" accent={accent} />
        <StatBlock label="Racha actual" value={String(stats.currentStreak)} hint="días" accent={accent} />
        <StatBlock label="Mejor racha" value={String(stats.bestStreak)} hint="días" accent={accent} />
        <StatBlock label="Adherencia" value={`${stats.adherence}%`} hint="vs plan" accent={accent} />
      </div>
    </div>
  );
};

const StatBlock: React.FC<{ label: string; value: string; hint: string; accent: string }> = ({ label, value, hint, accent }) => (
  <div style={{ textAlign: 'center' }}>
    <p style={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.08em',
      color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', margin: 0,
    }}>{label}</p>
    <p style={{
      fontSize: 18, fontWeight: 900, color: accent, margin: '2px 0 0',
      fontStyle: 'italic', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
    }}>{value}</p>
    <p style={{ fontSize: 9, color: 'var(--text-secondary, #94A3B8)', margin: '2px 0 0' }}>{hint}</p>
  </div>
);

export default Heatmap365;

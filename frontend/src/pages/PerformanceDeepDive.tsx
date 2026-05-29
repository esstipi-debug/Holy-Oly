import React, { useState, useMemo } from 'react';
import BottomSheet from '../components/BottomSheet';
import { useAthlete } from '../context/AthleteContext';
import { derivePrHistory, cjMax, seeded } from '../data/derive';
import { getAthleteWeek, weekTonnage, weekImr } from '../data/sessionDetail';
import { getMacroDetail } from '../data/macroDetail';
import '../styles/v2/performance-deep-dive.css';

/**
 * PerformanceDeepDive · análisis histórico del atleta de halterofilia.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.pdd-root` · acento cyan
 * (--engine-stress · identidad analytics/deep-dive). Se monta dentro de
 * PhoneLayout. Lógica intacta: rangos W/M/Y, volume load, intensidad
 * media interactiva, distribución de levantamientos y los BottomSheets
 * (detalle de día, info de métrica, histórico de PRs) se preservan.
 * Solo cambia la presentación; los BottomSheets son el componente
 * compartido, su contenido interior se estiliza con `.pdd-*`.
 */

type Range = 'W' | 'M' | 'Y';

interface DayDetail {
  label: string;
  fullLabel: string;
  intensity: number;       // %1RM medio de la sesión
  exercises: { name: string; sets: string; load: string; tonelajeKg: number }[];
  prFlag?: boolean;
  notes?: string;
}

interface RangeData {
  volume: string;
  trend: string;
  bars: number[];
  labels: string[];
  details: DayDetail[];
}

// Etiquetas de día/mes. Los datos REALES (intensidad = IMR, tonelaje, ejercicios)
// se derivan POR ATLETA en el componente vía getAthleteWeek + getMacroDetail
// (ver useMemo `rangeData`). Ya no hay sesiones hardcodeadas.
const DAY_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTH_LETTER = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const fmtK = (kg: number) => (kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : `${Math.round(kg)}`);

// ─── METRIC INFO POPOVERS ────────────────────────────────
interface MetricInfo {
  title: string;
  what: string;
  how: string;
  example?: string;
}

const METRIC_INFOS: Record<string, MetricInfo> = {
  volume_load: {
    title: 'Volume Load (VL)',
    what: 'Suma del peso total levantado en el período. Se calcula multiplicando peso × reps × sets de cada serie.',
    how: 'VL = Σ (peso × reps × sets). Un VL creciente indica acumulación de carga; un VL decreciente indica descarga (deload).',
    example: 'Ejemplo: 5 series × 3 reps × 100kg = 1.500 kg de VL para ese ejercicio.',
  },
  intensity_avg: {
    title: 'Intensidad Media Relativa',
    what: 'Promedio del %1RM trabajado por día. Indica qué tan cerca de tu máximo estás levantando.',
    how: '40-60% = volumen / técnica. 60-80% = fuerza. 80-95% = potencia / fuerza máxima. >95% = peaking.',
    example: 'Una sesión de 4×6 al 70% tiene intensidad 70%. Combinada con 1×1 al 90% el promedio sube según los sets.',
  },
  snatch_ratio: {
    title: 'Ratio Snatch/Clean',
    what: 'Relación entre tu mejor Arrancada y tu mejor Cargada. Indica balance técnico.',
    how: 'Ratio sano: 78-82%. <75% = Snatch atrasado (técnica/movilidad). >85% = Clean atrasado (fuerza de jalón).',
    example: 'Snatch 100 / Clean 130 = 77% → tu Snatch está dentro del rango óptimo.',
  },
  rep_max: {
    title: 'Rep Max (Rep.Max)',
    what: 'El mejor peso logrado para un número específico de reps.',
    how: 'Útil para programar entrenos: si tu 3RM es 120kg, podés trabajar 3×3 al 90% (108kg) con seguridad.',
  },
};

// ─── BAR CHART INTERACTIVO ───────────────────────────────
interface ChartProps {
  data: RangeData;
  onBarClick: (idx: number) => void;
}

const InteractiveChart: React.FC<ChartProps> = ({ data, onBarClick }) => (
  <div className="pdd-chart">
    {data.bars.map((h, i) => (
      <button
        key={i}
        onClick={() => onBarClick(i)}
        className="pdd-bar-btn btn-press"
        style={{ '--c': h > 80 ? '#EF4444' : 'var(--pdd-accent)' } as React.CSSProperties}
      >
        <span className="pdd-bar-pct">{h}%</span>
        <span className="pdd-bar-track">
          <span className="pdd-bar-fill" style={{ height: `${(h/100) * 120}px` }} />
        </span>
        <span className="pdd-bar-label">{data.labels[i]}</span>
      </button>
    ))}
  </div>
);

// ─── INFO BUTTON ─────────────────────────────────────────
const InfoButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="pdd-info btn-press" aria-label="Más info">ⓘ</button>
);

const PerformanceDeepDive: React.FC = () => {
  const { athlete } = useAthlete();
  const [range, setRange] = useState<Range>('W');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [activeInfo, setActiveInfo] = useState<MetricInfo | null>(null);
  const [activeLift, setActiveLift] = useState<'snatch' | 'cj' | null>(null);

  // Datos por rango derivados del atleta real (sesiones por ejercicio + IMR).
  const rangeData = useMemo<Record<Range, RangeData>>(() => {
    const empty: RangeData = { volume: '—', trend: '', bars: [], labels: [], details: [] };
    if (!athlete) return { W: empty, M: empty, Y: empty };

    // ── W · semana real, por ejercicio, IMR por día ──
    const week = getAthleteWeek(athlete);
    const wDetails: DayDetail[] = week.map((s, i) => ({
      label: DAY_LETTER[i],
      fullLabel: DAY_FULL[i],
      intensity: s.imr,
      exercises: s.rest
        ? [{ name: 'Descanso', sets: '—', load: '—', tonelajeKg: 0 }]
        : s.exercises.map(e => ({ name: e.movement, sets: `${e.sets}×${e.reps}`, load: `${e.kg}kg`, tonelajeKg: e.tonnage })),
      notes: s.rest ? 'Día de descanso' : `${s.label} · ${s.dur}min · RPE ${s.rpe}`,
    }));
    // Marca el día de mayor IMR como el más exigente de la semana.
    let peak = -1, peakV = -1;
    week.forEach((s, i) => { if (!s.rest && s.imr > peakV) { peakV = s.imr; peak = i; } });
    if (peak >= 0) wDetails[peak] = { ...wDetails[peak], prFlag: true, notes: `${wDetails[peak].notes} · día más intenso` };

    const wTon = weekTonnage(week);
    const W: RangeData = {
      volume: fmtK(wTon),
      trend: `IMR medio ${weekImr(week)}% · Sem ${athlete.macrocycle.week}/${athlete.macrocycle.total_weeks}`,
      bars: wDetails.map(d => d.intensity),
      labels: wDetails.map(d => d.label),
      details: wDetails,
    };

    // ── M · curva semanal REAL del macro (fase), ventana hasta la semana actual ──
    const macro = getMacroDetail(athlete.macrocycle?.program_id ?? null);
    const cur = Math.max(1, Math.min(macro.weekly.length, athlete.macrocycle.week));
    const window = macro.weekly.slice(Math.max(0, cur - 6), Math.max(cur, 1));
    const totalWeekReps = week.reduce((s, d) => s + d.totalReps, 0) || 1;
    const M: RangeData = {
      volume: fmtK(wTon * Math.max(1, window.length)),
      trend: `Fase actual · ${macro.weekly[cur - 1]?.focus ?? ''}`,
      bars: window.map(w => w.imr),
      labels: window.map(w => `S${w.w}`),
      details: window.map(w => ({
        label: `S${w.w}`,
        fullLabel: `Semana ${w.w} · ${w.focus}`,
        intensity: w.imr,
        exercises: [{ name: w.focus, sets: `${w.reps} reps`, load: `${w.imr}% IMR`, tonelajeKg: Math.round(wTon * (w.reps / totalWeekReps)) }],
      })),
    };

    // ── Y · progresión anual determinística (sin fuente real → tendencia ilustrativa) ──
    const r = seeded(`${athlete.id}:year`);
    const yBars = Array.from({ length: 12 }, (_, i) => Math.round(56 + i * 2.4 + (r() - 0.5) * 8));
    const Y: RangeData = {
      volume: fmtK(wTon * 44),
      trend: 'Progresión · 12 meses',
      bars: yBars,
      labels: MONTH_LETTER,
      details: yBars.map((v, i) => ({
        label: MONTH_LETTER[i],
        fullLabel: MONTH_FULL[i],
        intensity: v,
        exercises: [{ name: 'Promedio mensual', sets: '—', load: `${v}% IMR`, tonelajeKg: Math.round(wTon * 4 * (v / 70)) }],
      })),
    };

    return { W, M, Y };
  }, [athlete]);

  const data = rangeData[range];
  const athleteId = athlete?.id ?? 'demo';
  const snatchBest = athlete?.maxes.snatch ?? 112;
  const cjBest = athlete ? cjMax(athlete.maxes.clean, athlete.maxes.jerk) : 145;
  const sRatio = athlete ? Math.round((athlete.maxes.snatch / athlete.maxes.clean) * 100) : 78;
  // Histórico de PRs por lift, derivado del 1RM real del atleta (data/derive.ts).
  const snatchHistory = derivePrHistory(athleteId, 'snatch', snatchBest);
  const cjHistory = derivePrHistory(athleteId, 'cj', cjBest);

  const selectedDay = selectedBar !== null ? data.details[selectedBar] : null;

  return (
    <div className="pdd-root anim-fade-in">
      <div className="pdd-scroll">
        {/* Header */}
        <header className="pdd-head">
          <div className="pdd-head-titles">
            <p className="pdd-eyebrow">Análisis de datos históricos</p>
            <h1 className="pdd-title">Performance</h1>
          </div>
          <div className="pdd-range">
            {(['W', 'M', 'Y'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="pdd-range-btn btn-press"
                data-active={range === r}
              >{r}</button>
            ))}
          </div>
        </header>

        {/* Big Metric Card · ahora clickable + info */}
        <div className="pdd-hero">
          <div className="pdd-hero-glow" />
          <div className="pdd-hero-head">
            <p className="pdd-hero-label">
              Volume Load ({range === 'W' ? 'Semanal' : range === 'M' ? 'Mensual' : 'Anual'})
            </p>
            <InfoButton onClick={() => setActiveInfo(METRIC_INFOS.volume_load)} />
          </div>
          <div className="pdd-hero-row">
            <span className="pdd-hero-num">{data.volume}</span>
            <span className="pdd-hero-unit">kg</span>
          </div>
          <p className="pdd-hero-trend">{data.trend}</p>
        </div>

        {/* Intensity Chart Interactivo */}
        <div className="pdd-section">
          <div className="pdd-sec-head">
            <div className="pdd-sec-titleline">
              <h3 className="pdd-sec-title">Intensidad Media Relativa</h3>
              <InfoButton onClick={() => setActiveInfo(METRIC_INFOS.intensity_avg)} />
            </div>
            <span className="pdd-sec-hint">Tocá una barra</span>
          </div>
          <InteractiveChart data={data} onBarClick={setSelectedBar} />
        </div>

        {/* PR Distribution · cards clickables */}
        <div className="pdd-section">
          <div className="pdd-sec-head">
            <h3 className="pdd-sec-title">Distribución de Levantamientos</h3>
          </div>
          <div className="pdd-lifts">
            <button
              onClick={() => setActiveLift('snatch')}
              className="pdd-lift btn-press"
              style={{ '--c': 'var(--engine-stress)' } as React.CSSProperties}
            >
              <div className="pdd-lift-head">
                <span className="pdd-lift-emoji">🏋️</span>
                <span className="pdd-lift-tag">Snatch</span>
              </div>
              <p className="pdd-lift-best">Best: {snatchBest} kg</p>
              <div className="pdd-lift-foot">
                <p className="pdd-lift-sub">Ratio S/C: {sRatio}%</p>
                <span className="pdd-lift-cta">Ver →</span>
              </div>
            </button>
            <button
              onClick={() => setActiveLift('cj')}
              className="pdd-lift btn-press"
              style={{ '--c': 'var(--engine-pulse)' } as React.CSSProperties}
            >
              <div className="pdd-lift-head">
                <span className="pdd-lift-emoji">💥</span>
                <span className="pdd-lift-tag">C&J</span>
              </div>
              <p className="pdd-lift-best">Best: {cjBest} kg</p>
              <div className="pdd-lift-foot">
                <p className="pdd-lift-sub">Rep.Max: {Math.round(cjBest * 0.9)}×3</p>
                <span className="pdd-lift-cta">Ver →</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ─── BottomSheet: detalle del día (al clickear bar) ─── */}
      <BottomSheet
        open={selectedBar !== null}
        onClose={() => setSelectedBar(null)}
        title={selectedDay ? `${selectedDay.fullLabel} · ${selectedDay.intensity}% intensidad` : ''}
      >
        {selectedDay && (
          <div className="pdd-sheet">
            {selectedDay.prFlag && (
              <div className="pdd-pr-banner">🏆 Día más intenso de la semana</div>
            )}

            <div className="pdd-ex-list">
              {selectedDay.exercises.map((ex, i) => (
                <div key={i} className="pdd-ex">
                  <div>
                    <p className="pdd-ex-name">{ex.name}</p>
                    <p className="pdd-ex-meta">{ex.sets} @ {ex.load}</p>
                  </div>
                  <p className="pdd-ex-ton">{ex.tonelajeKg.toLocaleString('es')} kg</p>
                </div>
              ))}
            </div>

            {selectedDay.notes && (
              <div className="pdd-notes">
                <strong>Notas: </strong>{selectedDay.notes}
              </div>
            )}

            <div className="pdd-total">
              <p className="pdd-total-label">Tonelaje del día</p>
              <p className="pdd-total-val">
                {selectedDay.exercises.reduce((s, e) => s + e.tonelajeKg, 0).toLocaleString('es')} kg
              </p>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ─── BottomSheet: info de métrica ─── */}
      <BottomSheet
        open={activeInfo !== null}
        onClose={() => setActiveInfo(null)}
        title={activeInfo?.title}
      >
        {activeInfo && (
          <div className="pdd-info-body">
            <div>
              <p className="pdd-info-block-label">¿Qué es?</p>
              <p className="pdd-info-text">{activeInfo.what}</p>
            </div>
            <div>
              <p className="pdd-info-block-label">¿Cómo se calcula / interpreta?</p>
              <p className="pdd-info-text">{activeInfo.how}</p>
            </div>
            {activeInfo.example && (
              <div className="pdd-info-example">
                <p className="pdd-info-block-label">Ejemplo</p>
                <p className="pdd-info-text">{activeInfo.example}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* ─── BottomSheet: histórico de PRs ─── */}
      <BottomSheet
        open={activeLift !== null}
        onClose={() => setActiveLift(null)}
        title={activeLift === 'snatch' ? 'Snatch · histórico de PRs' : 'Clean & Jerk · histórico de PRs'}
      >
        {activeLift && (
          <div className="pdd-sheet">
            <div className="pdd-pr-best">
              <p className="pdd-pr-best-label">Mejor marca</p>
              <p className="pdd-pr-best-val">
                {activeLift === 'snatch' ? snatchBest : cjBest} <span>kg</span>
              </p>
              {activeLift === 'snatch' && (
                <button
                  onClick={() => { setActiveLift(null); setActiveInfo(METRIC_INFOS.snatch_ratio); }}
                  className="pdd-pr-link btn-press"
                >Ver explicación de Ratio S/C →</button>
              )}
              {activeLift === 'cj' && (
                <button
                  onClick={() => { setActiveLift(null); setActiveInfo(METRIC_INFOS.rep_max); }}
                  className="pdd-pr-link btn-press"
                >¿Qué es Rep.Max? →</button>
              )}
            </div>

            <p className="pdd-pr-listlabel">Últimos PRs</p>
            <div className="pdd-pr-list">
              {(activeLift === 'snatch' ? snatchHistory : cjHistory).map((pr, i) => (
                <div key={i} className="pdd-pr-row">
                  <span className="pdd-pr-date">{pr.date}</span>
                  <div className="pdd-pr-right">
                    <span className="pdd-pr-kg">{pr.kg} kg</span>
                    <span
                      className="pdd-pr-delta"
                      data-pos={pr.delta > 0}
                    >+{pr.delta}kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default PerformanceDeepDive;

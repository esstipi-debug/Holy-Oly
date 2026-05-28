import React, { useState } from 'react';
import BottomSheet from '../components/BottomSheet';
import { useAthlete } from '../context/AthleteContext';
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

const WEEK_DETAILS: DayDetail[] = [
  { label: 'L', fullLabel: 'Lunes', intensity: 40, exercises: [
    { name: 'Sentadilla Frontal', sets: '4×6', load: '90kg', tonelajeKg: 2160 },
    { name: 'Sentadilla Atrás', sets: '3×4', load: '100kg', tonelajeKg: 1200 },
  ], notes: 'Sesión de volumen liviano post-descanso.' },
  { label: 'M', fullLabel: 'Martes', intensity: 75, exercises: [
    { name: 'Arrancada', sets: '5×2', load: '85kg', tonelajeKg: 850 },
    { name: 'Snatch Pull', sets: '4×3', load: '105kg', tonelajeKg: 1260 },
  ] },
  { label: 'X', fullLabel: 'Miércoles', intensity: 60, exercises: [
    { name: 'Cargada Hang', sets: '4×3', load: '85kg', tonelajeKg: 1020 },
    { name: 'Jerk de soporte', sets: '4×2', load: '100kg', tonelajeKg: 800 },
  ], notes: 'Foco técnico, controles de catch.' },
  { label: 'J', fullLabel: 'Jueves', intensity: 85, exercises: [
    { name: 'Arrancada', sets: '3×1', load: '105kg', tonelajeKg: 315 },
    { name: 'Sentadilla Frontal', sets: '5×3', load: '120kg', tonelajeKg: 1800 },
  ], prFlag: true, notes: 'PR en Front Squat (+5kg) 🏆' },
  { label: 'V', fullLabel: 'Viernes', intensity: 95, exercises: [
    { name: 'Cargada + Envión', sets: '4×1+1', load: '130kg', tonelajeKg: 1040 },
    { name: 'Sentadilla Atrás', sets: '3×2', load: '150kg', tonelajeKg: 900 },
  ], notes: 'Día más exigente. Eficiencia técnica alta.' },
  { label: 'S', fullLabel: 'Sábado', intensity: 70, exercises: [
    { name: 'Arrancada Power', sets: '4×2', load: '80kg', tonelajeKg: 640 },
    { name: 'Push Press', sets: '4×4', load: '75kg', tonelajeKg: 1200 },
  ] },
  { label: 'D', fullLabel: 'Domingo', intensity: 50, exercises: [
    { name: 'Movilidad', sets: '15 min', load: '—', tonelajeKg: 0 },
    { name: 'Técnica barra vacía', sets: '5×5', load: '20kg', tonelajeKg: 500 },
  ], notes: 'Descanso activo.' },
];

const RANGE_DATA: Record<Range, RangeData> = {
  W: {
    volume: '14.2k', trend: '▲ 12% vs semana pasada',
    bars: WEEK_DETAILS.map(d => d.intensity),
    labels: WEEK_DETAILS.map(d => d.label),
    details: WEEK_DETAILS,
  },
  M: {
    volume: '58.7k', trend: '▲ 8% vs mes pasado',
    bars: [60, 70, 85, 78], labels: ['Sem1', 'Sem2', 'Sem3', 'Sem4'],
    details: ['Sem1','Sem2','Sem3','Sem4'].map((l, i) => ({
      label: l, fullLabel: `Semana ${i+1}`, intensity: [60, 70, 85, 78][i],
      exercises: [{ name: 'Promedio semanal', sets: '—', load: '—', tonelajeKg: 14000 + i*200 }],
    })),
  },
  Y: {
    volume: '684k', trend: '▲ 34% vs año pasado',
    bars: [50, 55, 62, 70, 75, 80, 85, 78, 82, 88, 90, 86],
    labels: ['E','F','M','A','M','J','J','A','S','O','N','D'],
    details: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => ({
      label: m[0], fullLabel: m, intensity: [50, 55, 62, 70, 75, 80, 85, 78, 82, 88, 90, 86][i],
      exercises: [{ name: 'Promedio mensual', sets: '—', load: '—', tonelajeKg: 50000 + i*3000 }],
    })),
  },
};

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

// ─── PR HISTORY MOCK ─────────────────────────────────────
const SNATCH_HISTORY = [
  { date: '24 may', kg: 112, delta: '+2' },
  { date: '12 may', kg: 110, delta: '+3' },
  { date: '02 may', kg: 107, delta: '+2' },
  { date: '18 abr', kg: 105, delta: '+0' },
  { date: '01 abr', kg: 105, delta: '+5' },
];

const CJ_HISTORY = [
  { date: '23 may', kg: 145, delta: '+5' },
  { date: '08 may', kg: 140, delta: '+2' },
  { date: '21 abr', kg: 138, delta: '+3' },
  { date: '04 abr', kg: 135, delta: '+5' },
];

const PerformanceDeepDive: React.FC = () => {
  const { athlete } = useAthlete();
  const [range, setRange] = useState<Range>('W');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [activeInfo, setActiveInfo] = useState<MetricInfo | null>(null);
  const [activeLift, setActiveLift] = useState<'snatch' | 'cj' | null>(null);

  const data = RANGE_DATA[range];
  const snatchBest = athlete?.maxes.snatch ?? 112;
  const cjBest = athlete ? (athlete.maxes.clean + athlete.maxes.jerk - athlete.maxes.clean) : 145;
  const sRatio = athlete ? Math.round((athlete.maxes.snatch / athlete.maxes.clean) * 100) : 78;

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
              <div className="pdd-pr-banner">🏆 Día con PR registrado</div>
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
              {(activeLift === 'snatch' ? SNATCH_HISTORY : CJ_HISTORY).map((pr, i) => (
                <div key={i} className="pdd-pr-row">
                  <span className="pdd-pr-date">{pr.date}</span>
                  <div className="pdd-pr-right">
                    <span className="pdd-pr-kg">{pr.kg} kg</span>
                    <span
                      className="pdd-pr-delta"
                      data-pos={pr.delta.startsWith('+') && pr.delta !== '+0'}
                    >{pr.delta}kg</span>
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

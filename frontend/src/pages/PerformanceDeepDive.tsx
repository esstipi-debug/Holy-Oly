import React, { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import BottomSheet from '../components/BottomSheet';
import { useAthlete } from '../context/AthleteContext';

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
  <Card variant="glass" className="h-48 flex items-end justify-between px-4 pb-2 gap-1">
    {data.bars.map((h, i) => (
      <button
        key={i}
        onClick={() => onBarClick(i)}
        className="flex-1 space-y-2 btn-press cursor-pointer"
        style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit' }}
      >
        <p className="text-center text-[8px] text-holy-text-secondary font-bold">{h}%</p>
        <div
          className={`w-full rounded-t-lg transition-all duration-700 ${h > 80 ? 'bg-red-500' : 'bg-holy-primary'}`}
          style={{ height: `${(h/100) * 120}px` }}
        />
        <p className="text-center text-[8px] text-holy-text-secondary font-bold">{data.labels[i]}</p>
      </button>
    ))}
  </Card>
);

// ─── INFO BUTTON ─────────────────────────────────────────
const InfoButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="btn-press"
    style={{
      width: 18, height: 18, borderRadius: '50%',
      background: 'rgba(255,255,255,0.08)',
      color: 'var(--text-secondary)',
      border: 'none', cursor: 'pointer',
      fontSize: 10, fontWeight: 900, fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginLeft: 6,
    }}
    aria-label="Más info"
  >ⓘ</button>
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
    <div className="flex flex-col h-full bg-holy-bg anim-fade-in">
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-holy-text text-2xl font-black italic tracking-tighter">PERFORMANCE</h1>
              <p className="text-holy-primary text-[10px] font-black uppercase mt-1">ANÁLISIS DE DATOS HISTÓRICOS</p>
            </div>
          </div>
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {(['W', 'M', 'Y'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-[9px] font-bold rounded-md btn-press ${
                  range === r ? 'bg-holy-surface text-holy-text' : 'text-holy-text-secondary hover:text-holy-text'
                }`}
              >{r}</button>
            ))}
          </div>
        </header>

        {/* Big Metric Card · ahora clickable + info */}
        <Card variant="solid" className="bg-gradient-to-br from-holy-primary/10 to-transparent border-holy-primary/30 mb-8 overflow-hidden relative">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-holy-primary/10 rounded-full blur-3xl" />
          <div className="flex items-center">
            <p className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest mb-2">
              Volume Load ({range === 'W' ? 'Semanal' : range === 'M' ? 'Mensual' : 'Anual'})
            </p>
            <InfoButton onClick={() => setActiveInfo(METRIC_INFOS.volume_load)} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-holy-text text-5xl font-black italic">{data.volume}</span>
            <span className="text-holy-primary text-sm font-bold">KG</span>
          </div>
          <p className="text-green-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{data.trend}</p>
        </Card>

        {/* Intensity Chart Interactivo */}
        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center pl-1">
            <div className="flex items-center">
              <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest">
                Intensidad Media Relativa
              </h3>
              <InfoButton onClick={() => setActiveInfo(METRIC_INFOS.intensity_avg)} />
            </div>
            <span className="text-[9px] text-holy-text-secondary font-bold">
              👆 Tocá una barra
            </span>
          </div>
          <InteractiveChart data={data} onBarClick={setSelectedBar} />
        </div>

        {/* PR Distribution · cards clickables */}
        <div className="space-y-4 mb-20">
          <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest pl-1">
            Distribución de Levantamientos
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveLift('snatch')}
              className="btn-press text-left"
              style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit' }}
            >
              <Card variant="solid" className="p-4 bg-holy-surface border-holy-surface">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg">🏋️</span>
                  <Badge variant="info">SNATCH</Badge>
                </div>
                <p className="text-holy-text text-xs font-bold">Best: {snatchBest} kg</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-holy-text-secondary text-[10px]">Ratio S/C: {sRatio}%</p>
                  <span className="text-holy-primary text-[10px] font-bold">Ver →</span>
                </div>
              </Card>
            </button>
            <button
              onClick={() => setActiveLift('cj')}
              className="btn-press text-left"
              style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit' }}
            >
              <Card variant="solid" className="p-4 bg-holy-surface border-holy-surface">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg">💥</span>
                  <Badge variant="info">C&J</Badge>
                </div>
                <p className="text-holy-text text-xs font-bold">Best: {cjBest} kg</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-holy-text-secondary text-[10px]">Rep.Max: {Math.round(cjBest * 0.9)}×3</p>
                  <span className="text-holy-primary text-[10px] font-bold">Ver →</span>
                </div>
              </Card>
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
          <div style={{ color: 'var(--text)' }}>
            {selectedDay.prFlag && (
              <div style={{
                background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 12, padding: '10px 14px', marginBottom: 14,
                fontSize: 12, fontWeight: 800, color: '#F59E0B',
              }}>
                🏆 Día con PR registrado
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {selectedDay.exercises.map((ex, i) => (
                <div key={i} style={{
                  background: 'var(--surface)', border: '1px solid var(--card-border)',
                  borderRadius: 12, padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p className="type-body-strong" style={{ color: 'var(--text)' }}>{ex.name}</p>
                    <p className="type-caption" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{ex.sets} @ {ex.load}</p>
                  </div>
                  <p className="type-mono type-heading-sm" style={{ color: 'var(--primary)' }}>
                    {ex.tonelajeKg.toLocaleString('es')} kg
                  </p>
                </div>
              ))}
            </div>

            {selectedDay.notes && (
              <div style={{
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)',
                borderRadius: 12, padding: '10px 14px',
                fontSize: 11, color: 'var(--text)', lineHeight: 1.5,
              }}>
                <strong style={{ color: 'var(--primary)' }}>Notas: </strong>{selectedDay.notes}
              </div>
            )}

            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface)', borderRadius: 12 }}>
              <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>Tonelaje del día</p>
              <p className="type-heading-xl type-mono" style={{ color: 'var(--text)', marginTop: 4 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--text)' }}>
            <div>
              <p className="type-caption" style={{ color: 'var(--primary)' }}>¿Qué es?</p>
              <p className="type-body" style={{ marginTop: 4, color: 'var(--text)' }}>{activeInfo.what}</p>
            </div>
            <div>
              <p className="type-caption" style={{ color: 'var(--primary)' }}>¿Cómo se calcula / interpreta?</p>
              <p className="type-body" style={{ marginTop: 4, color: 'var(--text)' }}>{activeInfo.how}</p>
            </div>
            {activeInfo.example && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--card-border)',
                borderRadius: 12, padding: '10px 14px',
              }}>
                <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>Ejemplo</p>
                <p className="type-body" style={{ marginTop: 4, color: 'var(--text)' }}>{activeInfo.example}</p>
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
          <div style={{ color: 'var(--text)' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.10), transparent)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 14,
            }}>
              <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>Mejor marca</p>
              <p className="type-display type-mono" style={{ color: 'var(--text)', marginTop: 4 }}>
                {activeLift === 'snatch' ? snatchBest : cjBest} <span style={{ fontSize: 18, color: 'var(--primary)' }}>kg</span>
              </p>
              {activeLift === 'snatch' && (
                <button
                  onClick={() => { setActiveLift(null); setActiveInfo(METRIC_INFOS.snatch_ratio); }}
                  className="btn-press"
                  style={{
                    marginTop: 8, fontSize: 10, color: 'var(--primary)', fontWeight: 700,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', padding: 0,
                  }}
                >Ver explicación de Ratio S/C →</button>
              )}
              {activeLift === 'cj' && (
                <button
                  onClick={() => { setActiveLift(null); setActiveInfo(METRIC_INFOS.rep_max); }}
                  className="btn-press"
                  style={{
                    marginTop: 8, fontSize: 10, color: 'var(--primary)', fontWeight: 700,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', padding: 0,
                  }}
                >¿Qué es Rep.Max? →</button>
              )}
            </div>

            <p className="type-caption" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              Últimos PRs
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(activeLift === 'snatch' ? SNATCH_HISTORY : CJ_HISTORY).map((pr, i) => (
                <div key={i} style={{
                  background: 'var(--surface)', border: '1px solid var(--card-border)',
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span className="type-caption" style={{ color: 'var(--text-secondary)' }}>{pr.date}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="type-mono type-heading-sm" style={{ color: 'var(--text)' }}>{pr.kg} kg</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      color: pr.delta.startsWith('+') && pr.delta !== '+0' ? '#22C55E' : 'var(--text-secondary)',
                      padding: '2px 6px', borderRadius: 6,
                      background: pr.delta.startsWith('+') && pr.delta !== '+0' ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.04)',
                    }}>{pr.delta}kg</span>
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

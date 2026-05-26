import React, { useEffect, useMemo } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';
import { useToast } from '../components/Toast';

/**
 * VictoryScreen · sesión finalizada · informativa, NO viral.
 *
 * Producto-aware:
 *  - holy-oly: KPIs específicos de halterofilia (tonelaje, IMR, distribución
 *    por zonas de %1RM, PRs detectados) leídos de `last_session:summary` que
 *    persiste ActiveSession antes de navegar acá.
 *  - volta: pantalla "celebración genérica" original (no se rompe).
 *
 * Diseño:
 *  - Cero botones (el atleta toma screenshot nativo del dispositivo)
 *  - Toast "✓ Sesión guardada" al entrar (confirmación explícita)
 *  - Toda la data útil de la sesión + recomendación post-sesión basada en IMR
 *  - Contexto del mesociclo (semana X/Y)
 */

// 4 zonas canónicas de halterofilia (mismas que HoStats.tsx · keep DRY)
const ZONES = [
  { id: 'liviano', label: 'Liviano', range: '<60%',  color: '#56CCF2' },
  { id: 'tecnico', label: 'Técnico', range: '60-75%', color: '#22C55E' },
  { id: 'fuerza',  label: 'Fuerza',  range: '75-90%', color: '#F5C518' },
  { id: 'maximo',  label: 'Máximo',  range: '>90%',  color: '#FF3D00' },
] as const;

interface SessionSummary {
  date: string;
  product: 'holy-oly';
  duration_seconds: number;
  exercises: Array<{
    name: string;
    targetSets: number;
    targetReps: number;
    pct: number;
    max: number;
    sets_completed: number;
    sets_failed: number;
    sets: Array<{ weight: number; reps: number; result: 'completed' | 'failed' }>;
  }>;
  total_tonelaje: number;
  imr_pct: number;
  zone_distribution: { liviano: number; tecnico: number; fuerza: number; maximo: number };
  prs_detected: Array<{ label: string; weight: number; delta: number }>;
}

const readSummary = (): SessionSummary | null => {
  try {
    const raw = localStorage.getItem('last_session:summary');
    if (!raw) return null;
    return JSON.parse(raw) as SessionSummary;
  } catch { return null; }
};

/**
 * Recomendación post-sesión basada en IMR:
 *  - IMR alto (>82%): SNC estresado, prioridad descanso/sueño.
 *  - IMR medio (72-82%): zona técnico-fuerza, hidratación + proteína.
 *  - IMR bajo (<72%): sesión liviana, considerar subir intensidad.
 */
const recommendationByIMR = (imr: number): { title: string; body: string; color: string } => {
  if (imr >= 82) return {
    title: 'SNC bajo carga',
    body: 'Dormí 8h hoy · el sistema nervioso pide reset. Mañana priorizá descanso entre series si tenés otra sesión pesada.',
    color: '#EF4444',
  };
  if (imr >= 72) return {
    title: 'Buena sesión técnica',
    body: 'Hidratación + proteína post-entreno. Trabajaste en zona fuerza-técnica, es donde se construye el patrón.',
    color: '#F5C518',
  };
  return {
    title: 'Sesión liviana',
    body: 'Tu cuerpo no se fortalece si la carga es muy baja. Considerá subir intensidad la próxima sesión.',
    color: '#22C55E',
  };
};

const imrColor = (imr: number) => imr > 82 ? '#EF4444' : imr >= 72 ? '#F5C518' : '#22C55E';

const VictoryScreenHO: React.FC<{ summary: SessionSummary | null }> = ({ summary }) => {
  const { athlete } = useAthlete();
  const { showToast } = useToast();
  const macro = athlete?.macrocycle;

  // Toast confirmación una sola vez al entrar
  useEffect(() => {
    if (!summary) return;
    const mm = Math.floor(summary.duration_seconds / 60).toString().padStart(2, '0');
    const ss = (summary.duration_seconds % 60).toString().padStart(2, '0');
    showToast({
      message: `✓ Sesión guardada · ${summary.total_tonelaje.toLocaleString('es')}kg en ${mm}:${ss}`,
      variant: 'success',
      duration: 3000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback si no hay summary persistido (e.g. ingreso directo via deep link)
  const data = useMemo<SessionSummary>(() => summary ?? {
    date: new Date().toISOString(),
    product: 'holy-oly',
    duration_seconds: 0,
    exercises: [],
    total_tonelaje: 0,
    imr_pct: 0,
    zone_distribution: { liviano: 0, tecnico: 0, fuerza: 0, maximo: 0 },
    prs_detected: [],
  }, [summary]);

  const mm = Math.floor(data.duration_seconds / 60).toString().padStart(2, '0');
  const ss = (data.duration_seconds % 60).toString().padStart(2, '0');

  const totalSetsCompleted = data.exercises.reduce((a, ex) => a + ex.sets_completed, 0);
  const totalSetsPlanned = data.exercises.reduce((a, ex) => a + ex.targetSets, 0);
  const compliance = totalSetsPlanned > 0 ? Math.round((totalSetsCompleted / totalSetsPlanned) * 100) : 0;

  const tons = (data.total_tonelaje / 1000).toFixed(2);
  const imr = data.imr_pct;
  const reco = recommendationByIMR(imr);
  const prCount = data.prs_detected.length;

  const totalZoneSets =
    data.zone_distribution.liviano +
    data.zone_distribution.tecnico +
    data.zone_distribution.fuerza +
    data.zone_distribution.maximo;

  return (
    <div className="flex flex-col min-h-full bg-holy-bg text-holy-text overflow-y-auto" style={{ paddingBottom: 28 }}>

      {/* HERO */}
      <div className="px-6 pt-10 pb-4 flex flex-col items-center text-center relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-holy-gold/15 via-holy-gold/5 to-transparent pointer-events-none" />

        <div className="relative mb-4 z-10">
          <div className="absolute inset-0 bg-holy-gold/30 blur-3xl rounded-full" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-holy-gold to-amber-700 flex items-center justify-center text-4xl shadow-2xl shadow-holy-gold/50 relative border border-white/20">
            🏆
          </div>
          {prCount > 0 && (
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-holy-bg shadow-xl">
              {prCount} PR
            </div>
          )}
        </div>

        <p className="text-[10px] font-black tracking-[0.3em] text-holy-gold uppercase">HOLY OLY · SMART TRAINING</p>
        <h1 className="text-2xl font-black italic tracking-tighter uppercase mt-1">Sesión guardada</h1>
        <p className="text-[10px] font-bold text-green-400 mt-1 tracking-wide">✓ Confirmado · datos persistidos</p>
        {macro && (
          <p className="text-[11px] font-bold text-holy-text-secondary mt-2 tracking-wide">
            {macro.program_name} · Semana {macro.week}/{macro.total_weeks} · {macro.focus}
          </p>
        )}
        <p className="text-[10px] text-holy-text-secondary mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {mm}:{ss} · {new Date(data.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* HERO STATS · 4 boxes */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-3">
        <StatBox
          label="Tonelaje"
          value={tons}
          unit="t"
          sub={`${data.total_tonelaje.toLocaleString('es')} kg movidos`}
          accent="#F5C518"
        />
        <StatBox
          label="IMR · Intensidad"
          value={String(imr)}
          unit="% 1RM"
          sub={imr > 82 ? 'Zona MÁXIMA · SNC alto' : imr >= 72 ? 'Zona Fuerza' : 'Zona Técnica'}
          accent={imrColor(imr)}
        />
        <StatBox
          label="Series"
          value={`${totalSetsCompleted}/${totalSetsPlanned}`}
          unit={totalSetsCompleted >= totalSetsPlanned && totalSetsPlanned > 0 ? '✓' : ''}
          sub={`${compliance}% del plan`}
          accent={compliance >= 100 ? '#22C55E' : '#56CCF2'}
        />
        <StatBox
          label="Duración"
          value={`${mm}:${ss}`}
          unit=""
          sub="Tiempo total"
          accent="#7C5CFF"
        />
      </div>

      {/* DISTRIBUCIÓN POR ZONA · halterofilia-specific */}
      <div className="px-4 mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-holy-text-secondary mb-2 px-1">
          Distribución por zona de intensidad
        </p>
        <div className="bg-[#0F0F1C] border border-[#1E1E32] rounded-2xl p-4">
          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden bg-[#1E1E32] mb-3">
            {ZONES.map(z => {
              const count = data.zone_distribution[z.id as keyof typeof data.zone_distribution];
              const w = totalZoneSets > 0 ? (count / totalZoneSets) * 100 : 0;
              if (w === 0) return null;
              return (
                <div
                  key={z.id}
                  style={{
                    width: `${w}%`,
                    background: z.color,
                    transition: 'width 0.6s ease',
                  }}
                  title={`${z.label} · ${count} sets`}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {ZONES.map(z => {
              const count = data.zone_distribution[z.id as keyof typeof data.zone_distribution];
              const pct = totalZoneSets > 0 ? Math.round((count / totalZoneSets) * 100) : 0;
              return (
                <div key={z.id} className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: z.color, display: 'inline-block' }} />
                  <span className="text-[10px] font-bold text-holy-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {z.label}
                  </span>
                  <span className="text-[10px] text-holy-text-secondary">
                    {z.range}
                  </span>
                  <span className="text-[10px] font-black ml-auto" style={{ color: z.color, fontVariantNumeric: 'tabular-nums' }}>
                    {count} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRs DETECTADOS */}
      {prCount > 0 && (
        <div className="px-4 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-green-400 mb-2 px-1">
            🔥 NUEVO PR detectado
          </p>
          <div className="bg-green-500/10 border border-green-500/40 rounded-2xl overflow-hidden">
            {data.prs_detected.map((pr, i) => (
              <div
                key={`${pr.label}-${i}`}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(34,197,94,0.2)' }}
              >
                <span className="text-sm font-black tracking-tight text-green-400">{pr.label}</span>
                <div className="text-right">
                  <p className="text-sm font-black italic" style={{ color: '#22C55E', fontVariantNumeric: 'tabular-nums' }}>
                    {pr.weight}kg
                  </p>
                  <p className="text-[10px] text-green-300 font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    +{pr.delta}kg vs anterior
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETALLE EJERCICIOS */}
      {data.exercises.length > 0 && (
        <div className="px-4 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-holy-text-secondary mb-2 px-1">
            Detalle de la sesión
          </p>
          <div className="bg-[#0F0F1C] border border-[#1E1E32] rounded-2xl overflow-hidden">
            {data.exercises.map((ex, i) => {
              const exTonelaje = ex.sets.reduce((a, s) => s.result === 'completed' ? a + s.weight * s.reps : a, 0);
              const avgWeight = ex.sets_completed > 0
                ? Math.round(ex.sets.filter(s => s.result === 'completed').reduce((a, s) => a + s.weight, 0) / ex.sets_completed)
                : 0;
              return (
                <div
                  key={ex.name}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid #1E1E32' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black tracking-tight">{ex.name}</p>
                    <p className="text-[10px] text-holy-text-secondary mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {ex.sets_completed}/{ex.targetSets} × {ex.targetReps} @ {avgWeight}kg · {ex.pct}% 1RM
                      {ex.sets_failed > 0 && (
                        <span className="text-red-400 font-bold"> · {ex.sets_failed} fallo{ex.sets_failed > 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black italic text-holy-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {exTonelaje.toLocaleString('es')}
                      <span className="text-[10px] text-holy-text-secondary ml-0.5 not-italic">kg</span>
                    </p>
                    <p className="text-[9px] text-holy-text-secondary uppercase tracking-wider">volumen</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MESOCICLO */}
      {macro && macro.total_weeks > 0 && (
        <div className="px-4 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-holy-text-secondary mb-2 px-1">
            Tu mesociclo
          </p>
          <div className="bg-[#0F0F1C] border border-[#1E1E32] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black">{macro.program_name}</span>
              <span className="text-[10px] font-bold text-holy-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                Semana {macro.week} / {macro.total_weeks}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#1E1E32] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-holy-gold to-amber-500"
                style={{ width: `${Math.round((macro.week / macro.total_weeks) * 100)}%`, transition: 'width 1s ease' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* RECOMENDACIÓN POST-SESIÓN basada en IMR */}
      <div className="px-4 mb-3">
        <div
          className="rounded-2xl p-4"
          style={{
            background: `${reco.color}14`,
            border: `1px solid ${reco.color}44`,
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-2" style={{ color: reco.color }}>
            Recomendación post-sesión
          </p>
          <p className="text-[14px] font-black tracking-tight mb-1">
            {reco.title}
          </p>
          <p className="text-[12px] text-holy-text-secondary leading-relaxed">
            {reco.body}
          </p>
        </div>
      </div>

      <p className="text-center text-[9px] font-black italic tracking-tighter text-holy-text-secondary mt-2 px-6">
        holyoly.app · SMART TRAINING · ZERO BURNOUT
      </p>
    </div>
  );
};

/** Variante VOLTA · pantalla genérica de celebración (compat backwards). */
const VictoryScreenVolta: React.FC = () => {
  const { showToast } = useToast();
  useEffect(() => {
    showToast({ message: '✓ WOD guardado', variant: 'success', duration: 2500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex flex-col min-h-full bg-holy-bg text-holy-text overflow-y-auto" style={{ paddingBottom: 28 }}>
      <div className="px-6 pt-10 pb-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-holy-gold to-amber-700 flex items-center justify-center text-4xl shadow-2xl shadow-holy-gold/50 border border-white/20 mb-4">
          🏆
        </div>
        <p className="text-[10px] font-black tracking-[0.3em] text-holy-gold uppercase">VOLTA · PEAK QUAL</p>
        <h1 className="text-2xl font-black italic tracking-tighter uppercase mt-1">WOD guardado</h1>
        <p className="text-[10px] font-bold text-green-400 mt-1 tracking-wide">✓ Confirmado · datos persistidos</p>
      </div>
    </div>
  );
};

const VictoryScreen: React.FC = () => {
  const { product } = useProduct();
  const summary = useMemo(() => readSummary(), []);
  if (product === 'volta') return <VictoryScreenVolta />;
  return <VictoryScreenHO summary={summary} />;
};

const StatBox: React.FC<{ label: string; value: string; unit: string; sub: string; accent: string }> = ({ label, value, unit, sub, accent }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent}33`,
    }}
  >
    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-holy-text-secondary">{label}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-black italic tracking-tighter" style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {unit && <span className="text-[11px] font-bold text-holy-text-secondary">{unit}</span>}
    </div>
    <p className="text-[9px] text-holy-text-secondary mt-1 leading-tight">{sub}</p>
  </div>
);

export default VictoryScreen;

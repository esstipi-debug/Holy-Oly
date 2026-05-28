import React, { useEffect, useMemo } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';
import { useToast } from '../components/Toast';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/victory.css';

/**
 * VictoryScreen · sesión finalizada · informativa, NO viral.
 *
 * Producto-aware:
 *  - holy-oly: KPIs específicos de halterofilia (tonelaje, IMR, distribución
 *    por zonas de %1RM, PRs detectados) leídos de `last_session:summary` que
 *    persiste ActiveSession antes de navegar acá.
 *  - volta: pantalla "celebración genérica" original (no se rompe).
 *
 * Diseño (V2 dark · scoped `.vic-root`):
 *  - Acento producto-aware: HO rojo/ámbar · Volta cyan (vía data-product).
 *  - Cero botones (el atleta toma screenshot nativo del dispositivo)
 *  - Toast "✓ Sesión guardada" al entrar (confirmación explícita)
 *  - Disco PlateBadge como centerpiece celebratorio (HO · tier por PR/peso)
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

/**
 * Mapea un peso (kg) a un tier de disco para el centerpiece celebratorio.
 * Sólo cosmético: traduce magnitud de carga al color del disco oficial
 * (blanco→verde→amarillo→azul→rojo) para que el PR "se sienta" más grande.
 */
const weightToTier = (kg: number): PlateTier => {
  if (kg >= 140) return 'red';
  if (kg >= 100) return 'blue';
  if (kg >= 60)  return 'yellow';
  if (kg > 0)    return 'green';
  return 'white';
};

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

  // Centerpiece: si hubo PR, el disco toma el tier del PR más pesado.
  const topPrWeight = prCount > 0 ? Math.max(...data.prs_detected.map(p => p.weight)) : 0;
  const heroTier = weightToTier(topPrWeight);

  return (
    <div className="vic-root" data-product="holy-oly">

      {/* HERO */}
      <header className="vic-hero">
        <div className="vic-emblem">
          {prCount > 0 ? (
            <PlateBadge tier={heroTier} size={104} animate />
          ) : (
            <div className="vic-emblem-trophy">🏆</div>
          )}
          {prCount > 0 && (
            <span className="vic-emblem-pr">{prCount} PR</span>
          )}
        </div>

        <p className="vic-eyebrow">HOLY OLY · SMART TRAINING</p>
        <h1 className="vic-title">Sesión guardada</h1>
        <span className="vic-confirm"><span className="dot" />Confirmado · datos persistidos</span>
        {macro && (
          <p className="vic-macro-line">
            {macro.program_name} · Semana {macro.week}/{macro.total_weeks} · {macro.focus}
          </p>
        )}
        <p className="vic-date">
          {mm}:{ss} · {new Date(data.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </header>

      {/* HERO STATS · 4 boxes */}
      <div className="vic-stats">
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
      <section className="vic-section">
        <p className="vic-section-head">Distribución por zona de intensidad</p>
        <div className="vic-card vic-zone-card">
          {/* Stacked bar */}
          <div className="vic-zone-bar">
            {ZONES.map(z => {
              const count = data.zone_distribution[z.id as keyof typeof data.zone_distribution];
              const w = totalZoneSets > 0 ? (count / totalZoneSets) * 100 : 0;
              if (w === 0) return null;
              return (
                <span
                  key={z.id}
                  style={{ width: `${w}%`, background: z.color }}
                  title={`${z.label} · ${count} sets`}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="vic-zone-legend">
            {ZONES.map(z => {
              const count = data.zone_distribution[z.id as keyof typeof data.zone_distribution];
              const pct = totalZoneSets > 0 ? Math.round((count / totalZoneSets) * 100) : 0;
              return (
                <div key={z.id} className="vic-zone-row">
                  <span className="vic-zone-swatch" style={{ background: z.color }} />
                  <span className="vic-zone-name">{z.label}</span>
                  <span className="vic-zone-range">{z.range}</span>
                  <span className="vic-zone-val" style={{ color: z.color }}>
                    {count} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRs DETECTADOS */}
      {prCount > 0 && (
        <section className="vic-section">
          <p className="vic-section-head accent">🔥 NUEVO PR detectado</p>
          <div className="vic-card vic-pr-card">
            {data.prs_detected.map((pr, i) => (
              <div key={`${pr.label}-${i}`} className="vic-pr-row">
                <span className="vic-pr-disc">
                  <PlateBadge tier={weightToTier(pr.weight)} size={40} />
                </span>
                <div className="vic-pr-main">
                  <span className="vic-pr-label">{pr.label}</span>
                </div>
                <div className="vic-pr-target">
                  <p className="vic-pr-weight">
                    {pr.weight}<span className="u">kg</span>
                  </p>
                  <p className="vic-pr-delta">+{pr.delta}kg vs anterior</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DETALLE EJERCICIOS */}
      {data.exercises.length > 0 && (
        <section className="vic-section">
          <p className="vic-section-head">Detalle de la sesión</p>
          <div className="vic-card vic-ex-card">
            {data.exercises.map((ex) => {
              const exTonelaje = ex.sets.reduce((a, s) => s.result === 'completed' ? a + s.weight * s.reps : a, 0);
              const avgWeight = ex.sets_completed > 0
                ? Math.round(ex.sets.filter(s => s.result === 'completed').reduce((a, s) => a + s.weight, 0) / ex.sets_completed)
                : 0;
              return (
                <div key={ex.name} className="vic-ex-row">
                  <div className="vic-ex-main">
                    <p className="vic-ex-name">{ex.name}</p>
                    <p className="vic-ex-detail">
                      {ex.sets_completed}/{ex.targetSets} × {ex.targetReps} @ {avgWeight}kg · {ex.pct}% 1RM
                      {ex.sets_failed > 0 && (
                        <span className="vic-ex-fail"> · {ex.sets_failed} fallo{ex.sets_failed > 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                  <div className="vic-ex-vol">
                    <p className="vic-ex-vol-num">
                      {exTonelaje.toLocaleString('es')}<span className="u">kg</span>
                    </p>
                    <p className="vic-ex-vol-label">volumen</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MESOCICLO */}
      {macro && macro.total_weeks > 0 && (
        <section className="vic-section">
          <p className="vic-section-head">Tu mesociclo</p>
          <div className="vic-card vic-meso-card">
            <div className="vic-meso-head">
              <span className="vic-meso-name">{macro.program_name}</span>
              <span className="vic-meso-week">
                Semana {macro.week} / {macro.total_weeks}
              </span>
            </div>
            <div className="vic-meso-track">
              <div
                className="vic-meso-fill"
                style={{ width: `${Math.round((macro.week / macro.total_weeks) * 100)}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* RECOMENDACIÓN POST-SESIÓN basada en IMR (color data-driven) */}
      <section className="vic-reco">
        <div
          className="vic-reco-card"
          style={{
            background: `${reco.color}14`,
            border: `1px solid ${reco.color}44`,
          }}
        >
          <p className="vic-reco-eyebrow" style={{ color: reco.color }}>
            Recomendación post-sesión
          </p>
          <p className="vic-reco-title">{reco.title}</p>
          <p className="vic-reco-body">{reco.body}</p>
        </div>
      </section>

      <p className="vic-foot">holyoly.app · SMART TRAINING · ZERO BURNOUT</p>
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
    <div className="vic-root" data-product="volta">
      <header className="vic-hero">
        <div className="vic-emblem">
          <div className="vic-emblem-trophy">🏆</div>
        </div>
        <p className="vic-eyebrow">VOLTA · PEAK QUAL</p>
        <h1 className="vic-title">WOD guardado</h1>
        <span className="vic-confirm"><span className="dot" />Confirmado · datos persistidos</span>
      </header>
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
  <div className="vic-stat" style={{ ['--stat-c' as string]: accent }}>
    <p className="vic-stat-label">{label}</p>
    <div className="vic-stat-value">
      <span className="vic-stat-num">{value}</span>
      {unit && <span className="vic-stat-unit">{unit}</span>}
    </div>
    <p className="vic-stat-sub">{sub}</p>
  </div>
);

export default VictoryScreen;

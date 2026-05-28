import React, { useEffect, useState, type CSSProperties } from 'react';
import { useNav } from '../context/NavigationContext';
import { wodsApi, type TodayWod } from '../lib/wods';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/volta-active-wod.css';

/**
 * Sesión activa CrossFit (Volta) · pantalla de score sheet.
 *
 * SIN timer en la app · vetado por usuario · "los atletas no usan celular
 * mientras entrenan". El atleta hace el WOD en el gym y vuelve a la app
 * solo para anotar el score.
 *
 * Esta sección es solo para anotar el score (scale + rondas + extra reps).
 * Para el log completo con auto-PR check vs benchmarks, finalizar → VOLTA_WOD_LOG.
 *
 * Estilo V2 (dark FIFA/Tactical HUD · cyan) · scope CSS .vaw-root.
 * PhoneLayout aporta status bar / back / bottom nav · acá solo contenido.
 */

type Scale = 'Rx' | 'Scaled' | 'Beginner';

// Acento disco-tier por escala · refleja exigencia (verde→azul→rojo).
const SCALE_META: Record<Scale, { tier: PlateTier; color: string }> = {
  Beginner: { tier: 'green', color: 'var(--tier-1)' }, // verde
  Scaled:   { tier: 'blue', color: 'var(--tier-3)' }, // azul
  Rx:       { tier: 'red', color: 'var(--tier-4)' }, // rojo
};

// Fallback WOD si la API devuelve "none" (atleta sin custom_wod hoy)
const FALLBACK_WOD = {
  type: 'AMRAP' as 'AMRAP' | 'EMOM' | 'For Time',
  durationLabel: '20 min',
  title: 'WOD del día',
  movements: [
    { name: 'Elegí un benchmark del catálogo', detail: 'Tu coach no asignó WOD hoy · andá a VoltaStats → Benchmarks para escoger' },
  ],
};

const VoltaActiveWod: React.FC = () => {
  const { navigate } = useNav();
  const [scale, setScale] = useState<Scale>('Rx');
  const [rounds, setRounds] = useState(0);
  const [extraReps, setExtraReps] = useState(0);

  // WOD real desde backend (custom_wod del coach si existe)
  const [todayWod, setTodayWod] = useState<TodayWod | null>(null);
  useEffect(() => {
    let alive = true;
    wodsApi.today()
      .then(t => { if (alive) setTodayWod(t); })
      .catch(() => { /* silent · usamos fallback */ });
    return () => { alive = false; };
  }, []);

  // Compose WOD final: si hay custom_wod del backend, lo usamos · sino fallback genérico
  const WOD = todayWod && todayWod.source === 'custom' && todayWod.title
    ? {
        type: (todayWod.type as 'AMRAP' | 'EMOM' | 'For Time') ?? 'AMRAP',
        durationLabel: todayWod.duration_sec
          ? `${Math.round(todayWod.duration_sec / 60)} min`
          : '—',
        title: todayWod.title,
        movements: todayWod.movements.map(m => ({
          name: m.name,
          detail: m.scaling
            ? [m.scaling.rx, m.scaling.scaled, m.scaling.beginner].filter(Boolean).join(' / ')
            : (m.tag ?? ''),
        })),
      }
    : FALLBACK_WOD;

  const incRound = () => setRounds(r => r + 1);
  const decRound = () => setRounds(r => Math.max(0, r - 1));
  const incRep = () => setExtraReps(r => r + 1);
  const decRep = () => setExtraReps(r => Math.max(0, r - 1));

  const handleFinish = () => {
    // Persistir score parcial para que VOLTA_WOD_LOG pre-rellene
    try {
      localStorage.setItem('volta_wod:score_draft', JSON.stringify({
        scale, rounds, extra_reps: extraReps, wod_name: WOD.title,
      }));
    } catch { /* ignore */ }
    navigate('SUMMARY');
  };

  return (
    <div className="vaw-root">
      <div className="vaw-scroll">
        {/* HERO · header del WOD */}
        <section className="vaw-hero" aria-label={`WOD: ${WOD.title}`}>
          <span className="br-tl" /><span className="br-tr" />
          <span className="br-bl" /><span className="br-br" />

          <span className="vaw-hero-eyebrow">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {WOD.type} · {WOD.durationLabel} · CROSSFIT
          </span>
          <h1 className="vaw-hero-title">{WOD.title}</h1>
          <p className="vaw-hero-note">
            Hacé el WOD en el box. Cuando termines, anotá tu score acá y pasá al log final.
          </p>
        </section>

        {/* SCALING TOGGLE · discos de tier */}
        <div className="vaw-section">
          <span className="vaw-eyebrow">Escala</span>
          <div className="vaw-scale-grid" role="group" aria-label="Escala del WOD">
            {(['Rx', 'Scaled', 'Beginner'] as Scale[]).map(s => {
              const meta = SCALE_META[s];
              return (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className="vaw-scale-btn"
                  data-active={scale === s}
                  style={{ ['--scale-c' as string]: meta.color } as CSSProperties}
                  aria-pressed={scale === s}
                >
                  <span className="vaw-scale-disc">
                    <PlateBadge tier={meta.tier} size={34} />
                  </span>
                  <span className="vaw-scale-label">{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MOVEMENTS · referencia, no checkable */}
        <div className="vaw-section">
          <span className="vaw-eyebrow">Movimientos</span>
          <div className="vaw-moves">
            {WOD.movements.map((m, i) => (
              <div key={i} className="vaw-move">
                <span className="vaw-move-idx">{i + 1}</span>
                <div className="vaw-move-body">
                  <p className="vaw-move-name">{m.name}</p>
                  {m.detail && <p className="vaw-move-detail">{m.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCORE INPUTS · sin timer · solo contadores manuales */}
        <div className="vaw-section">
          <span className="vaw-eyebrow">Tu score</span>
          <div className="vaw-steppers">
            {/* Rondas */}
            <div className="vaw-stepper" style={{ ['--step-c' as string]: 'var(--engine-oly)' } as CSSProperties}>
              <div className="vaw-step-info">
                <p className="vaw-step-label">Rondas completas</p>
                <p className="vaw-step-hint">Toques manuales · sin timer</p>
              </div>
              <button onClick={decRound} className="vaw-step-btn minus" aria-label="Restar ronda">−</button>
              <span className="vaw-step-val" aria-live="polite">{rounds}</span>
              <button onClick={incRound} className="vaw-step-btn plus" aria-label="Sumar ronda">+</button>
            </div>

            {/* Extra reps */}
            <div className="vaw-stepper" style={{ ['--step-c' as string]: 'var(--engine-stress)' } as CSSProperties}>
              <div className="vaw-step-info">
                <p className="vaw-step-label">Reps extra</p>
                <p className="vaw-step-hint">De la ronda incompleta</p>
              </div>
              <button onClick={decRep} className="vaw-step-btn minus" aria-label="Restar rep">−</button>
              <span className="vaw-step-val" aria-live="polite">+{extraReps}</span>
              <button onClick={incRep} className="vaw-step-btn plus" aria-label="Sumar rep">+</button>
            </div>
          </div>

          {/* Resumen */}
          <div className="vaw-readout">
            Tu score:&nbsp;<b>{rounds} rondas + {extraReps} reps</b>
            <span className="sep">·</span>
            <span className="sc">{scale}</span>
          </div>
        </div>

        {/* CTA · sticky dentro del scroll */}
        <div className="vaw-cta-wrap">
          <button onClick={handleFinish} className="vaw-cta">
            Anotar score completo
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoltaActiveWod;

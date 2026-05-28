import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/warmup.css';

type Phase = 'MOBILITY' | 'SPECIFIC' | 'RAMP';
type Status = 'done' | 'active' | 'pending';

const PHASE_ITEMS: Record<Phase, { name: string; info: string }[]> = {
  MOBILITY: [
    { name: 'Cat-Cow + T-spine',  info: '2 series × 8 reps · Movilidad torácica' },
    { name: 'Hip 90/90',           info: '6 reps por lado · Apertura cadera' },
    { name: 'Squat to stand',      info: '2 × 8 reps · Cadena posterior' },
  ],
  SPECIFIC: [
    { name: 'Muscle Snatch',       info: '2 series × 10 reps · Barra vacía' },
    { name: 'Snatch Balance',      info: '3 series × 5 reps · Control de pies' },
    { name: 'Power Snatch + OHS',  info: '2 series × 3+3 reps · Fluidez' },
  ],
  RAMP: [
    { name: 'Snatch @ 50% 1RM',    info: '3 reps · Aproximación' },
    { name: 'Snatch @ 65% 1RM',    info: '2 reps · Subida progresiva' },
    { name: 'Snatch @ 75% 1RM',    info: '1 rep · Última antes del work set' },
  ],
};

/* Eyebrow + descripción por fase · usado en header y línea contextual */
const PHASE_META: Record<Phase, { tab: string; eyebrow: string }> = {
  MOBILITY: { tab: 'MOVILIDAD',  eyebrow: 'FASE 1 · MOVILIDAD' },
  SPECIFIC: { tab: 'ESPECÍFICO', eyebrow: 'FASE 2 · PATRÓN' },
  RAMP:     { tab: 'RAMP-UP',    eyebrow: 'FASE 3 · APROXIMACIÓN' },
};

/* Disco por intensidad de la serie de ramp-up (halterofilia · el peso sube → el
   disco "pesa" más). Mapea el % de 1RM a un tier nominal de PlateBadge. */
const pctToPlate = (pct: number): PlateTier =>
  pct >= 75 ? 'red' : pct >= 65 ? 'blue' : pct >= 55 ? 'yellow' : 'green';

/* Icons (lucide-style stroke 1.5) · inline para no acoplar dependencias */
const IconFlame = (p: { size?: number }) => (
  <svg width={p.size ?? 12} height={p.size ?? 12} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);
const IconCheck = (p: { size?: number }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconClock = (p: { size?: number }) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconSkip = (p: { size?: number }) => (
  <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
  </svg>
);

const WarmupGenerator: React.FC = () => {
  const { navigate } = useNav();
  const [phase, setPhase] = useState<Phase>('SPECIFIC');
  // Track completion per phase
  const [done, setDone] = useState<Record<Phase, number[]>>({ MOBILITY: [], SPECIFIC: [0], RAMP: [] });

  const items = PHASE_ITEMS[phase].map((it, i) => {
    const phaseDone = done[phase];
    let status: Status = 'pending';
    if (phaseDone.includes(i)) status = 'done';
    else if (i === Math.min(...PHASE_ITEMS[phase].map((_, idx) => idx).filter(idx => !phaseDone.includes(idx)))) status = 'active';
    return { ...it, status, idx: i };
  });

  const toggleItem = (i: number) => {
    setDone(prev => {
      const cur = prev[phase];
      const next = cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i];
      return { ...prev, [phase]: next };
    });
  };

  const phaseDoneCount = done[phase].length;
  const phaseTotal = PHASE_ITEMS[phase].length;
  const phasePct = phaseTotal > 0 ? Math.round((phaseDoneCount / phaseTotal) * 100) : 0;
  const phaseLabel = phase === 'MOBILITY' ? 'movilidad general' : phase === 'SPECIFIC' ? 'el patrón de Arrancada' : 'ramp-up al peso de trabajo';

  return (
    <div className="wu-root">
      {/* Header · eyebrow + título + SKIP claramente visible */}
      <header className="wu-header">
        <div className="wu-head-titles">
          <span className="wu-eyebrow"><IconFlame size={11} /> {PHASE_META[phase].eyebrow}</span>
          <h2 className="wu-title">Calentamiento</h2>
          <span className="wu-sub">Adaptado a tu readiness <span className="dot">·</span> <b>{phaseDoneCount}/{phaseTotal}</b> hechos</span>
        </div>
        {/* SKIP · botón visible (no link diminuto) → SESSION */}
        <button className="wu-skip" onClick={() => navigate('SESSION')} aria-label="Saltar calentamiento">
          <IconSkip size={12} /> OMITIR ›
        </button>
      </header>

      <div className="wu-scroll">
        {/* Phase Tabs */}
        <div className="wu-tabs" role="tablist">
          {(['MOBILITY', 'SPECIFIC', 'RAMP'] as const).map((p) => {
            const complete = done[p].length === PHASE_ITEMS[p].length;
            return (
              <button
                key={p}
                role="tab"
                aria-selected={phase === p}
                className="wu-tab"
                data-active={phase === p}
                data-complete={complete}
                onClick={() => setPhase(p)}
              >
                <span className="wu-tab-label">{PHASE_META[p].tab}</span>
                <span className="wu-tab-count">{complete ? '✓ listo' : `${done[p].length}/${PHASE_ITEMS[p].length}`}</span>
              </button>
            );
          })}
        </div>

        {/* Phase Info + progreso de la fase */}
        <div className="wu-phase-info">
          <p className="wu-phase-line">
            Preparamos <b>{phaseLabel}</b> · {phaseDoneCount}/{phaseTotal} ejercicios hechos
          </p>
          <div className="wu-phase-bar">
            <div className="wu-phase-bar-head">
              <span className="wu-phase-bar-label">Progreso fase</span>
              <span className="wu-phase-bar-pct">{phasePct}%</span>
            </div>
            <div className="wu-phase-bar-track">
              <div className="wu-phase-bar-fill" style={{ width: `${phasePct}%` }} />
            </div>
          </div>
        </div>

        {/* Movement list · checklist */}
        <div className="wu-movs">
          {items.map((item) => (
            <button
              key={item.idx}
              className="wu-mov"
              data-state={item.status}
              onClick={() => toggleItem(item.idx)}
            >
              <span className="wu-check">{item.status === 'done' && <IconCheck size={14} />}</span>
              <span className="wu-mov-body">
                <span className="wu-mov-name">{item.name}</span>
                <span className="wu-mov-info">{item.info}</span>
              </span>
              {item.status === 'active' && <span className="wu-mov-dot" aria-hidden="true" />}
            </button>
          ))}
        </div>

        {/* Ramp-up · separador + serie con DISCO (halterofilia) */}
        <div className="wu-divider">
          <span className="line" />
          <span className="lbl">Aproximación</span>
          <span className="line" />
        </div>

        <div className="wu-serie">
          <span className="wu-serie-disc">
            <PlateBadge tier={pctToPlate(45)} size={44} />
          </span>
          <span className="wu-serie-body">
            <span className="wu-serie-name">Serie 1</span>
            <span className="wu-serie-info">3 reps · 45% 1RM</span>
          </span>
          <span className="wu-serie-kg">40 kg</span>
        </div>

        {/* Next-up · descanso (ámbar) */}
        <div className="wu-next">
          <span className="wu-next-icon"><IconClock size={18} /></span>
          <span className="wu-next-body">
            <span className="wu-next-title">Siguiente: Descanso 45s</span>
            <span className="wu-next-sub">Mantén pulsaciones en Zona 2</span>
          </span>
        </div>
      </div>

      {/* Footer · FINALIZAR (→ SESSION) + SKIP secundario visible (→ SESSION) */}
      <footer className="wu-footer">
        <button className="wu-cta" onClick={() => navigate('SESSION')}>
          FINALIZAR CALENTAMIENTO →
        </button>
        <button className="wu-skip-secondary" onClick={() => navigate('SESSION')} aria-label="Saltar calentamiento e ir directo a la sesión">
          <IconSkip size={11} /> Saltar calentamiento
        </button>
      </footer>
    </div>
  );
};

export default WarmupGenerator;

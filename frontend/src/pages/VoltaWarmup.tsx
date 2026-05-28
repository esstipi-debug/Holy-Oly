import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { PlateBadge } from '../components/PlateBadge';
import '../styles/v2/volta-warmup.css';

/**
 * Calentamiento CrossFit (Volta).
 *
 * 3 fases: Movilidad (general) → Activación (dinámica) → Ramp-up (al WOD).
 * Diseñado para preparar el cuerpo para AMRAP/EMOM/For Time.
 *
 * Estilo: V2 dark FIFA + Tactical HUD · cyan dominante (.vwu-root).
 * Lógica/datos/navegación intactos · sólo presentación.
 */

type Phase = 'MOBILITY' | 'ACTIVATION' | 'RAMP_UP';

interface Movement {
  name: string;
  info: string;
  duration?: string;
}

const PHASES: Record<Phase, { label: string; movements: Movement[]; tag: string }> = {
  MOBILITY: {
    label: 'Movilidad general',
    tag: '3 min',
    movements: [
      { name: 'Foam roll espalda alta', info: '30 seg · presión sostenida' },
      { name: 'World\'s greatest stretch', info: '5 reps × lado · profundo' },
      { name: 'Cat-cow + thoracic rotation', info: '10 reps · flow lento' },
    ],
  },
  ACTIVATION: {
    label: 'Activación dinámica',
    tag: '4 min',
    movements: [
      { name: 'Air squat + reach', info: '15 reps · profundo y controlado' },
      { name: 'PVC pass-through + OHS', info: '10 + 10 reps · activar hombros' },
      { name: 'Inchworm + push-up', info: '8 reps · cadena posterior' },
      { name: 'Banded glute walk', info: '10 pasos × dirección' },
    ],
  },
  RAMP_UP: {
    label: 'Ramp-up al WOD',
    tag: '5 min',
    movements: [
      { name: 'Box jumps 16" → 24"', info: '5 + 5 reps · progresión' },
      { name: 'Pull-ups (50% RM)', info: '5 reps · escalado del WOD' },
      { name: 'Power Clean ligero', info: '3 + 2 reps · técnica' },
    ],
  },
};

const PHASE_ORDER: Phase[] = ['MOBILITY', 'ACTIVATION', 'RAMP_UP'];

// Etiqueta corta para el chip de tab (cabe en una línea).
const PHASE_SHORT: Record<Phase, string> = {
  MOBILITY: 'Movilidad',
  ACTIVATION: 'Activación',
  RAMP_UP: 'Ramp-up',
};

const VoltaWarmup: React.FC = () => {
  const { navigate } = useNav();
  const [phase, setPhase] = useState<Phase>('MOBILITY');
  const [done, setDone] = useState<Set<string>>(new Set());

  const current = PHASES[phase];
  const totalDone = done.size;
  const totalMovs = Object.values(PHASES).reduce((s, p) => s + p.movements.length, 0);
  const totalMin = Object.values(PHASES).reduce((s, p) => s + parseInt(p.tag), 0);
  const pct = Math.round((totalDone / totalMovs) * 100);

  const toggle = (name: string) => {
    const next = new Set(done);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setDone(next);
  };

  return (
    <div className="vwu-root">
      {/* HEADER */}
      <header className="vwu-header">
        <div className="vwu-head-titles">
          <span className="vwu-eyebrow">
            <svg className="bolt" width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            PRE-WOD · CROSSFIT
          </span>
          <h1 className="vwu-title">Calentamiento</h1>
          <span className="vwu-sub">
            <b>{totalDone}</b>/{totalMovs} movs
            <span className="dot">·</span>
            <b>{totalMin}</b> min total
          </span>
        </div>
        <button className="vwu-skip" onClick={() => navigate('SESSION')}>
          Omitir
        </button>
      </header>

      {/* SCROLL CONTENT */}
      <div className="vwu-scroll">
        {/* PHASE TABS */}
        <div className="vwu-tabs" role="tablist" aria-label="Fases del calentamiento">
          {PHASE_ORDER.map(p => {
            const active = phase === p;
            const doneCount = PHASES[p].movements.filter(m => done.has(m.name)).length;
            const total = PHASES[p].movements.length;
            const complete = doneCount === total;
            return (
              <button
                key={p}
                role="tab"
                aria-selected={active}
                data-active={active || undefined}
                data-complete={complete || undefined}
                className="vwu-tab"
                onClick={() => setPhase(p)}
              >
                <span className="vwu-tab-label">{PHASE_SHORT[p]}</span>
                <span className="vwu-tab-count">{doneCount}/{total}</span>
              </button>
            );
          })}
        </div>

        {/* PHASE PANEL */}
        <div className="vwu-panel">
          <div className="vwu-panel-head">
            <span className="vwu-panel-title">{current.label}</span>
            <span className="vwu-panel-tag">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {current.tag}
            </span>
          </div>

          {/* MOVEMENT LIST */}
          <div className="vwu-movs">
            {current.movements.map(mov => {
              const isDone = done.has(mov.name);
              // Accent disco · sólo en Ramp-up (fase con carga de barra) · sparingly.
              const showPlate = phase === 'RAMP_UP' && /clean|pull-?up/i.test(mov.name);
              return (
                <button
                  key={mov.name}
                  className="vwu-mov"
                  data-done={isDone || undefined}
                  onClick={() => toggle(mov.name)}
                >
                  <span className="vwu-check" aria-hidden="true">
                    {isDone && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="vwu-mov-body">
                    <span className="vwu-mov-name">{mov.name}</span>
                    <span className="vwu-mov-info">{mov.info}</span>
                  </span>
                  {showPlate && <PlateBadge tier="green" size={26} tilt={20} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="vwu-progress">
          <div className="vwu-progress-head">
            <span className="vwu-progress-label">Progreso del calentamiento</span>
            <span className="vwu-progress-pct">{pct}%</span>
          </div>
          <div className="vwu-progress-track">
            <div className="vwu-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* CTA */}
        <button className="vwu-cta" onClick={() => navigate('SESSION')}>
          Empezar WOD
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VoltaWarmup;

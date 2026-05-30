import React, { useMemo } from 'react';
import { useAthlete } from '../context/AthleteContext';

// Diseño Peak Qual (del Boss) · tokens + componentes de disco + estilos del macro.
// CSS scopeado a .pq (no pisa el theme actual). Web-components registran solos.
import '../styles/peakqual/tokens.css';
import '../styles/peakqual/macrocycle.css';
import PlateIcon, { type PlateWeight } from '../components/PlateIcon';

/**
 * MacrocicloMask · aplica la "máscara de los macrociclos" del Boss (cartas simples):
 * header + hero dual Sn/C&J con discos + timeline de bloques.
 *
 * REGLA: data REAL de useAthlete (nombre, programa/semana, 1RM de maxes); donde el
 * app todavía no tiene historial (tendencias, RPE, sesiones por bloque) → placeholder
 * honesto, NO números inventados. El disco es el componente del Boss (plate-stack),
 * slot directo para el nuevo estilo de discos cuando lo cree.
 */

// <plate-stack> es web-component → se crea con React.createElement (sin tipado JSX intrínseco).

// Composición visual de discos a partir del 1RM real (barra 20kg + discos por lado).
// Greedy con tiers 25(rojo)/20(azul)/15(amarillo)/10(verde) — aproximación visual,
// igual que el diseño original (no es prescripción, es ilustración del peso real).
const TIER_KG: Array<[number, string]> = [[25, '4'], [20, '3'], [15, '2'], [10, '1']];
// tier id → peso del icono HOLY OLY (nuevo estilo de discos)
const TIER_WEIGHT: Record<string, PlateWeight> = { '1': 10, '2': 15, '3': 20, '4': 25 };
function platesForOneRm(oneRm: number): string[] {
  if (!oneRm || oneRm <= 20) return [];
  let perSide = (oneRm - 20) / 2;
  const out: string[] = [];
  for (const [kg, tier] of TIER_KG) {
    while (perSide >= kg - 0.01 && out.length < 5) { out.push(tier); perSide -= kg; }
    if (out.length >= 5) break;
  }
  return out.reverse();
}

type BlockState = 'done' | 'current' | 'future';
const SYM: Record<BlockState, string> = { done: '✓', current: '▶', future: '◌' };

// Fases estándar de periodización (plantilla del diseño del Boss), escaladas al
// total de semanas real del macro asignado. Estado por la semana actual real.
const PHASE_TEMPLATE: Array<{ name: string; pct: string; ratio: number }> = [
  { name: 'VOLUMEN GENERAL', pct: '70-80%', ratio: 2 },
  { name: 'INTENSIDAD', pct: '85-92%', ratio: 2 },
  { name: 'PEAKING', pct: '88-95%', ratio: 2 },
  { name: 'TAPERING', pct: '60-70%', ratio: 1 },
  { name: 'PEAK TEST', pct: '95-105%', ratio: 1 },
];

function buildBlocks(totalWeeks: number, currentWeek: number) {
  const total = Math.max(PHASE_TEMPLATE.length, totalWeeks || 12);
  const ratioSum = PHASE_TEMPLATE.reduce((s, p) => s + p.ratio, 0);
  let acc = 0;
  let used = 0;
  return PHASE_TEMPLATE.map((p, i) => {
    const isLast = i === PHASE_TEMPLATE.length - 1;
    const span = isLast ? total - used : Math.max(1, Math.round((p.ratio / ratioSum) * total));
    used += span;
    const w0 = acc + 1;
    const w1 = acc + span;
    acc = w1;
    const state: BlockState = currentWeek > w1 ? 'done' : currentWeek >= w0 ? 'current' : 'future';
    return { ...p, w0, w1, state };
  });
}

interface LiftCardProps { label: string; code: 'sn' | 'cj'; oneRm: number; }
const LiftCard: React.FC<LiftCardProps> = ({ label, code, oneRm }) => {
  const tiers = platesForOneRm(oneRm);
  return (
    <article className="ho-lift-card" data-lift={code} aria-label={`${label} ${oneRm} kg`}>
      <span className="br br-l" /><span className="br br-r" />
      <div className="ho-lift-eyebrow">
        <span className="lift">{label}</span>
      </div>
      <div className="ho-lift-plates" aria-hidden="true">
        {tiers.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {tiers.map((t, i) => (
              <PlateIcon key={i} weight={TIER_WEIGHT[t]} view="flat" size="S" />
            ))}
          </div>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-lo)' }}>sin 1RM</span>
        )}
      </div>
      <div className="ho-lift-value">
        {oneRm > 0 ? oneRm : '—'}<span className="u">kg</span>
      </div>
      <div className="ho-lift-foot">
        <span>histórico</span>
        <span className="rpe-v" style={{ fontWeight: 500, color: 'var(--text-lo)' }}>registrá sesiones</span>
      </div>
    </article>
  );
};

const MacrocicloMask: React.FC = () => {
  const { athlete } = useAthlete();

  const blocks = useMemo(
    () => (athlete ? buildBlocks(athlete.macrocycle.total_weeks, athlete.macrocycle.week) : []),
    [athlete?.macrocycle.total_weeks, athlete?.macrocycle.week],
  );

  if (!athlete) return null;
  const m = athlete.macrocycle;
  const initials = athlete.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="pq">
      {/* HEADER */}
      <header className="ho-header" style={{ borderRadius: 14, marginBottom: 12 }}>
        <div className="ho-h-top">
          <div className="ho-avatar">{initials}</div>
          <div className="ho-h-meta">
            <div className="ho-h-name">{athlete.name}</div>
            <div className="ho-h-coach">MACROCICLO <span className="nm">{m.focus}</span></div>
          </div>
          {/* slot del disco · el nuevo estilo de discos va acá */}
        </div>
        <div className="ho-h-chip-row">
          <span className="ho-macro-badge">
            <span className="pip" />
            {m.program_name} · S<span className="n">{m.week}</span>/{m.total_weeks}
          </span>
        </div>
      </header>

      {/* HERO DUAL · 1RM real */}
      <div className="ho-section-head">
        <h3>Levantamientos · 1RM</h3>
        <span className="meta">de tus maxes</span>
      </div>
      <div className="ho-duo" style={{ marginTop: 8, marginBottom: 14 }}>
        <LiftCard label="SNATCH" code="sn" oneRm={athlete.maxes.snatch} />
        <LiftCard label="CLEAN & JERK" code="cj" oneRm={athlete.maxes.clean} />
      </div>

      {/* TIMELINE DE BLOQUES */}
      <div className="ho-section-head">
        <h3>Bloques · macrociclo</h3>
        <span className="meta">{blocks.length} fases</span>
      </div>
      <div className="ho-timeline-v" style={{ marginTop: 8 }}>
        {blocks.map((b, i) => (
          <div className="ho-block-v" data-state={b.state} key={i}
               aria-label={`Bloque ${i + 1}: ${b.name}, ${b.pct}, semanas ${b.w0} a ${b.w1}, ${b.state}`}>
            <div className="ho-block-num">{i + 1}</div>
            <div className="ho-block-name">{b.name}</div>
            <div className="ho-block-pct">% 1RM · <strong>{b.pct}</strong></div>
            <div className="ho-block-status">
              <span className="sym" aria-hidden="true">{SYM[b.state]}</span>
              <span className="wks">S{b.w0}{b.w1 > b.w0 ? `-S${b.w1}` : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacrocicloMask;

import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useAthlete } from '../context/AthleteContext';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import { MACROCYCLES } from '../data/macrocycles';
import { phaseOfWeek } from '../data/competitions';
import '../styles/v2/coach-macro-view.css';

/**
 * CoachMacroView
 * Vista friendly del macrociclo para coach (HO y VOL): timeline visual, distribución
 * del roster por fase, alertas accionables y pulse del club.
 *
 * Toda la data sale del roster REAL (AthleteContext.allAthletes, ya scopeado por
 * producto) — NO mock. El macro mostrado es el dominante del roster; la distribución,
 * alertas y pulse se derivan de los atletas reales (fase por semana, adherencia por
 * sesiones, lesiones). Estilos scoped bajo .cmv-root.
 */

type Phase = 'ACUM' | 'INTENS' | 'REAL' | 'DELOAD' | 'TEST';

interface WeekCell {
  n: number;
  phase: Phase;
  marker?: '🔻' | '🏆' | '⭐';
}

type RosterStatus = 'on-track' | 'ahead' | 'behind' | 'deload';
interface RosterItem {
  id: string;
  name: string;
  initials: string;
  phase: Phase;
  status: RosterStatus;
  adherence: number;
}

interface AlertItem {
  id: string;
  athleteName: string;
  athleteId: string;
  message: string;
  level: 'red' | 'green' | 'amber';
}

const STATUS_META: Record<RosterStatus, { label: string }> = {
  'on-track': { label: 'Adherido' },
  'ahead':    { label: 'Adelantado' },
  'behind':   { label: 'Atrasado' },
  'deload':   { label: 'Carga reducida' },
};

const PHASE_META: Record<Phase, { label: string; volume: string; intensity: string }> = {
  ACUM:   { label: 'Acumulación',     volume: '90-100% del plan',  intensity: '60-75% 1RM' },
  INTENS: { label: 'Intensificación', volume: '70-85% del plan',   intensity: '75-87% 1RM' },
  REAL:   { label: 'Realización',     volume: '50-70% del plan',   intensity: '85-95% 1RM' },
  DELOAD: { label: 'Descarga',        volume: '40-55% del plan',   intensity: '55-70% 1RM' },
  TEST:   { label: 'Test / Pico',     volume: '30-45% del plan',   intensity: '95-105% 1RM' },
};

// Fase → tier de disco (intensidad creciente).
const PHASE_TIER: Record<Phase, PlateTier> = {
  ACUM:   'green',
  INTENS: 'yellow',
  REAL:   'blue',
  TEST:   'red',
  DELOAD: 'white',
};

const initialsOf = (name: string) => name.split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase();
const adherenceOf = (a: { sessions_last_7: { completed: boolean }[] }) => {
  const planned = a.sessions_last_7.length;
  if (!planned) return 0;
  return Math.round((a.sessions_last_7.filter(s => s.completed).length / planned) * 100);
};
// phaseOfWeek (competitions) puede devolver 'POST' (post-macro) → lo tratamos como TEST (cierre).
const toCmvPhase = (week: number, total: number): Phase => {
  const p = phaseOfWeek(week, total);
  return p === 'POST' ? 'TEST' : p;
};

const CoachMacroView: React.FC = () => {
  const { navigate, back } = useNav();
  const { product } = useProduct();
  const { allAthletes, selectAthlete } = useAthlete();

  const isVolta = product === 'volta';

  // Macro DOMINANTE del roster real (programa más usado), normalizado al shape que usa la vista.
  const macro = useMemo(() => {
    const withProgram = allAthletes.filter(a => a.macrocycle?.program_id);
    const freq: Record<string, number> = {};
    withProgram.forEach(a => { freq[a.macrocycle.program_id] = (freq[a.macrocycle.program_id] || 0) + 1; });
    const topId = Object.entries(freq).sort((x, y) => y[1] - x[1])[0]?.[0];
    const top = withProgram.find(a => a.macrocycle.program_id === topId);
    const school = topId ? (MACROCYCLES.find(m => m.id === topId)?.family ?? 'Escuela') : '—';
    const totalWeeks = Math.max(1, top?.macrocycle.total_weeks ?? 12);
    return {
      program: top?.macrocycle.program_name ?? 'Sin macrociclo activo',
      school,
      totalWeeks,
      currentWeek: Math.max(1, Math.min(totalWeeks, top?.macrocycle.week ?? 1)),
    };
  }, [allAthletes]);

  // Timeline de fases (cuartiles + deload ~2/3 + test final + pico penúltima).
  const weeks: WeekCell[] = useMemo(() => {
    const total = macro.totalWeeks;
    const out: WeekCell[] = [];
    for (let i = 1; i <= total; i++) out.push({ n: i, phase: toCmvPhase(i, total) });
    const deloadWeek = Math.min(total, Math.round(total * 0.67));
    if (out[deloadWeek - 1]) { out[deloadWeek - 1].phase = 'DELOAD'; out[deloadWeek - 1].marker = '🔻'; }
    if (out[total - 1]) { out[total - 1].marker = '🏆'; out[total - 1].phase = 'TEST'; }
    if (out[total - 2]) out[total - 2].marker = '⭐';
    return out;
  }, [macro.totalWeeks]);

  const [selectedWeek, setSelectedWeek] = useState<number>(macro.currentWeek);
  const selectedCell = weeks[selectedWeek - 1] ?? weeks[macro.currentWeek - 1] ?? weeks[0];
  const currentPhase = weeks[macro.currentWeek - 1]?.phase ?? 'ACUM';
  const phaseInfo = PHASE_META[currentPhase];

  const weeksLeftInPhase = useMemo(() => {
    let count = 0;
    for (let i = macro.currentWeek - 1; i < weeks.length; i++) {
      if (weeks[i].phase === currentPhase) count++;
      else break;
    }
    return count;
  }, [weeks, macro.currentWeek, currentPhase]);
  const nextPhase = useMemo(() => {
    for (let i = macro.currentWeek - 1; i < weeks.length; i++) {
      if (weeks[i].phase !== currentPhase) return weeks[i].phase;
    }
    return null;
  }, [weeks, macro.currentWeek, currentPhase]);

  // Distribución del roster REAL: fase por su semana, status por adherencia/lesión.
  const rosterItems: RosterItem[] = useMemo(() => allAthletes.map(a => {
    const adherence = adherenceOf(a);
    const injured = !!(a.injuries && a.injuries.length);
    const status: RosterStatus = injured ? 'deload' : adherence >= 90 ? 'ahead' : adherence < 60 ? 'behind' : 'on-track';
    return {
      id: a.id,
      name: a.name,
      initials: initialsOf(a.name),
      phase: toCmvPhase(a.macrocycle.week, Math.max(1, a.macrocycle.total_weeks || macro.totalWeeks)),
      status,
      adherence,
    };
  }), [allAthletes, macro.totalWeeks]);

  const rosterByStatus = useMemo(() => {
    const groups: Record<RosterStatus, RosterItem[]> = { 'on-track': [], ahead: [], behind: [], deload: [] };
    rosterItems.forEach(r => groups[r.status].push(r));
    return groups;
  }, [rosterItems]);

  const avgAdherence = rosterItems.length
    ? Math.round(rosterItems.reduce((a, b) => a + b.adherence, 0) / rosterItems.length)
    : 0;
  const injuredCount = allAthletes.filter(a => a.injuries && a.injuries.length).length;

  // Alertas REALES: lesión (rojo) o adherencia baja (amber).
  const alerts: AlertItem[] = useMemo(() => {
    const out: AlertItem[] = [];
    allAthletes.forEach(a => {
      if (a.injuries && a.injuries.length) {
        out.push({ id: `${a.id}-inj`, athleteName: a.name, athleteId: a.id, message: a.injuries[0], level: 'red' });
      } else if (adherenceOf(a) < 60) {
        out.push({ id: `${a.id}-adh`, athleteName: a.name, athleteId: a.id, message: `Adherencia ${adherenceOf(a)}% · revisar plan`, level: 'amber' });
      }
    });
    return out.slice(0, 6);
  }, [allAthletes]);

  const openAlert = (a: AlertItem) => {
    selectAthlete(a.athleteId);
    navigate('ATHLETE_DETAIL');
  };

  const deloadWeekNum = Math.round(macro.totalWeeks * 0.67);

  return (
    <div className="cmv-root" data-product={isVolta ? 'volta' : 'holyoly'}>

      {/* HEADER */}
      <header className="cmv-header">
        <button onClick={back} className="cmv-back" aria-label="Back">‹</button>
        <div className="cmv-head-meta">
          <p className="cmv-eyebrow">Coach · Vista friendly</p>
          <h1 className="cmv-title">{macro.program} · {macro.school}</h1>
          <span className="cmv-week-chip">
            <span className="pip" />
            Semana {macro.currentWeek}/{macro.totalWeeks}
          </span>
        </div>
      </header>

      {/* TIMELINE HORIZONTAL */}
      <SectionTitle>Timeline del macrociclo</SectionTitle>
      <div className="cmv-timeline">
        {weeks.map(w => {
          const isPast = w.n < macro.currentWeek;
          const isCurrent = w.n === macro.currentWeek;
          const isSelected = w.n === selectedWeek;
          const isFuture = w.n > macro.currentWeek;
          return (
            <button
              key={w.n}
              onClick={() => setSelectedWeek(w.n)}
              className="cmv-week"
              data-phase={w.phase}
              data-past={isPast || undefined}
              data-future={isFuture || undefined}
              data-current={isCurrent || undefined}
              data-selected={isSelected || undefined}
            >
              <span className="wk">S{w.n}</span>
              <span className="marker">{w.marker ?? ''}</span>
              <span className="bar" />
            </button>
          );
        })}
      </div>

      {/* Detalle de semana seleccionada */}
      <div className="cmv-week-detail">
        <div className="info">
          <p className="cmv-wd-eyebrow">
            Semana {selectedCell.n} {selectedCell.n === macro.currentWeek && '· actual'}
          </p>
          <p className="cmv-wd-phase">
            {PHASE_META[selectedCell.phase].label}
            {selectedCell.marker && <span>{selectedCell.marker}</span>}
          </p>
          <p className="cmv-wd-load">
            Vol: {PHASE_META[selectedCell.phase].volume} · Int: {PHASE_META[selectedCell.phase].intensity}
          </p>
        </div>
      </div>

      {/* FASE ACTUAL */}
      <SectionTitle>Fase actual</SectionTitle>
      <div className="cmv-phase-hero">
        <span className="br br-tl" />
        <span className="br br-tr" />
        <div className="cmv-phase-row">
          <div className="cmv-phase-left">
            <p className="cmv-phase-label">{phaseInfo.label}</p>
            <p className="cmv-phase-big">
              {weeksLeftInPhase} {weeksLeftInPhase === 1 ? 'semana' : 'semanas'}
            </p>
            <p className="cmv-phase-next">
              {nextPhase
                ? `para ${PHASE_META[nextPhase].label}`
                : 'hasta el final del macro'}
            </p>
          </div>
          <div className="cmv-phase-disc" aria-hidden="true">
            <PlateBadge tier={PHASE_TIER[currentPhase]} size={48} />
          </div>
          <div className="cmv-phase-expect">
            <p className="lbl">Esperado</p>
            <p className="row">Vol: <b>{phaseInfo.volume}</b></p>
            <p className="row">Int: <b>{phaseInfo.intensity}</b></p>
          </div>
        </div>
      </div>

      {/* DISTRIBUCIÓN DEL ROSTER POR ESTADO */}
      <SectionTitle right={`${rosterItems.length} atletas`}>
        Distribución del roster
      </SectionTitle>
      <div className="cmv-card">
        {(['on-track','ahead','behind','deload'] as RosterStatus[]).map(st => {
          const meta = STATUS_META[st];
          const group = rosterByStatus[st];
          if (group.length === 0) return null;
          return (
            <div key={st} className="cmv-roster-group">
              <div className="cmv-roster-grouphead">
                <p className={`cmv-roster-status cmv-status-${st}`}>
                  <span className="dot" />
                  {meta.label}
                </p>
                <p className="cmv-roster-count">{group.length}</p>
              </div>
              <div className="cmv-roster-chips">
                {group.map(a => (
                  <button
                    key={a.id}
                    className={`cmv-chip cmv-status-${st}`}
                    title={`${a.name} · ${PHASE_META[a.phase].label} · adherencia ${a.adherence}%`}
                    onClick={() => { selectAthlete(a.id); navigate('ATHLETE_DETAIL'); }}
                  >
                    <span className="ava">{a.initials}</span>
                    <span className="nm">{a.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ALERTAS */}
      <SectionTitle>Alertas del macrociclo</SectionTitle>
      <div className="cmv-alerts">
        {alerts.length === 0 && <div className="cmv-card" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sin alertas · roster estable.</div>}
        {alerts.map(al => (
          <button
            key={al.id}
            onClick={() => openAlert(al)}
            className={`cmv-alert cmv-alert-${al.level}`}
          >
            <span className="pip" />
            <div className="body">
              <p className="name">{al.athleteName}</p>
              <p className="msg">{al.message}</p>
            </div>
            <span className="chev">›</span>
          </button>
        ))}
      </div>

      {/* PULSE DEL MACRO */}
      <SectionTitle>Pulse del macro</SectionTitle>
      <div className="cmv-pulse">
        <PulseCard value={`${avgAdherence}%`} label="Adherencia promedio" />
        <PulseCard value={`${rosterItems.length}`} label="Atletas en el macro" />
        <PulseCard value={`${injuredCount}`} label="Lesiones activas" tone={injuredCount > 0 ? 'red' : 'green'} />
        <div className="cmv-deload-card">
          <div>
            <p className="lbl">Próximo deload</p>
            <p className="wk">Semana {deloadWeekNum} 🔻</p>
          </div>
          <span className="badge">{Math.max(0, deloadWeekNum - macro.currentWeek)}w</span>
        </div>
      </div>

      {/* CTA */}
      <div className="cmv-cta-row">
        <button onClick={() => navigate('ASSIGN_MACRO')} className="cmv-btn cmv-btn-primary">
          Cambiar programa
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- */

const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div className="cmv-section-head">
    <h3>{children}</h3>
    {right && <span className="meta">{right}</span>}
  </div>
);

const PulseCard: React.FC<{
  value: string;
  label: string;
  tone?: 'accent' | 'green' | 'red';
}> = ({ value, label, tone = 'accent' }) => (
  <div className={`cmv-pulse-card${tone === 'green' ? ' is-green' : tone === 'red' ? ' is-red' : ''}`}>
    <p className="v">{value}</p>
    <p className="l">{label}</p>
  </div>
);

export default CoachMacroView;

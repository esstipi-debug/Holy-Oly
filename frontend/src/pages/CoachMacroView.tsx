import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useAthlete } from '../context/AthleteContext';
import Chart from '../components/social/Chart';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/coach-macro-view.css';

/**
 * CoachMacroView
 * Vista friendly del macrociclo para coach (HO y VOL).
 * Distinta de VoltaCoachTools tab='macro' (eval cuantitativa).
 * Aquí prioriza: timeline visual, distribución del roster por fase,
 * alertas accionables y pulse general del club/box.
 *
 * Restyle V2 (dark) IN PLACE · solo presentación. Toda la lógica
 * (hooks, data reads, navigate, handlers) se preserva intacta.
 * Estilos en src/styles/v2/coach-macro-view.css scoped bajo .cmv-root.
 */

type Phase = 'ACUM' | 'INTENS' | 'REAL' | 'DELOAD' | 'TEST';

interface WeekCell {
  n: number;
  phase: Phase;
  marker?: '🔻' | '🏆' | '⭐';
}

interface RosterItem {
  id: string;
  name: string;
  initials: string;
  phase: Phase;
  status: 'on-track' | 'ahead' | 'behind' | 'deload';
  adherence: number;
}

interface AlertItem {
  id: string;
  athleteName: string;
  athleteId?: string;
  message: string;
  level: 'red' | 'green' | 'amber';
}

const ROSTER: RosterItem[] = [
  { id: 'm1', name: 'Marco Torres',   initials: 'MT', phase: 'INTENS', status: 'behind',   adherence: 64 },
  { id: 'm2', name: 'Lucía Ramos',    initials: 'LR', phase: 'REAL',   status: 'ahead',    adherence: 88 },
  { id: 'm3', name: 'Diego Suárez',   initials: 'DS', phase: 'ACUM',   status: 'on-track', adherence: 72 },
  { id: 'm4', name: 'Camila Vega',    initials: 'CV', phase: 'REAL',   status: 'on-track', adherence: 94 },
  { id: 'm5', name: 'Pablo Iglesias', initials: 'PI', phase: 'DELOAD', status: 'deload',   adherence: 38 },
  { id: 'm6', name: 'Sofía Méndez',   initials: 'SM', phase: 'INTENS', status: 'on-track', adherence: 76 },
];

const STATUS_META: Record<RosterItem['status'], { label: string }> = {
  'on-track': { label: 'Adherido' },
  'ahead':    { label: 'Adelantado' },
  'behind':   { label: 'Atrasado' },
  'deload':   { label: 'Deload forzado' },
};

const PHASE_META: Record<Phase, { label: string; volume: string; intensity: string }> = {
  ACUM:   { label: 'Acumulación',     volume: '90-100% del plan',  intensity: '60-75% 1RM' },
  INTENS: { label: 'Intensificación', volume: '70-85% del plan',   intensity: '75-87% 1RM' },
  REAL:   { label: 'Realización',     volume: '50-70% del plan',   intensity: '85-95% 1RM' },
  DELOAD: { label: 'Descarga',        volume: '40-55% del plan',   intensity: '55-70% 1RM' },
  TEST:   { label: 'Test / Pico',     volume: '30-45% del plan',   intensity: '95-105% 1RM' },
};

// Fase → tier de disco (mapeo por intensidad creciente):
//   ACUM (60-75%) → verde · INTENS (75-87%) → amarillo · REAL (85-95%) → azul
//   TEST (95-105%) → rojo · DELOAD (descarga) → blanco
const PHASE_TIER: Record<Phase, PlateTier> = {
  ACUM:   'green',
  INTENS: 'yellow',
  REAL:   'blue',
  TEST:   'red',
  DELOAD: 'white',
};

// Sparkline mock: volumen semanal del club (toneladas)
const CLUB_VOLUME_HO = [62, 71, 78, 84, 90, 88, 94, 92, 86, 78, 70, 58];
const CLUB_VOLUME_VOL = [12, 14, 15, 16, 18, 17, 16];

const CoachMacroView: React.FC = () => {
  const { navigate, back } = useNav();
  const { product } = useProduct();
  const { allAthletes, selectAthlete } = useAthlete();

  const isVolta = product === 'volta';

  // Color para el componente compartido <Chart /> (SVG inline · recibe string JS,
  // no lee CSS vars). El resto de la pantalla usa tokens via --cmv-accent.
  const chartAccent = isVolta ? '#00E5FF' : '#FFB300';

  // Macrociclo según producto
  const macro = isVolta
    ? { program: 'CrossFit Open Prep', school: 'Q2', totalWeeks: 8, currentWeek: 4 }
    : { program: 'Ruso Clásico',        school: 'Escuela Rusa', totalWeeks: 12, currentWeek: 4 };

  // Build timeline cells
  const weeks: WeekCell[] = useMemo(() => {
    const total = macro.totalWeeks;
    const out: WeekCell[] = [];
    // Phase distribution: ACUM (40%) · INTENS (30%) · REAL (20%) · DELOAD/TEST sprinkled
    for (let i = 1; i <= total; i++) {
      let phase: Phase = 'ACUM';
      const pct = i / total;
      if (pct <= 0.4) phase = 'ACUM';
      else if (pct <= 0.7) phase = 'INTENS';
      else if (pct < 0.95) phase = 'REAL';
      else phase = 'TEST';
      out.push({ n: i, phase });
    }
    // Deload markers cada ~4 semanas
    const deloadWeek = Math.min(total, Math.round(total * 0.67));
    if (out[deloadWeek - 1]) { out[deloadWeek - 1].phase = 'DELOAD'; out[deloadWeek - 1].marker = '🔻'; }
    // Test week final
    if (out[total - 1]) { out[total - 1].marker = '🏆'; out[total - 1].phase = 'TEST'; }
    // Pico planificado: penúltima
    if (out[total - 2]) out[total - 2].marker = '⭐';
    return out;
  }, [macro.totalWeeks]);

  const [selectedWeek, setSelectedWeek] = useState<number>(macro.currentWeek);
  const selectedCell = weeks[selectedWeek - 1] ?? weeks[macro.currentWeek - 1];
  const currentPhase = weeks[macro.currentWeek - 1]?.phase ?? 'ACUM';
  const phaseInfo = PHASE_META[currentPhase];

  // Tiempo restante en la fase actual
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

  // Distribución del roster
  const rosterByStatus = useMemo(() => {
    const groups: Record<RosterItem['status'], RosterItem[]> = {
      'on-track': [], ahead: [], behind: [], deload: [],
    };
    ROSTER.forEach(r => groups[r.status].push(r));
    return groups;
  }, []);

  const avgAdherence = Math.round(ROSTER.reduce((a, b) => a + b.adherence, 0) / ROSTER.length);

  // Alerts list
  const alerts: AlertItem[] = [
    { id: 'a1', athleteName: 'Pablo Iglesias', message: 'HRV bajo 3 días · sugerencia deload', level: 'red' },
    { id: 'a2', athleteName: 'Lucía Ramos',    message: `lista para test de PR ${isVolta ? 'Fran' : 'Snatch'}`, level: 'green' },
    { id: 'a3', athleteName: 'Marco Torres',   message: 'desvío -25% del plan semanal', level: 'amber' },
  ];

  const openAlert = (_a: AlertItem) => {
    // Linkea al primer atleta real disponible para abrir AthleteDeepDive con data válida.
    const real = allAthletes[0];
    if (real) selectAthlete(real.id);
    navigate('ATHLETE_DETAIL');
  };

  const handleMarkDeload = () => {
    // Stub: visualmente marcaríamos la semana seleccionada como deload.
    // Sin persistencia por ahora.
    alert(`Semana ${selectedWeek} marcada para deload (stub).`);
  };

  const handleExport = () => {
    alert('Exportar review semanal (stub).');
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
        <div className="cmv-wd-chart">
          <Chart
            data={{ kind: 'sparkline', values: (isVolta ? CLUB_VOLUME_VOL : CLUB_VOLUME_HO).slice(0, macro.totalWeeks) }}
            color={chartAccent}
            width={110}
            height={42}
          />
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
      <SectionTitle right={`${ROSTER.length} atletas`}>
        Distribución del roster
      </SectionTitle>
      <div className="cmv-card">
        {(['on-track','ahead','behind','deload'] as RosterItem['status'][]).map(st => {
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
                  <div
                    key={a.id}
                    className={`cmv-chip cmv-status-${st}`}
                    title={`${a.name} · ${PHASE_META[a.phase].label}`}
                  >
                    <span className="ava">{a.initials}</span>
                    <span className="nm">{a.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ALERTAS */}
      <SectionTitle>Alertas del macrociclo</SectionTitle>
      <div className="cmv-alerts">
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
        <PulseCard value="12" label="PRs colectivos" />
        <PulseCard value="0" label="Lesiones reportadas" tone="green" />
        <PulseCard value="1" label="V-Form rojo · Pablo I." tone="red" />
        <div className="cmv-deload-card">
          <div>
            <p className="lbl">Próximo deload</p>
            <p className="wk">Semana {deloadWeekNum} 🔻</p>
          </div>
          <span className="badge">{Math.max(0, deloadWeekNum - macro.currentWeek)}w</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="cmv-cta-row">
        <button onClick={handleMarkDeload} className="cmv-btn cmv-btn-ghost">
          Marcar deload
        </button>
        <button onClick={() => navigate('ASSIGN_MACRO')} className="cmv-btn cmv-btn-primary">
          Cambiar programa
        </button>
      </div>
      <button onClick={handleExport} className="cmv-btn cmv-btn-outline">
        Exportar review semanal
      </button>
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

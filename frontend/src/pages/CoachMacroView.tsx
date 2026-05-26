import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useAthlete } from '../context/AthleteContext';
import Chart from '../components/social/Chart';

/**
 * CoachMacroView
 * Vista friendly del macrociclo para coach (HO y VOL).
 * Distinta de VoltaCoachTools tab='macro' (eval cuantitativa).
 * Aquí prioriza: timeline visual, distribución del roster por fase,
 * alertas accionables y pulse general del club/box.
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

const STATUS_META: Record<RosterItem['status'], { color: string; label: string }> = {
  'on-track': { color: '#22C55E', label: 'Adherido' },
  'ahead':    { color: '#3B82F6', label: 'Adelantado' },
  'behind':   { color: '#F59E0B', label: 'Atrasado' },
  'deload':   { color: '#94A3B8', label: 'Deload forzado' },
};

const PHASE_META: Record<Phase, { label: string; volume: string; intensity: string }> = {
  ACUM:   { label: 'Acumulación',     volume: '90-100% del plan',  intensity: '60-75% 1RM' },
  INTENS: { label: 'Intensificación', volume: '70-85% del plan',   intensity: '75-87% 1RM' },
  REAL:   { label: 'Realización',     volume: '50-70% del plan',   intensity: '85-95% 1RM' },
  DELOAD: { label: 'Descarga',        volume: '40-55% del plan',   intensity: '55-70% 1RM' },
  TEST:   { label: 'Test / Pico',     volume: '30-45% del plan',   intensity: '95-105% 1RM' },
};

// Sparkline mock: volumen semanal del club (toneladas)
const CLUB_VOLUME_HO = [62, 71, 78, 84, 90, 88, 94, 92, 86, 78, 70, 58];
const CLUB_VOLUME_VOL = [12, 14, 15, 16, 18, 17, 16];

const CoachMacroView: React.FC = () => {
  const { navigate, back } = useNav();
  const { product } = useProduct();
  const { allAthletes, selectAthlete } = useAthlete();

  const isVolta = product === 'volta';

  const accent = isVolta ? '#00E5FF' : '#F5C518';
  const accentDim = isVolta ? '#00B8CC' : '#B8860B';
  const bg = '#07070F';
  const surface = '#0F0F1C';
  const line = '#1E1E32';
  const text = '#EAEAF5';
  const muted = '#52527A';

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

  return (
    <div style={{ background: bg, minHeight: '100%', paddingBottom: 90, color: text, fontFamily: 'inherit' }}>

      {/* HEADER */}
      <div style={{ padding: '48px 20px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={back}
          style={{
            width: 34, height: 34, borderRadius: 12,
            background: surface, border: `1px solid ${line}`,
            color: text, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Back"
        >‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: muted, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Coach · Vista friendly
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: text, letterSpacing: '-.02em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {macro.program} · {macro.school}
          </h1>
          <p style={{ fontSize: 11, color: accent, fontWeight: 800, marginTop: 2 }}>
            Semana {macro.currentWeek}/{macro.totalWeeks}
          </p>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* TIMELINE HORIZONTAL */}
        <SectionTitle muted={muted}>Timeline del macrociclo</SectionTitle>
        <div
          style={{
            display: 'flex', gap: 6, overflowX: 'auto',
            padding: '4px 2px 10px', marginBottom: 16,
            WebkitOverflowScrolling: 'touch',
          }}
          className="scroll-x-no-bar"
        >
          {weeks.map(w => {
            const isPast = w.n < macro.currentWeek;
            const isCurrent = w.n === macro.currentWeek;
            const isSelected = w.n === selectedWeek;
            const opacity = w.n > macro.currentWeek ? 0.3 : 1;
            const phaseColor =
              w.phase === 'DELOAD' ? '#94A3B8' :
              w.phase === 'TEST'   ? '#A855F7' :
              w.phase === 'REAL'   ? accent :
              w.phase === 'INTENS' ? accentDim :
              `${accent}88`;
            return (
              <button
                key={w.n}
                onClick={() => setSelectedWeek(w.n)}
                style={{
                  flex: '0 0 auto',
                  width: 52, padding: '10px 0',
                  background: isCurrent
                    ? `linear-gradient(180deg, ${phaseColor}33, ${phaseColor}11)`
                    : isPast ? `${phaseColor}1A` : 'transparent',
                  border: isCurrent
                    ? `2px solid ${accent}`
                    : isSelected ? `1px solid ${accent}` : `1px solid ${line}`,
                  boxShadow: isCurrent ? `0 0 14px ${accent}55` : 'none',
                  borderRadius: 12,
                  color: isCurrent ? accent : isPast ? text : muted,
                  opacity,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em' }}>S{w.n}</span>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{w.marker ?? ''}</span>
                <span style={{
                  width: 22, height: 3, borderRadius: 2,
                  background: phaseColor,
                }} />
              </button>
            );
          })}
        </div>

        {/* Detalle de semana seleccionada */}
        <div style={{
          background: surface, border: `1px solid ${line}`, borderRadius: 14,
          padding: 12, marginBottom: 18,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 10, color: muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Semana {selectedCell.n} {selectedCell.n === macro.currentWeek && '· actual'}
            </p>
            <p style={{ fontSize: 13, fontWeight: 800, color: text, marginTop: 2 }}>
              {PHASE_META[selectedCell.phase].label} {selectedCell.marker && <span style={{ marginLeft: 6 }}>{selectedCell.marker}</span>}
            </p>
            <p style={{ fontSize: 10, color: muted, marginTop: 2 }}>
              Vol: {PHASE_META[selectedCell.phase].volume} · Int: {PHASE_META[selectedCell.phase].intensity}
            </p>
          </div>
          <Chart
            data={{ kind: 'sparkline', values: (isVolta ? CLUB_VOLUME_VOL : CLUB_VOLUME_HO).slice(0, macro.totalWeeks) }}
            color={accent}
            width={110}
            height={42}
          />
        </div>

        {/* FASE ACTUAL */}
        <SectionTitle muted={muted}>Fase actual</SectionTitle>
        <div style={{
          background: `linear-gradient(135deg, ${accent}11, transparent)`,
          border: `1px solid ${accent}55`,
          borderRadius: 16, padding: 14, marginBottom: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 11, color: accent, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {phaseInfo.label}
              </p>
              <p style={{ fontSize: 22, fontWeight: 900, color: text, marginTop: 4, letterSpacing: '-.02em' }}>
                {weeksLeftInPhase} {weeksLeftInPhase === 1 ? 'semana' : 'semanas'}
              </p>
              <p style={{ fontSize: 10, color: muted, marginTop: 2 }}>
                {nextPhase
                  ? `para ${PHASE_META[nextPhase].label}`
                  : 'hasta el final del macro'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, color: muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Esperado</p>
              <p style={{ fontSize: 11, color: text, fontWeight: 700, marginTop: 4 }}>Vol: <span style={{ color: accent }}>{phaseInfo.volume}</span></p>
              <p style={{ fontSize: 11, color: text, fontWeight: 700, marginTop: 2 }}>Int: <span style={{ color: accent }}>{phaseInfo.intensity}</span></p>
            </div>
          </div>
        </div>

        {/* DISTRIBUCIÓN DEL ROSTER POR ESTADO */}
        <SectionTitle muted={muted} right={<span style={{ fontSize: 10, color: muted }}>{ROSTER.length} atletas</span>}>
          Distribución del roster
        </SectionTitle>
        <div style={{
          background: surface, border: `1px solid ${line}`,
          borderRadius: 16, padding: 14, marginBottom: 18,
        }}>
          {(['on-track','ahead','behind','deload'] as RosterItem['status'][]).map(st => {
            const meta = STATUS_META[st];
            const group = rosterByStatus[st];
            if (group.length === 0) return null;
            return (
              <div key={st} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block', marginRight: 6 }} />
                    {meta.label}
                  </p>
                  <p style={{ fontSize: 10, color: muted, fontWeight: 700 }}>{group.length}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {group.map(a => (
                    <div
                      key={a.id}
                      title={`${a.name} · ${PHASE_META[a.phase].label}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: `${meta.color}15`,
                        border: `1px solid ${meta.color}33`,
                        padding: '4px 10px 4px 4px', borderRadius: 999,
                      }}
                    >
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${accent}, ${accentDim})`,
                        color: '#07070F',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 900,
                      }}>{a.initials}</span>
                      <span style={{ fontSize: 11, color: text, fontWeight: 600 }}>{a.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ALERTAS */}
        <SectionTitle muted={muted}>Alertas del macrociclo</SectionTitle>
        <div style={{
          background: surface, border: `1px solid ${line}`,
          borderRadius: 16, overflow: 'hidden', marginBottom: 18,
        }}>
          {alerts.map((al, i) => {
            const color = al.level === 'red' ? '#EF4444' : al.level === 'green' ? '#22C55E' : '#F59E0B';
            const dot = al.level === 'red' ? '🔴' : al.level === 'green' ? '🟢' : '🟡';
            return (
              <button
                key={al.id}
                onClick={() => openAlert(al)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  background: 'transparent',
                  borderBottom: i < alerts.length - 1 ? `1px solid ${line}` : 'none',
                  borderLeft: `3px solid ${color}`,
                  borderTop: 'none', borderRight: 'none',
                  color: text, textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 14 }}>{dot}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: text }}>{al.athleteName}</p>
                  <p style={{ fontSize: 10, color: muted, marginTop: 2 }}>{al.message}</p>
                </div>
                <span style={{ fontSize: 16, color: muted }}>›</span>
              </button>
            );
          })}
        </div>

        {/* PULSE DEL MACRO */}
        <SectionTitle muted={muted}>Pulse del macro</SectionTitle>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18,
        }}>
          <PulseCard accent={accent} surface={surface} line={line} muted={muted} text={text}
            value={`${avgAdherence}%`} label="Adherencia promedio" />
          <PulseCard accent={accent} surface={surface} line={line} muted={muted} text={text}
            value="12" label="PRs colectivos" />
          <PulseCard accent={'#22C55E'} surface={surface} line={line} muted={muted} text={text}
            value="0" label="Lesiones reportadas" />
          <PulseCard accent={'#EF4444'} surface={surface} line={line} muted={muted} text={text}
            value="1" label="V-Form rojo · Pablo I." />
          <div style={{
            gridColumn: '1 / -1',
            background: surface, border: `1px solid ${line}`,
            borderRadius: 14, padding: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 10, color: muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Próximo deload
              </p>
              <p style={{ fontSize: 14, fontWeight: 800, color: text, marginTop: 2 }}>
                Semana {Math.round(macro.totalWeeks * 0.67)} 🔻
              </p>
            </div>
            <span style={{
              fontSize: 18,
              padding: '8px 14px',
              background: `${accent}15`,
              border: `1px solid ${accent}55`,
              color: accent,
              borderRadius: 12, fontWeight: 800,
            }}>{Math.max(0, Math.round(macro.totalWeeks * 0.67) - macro.currentWeek)}w</span>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <button
            onClick={handleMarkDeload}
            style={{
              padding: '12px 10px', borderRadius: 14,
              background: 'transparent', color: muted,
              border: `1px solid ${line}`,
              fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Marcar deload</button>
          <button
            onClick={() => navigate('ASSIGN_MACRO')}
            style={{
              padding: '12px 10px', borderRadius: 14,
              background: `linear-gradient(135deg, ${accent}, ${accentDim})`,
              color: '#07070F', border: 'none',
              fontSize: 11, fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Cambiar programa</button>
        </div>
        <button
          onClick={handleExport}
          style={{
            width: '100%', padding: '12px 10px', borderRadius: 14,
            background: 'transparent', color: accent,
            border: `1px solid ${accent}55`,
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: 8,
          }}
        >Exportar review semanal</button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- */

const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode; muted: string }> = ({ children, right, muted }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: muted }}>
      {children}
    </p>
    {right}
  </div>
);

const PulseCard: React.FC<{
  accent: string; surface: string; line: string; muted: string; text: string;
  value: string; label: string;
}> = ({ accent, surface, line, muted, text, value, label }) => (
  <div style={{
    background: surface, border: `1px solid ${line}`,
    borderRadius: 14, padding: 12,
  }}>
    <p style={{ fontSize: 22, fontWeight: 900, color: accent, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: 10, color: muted, fontWeight: 700, marginTop: 6 }}>{label}</p>
    <span style={{ display: 'none' }}>{text}</span>
  </div>
);

export default CoachMacroView;

import React from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import WiseAssistant from '../components/WiseAssistant';

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  cyan: '#00E5FF',
  cyanDim: '#00B8CC',
  amber: '#FFB300',
  red: '#FF3D00',
  green: '#00E676',
  purple: '#A855F7',
};

const Sec: React.FC<{ children: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties }> = ({ children, right, style }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, ...style }}>
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted }}>
      {children}
    </p>
    {right}
  </div>
);

const ROSTER = [
  { id: 'm1', name: 'Marco Torres',   initials: 'MT', cf: 72, vform: 'amber',  hrv: 'red',    progress: 64, plan: 'AMRAP 20' },
  { id: 'm2', name: 'Lucía Ramos',    initials: 'LR', cf: 81, vform: 'green',  hrv: 'green',  progress: 88, plan: 'Fran' },
  { id: 'm3', name: 'Diego Suárez',   initials: 'DS', cf: 64, vform: 'amber',  hrv: 'amber',  progress: 52, plan: 'Helen' },
  { id: 'm4', name: 'Camila Vega',    initials: 'CV', cf: 89, vform: 'green',  hrv: 'green',  progress: 94, plan: 'Karen' },
  { id: 'm5', name: 'Pablo Iglesias', initials: 'PI', cf: 58, vform: 'red',    hrv: 'red',    progress: 38, plan: 'Rest' },
  { id: 'm6', name: 'Sofía Méndez',   initials: 'SM', cf: 76, vform: 'green',  hrv: 'amber',  progress: 71, plan: 'Grace' },
];

const colorMap = { red: C.red, amber: C.amber, green: C.green };

const WEEK_WODS = [
  { day: 'L', name: 'Strength · BS 5×5',  type: 'Strength',   intensity: 4 },
  { day: 'M', name: 'Fran',                type: 'Benchmark', intensity: 5 },
  { day: 'X', name: 'Engine · Row 5k',    type: 'Engine',    intensity: 3 },
  { day: 'J', name: 'AMRAP 20',            type: 'WOD',       intensity: 4, today: true },
  { day: 'V', name: 'Skill · HSPU',        type: 'Gym',       intensity: 2 },
  { day: 'S', name: 'Team WOD',            type: 'Team',      intensity: 4 },
  { day: 'D', name: 'Active Rest',         type: 'Rest',      intensity: 1 },
];

const TODAY_OBJECTIVES = [
  { icon: '🎯', label: 'Patrón AMRAP sin breaks largos', status: 'primary' },
  { icon: '🔥', label: 'Mantener cadencia constante (sub-90s/ronda)', status: 'primary' },
  { icon: '⚡', label: 'C&J a 80% técnico (no fallo)', status: 'secondary' },
  { icon: '🩹', label: 'Atletas con HRV bajo: escalar a 70%', status: 'warning' },
];

const INVENTORY = [
  { icon: '🏋️', label: 'Barras Olímpicas', count: 12, total: 12 },
  { icon: '⚪', label: 'Bumpers (kg)',     count: 480, total: 600 },
  { icon: '🥊', label: 'Kettlebells',       count: 18, total: 20 },
  { icon: '🪢', label: 'Cuerdas',           count: 4,  total: 4 },
  { icon: '📦', label: 'Cajones plyo',      count: 8,  total: 8 },
];

const VoltaCoachDash: React.FC = () => {
  const { navigate } = useNav();
  const { allAthletes, selectAthlete } = useAthlete();

  const openAthlete = (mockIdx: number) => {
    const real = allAthletes[mockIdx];
    if (real) selectAthlete(real.id);
    navigate('ATHLETE_DETAIL');
  };

  const critical = ROSTER.filter((a) => a.hrv === 'red').length;
  const warning  = ROSTER.filter((a) => a.hrv === 'amber').length;
  const ok       = ROSTER.filter((a) => a.hrv === 'green').length;
  const avgProgress = Math.round(ROSTER.reduce((acc, a) => acc + a.progress, 0) / ROSTER.length);

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text }}>

      {/* HEADER */}
      <div style={{ padding: '48px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '.08em' }}>COACH · CROSSFIT</div>
          <div style={{ fontSize: 21, fontWeight: 900, color: C.text, letterSpacing: '-.02em', marginTop: 2 }}>Box Command</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
            background: 'rgba(0,229,255,0.1)', color: C.cyan, border: '1px solid rgba(0,229,255,0.2)',
          }}>{ROSTER.length} atletas</span>
        </div>
      </div>

      {/* TRIAGE STRIP */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 16px 14px',
        borderBottom: `1px solid ${C.line}`,
        background: 'rgba(0,229,255,0.03)',
      }}>
        <div style={{ flex: 1, padding: 10, borderRadius: 12, background: 'rgba(255,61,0,0.08)', border: '1px solid rgba(255,61,0,0.25)' }}>
          <div style={{ fontSize: 9, color: C.red, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>Crítico</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.red, lineHeight: 1.2 }}>{critical}</div>
          <div style={{ fontSize: 9, color: C.muted }}>HRV bajo</div>
        </div>
        <div style={{ flex: 1, padding: 10, borderRadius: 12, background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.25)' }}>
          <div style={{ fontSize: 9, color: C.amber, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>Watch</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.amber, lineHeight: 1.2 }}>{warning}</div>
          <div style={{ fontSize: 9, color: C.muted }}>Fatiga</div>
        </div>
        <div style={{ flex: 1, padding: 10, borderRadius: 12, background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.25)' }}>
          <div style={{ fontSize: 9, color: C.green, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>OK</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.green, lineHeight: 1.2 }}>{ok}</div>
          <div style={{ fontSize: 9, color: C.muted }}>Listos</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* MACROCICLO ACTIVO */}
        <Sec right={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('COACH_MACRO_VIEW')} style={{ fontSize: 10, color: C.cyan, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Ver friendly →</button>
            <button onClick={() => navigate('VOLTA_COACH_MACRO')} style={{ fontSize: 10, color: C.muted, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Eval →</button>
          </div>
        }>
          Macrociclo activo
        </Sec>
        <div
          onClick={() => navigate('COACH_MACRO_VIEW')}
          style={{
            background: C.surface,
            border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: 16, padding: 14, marginBottom: 18,
            cursor: 'pointer',
          }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.text }}>CrossFit Open Prep · Q2</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Mesociclo: <span style={{ color: C.cyan, fontWeight: 700 }}>Conditioning Block</span></p>
            </div>
            <div style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 10, padding: '4px 9px' }}>
              <span style={{ fontSize: 11, color: C.cyan, fontWeight: 800 }}>Sem 4/8</span>
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: '50%', background: `linear-gradient(90deg, ${C.cyan}, ${C.purple})` }} />
          </div>
          <p style={{ fontSize: 10, color: C.muted }}>50% · Pico planificado en 4 semanas</p>
        </div>

        {/* WOD DE LA SEMANA */}
        <Sec right={<button onClick={() => navigate('VOLTA_COACH_WOD')} style={{ fontSize: 10, color: C.cyan, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Plan completo →</button>}>
          WOD de la semana
        </Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', marginBottom: 18 }}>
          {WEEK_WODS.map((w, i) => (
            <div
              key={w.day}
              onClick={() => navigate('VOLTA_COACH_WOD')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: i < WEEK_WODS.length - 1 ? `1px solid ${C.line}` : 'none',
                background: w.today ? 'rgba(0,229,255,0.05)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: w.today ? C.cyan : C.surface2,
                color: w.today ? '#07070F' : C.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900,
                flexShrink: 0,
              }}>{w.day}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: w.today ? C.cyan : C.text }}>
                  {w.name} {w.today && <span style={{ fontSize: 9, color: C.cyan, marginLeft: 6 }}>· HOY</span>}
                </p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{w.type}</p>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((x) => (
                  <div key={x} style={{
                    width: 4, height: 12, borderRadius: 1,
                    background: x <= w.intensity ? (w.intensity >= 4 ? C.red : w.intensity >= 3 ? C.amber : C.cyan) : C.line,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* OBJETIVOS WOD DE HOY */}
        <Sec>Objetivos · WOD de hoy</Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, marginBottom: 18 }}>
          {TODAY_OBJECTIVES.map((o, i) => {
            const bg = o.status === 'warning' ? 'rgba(255,179,0,0.05)' : o.status === 'secondary' ? 'rgba(255,255,255,0.02)' : 'rgba(0,229,255,0.04)';
            const accent = o.status === 'warning' ? C.amber : o.status === 'secondary' ? C.cyanDim : C.cyan;
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: bg, borderRadius: 10,
                  marginBottom: i < TODAY_OBJECTIVES.length - 1 ? 6 : 0,
                  borderLeft: `2px solid ${accent}`,
                }}
              >
                <span style={{ fontSize: 16 }}>{o.icon}</span>
                <span style={{ fontSize: 12, color: C.text, fontWeight: 500, lineHeight: 1.3 }}>{o.label}</span>
              </div>
            );
          })}
        </div>

        {/* AVANCE DE ATLETAS */}
        <Sec right={<span style={{ fontSize: 10, color: C.muted }}>Avg: <strong style={{ color: C.cyan }}>{avgProgress}%</strong></span>}>
          Avance de atletas
        </Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', marginBottom: 18 }}>
          {ROSTER.map((a, i) => {
            const progColor = a.progress >= 80 ? C.green : a.progress >= 50 ? C.cyan : C.amber;
            return (
              <div
                key={a.id}
                onClick={() => openAthlete(i)}
                style={{
                  padding: '12px 14px',
                  borderBottom: i < ROSTER.length - 1 ? `1px solid ${C.line}` : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#00E5FF,#0070FF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#07070F', flexShrink: 0,
                  }}>{a.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.name}
                    </p>
                    <p style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>
                      CF <span style={{ color: C.cyan, fontWeight: 700 }}>{a.cf}</span> · Plan: {a.plan}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorMap[a.vform as keyof typeof colorMap] }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorMap[a.hrv as keyof typeof colorMap] }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: progColor, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
                    {a.progress}%
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: C.line, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${a.progress}%`, background: progColor, transition: 'width .6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* INVENTARIO RESUMEN */}
        <Sec right={<button onClick={() => navigate('VOLTA_COACH_INVENTORY')} style={{ fontSize: 10, color: C.cyan, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Ver todo →</button>}>
          Inventario del box
        </Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="scroll-x-no-bar">
            {INVENTORY.slice(0, 4).map((it) => {
              const pct = (it.count / it.total) * 100;
              const color = pct >= 100 ? C.green : pct >= 60 ? C.cyan : C.amber;
              return (
                <div key={it.label} style={{
                  flex: '0 0 90px',
                  background: C.surface2,
                  border: `1px solid ${C.line}`,
                  borderRadius: 12, padding: 10, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{it.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color }}>{it.count}/{it.total}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{it.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACCIONES PRINCIPALES */}
        <Sec>Acciones del coach</Sec>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          <button
            onClick={() => navigate('VOLTA_COACH_WOD')}
            style={{
              padding: '14px 10px', borderRadius: 14,
              background: `linear-gradient(135deg, ${C.cyan}22, transparent)`,
              border: `1px solid ${C.cyan}55`,
              color: C.cyan,
              fontSize: 12, fontWeight: 800, textAlign: 'left',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>⚡</div>
            Crear WOD
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 500, marginTop: 2 }}>Editor diario</div>
          </button>
          <button
            onClick={() => navigate('VOLTA_COACH_TOOLS')}
            style={{
              padding: '14px 10px', borderRadius: 14,
              background: `linear-gradient(135deg, ${C.green}22, transparent)`,
              border: `1px solid ${C.green}55`,
              color: C.green,
              fontSize: 12, fontWeight: 800, textAlign: 'left',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>🧰</div>
            Toolbox
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 500, marginTop: 2 }}>7 herramientas</div>
          </button>
          <button
            onClick={() => navigate('VOLTA_COACH_MACRO')}
            style={{
              padding: '14px 10px', borderRadius: 14,
              background: `linear-gradient(135deg, ${C.purple}22, transparent)`,
              border: `1px solid ${C.purple}55`,
              color: C.purple,
              fontSize: 12, fontWeight: 800, textAlign: 'left',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>📅</div>
            Macrociclo
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 500, marginTop: 2 }}>Crear / editar</div>
          </button>
          <button
            onClick={() => navigate('VOLTA_COACH_INVENTORY')}
            style={{
              padding: '14px 10px', borderRadius: 14,
              background: `linear-gradient(135deg, ${C.amber}22, transparent)`,
              border: `1px solid ${C.amber}55`,
              color: C.amber,
              fontSize: 12, fontWeight: 800, textAlign: 'left',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>📦</div>
            Inventario
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 500, marginTop: 2 }}>Equipamiento</div>
          </button>
        </div>
      </div>

      <WiseAssistant context="Coach Dashboard · Box Command" />
    </div>
  );
};

export default VoltaCoachDash;

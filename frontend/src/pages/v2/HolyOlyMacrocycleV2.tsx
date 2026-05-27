// @ts-nocheck — Custom elements <plate-3d> y <plate-stack> requieren JSX.IntrinsicElements global
//                que React 19 strict no acepta sin namespace explícito.
//                Mismo workaround que los wrappers Plate3D.tsx / PlateStack.tsx.
/**
 * HolyOlyMacrocycleV2 · Macrociclo Atleta · vista del atleta sobre su macro activo.
 *
 * Portado de claude_design_drops/2026-05-27_pkql_v2/holy-oly-macrocycle.jsx
 * Cambios:
 *  - jsx → tsx con tipos explícitos
 *  - `const { useState, useMemo } = React;` → import directo
 *  - scope CSS bajo .hmm-root (sin reset global, sin frame .phone)
 *  - useNav para navegar al catálogo (botón en chip macro · long-press demo)
 *  - removido ReactDOM.createRoot leftover del jsx fuente
 *  - mock holyOly (Marco Vitali · semana 5/8 PEAKING SNATCH) por ahora · backend pendiente
 */
import { useState, useMemo, type CSSProperties, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import '../../lib/web-components';
import '../../styles/v2/holy-oly-macrocycle.css';

// ============================================================
// Types
// ============================================================
interface CoachInfo { name: string; unread: number }
interface AthleteInfo { name: string; avatar: string; discoActiveTier: string; discoActiveKg: number; coach: CoachInfo }
interface LiftData {
  label: string;
  code: string;
  oneRm: number;
  deltaBlock: number;
  plates: string[];
  rpeAvg: number;
  sessions: number[];
}
interface BlockSession { d: string; mv: string; pct: string; rpe: number; done?: boolean; today?: boolean; rest?: boolean }
interface MacroBlock {
  name: string;
  weeks: number[];
  pct: string;
  state: 'done' | 'current' | 'future';
  desc: string;
  sessions?: BlockSession[];
}
interface LoadDay { d: string; sn: number; cj: number; acc: number; done?: boolean; today?: boolean; rest?: boolean }
interface WeeklyLoad { days: LoadDay[]; totalKg: number; acwr: number }
interface DamageControlData { show: boolean; when: string; summary: string; detail: string }
interface HolyOlyMacrocycle {
  athlete: AthleteInfo;
  macroLabel: string;
  currentWeek: number;
  totalWeeks: number;
  snatch: LiftData;
  clean: LiftData;
  blocks: MacroBlock[];
  weeklyLoad: WeeklyLoad;
  damageControl: DamageControlData;
}

// ============================================================
// Mock data · GET /v1/holyoly/macrocycle/me
// ============================================================
const mockHolyOlyMacrocycle: HolyOlyMacrocycle = {
  athlete: {
    name: 'MARCO VITALI',
    avatar: 'MV',
    discoActiveTier: '3',         // AZUL = 20kg dominados
    discoActiveKg:   20,
    coach: { name: 'Carla R.', unread: 2 },
  },
  macroLabel: 'PEAKING SNATCH',
  currentWeek: 5,
  totalWeeks: 8,

  // 1RMs
  snatch: {
    label: 'SNATCH',
    code: 'Sn',
    oneRm: 92,
    deltaBlock: +4,
    plates: ['4','1'],
    rpeAvg: 8.2,
    sessions: [78,80,82,82,85,88,90,92],
  },
  clean: {
    label: 'CLEAN & JERK',
    code: 'C&J',
    oneRm: 115,
    deltaBlock: +6,
    plates: ['4','4','1'],
    rpeAvg: 8.5,
    sessions: [102,105,108,110,108,112,113,115],
  },

  blocks: [
    { name: 'VOLUMEN GENERAL', weeks: [1,2], pct: '70-80%', state: 'done',
      desc: 'Acumulación · volumen alto · técnica.' },
    { name: 'INTENSIDAD',      weeks: [3,4], pct: '85-92%', state: 'done',
      desc: 'Subida progresiva · singles + doubles.' },
    { name: 'PEAKING SNATCH',  weeks: [5,6], pct: '88-95%', state: 'current',
      desc: 'Pico de intensidad en Sn · cargas máximas controladas.',
      sessions: [
        { d:'LUN',  mv:'Snatch · 3×2', pct:'90%', rpe:8, done:true  },
        { d:'MAR',  mv:'Front Squat · 4×3', pct:'85%', rpe:8, done:true },
        { d:'MIÉ',  mv:'C&J · 4×1', pct:'88%', rpe:8.5, done:true },
        { d:'JUE',  mv:'Snatch + Pull · 5×1', pct:'92%', rpe:9, today:true },
        { d:'VIE',  mv:'Tech + Acc · barra vacía', pct:'—', rpe:6 },
        { d:'SÁB',  mv:'Hang Snatch · 3×3', pct:'80%', rpe:7 },
        { d:'DOM',  mv:'Rest', pct:'—', rpe:0, rest:true },
      ],
    },
    { name: 'TAPERING',        weeks: [7],   pct: '60-70%', state: 'future',
      desc: 'Descarga progresiva · técnica · barra vacía.' },
    { name: 'PEAK TEST',       weeks: [8],   pct: '95-105%', state: 'future',
      desc: 'Test de PRs · Sn + C&J + Total olímpico.' },
  ],

  weeklyLoad: {
    days: [
      { d:'L', sn:1800, cj:0,    acc:600,  done:true  },
      { d:'M', sn:0,    cj:0,    acc:1100, done:true  },
      { d:'X', sn:600,  cj:2400, acc:400,  done:true  },
      { d:'J', sn:2200, cj:0,    acc:500,  today:true },
      { d:'V', sn:200,  cj:0,    acc:900,             },
      { d:'S', sn:900,  cj:1100, acc:300              },
      { d:'D', sn:0,    cj:0,    acc:0,    rest:true  },
    ],
    totalKg: 12840,
    acwr: 1.12,
  },

  damageControl: {
    show: true,
    when: 'esta semana',
    summary: 'Ajustamos -10% volumen Sn · sueño promedio 5h × 3 noches',
    detail: 'Tu CNS bajó 8% lunes-miércoles · forzamos sleep target ≥7h hasta sábado',
  },
};

// ============================================================
// Helpers + icons
// ============================================================
const ICONS: Record<string, ReactElement> = {
  chat:   <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
  chev:   <polyline points="9 18 15 12 9 6"/>,
  zap:    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  warn:   <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  sparkle:<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>,
  arrowR: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  trend:  <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
};
interface IconProps { name: keyof typeof ICONS; size?: number; stroke?: number; className?: string; style?: CSSProperties }
function Icon({ name, size = 14, stroke = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

/* describe plate composition for aria-label */
const TIER_KG: Record<string, number> = { '0':0, '1':10, '2':15, '3':20, '4':25 };
const TIER_NM: Record<string, string> = { '0':'blanco', '1':'verde', '2':'amarillo', '3':'azul', '4':'rojo' };
void TIER_KG; // referenced in mock comments only
function describePlates(plates: string[] | undefined, oneRm: number): string {
  if (!plates?.length) return `${oneRm} kg`;
  const counts: Record<string, number> = {};
  plates.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const parts = Object.entries(counts).reverse()
    .map(([t, n]) => `${n} disco${n>1?'s':''} ${TIER_NM[t]}`)
    .join(' + ');
  return `${oneRm} kg total · barra + ${parts} por lado`;
}

// ============================================================
// ZONE A · HEADER
// ============================================================
function Header({ data }: { data: HolyOlyMacrocycle }) {
  return (
    <header className="ho-header" role="banner">
      <div className="ho-h-top">
        <div className="ho-avatar" aria-label="avatar">{data.athlete.avatar}</div>
        <div className="ho-h-meta">
          <div className="ho-h-name">{data.athlete.name}</div>
          <div className="ho-h-coach">
            <Icon name="sparkle" size={9} stroke={2} className="ic"/>
            COACH <span className="nm">{data.athlete.coach.name}</span>
          </div>
        </div>
        <div className="ho-disco"
             aria-label={`Disco actual: ${TIER_NM[data.athlete.discoActiveTier]}, ${data.athlete.discoActiveKg}kg`}
             title="Long-press: cómo subir de disco">
          <plate-3d tier={data.athlete.discoActiveTier} size="30"/>
          <span className="ho-disco-kg">{data.athlete.discoActiveKg}kg</span>
        </div>
        <button className="ho-chat-btn" aria-label={`Chat con coach (${data.athlete.coach.unread} sin leer)`}>
          <Icon name="chat" size={14}/>
          {data.athlete.coach.unread > 0 && <span className="new"/>}
        </button>
      </div>

      <div className="ho-h-chip-row">
        <span className="ho-macro-badge">
          <span className="pip"/>
          {data.macroLabel} · S<span className="n">{data.currentWeek}</span>/{data.totalWeeks}
        </span>
      </div>
    </header>
  );
}

// ============================================================
// ZONE B · DUAL HERO · Sn + C&J
// ============================================================
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 100, h = 24;
  const min = Math.min(...values), max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / span) * (h - 4);
    return [x, y] as [number, number];
  });
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const fillPath = `${path} L ${w} ${h} L 0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
         style={{ ['--lc' as string]: color } as CSSProperties}>
      <path d={fillPath} className="fill"/>
      <path d={path} className="line"/>
      <circle cx={last[0]} cy={last[1]} r="2.2" className="dot"/>
    </svg>
  );
}

function LiftCard({ lift, code, color }: { lift: LiftData; code: string; color: string }) {
  const trend = lift.deltaBlock >= 0 ? 'up' : 'down';
  const sign = lift.deltaBlock >= 0 ? '+' : '';
  return (
    <article className="ho-lift-card" data-lift={code}
             aria-label={describePlates(lift.plates, lift.oneRm)}>
      <span className="br br-l"/><span className="br br-r"/>

      <div className="ho-lift-eyebrow">
        <span className="lift">{lift.label}</span>
        <span className={`ho-lift-delta ${trend}`}>
          {trend === 'up' ? '▲' : '▼'} {sign}{lift.deltaBlock}kg
        </span>
      </div>

      <div className="ho-lift-plates" aria-hidden="true">
        <plate-stack tiers={lift.plates.join(',')}
                     size="38"
                     orientation="row"
                     overlap="0.3"></plate-stack>
      </div>

      <div className="ho-lift-value">
        {lift.oneRm}<span className="u">kg</span>
      </div>

      <div className="ho-lift-spark">
        <Sparkline values={lift.sessions} color={color}/>
      </div>

      <div className="ho-lift-foot">
        <span>RPE prom</span>
        <span className="rpe-v">{lift.rpeAvg.toFixed(1)}</span>
      </div>

      <table className="sr-only">
        <caption>Últimas 8 sesiones de {lift.label} (kg)</caption>
        <tbody>
          {lift.sessions.map((v, i) => (
            <tr key={i}><td>Sesión {i+1}</td><td>{v} kg</td></tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

// ============================================================
// ZONE C · TIMELINE VERTICAL · 4-5 bloques
// ============================================================
function VerticalTimeline({
  blocks, expandedIdx, setExpanded,
}: {
  blocks: MacroBlock[];
  expandedIdx: number | null;
  setExpanded: (i: number | null) => void;
}) {
  const sym = (s: MacroBlock['state']): string =>
    ({ done: '✓', current: '▶', future: '◌' } as const)[s];
  return (
    <>
      <div className="ho-section-head">
        <h3>Bloques · macrociclo</h3>
        <span className="meta">{blocks.length} fases · vertical</span>
      </div>
      <div className="ho-timeline-v">
        {blocks.map((b, i) => (
          <div key={i}>
            <div className="ho-block-v"
                 data-state={b.state}
                 data-expanded={expandedIdx === i}
                 onClick={() => setExpanded(expandedIdx === i ? null : i)}
                 role="button"
                 tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     setExpanded(expandedIdx === i ? null : i);
                   }
                 }}
                 aria-label={`Bloque ${i+1}: ${b.name}, ${b.pct}, ${b.state}, semanas ${b.weeks.join(' a ')}`}>
              <div className="ho-block-num">{i + 1}</div>
              <div className="ho-block-name">{b.name}</div>
              <div className="ho-block-pct">% 1RM · <strong>{b.pct}</strong></div>
              <div className="ho-block-status">
                <span className="sym" aria-hidden="true">{sym(b.state)}</span>
                <span className="wks">S{b.weeks.join('-S')}</span>
              </div>
              {b.state === 'current' && (
                <span className="chev" aria-hidden="true">
                  <Icon name="chev" size={14}/>
                </span>
              )}
            </div>
            {expandedIdx === i && b.sessions && (
              <div className="ho-block-sessions">
                {b.sessions.map((s, j) => (
                  <div key={j} className={`ho-sess ${s.done ? 'done' : ''}`}>
                    <span className="d">{s.d}</span>
                    <span className="mv">{s.mv}</span>
                    <span className="pct">{s.pct}</span>
                    <span className="rpe">
                      {s.rest ? '—' : `RPE ${s.rpe}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================
// ZONE D · CARGA SEMANAL · bar chart + ACWR
// ============================================================
function WeeklyLoadView({ load }: { load: WeeklyLoad }) {
  const maxDay = useMemo(() =>
    Math.max(...load.days.map(d => d.sn + d.cj + d.acc)), [load]);

  const acwr = load.acwr;
  const acwrZone: 'ok' | 'warn' | 'crit' =
    acwr <= 1.3 ? 'ok' : acwr <= 1.5 ? 'warn' : 'crit';
  const acwrZoneLabel = ({ ok: 'ZONA SEGURA', warn: 'CARGA ALTA', crit: 'RIESGO' } as const)[acwrZone];
  const acwrColor = ({
    ok:   'var(--engine-oly)',
    warn: 'var(--engine-macro)',
    crit: 'var(--engine-pulse)',
  } as const)[acwrZone];
  const acwrPct = Math.min(100, (acwr / 2) * 100);

  return (
    <>
      <div className="ho-section-head">
        <h3>Carga semanal</h3>
        <span className="meta">tonelaje · ACWR 0.8-1.3 ok</span>
      </div>
      <div className="ho-load">
        <div className="ho-load-left">
          <div className="ho-load-bars" aria-hidden="true">
            {load.days.map((d, i) => {
              const total = d.sn + d.cj + d.acc;
              const h = (total / maxDay) * 100;
              return (
                <div key={i} className="ho-day-col"
                     data-today={d.today || undefined}
                     data-rest={d.rest || undefined}>
                  <div className="ho-day-stack"
                       data-today={d.today || undefined}
                       style={{ height: total > 0 ? `${h}%` : '4px' }}>
                    {d.sn > 0 && (
                      <div className="seg sn"
                           style={{ flex: d.sn }}/>
                    )}
                    {d.cj > 0 && (
                      <div className="seg cj"
                           style={{ flex: d.cj }}/>
                    )}
                    {d.acc > 0 && (
                      <div className="seg acc"
                           style={{ flex: d.acc }}/>
                    )}
                  </div>
                  <div className="ho-day-label">{d.d}</div>
                </div>
              );
            })}
          </div>
          <div className="ho-load-legend" aria-hidden="true">
            <span className="l"><span className="sw" style={{background:'var(--color-disc-blue)'}}/>SN</span>
            <span className="l"><span className="sw" style={{background:'var(--color-disc-red)'}}/>C&amp;J</span>
            <span className="l"><span className="sw" style={{background:'rgba(148,163,184,0.6)'}}/>ACC</span>
          </div>
          <div className="ho-load-tot">
            <span className="v">{load.totalKg.toLocaleString('es-CL')}</span>
            <span className="u">kg · TONELAJE SEMANA</span>
          </div>
        </div>

        <div className="ho-acwr">
          <div className="ho-acwr-ring"
               style={{
                 background: `conic-gradient(${acwrColor} ${acwrPct}%, rgba(255,255,255,0.06) 0)`,
                 filter: `drop-shadow(0 0 8px ${acwrColor})`,
               }}
               role="img"
               aria-label={`ACWR ${acwr.toFixed(2)}, ${acwrZoneLabel}`}>
            <div className="ho-acwr-num">
              {acwr.toFixed(2)}
              <small>ACWR</small>
            </div>
          </div>
          <span className={`ho-acwr-zone ${acwrZone}`}>{acwrZoneLabel}</span>
        </div>

        {acwr > 1.3 && (
          <div className="ho-load-alert" style={{ gridColumn: '1 / -1' }}>
            <Icon name="warn" size={14} className="ic"/>
            <span>
              <strong>Carga alta esta semana.</strong> Revisá con tu coach antes de tu próximo
              entreno pesado.
            </span>
          </div>
        )}

        <table className="sr-only">
          <caption>Tonelaje por día (kg)</caption>
          <thead><tr><th>Día</th><th>Snatch</th><th>C&amp;J</th><th>Accesorios</th></tr></thead>
          <tbody>
            {load.days.map((d, i) => (
              <tr key={i}><td>{d.d}</td><td>{d.sn}</td><td>{d.cj}</td><td>{d.acc}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ============================================================
// ZONE E · CONTROL DE DAÑOS · collapsible
// ============================================================
function DamageControl({ data }: { data: DamageControlData }) {
  const [open, setOpen] = useState(false);
  if (!data.show) return null;
  return (
    <div className="ho-damage" aria-label="Aviso de control de daños">
      <div className="ho-damage-head">
        <div className="ho-damage-ic">
          <Icon name="sparkle" size={14} stroke={2}/>
        </div>
        <div className="ho-damage-meta">
          CONTROL DE DAÑOS
          <span className="when">{data.when}</span>
        </div>
      </div>
      <div className="ho-damage-body">
        {data.summary} · <strong>todo bien.</strong>
      </div>
      {open && (
        <div className="ho-damage-body"
             style={{ color: 'var(--text-mid)', fontSize: 11.5,
                      paddingTop: 6, borderTop: '1px dashed var(--border-soft)' }}>
          {data.detail}
        </div>
      )}
      <button className="ho-damage-link" onClick={() => setOpen(o => !o)}>
        {open ? '▾ Ocultar' : '▸ Ver explicación detallada IA'}
      </button>
    </div>
  );
}

// ============================================================
// Main
// ============================================================
export default function HolyOlyMacrocycleV2() {
  const { navigate } = useNav();
  const data = mockHolyOlyMacrocycle;
  const [expandedIdx, setExpanded] = useState<number | null>(2); // current block expanded

  // navigate referenced for future · ej tap macro badge → catálogo
  void navigate;

  return (
    <div className="hmm-root">
      <Header data={data}/>

      <div className="ho-scroll">
        <div className="ho-section-head">
          <h3>Levantamientos · 1RM</h3>
          <span className="meta">vs inicio macro</span>
        </div>
        <div className="ho-duo">
          <LiftCard lift={data.snatch} code="sn" color="#3B82F6"/>
          <LiftCard lift={data.clean}  code="cj" color="#EF4444"/>
        </div>

        <VerticalTimeline
          blocks={data.blocks}
          expandedIdx={expandedIdx}
          setExpanded={setExpanded}/>

        <WeeklyLoadView load={data.weeklyLoad}/>

        <DamageControl data={data.damageControl}/>
      </div>
    </div>
  );
}

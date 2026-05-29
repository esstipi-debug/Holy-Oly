/**
 * VoltaMacrocycleV2 · Macrociclo atleta Volta · CrossFit periodization view.
 *
 * Portado de claude_design_drops/2026-05-27_pkql_v2/volta-macrocycle.jsx
 * Cambios:
 *  - jsx → tsx con tipos explícitos para interfaces de datos
 *  - useNav opcional · hero no expone botón "Back" en source (long-press abre modal)
 *  - eliminados wrappers .phone / .phone-inner / .status-bar (chrome del mock)
 *  - scope CSS bajo .vm-root (ver styles/v2/volta-macrocycle.css)
 *  - removido ReactDOM.createRoot(...).render(<App/>) leftover
 *  - removido `useEffect` import (no se usa en source)
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { api } from '../../lib/api';
import { useNav } from '../../context/NavigationContext';
import '../../styles/v2/volta-macrocycle.css';

// ============================================================
// Types
// ============================================================
type BlockState = 'done' | 'current' | 'future';

interface BlockPoint { k: string; v: string }
interface Block {
  name: string;
  weeks: [number, number];
  state: BlockState;
  desc: string;
  pts: BlockPoint[];
}

interface KpiVolume    { v: number; u: string; delta: number; label: string }
interface KpiIntensity { v: number; u: string; delta: number; label: string; flat?: boolean }
interface KpiAdherence { v: number; u: string; pct: number;  label: string }
interface Kpis {
  volume:    KpiVolume;
  intensity: KpiIntensity;
  adherence: KpiAdherence;
}

interface NextSession {
  when: string;
  type: string;
  title: string;
}

interface Athlete {
  name: string;
  avatar: string;
  level: string;
  flag: string;
}

interface Domain {
  k: string;
  label: string;
  pct: number;
  c: string;
  spark: number[];
  weakest?: boolean;
}

interface MacrocycleData {
  athlete: Athlete;
  currentWeek: number;
  currentBlockIndex: number;
  blocks: Block[];
  kpis: Kpis;
  nextSession: NextSession;
  domains: Domain[];
}

// ============================================================
// Mock data · API: GET /v1/volta/macrocycle/me
// ============================================================
const mockMacrocycle: MacrocycleData = {
  athlete: { name: 'MARCO V.', avatar: 'MV', level: 'RX', flag: '🇨🇱' },
  currentWeek: 5,
  currentBlockIndex: 2,
  blocks: [
    { name: 'FUERZA BASE',     weeks: [1, 2],   state: 'done',
      desc: 'Construcción de fuerza máxima · 3 sesiones / semana · 70-85% 1RM.',
      pts: [{ k:'RIR', v:'2-3' }, { k:'VOL', v:'+12%' }, { k:'PR', v:'BS · DL' }] },
    { name: 'POTENCIA',        weeks: [3, 4],   state: 'done',
      desc: 'Trabajo de potencia · cleans · push-press · sprints.',
      pts: [{ k:'RIR', v:'1-2' }, { k:'VOL', v:'-8%' }, { k:'PR', v:'PC · Sprint' }] },
    { name: 'AERÓBICO',        weeks: [5, 6],   state: 'current',
      desc: 'Capacidad aeróbica · MetCon 18-25min · zona 2-3 · acumulación.',
      pts: [{ k:'RPE', v:'6-7' }, { k:'TIME', v:'247min' }, { k:'Z2-3', v:'72%' }] },
    { name: 'ESPECIALIZACIÓN', weeks: [7, 8],   state: 'future',
      desc: 'Foco en debilidades + skills · Front Squat + Gimnasia.',
      pts: [{ k:'PRI', v:'GYM' }, { k:'VOL', v:'+15%' }, { k:'INT', v:'85-92%' }] },
    { name: 'COMPETITIVO',     weeks: [9, 10],  state: 'future',
      desc: 'Pre-Open · simulacros · open WODs históricos.',
      pts: [{ k:'INT', v:'95%+' }, { k:'WODS', v:'Open' }, { k:'TAP', v:'parc' }] },
    { name: 'DELOAD',          weeks: [11, 12], state: 'future',
      desc: 'Tapering · descarga · técnica · recuperación activa.',
      pts: [{ k:'VOL', v:'-40%' }, { k:'INT', v:'70%' }, { k:'REC', v:'+++' }] },
  ],
  kpis: {
    volume:    { v: 247, u: 'min', delta: 18, label: 'VOLUMEN SEM.' },
    intensity: { v: 6.8, u: '',    delta: 0,  label: 'RPE PROM.', flat: true },
    adherence: { v: 6,   u: '/7',  pct: 86,   label: 'ADHERENCIA' },
  },
  nextSession: {
    when: 'Mañana · 18:00',
    type: 'MetCon · 22 min',
    title: 'Fran-style · 21-15-9',
  },
  domains: [
    { k:'AER', label:'Aerobic Cap',   pct:78, c:'#00E5FF', spark:[3,4,5,4,6,7,7,8,7,8,9,9] },
    { k:'STR', label:'Strength',      pct:62, c:'#F472B6', spark:[8,9,8,7,5,5,4,4,5,4,5,5] },
    { k:'GYM', label:'Gymnastics',    pct:54, c:'#A855F7', spark:[5,5,6,5,4,5,5,4,4,5,5,5] },
    { k:'OLY', label:'Olympic Lift',  pct:71, c:'#FFB300', spark:[6,7,7,8,6,5,6,5,6,7,6,7] },
    { k:'STM', label:'Stamina',       pct:68, c:'#22C55E', spark:[4,4,5,5,6,7,7,7,6,7,7,7] },
    { k:'PWR', label:'Power',         pct:58, c:'#FF6B35', spark:[6,7,7,8,5,4,5,4,4,4,5,5] },
    { k:'MOB', label:'Mobility',      pct:42, c:'#94A3B8', spark:[3,4,4,4,4,3,3,4,4,4,3,4],
      weakest: true },
  ],
};

// ============================================================
// Icons
// ============================================================
const ICONS: Record<string, ReactElement> = {
  bell:    <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  layers:  <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  play:    <polygon points="6 3 20 12 6 21 6 3"/>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  arrow:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  flame:   <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
  dumbbell:<><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></>,
  star:    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  zap:     <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  target:  <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  trend:   <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  stretch: <><path d="M9 4v6"/><path d="M9 14v6"/><path d="M15 4v6"/><path d="M15 14v6"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/></>,
  arrowR:  <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
};

function Icon({ name, size = 14, stroke = 1.7, style, className }: {
  name: keyof typeof ICONS; size?: number; stroke?: number; style?: CSSProperties; className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

// ============================================================
// ZONE A · HEADER
// ============================================================
function Header({ data, source }: { data: MacrocycleData; source: 'backend' | 'fallback' }) {
  return (
    <header className="vm-header" role="banner">
      <div className="vm-h-top">
        <div className="vm-h-id">
          <div className="vm-avatar" aria-label="avatar">{data.athlete.avatar}</div>
          <div className="vm-h-meta">
            <div className="vm-h-name">{data.athlete.name}</div>
            <div className="vm-h-level">
              <span className="lv">{data.athlete.level}</span>
              <span>·</span>
              <span className="flag">{data.athlete.flag}</span>
              <span>VOLTA</span>
              <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 9, opacity: 0.6 }}>
                · {source === 'backend' ? 'live' : 'offline'}
              </span>
            </div>
          </div>
        </div>
        <button className="vm-h-drawer" aria-label="Ver plan completo">
          PLAN ✦
        </button>
      </div>

      <span className="vm-block-badge">
        <span className="pip"/>
        BLOQUE <span className="n">{data.currentBlockIndex + 1}</span> / 6 · {data.blocks[data.currentBlockIndex].name}
      </span>

      <div className="vm-weeks" role="progressbar"
           aria-valuemin={1} aria-valuemax={12} aria-valuenow={data.currentWeek}
           aria-label={`Semana ${data.currentWeek} de 12`}>
        {Array.from({ length: 12 }, (_, i) => {
          const w = i + 1;
          const state: 'past' | 'current' | 'future' =
            w < data.currentWeek ? 'past'
            : w === data.currentWeek ? 'current'
            : 'future';
          return <span key={w} className="wk" data-state={state}
                       title={`Semana ${w} · ${state}`}/>;
        })}
      </div>
    </header>
  );
}

// ============================================================
// ZONE B · HERO CARD
// ============================================================
function HeroCard({ data, onLongPress }: { data: MacrocycleData; onLongPress?: () => void }) {
  const block = data.blocks[data.currentBlockIndex];
  const { kpis, nextSession } = data;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    pressTimer.current = setTimeout(() => onLongPress?.(), 600);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <section className="vm-hero"
             onPointerDown={startPress}
             onPointerUp={cancelPress}
             onPointerLeave={cancelPress}
             onContextMenu={(e) => { e.preventDefault(); onLongPress?.(); }}
             aria-label="Bloque actual">
      <span className="br-bl"/><span className="br-br"/>

      <div className="vm-hero-head">
        <div>
          <div className="vm-hero-eyebrow">BLOQUE ACTIVO</div>
          <h2 className="vm-hero-title">
            {block.name} <span className="s">S{data.currentWeek}</span>
          </h2>
        </div>
        <span className="vm-hero-tag">
          <Icon name="zap" size={9} stroke={2}/> EN CURSO
        </span>
      </div>

      <div className="vm-kpis">
        <div className="vm-kpi">
          <div className="k">{kpis.volume.label}</div>
          <div className="v">
            {kpis.volume.v}<span className="u">{kpis.volume.u}</span>
          </div>
          <div className="d up">
            <Icon name="trend" size={10}/> +{kpis.volume.delta} vs S{data.currentWeek - 1}
          </div>
        </div>

        <div className="vm-kpi">
          <div className="k">{kpis.intensity.label}</div>
          <div className="v">{kpis.intensity.v.toFixed(1)}</div>
          <div className="d flat">→ estable</div>
        </div>

        <div className="vm-kpi">
          <div className="k">{kpis.adherence.label}</div>
          <div className="v">
            {kpis.adherence.v}<span className="u">{kpis.adherence.u}</span>
          </div>
          <div className="d up">{kpis.adherence.pct}%</div>
          <div className="vm-kpi-ring"
               style={{
                 background: `conic-gradient(var(--engine-oly) ${kpis.adherence.pct}%, rgba(255,255,255,0.08) 0)`,
                 filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.35))',
               }}>
            <div style={{
              position:'absolute', inset:'3px', borderRadius:'50%',
              background:'rgba(0,0,0,0.65)',
            }}/>
            <span className="num" style={{position:'relative', zIndex:1}}>{kpis.adherence.pct}</span>
          </div>
        </div>
      </div>

      <div className="vm-next">
        <div className="vm-next-row">
          <div className="vm-next-info">
            <span className="vm-next-label">
              <Icon name="clock" size={9}/> PRÓXIMA SESIÓN
            </span>
            <div className="vm-next-title">{nextSession.title}</div>
            <div className="vm-next-when">{nextSession.when} · {nextSession.type}</div>
          </div>
          <button className="vm-cta-wod" aria-label="Ver detalle WOD">
            VER WOD <Icon name="arrowR" size={12} stroke={2.2}/>
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ZONE C · TIMELINE 6 BLOCKS
// ============================================================
const STATE_LABELS: Record<BlockState, { sym: string; label: string }> = {
  done:    { sym: '✓', label: 'DONE' },
  current: { sym: '▶', label: 'AHORA' },
  future:  { sym: '◌', label: 'FUTURO' },
};

function Timeline({ blocks, expandedIdx, setExpanded }: {
  blocks: Block[];
  currentIdx: number;
  expandedIdx: number | null;
  setExpanded: (i: number | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = Math.max(0, Math.min(blocks.length - 1, i + dir));
      const el = trackRef.current?.children[next] as HTMLElement | undefined;
      el?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded(expandedIdx === i ? null : i);
    }
  };

  return (
    <>
      <div className="vm-section-head">
        <h3>Macrociclo · 6 bloques</h3>
        <span className="meta">12 sem · ← → nav</span>
      </div>
      <div className="vm-timeline" ref={trackRef}
           role="tablist" aria-label="Bloques del macrociclo">
        {blocks.map((b, i) => (
          <div key={i}
               className="vm-block"
               data-state={b.state}
               tabIndex={0}
               role="tab"
               aria-selected={expandedIdx === i}
               aria-label={`Bloque ${i + 1}: ${b.name}, semanas ${b.weeks.join('-')}, ${STATE_LABELS[b.state].label}`}
               onClick={() => setExpanded(expandedIdx === i ? null : i)}
               onKeyDown={(e) => onKey(e, i)}>
            <div className="vm-block-num">{i + 1}</div>
            <div className="vm-block-name">{b.name}</div>
            <div className="vm-block-weeks">S{b.weeks[0]}-S{b.weeks[1]}</div>
            <div className="vm-block-status">
              <span className="sym" aria-hidden="true">{STATE_LABELS[b.state].sym}</span>
              {STATE_LABELS[b.state].label}
            </div>
          </div>
        ))}
      </div>
      {expandedIdx !== null && (
        <BlockDetail
          block={blocks[expandedIdx]}
          idx={expandedIdx}
          onClose={() => setExpanded(null)}/>
      )}
    </>
  );
}

function BlockDetail({ block, idx, onClose }: { block: Block; idx: number; onClose: () => void }) {
  const color = block.state === 'current' ? 'var(--color-tactical-amber)'
              : block.state === 'done'    ? 'var(--engine-oly)'
              : 'var(--text-mid)';
  return (
    <div className="vm-block-detail" style={{ ['--c' as string]: color } as CSSProperties}>
      <div className="head">
        <span>BLOQUE {idx + 1} · {block.name} · S{block.weeks[0]}-S{block.weeks[1]}</span>
        <span className="close" onClick={onClose} aria-label="Cerrar">×</span>
      </div>
      <p className="desc">{block.desc}</p>
      <div className="pts">
        {block.pts.map((p, i) => (
          <div key={i} className="pt">
            <span className="k">{p.k}</span>
            <span className="v">{p.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ZONE D · DOMINIOS BENTO
// ============================================================
const DOMAIN_ICON: Record<string, keyof typeof ICONS> = {
  AER: 'flame', STR: 'dumbbell', GYM: 'star',
  OLY: 'zap',   STM: 'target',   PWR: 'trend',
  MOB: 'stretch',
};

function Domains({ domains, currentWeek }: { domains: Domain[]; currentWeek: number }) {
  return (
    <>
      <div className="vm-section-head">
        <h3>Dominios · este macrociclo</h3>
        <span className="meta">7 áreas · spark 12sem</span>
      </div>
      <div className="vm-domains">
        {domains.map(d => {
          const max = Math.max(...d.spark);
          return (
            <div key={d.k} className="vm-dom"
                 data-weakest={d.weakest || undefined}
                 style={{ ['--c' as string]: d.c } as CSSProperties}
                 aria-label={`${d.label}: ${d.pct}% cubierto`}>
              <div className="vm-dom-head">
                <span className="vm-dom-name">
                  <Icon name={DOMAIN_ICON[d.k] ?? 'star'} size={11} stroke={1.8} className="ic"/>
                  {d.k}
                </span>
                <span className="vm-dom-pct">
                  {d.pct}<span className="u">%</span>
                </span>
              </div>
              <div className="vm-dom-bar">
                <div className="fill" style={{ width: `${d.pct}%` }}/>
              </div>
              <div className="vm-dom-spark" aria-hidden="true">
                {d.spark.map((s, i) => {
                  const h = Math.max(8, (s / max) * 100);
                  const isFuture = i + 1 > currentWeek;
                  const isNow = i + 1 === currentWeek;
                  return (
                    <span key={i}
                          className={`bar ${isFuture ? 'future' : ''} ${isNow ? 'now' : ''}`}
                          style={{ height: `${h}%` }}/>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// MODAL · solicitar ajuste
// ============================================================
function AdjustModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="vm-modal-scrim" onClick={onClose}>
      <div className="vm-modal" onClick={(e) => e.stopPropagation()}>
        <h4>Solicitar ajuste al coach</h4>
        <p>¿Hay algo del bloque actual que querés revisar? Tu coach lo recibe en su panel.</p>
        <textarea placeholder="Volumen demasiado alto · me cuesta recuperar entre sesiones..."/>
        <div className="vm-modal-actions">
          <button className="cancel" onClick={onClose}>Cancelar</button>
          <button className="ok" onClick={onClose}>Enviar a coach</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main
// ============================================================
export default function VoltaMacrocycleV2() {
  const { navigate, back, canGoBack } = useNav();
  const onBack = () => (canGoBack ? back() : navigate('VOLTA_HOME'));
  const [backendData, setBackendData] = useState<Record<string, unknown> | null>(null);
  const [source, setSource] = useState<'backend' | 'fallback'>('fallback');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Fetch macro activo Volta · GET /v1/macrocycles/me/active?product=volta.
  // Si responde OK · merge sobre mock. Si 404/500 · mock display intacto.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Record<string, unknown>>('/v1/macrocycles/me/active?product=volta');
        if (cancelled) return;
        if (res) {
          setBackendData(res);
          setSource('backend');
        }
      } catch {
        if (!cancelled) setSource('fallback');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Merge superficial · backend campos posibles (currentWeek, currentBlockIndex) sobre mock.
  // Si backend shape distinto · cae a mock. UI nunca rompe.
  const data: MacrocycleData = useMemo(() => {
    if (!backendData) return mockMacrocycle;
    const b = backendData as Record<string, unknown>;
    const cw = (b.current_week ?? b.currentWeek) as number | undefined;
    const cbi = (b.current_block_index ?? b.currentBlockIndex) as number | undefined;
    return {
      ...mockMacrocycle,
      currentWeek: typeof cw === 'number' ? cw : mockMacrocycle.currentWeek,
      currentBlockIndex: typeof cbi === 'number' ? cbi : mockMacrocycle.currentBlockIndex,
    };
  }, [backendData]);

  const [expandedIdx, setExpanded] = useState<number | null>(data.currentBlockIndex);

  return (
    <div className="vm-root">
      <button onClick={onBack} aria-label="Volver"
              style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: 22, lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit' }}>‹</button>
      <Header data={data} source={source}/>
      <div className="vm-scroll">
        <HeroCard data={data} onLongPress={() => setModalOpen(true)}/>
        <Timeline
          blocks={data.blocks}
          currentIdx={data.currentBlockIndex}
          expandedIdx={expandedIdx}
          setExpanded={setExpanded}/>
        <Domains domains={data.domains} currentWeek={data.currentWeek}/>
      </div>
      <AdjustModal open={modalOpen} onClose={() => setModalOpen(false)}/>
    </div>
  );
}

// @ts-nocheck — design import from Claude Design (custom element <plate-3d> + CSS-var inline styles)
/* ============================================================
   PEAK QUAL · COACH DASHBOARD · V2 (dark)
   Wired to REAL data (AthleteContext + Banister stress engine).
   Renders as plain content INSIDE PhoneLayout (frame/status-bar/
   bottom-nav are provided by the layout — no device chrome here).
   ============================================================ */

import React, { useMemo, useState } from 'react';
import '../../styles/v2/coach-dash.css';
import '../../lib/web-components'; // registra <plate-3d> (custom element usado en cards/header)
import { useNav } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useAthlete } from '../../context/AthleteContext';
import { useRosterStress, fallbackReadiness } from '../../hooks/useAthleteStress';
import { getWeekPlan } from '../../data/macroDetail';
import type { AthleteProfile } from '../../data/athletes';

/* ---------- Lucide icons ---------- */
const ICONS = {
  bell:      <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  warn:      <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  arrowR:    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  cal:       <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  pkg:       <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  wrench:    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>,
  bolt:      <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  barbell:   <><path d="M2 12h2"/><path d="M20 12h2"/><path d="M5 9v6"/><path d="M19 9v6"/><path d="M8 7v10"/><path d="M16 7v10"/><path d="M8 12h8"/></>,
  weight:    <circle cx="12" cy="12" r="9"/>,
  kettle:    <><path d="M14 6h-4l-2 3v4a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4V9z"/><path d="M10 4h4"/><path d="M10 4a2 2 0 0 0-2 2v0"/><path d="M14 4a2 2 0 0 1 2 2v0"/></>,
  rower:     <><line x1="4" y1="12" x2="20" y2="12"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/><path d="M9 9l-2 3 2 3"/><path d="M15 9l2 3-2 3"/></>,
};

function Icon({ name, size = 18, stroke = 1.5, className = '', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

/* ---------- Tier color / name (derived OVR tiers · no belt data in roster) ---------- */
const TIER_COLOR = {
  '0': '#F5F5F7', '1': '#22C55E', '2': '#FBBF24',
  '3': '#3B82F6', '4': '#EF4444',
};

/* ============================================================
   REAL DATA MAPPING
   ------------------------------------------------------------
   The roster + readiness come straight from AthleteContext and the
   Banister stress engine (same sources CommandCenter consumes).
   Fields the V2 card shows that have NO first-class source in the
   data model (OVR, the 6 FIFA-style sub-stats, the belt tier) are
   DERIVED deterministically from real signals (maxes, readiness,
   session adherence, sleep, soreness, motivation) so they move with
   real data instead of being invented. Marked clearly below.
   ============================================================ */

const clamp = (v: number, lo = 0, hi = 99) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Triage bucket (red/amber/green) from real status, mirrors CommandCenter logic. */
function triageStatus(a: AthleteProfile, readiness: number): 'red' | 'amber' | 'green' {
  const injured = !!(a.injuries && a.injuries.length > 0);
  const ratio = a.prior_fatigue / Math.max(a.prior_fitness, 1);
  // critical: injury, very low readiness, or fatigue clearly outrunning fitness
  if (injured || readiness < 4 || ratio > 0.95) return 'red';
  // watch: moderate readiness, rising fatigue, or weak input adherence
  const completed = a.sessions_last_7.filter(s => s.completed).length;
  const planned = Math.max(1, a.sessions_last_7.length);
  const adherence = completed / planned;
  if (readiness < 6.5 || ratio > 0.8 || adherence < 0.4) return 'amber';
  return 'green';
}

/** OVR 0-99 from real fitness + readiness + max-strength signal (derived). */
function deriveOvr(a: AthleteProfile, readiness: number): number {
  // strength signal: snatch+clean+jerk relative to bodyweight (Sinclair-ish, capped)
  const bw = Math.max(40, a.maxes.body_weight || 70);
  const total = (a.maxes.snatch || 0) + (a.maxes.clean || 0) + (a.maxes.jerk || 0);
  const strRatio = total / bw;                  // ~3-7 typical
  const strScore = clamp((strRatio / 7) * 100); // 0-99
  const fitScore = clamp(a.prior_fitness * 1.15);
  const readyScore = clamp(readiness * 10);
  // weighted blend, never below a floor so new athletes don't read as 0
  return clamp(strScore * 0.4 + fitScore * 0.4 + readyScore * 0.2, 40, 99);
}

/** Belt tier 0-4 from OVR buckets (derived — roster has no belt_idx). */
function ovrToTier(ovr: number): '0' | '1' | '2' | '3' | '4' {
  if (ovr >= 86) return '4';
  if (ovr >= 78) return '3';
  if (ovr >= 70) return '2';
  if (ovr >= 60) return '1';
  return '0';
}

/** 6 métricas de engine / "cómo está HOY el atleta": readiness, sueño, CNS,
 *  recuperación, ánimo y carga. Derivadas del engine Banister + el check-in
 *  de HOY (última sesión) en vez de ratings de habilidad estáticos — así el
 *  coach ve el estado del día, no un OVR fijo. */
function deriveStats(a: AthleteProfile, engine, readiness: number) {
  const sessions = a.sessions_last_7;
  const done = sessions.filter(s => s.completed);
  const last = sessions.at(-1);
  const avg = (sel: (s: typeof sessions[number]) => number, fb: number) =>
    done.length ? done.reduce((s, x) => s + sel(x), 0) / done.length : fb;

  // Señales del check-in de HOY (última sesión) con fallback al promedio reciente.
  const sleep      = last?.sleep_hours ?? avg(s => s.sleep_hours, 7);
  const soreness   = last?.soreness    ?? avg(s => s.soreness, 4);
  const motivation = last?.motivation  ?? avg(s => s.motivation, 7);
  const fitness    = engine?.fitness ?? a.prior_fitness;
  const fatigue    = engine?.fatigue ?? a.prior_fatigue;
  const cns        = engine?.cns_score;

  return {
    RDY: clamp(readiness * 10),                              // readiness (engine Banister)
    SUE: clamp((sleep / 8) * 100),                           // pts por sueño · anoche vs 8h
    CNS: clamp(cns != null ? cns : readiness * 10),          // frescura del SNC (engine)
    REC: clamp(((10 - soreness) / 9) * 100),                 // recuperación · inverso soreness
    MOT: clamp(motivation * 10),                             // ánimo / motivación
    CRG: clamp(100 - (fatigue / Math.max(fitness, 1)) * 60), // carga · frescura fitness:fatiga
  };
}

/** Human-readable note from real signals (injury > stale check-in > readiness). */
function deriveNote(a: AthleteProfile, status: string, readiness: number, cnsZone: string | null): string {
  if (a.injuries && a.injuries.length > 0) return a.injuries[0];
  const lastDone = [...a.sessions_last_7].reverse().find(s => s.completed);
  if (!lastDone && a.sessions_last_7.length > 0) return 'Sin check-in reciente · contactar';
  if (status === 'red') return `Readiness ${readiness.toFixed(1)} · revisar carga`;
  if (status === 'amber') return cnsZone ? `CNS ${cnsZone} · monitorear` : `Readiness ${readiness.toFixed(1)} · monitorear`;
  const todayNote = a.sessions_last_7.at(-1)?.notes;
  return todayNote || a.macrocycle.focus || 'Listo para entrenar';
}

function initialsOf(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase();
}

/* ============================================================
   COMPONENTS
   ============================================================ */

function Header({ coachName, count }: { coachName: string; count: number }) {
  return (
    <header className="cd-header">
      <div className="cd-header-left">
        <div className="cd-h-mark"><plate-3d tier="4" size="32"/></div>
        <div>
          <div className="cd-h-name">Box Comando</div>
          <div className="cd-h-sub">{coachName}</div>
        </div>
        <span className="cd-h-chip">
          <Icon name="users" size={12} stroke={1.8}/> {count} atletas
        </span>
      </div>
      <div className="cd-h-right">
        <button className="cd-h-btn" aria-label="Notificaciones"><Icon name="bell" size={18}/><span className="dot"/></button>
        <button className="cd-h-btn" aria-label="Ajustes"><Icon name="settings" size={18}/></button>
      </div>
    </header>
  );
}

function TriageStrip({ counts, filter, setFilter }) {
  const cards = [
    { k:'red',   label:'CRÍTICO', c:'var(--engine-pulse)', count:counts.red,
      desc:'Lesión · fatiga · sin input' },
    { k:'amber', label:'WATCH',   c:'var(--engine-macro)', count:counts.amber,
      desc:'Carga alta · readiness medio' },
    { k:'green', label:'OK',      c:'var(--engine-oly)',   count:counts.green,
      desc:'Listos para entrenar' },
  ];

  return (
    <div className="cd-triage">
      {cards.map(card => (
        <div key={card.k}
             className="cd-tri-card"
             data-active={filter === card.k}
             style={{ '--c': card.c }}
             onClick={() => setFilter(filter === card.k ? null : card.k)}>
          <span className="br"/><span className="br br-r"/>
          <div className="cd-tri-eyebrow">
            <span className="pip"/>{card.label}
          </div>
          <div className="cd-tri-num">{card.count}</div>
          <div className="cd-tri-desc">{card.desc}</div>
        </div>
      ))}
    </div>
  );
}

function AlertsBanner({ alerts, onResolve }) {
  if (alerts.length === 0) {
    return (
      <div className="cd-alerts" data-empty="true">
        <div className="cd-alerts-head">
          <Icon name="warn" size={11} stroke={2}/> ALERTAS · 0 críticas
        </div>
        <div className="cd-alert-empty">Sin alertas críticas · roster estable</div>
      </div>
    );
  }
  return (
    <div className="cd-alerts">
      <div className="cd-alerts-head">
        <Icon name="warn" size={11} stroke={2}/> ALERTAS · {alerts.length} críticas
      </div>
      {alerts.map((a) => (
        <div key={a.id} className="cd-alert" onClick={() => onResolve(a.id)}>
          <span className="br br-tl"/><span className="br br-tr"/>
          <Icon name="warn" size={16} stroke={2} className="cd-alert-icon"/>
          <div className="cd-alert-body">
            <div className="cd-alert-name">
              {a.who}<span className="sep">·</span>{a.why}
            </div>
            <div className="cd-alert-meta">{a.detail}</div>
          </div>
          <span className="cd-alert-cta">RESOLVER →</span>
        </div>
      ))}
    </div>
  );
}

function MacroHero({ macro, programCount, onAssign }) {
  const total = Math.max(1, macro.total_weeks || 12);
  const current = Math.max(0, Math.min(total, macro.week || 0));
  const peakAt = Math.max(1, Math.round(total * 0.7)); // peak ~70% through block (derived marker)
  return (
    <div className="cd-macro">
      <span className="br br-tl"/><span className="br br-tr"/>
      <div className="cd-macro-eyebrow">
        <Icon name="cal" size={11} stroke={2}/> MACROCICLO ACTIVO
      </div>
      <div>
        <div className="cd-macro-title">{macro.program_name}</div>
        <div className="cd-macro-sub">Sem {current}/{total} · {macro.focus}</div>
      </div>
      <div className="cd-macro-bar">
        {Array.from({length: total}, (_, i) => {
          const w = i + 1;
          const isOn = w <= current;
          const isPeak = w === peakAt;
          return (
            <div key={w} className={`tk ${isOn ? 'on' : ''} ${isPeak ? 'peak' : ''}`}>
              <span className="tk-label">{w}</span>
            </div>
          );
        })}
        <span className="flag" style={{ left: `${((peakAt - 0.5) / total) * 100}%` }}/>
      </div>
      <div className="cd-macro-foot">
        <div className="info">
          <strong>{programCount} programa{programCount === 1 ? '' : 's'}</strong> · roster activo
        </div>
        <button className="cd-macro-btn" onClick={onAssign}>
          ASIGNAR <Icon name="arrowR" size={12} stroke={2}/>
        </button>
      </div>
    </div>
  );
}

function AthleteCard({ a, onClick }) {
  const tColor = TIER_COLOR[a.tier];
  return (
    <div className="athlete" data-status={a.status} onClick={onClick}>
      <span className="status-dot"/>
      <div className="athlete-rank">
        <div className="athlete-ovr-lbl">OVR</div>
        <div className="athlete-ovr">{a.ovr}</div>
        <div className="athlete-tier-row">
          <plate-3d tier={a.tier} size="32"/>
          <div className="athlete-tier-name" style={{ '--tc': tColor }}>T{a.tier}</div>
        </div>
      </div>
      <div className="athlete-id">
        <div className="athlete-avatar">{a.avatar}</div>
        <div>
          <div className="athlete-name">{a.name}</div>
          <div className="athlete-spec">{a.spec}</div>
        </div>
        <div className="athlete-note">{a.note}</div>
      </div>
      <div className="athlete-stats">
        {Object.entries(a.stats).map(([k, v]) => {
          const glow = v >= 85 ? 'high' : v <= 40 ? 'low' : null;
          return (
            <div key={k} className="stat" data-glow={glow}>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
              <div className="bar"><div className="fill" style={{ width: `${v}%` }}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Roster({ list, onOpen }) {
  if (list.length === 0) {
    return <div className="cd-roster-empty">No hay atletas en este filtro.</div>;
  }
  return (
    <div className="cd-roster-grid">
      {list.map(a => <AthleteCard key={a.id} a={a} onClick={() => onOpen(a.id)}/>)}
    </div>
  );
}

/* Week WODs · derivado del macro dominante del roster (getWeekPlan): los tipos
   de día y su intensidad salen de la escuela + frecuencia reales del macro
   (Búlgaro = todo intensidad, Cubano = técnica-heavy, etc.). El marcador "hoy"
   sigue el día real de la semana. */
function WeekWods({ programId }: { programId?: string | null }) {
  const plan = getWeekPlan(programId ?? null);
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Lun-first
  return (
    <div className="cd-week">
      {plan.map((day, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const isToday = d.toDateString() === today.toDateString();
        return (
          <div key={i} className="day-chip" data-today={isToday} data-rest={day.rest}>
            <div className="day-name">{day.dow}</div>
            <div className="day-num">{d.getDate()}</div>
            <div className="day-type">{day.label}</div>
            {!day.rest && (
              <div className="day-int">
                {[1,2,3,4,5].map(j => (
                  <span key={j} className={`b ${j <= day.intensity ? 'on' : ''}`}/>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Inventory · OCUPACIÓN del box HOY derivada del roster: cuántos atletas entrenan
   hoy (según el plan semanal de SU macro) marca el equipamiento en uso. La
   CAPACIDAD es config del box (no hay censo de equipamiento real → default
   razonable; si se quiere exacto, es una fuente a conseguir). La ocupación SÍ
   se mueve con el roster/macro real. */
const BOX_EQUIPMENT = [
  { icon:'barbell', name:'Barras OLY',  cap:12,  per:(n:number) => n },                // 1 barra / atleta
  { icon:'pkg',     name:'Plataformas', cap:8,   per:(n:number) => n },                // 1 plataforma / atleta
  { icon:'weight',  name:'Bumpers (kg)',cap:600, per:(n:number) => n * 90 },           // ~90 kg discos / atleta
  { icon:'wrench',  name:'Racks',       cap:6,   per:(n:number) => Math.ceil(n / 2) }, // 1 rack / 2 atletas
  { icon:'kettle',  name:'Accesorios',  cap:24,  per:(n:number) => n * 2 },            // KB / bandas / accesorios
];

function InventoryStrip({ roster }: { roster: AthleteProfile[] }) {
  const todayMonIdx = (new Date().getDay() + 6) % 7; // Lun=0 … Dom=6
  const trainingToday = roster.filter(
    a => !getWeekPlan(a.macrocycle?.program_id ?? null)[todayMonIdx].rest,
  ).length;
  return (
    <div className="cd-inv">
      {BOX_EQUIPMENT.map((it, i) => {
        const inUse = Math.min(it.cap, it.per(trainingToday));
        const pct = Math.round((inUse / it.cap) * 100);
        const status = pct >= 85 ? 'amber' : pct >= 50 ? 'cyan' : 'green';
        return (
          <div key={i} className="inv-card" data-status={status}>
            <div className="inv-name">
              <Icon name={it.icon} size={12} stroke={1.8} className="ic"/>
              {it.name}
            </div>
            <div>
              <div className="inv-val">
                {inUse}<span className="total">/{it.cap}</span>
              </div>
              <div className="inv-pct">{pct}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionsFab({ onAction }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { icon:'bolt',   label:'Nuevo atleta',       view:'NEW_ATHLETE' },
    { icon:'cal',    label:'Asignar macrocycle', view:'ASSIGN_MACRO' },
    { icon:'pkg',    label:'Ver macrociclo',     view:'COACH_MACRO_VIEW' },
    { icon:'wrench', label:'Stats del club',     view:'COACH_STATS' },
  ];
  return (
    <>
      <div className="cd-scrim" data-open={open} onClick={() => setOpen(false)}/>
      <div className="cd-actions" data-open={open}>
        {actions.map((a, i) => (
          <button key={i} className="cd-action"
                  onClick={() => { setOpen(false); onAction(a.view); }}>
            <span className="ic"><Icon name={a.icon} size={14} stroke={1.8}/></span>
            {a.label}
          </button>
        ))}
      </div>
      <button className="cd-fab" data-open={open}
              onClick={() => setOpen(o => !o)}
              aria-label="Acciones">
        <Icon name="plus" size={24} stroke={2.2}/>
      </button>
    </>
  );
}

/* ============================================================
   SCREEN
   ============================================================ */

function CoachDashV2() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { allAthletes, selectAthlete } = useAthlete();
  const { stressByAthlete } = useRosterStress(allAthletes);
  const [filter, setFilter] = useState<'red' | 'amber' | 'green' | null>(null);

  // Enrich real roster with engine readiness + derived V2 card fields.
  const cards = useMemo(() => allAthletes.map(a => {
    const engine = stressByAthlete[a.id];
    const readiness = engine ? engine.readiness : fallbackReadiness(a);
    const cnsZone = engine?.cns_zone ?? null;
    const status = triageStatus(a, readiness);
    const ovr = deriveOvr(a, readiness);
    return {
      id: a.id,
      name: a.name.toUpperCase(),
      spec: `${a.weight_class} · ${a.macrocycle.focus}`,
      avatar: initialsOf(a.name),
      tier: ovrToTier(ovr),
      ovr,
      status,
      note: deriveNote(a, status, readiness, cnsZone),
      stats: deriveStats(a, engine, readiness),
    };
  }), [allAthletes, stressByAthlete]);

  const counts = useMemo(() => ({
    red:   cards.filter(c => c.status === 'red').length,
    amber: cards.filter(c => c.status === 'amber').length,
    green: cards.filter(c => c.status === 'green').length,
  }), [cards]);

  const list = useMemo(
    () => (filter ? cards.filter(c => c.status === filter) : cards),
    [cards, filter],
  );

  // Real alerts = critical-status athletes (injury / low readiness / stale input).
  const alerts = useMemo(() => cards
    .filter(c => c.status === 'red')
    .map(c => ({
      id: c.id,
      who: c.name.split(' ')[0],
      why: c.note.length > 28 ? 'Atención requerida' : c.note,
      detail: c.note,
    })), [cards]);

  // Macro hero = dominant active macrocycle across the roster (most-used program).
  const { macro, programCount } = useMemo(() => {
    const withProgram = allAthletes.filter(a => a.macrocycle?.program_id);
    const programIds = new Set(withProgram.map(a => a.macrocycle.program_id));
    const freq: Record<string, number> = {};
    withProgram.forEach(a => { freq[a.macrocycle.program_id] = (freq[a.macrocycle.program_id] || 0) + 1; });
    const topId = Object.entries(freq).sort((x, y) => y[1] - x[1])[0]?.[0];
    const top = withProgram.find(a => a.macrocycle.program_id === topId);
    return {
      macro: top?.macrocycle ?? {
        program_name: 'Sin macrociclo activo', week: 0, total_weeks: 12, focus: 'Por definir',
      },
      programCount: programIds.size,
    };
  }, [allAthletes]);

  const coachName = user?.name ? `Coach ${user.name.split(' ')[0]}` : 'Coach';

  const openDetail = (id: string) => { selectAthlete(id); navigate('ATHLETE_DETAIL'); };

  return (
    <div className="coach-frame">
      <Header coachName={coachName} count={cards.length}/>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Triage</h3>
          <span className="meta">{cards.length} atletas · tap = filtrar</span>
        </div>
        <TriageStrip counts={counts} filter={filter} setFilter={setFilter}/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3 style={{color:'var(--engine-pulse)'}}>Alertas</h3>
          <span className="meta">acción inmediata</span>
        </div>
        {/* RESOLVER → ventana de entrenamiento del atleta (AthleteDeepDive incluye
            AthleteTrainingView, donde el coach aprueba/modifica el ajuste reportado). */}
        <AlertsBanner alerts={alerts} onResolve={openDetail}/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Macrociclo</h3>
          <span className="meta">activo · roster</span>
        </div>
        <MacroHero macro={macro} programCount={programCount} onAssign={() => navigate('ASSIGN_MACRO')}/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Roster</h3>
          <span className="meta">
            {filter ? `${list.length} · filtro ${filter.toUpperCase()}` : `${list.length} cards`}
            {filter && <span style={{marginLeft:8, color:'var(--engine-stress)', cursor:'pointer'}}
                            onClick={() => setFilter(null)}>· LIMPIAR</span>}
          </span>
        </div>
        <Roster list={list} onOpen={openDetail}/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Week WODs</h3>
          <span className="meta">7 días · {macro.program_name}</span>
        </div>
        <WeekWods programId={(macro as { program_id?: string }).program_id ?? null}/>
      </div>

      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Inventory</h3>
          <span className="meta">ocupación hoy</span>
        </div>
        <InventoryStrip roster={allAthletes}/>
      </div>

      <ActionsFab onAction={(view) => navigate(view)}/>
    </div>
  );
}

export default CoachDashV2;

/**
 * HolyOlyDetailV2 · Detalle Macrociclo Holy Oly · deep dive.
 *
 * Portado de claude_design_drops/2026-05-27_pkql_v2/holy-oly-detail.jsx
 * Cambios:
 *  - jsx → tsx con tipos
 *  - useNav para volver al catálogo
 *  - lee macrocycleId desde sessionStorage['ho:selectedMacroId'] (puesto por Catalog)
 *  - scope CSS bajo .hd-root
 *  - mock MACRO (Ruso Clásico 16s) por ahora · backend pendiente
 */
import { useState, type CSSProperties, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import '../../styles/v2/holy-oly-detail.css';

// ============================================================
// Types
// ============================================================
interface WeeklyEntry { w: number; imr: number; reps: number; meso: number; focus: string; current?: boolean }
interface Mesocycle { idx: number; name: string; weeks: [number, number]; imrRange: string; focus: string; desc: string; color: string }
interface Slot { slot: string; ex: string; pct: number; kg: number; base: string; plates: string }
interface Day { d: string; type: 'vol'|'med'|'int'|'act'|'tec'|'rec'; name: string; dur: number; tonelaje: number; slots: Slot[]; rpe: string }
interface WeekTypical { label: string; days: Day[] }
interface UserState { isActive: boolean; currentWeek: number; pctComplete: number; role: 'athlete'|'coach'; has1RM: boolean }
interface MacroData {
  id: string; name: string; family: string; schoolColor: string;
  duration: number; frequency: number;
  intensity: number; volume: number; recovery: number; difficulty: number;
  subtitle: string;
  weekly: WeeklyEntry[];
  mesocycles: Mesocycle[];
  weekTypical: WeekTypical;
  user: UserState;
}

// ============================================================
// Mock data · Ruso Clásico 16s
// API: GET /v1/macrocycles/ruso-clasico-16 + sessions
// ============================================================
const MACRO: MacroData = {
  id: 'ruso-clasico-16',
  name: 'RUSO CLÁSICO',
  family: 'RUSO',
  schoolColor: '#DC2626',
  duration: 16,
  frequency: 5,
  intensity: 4,
  volume: 5,
  recovery: 2,
  difficulty: 4,
  subtitle: '16 semanas · 5 días/semana · Escuela soviética',
  weekly: [
    { w:1,  imr:65, reps:320, meso:1, focus:'Introducción · técnica' },
    { w:2,  imr:68, reps:380, meso:1, focus:'Acumulación' },
    { w:3,  imr:70, reps:420, meso:1, focus:'Choque · pico Mes 1' },
    { w:4,  imr:60, reps:180, meso:1, focus:'Descarga' },
    { w:5,  imr:72, reps:430, meso:2, focus:'Fuerza máx' },
    { w:6,  imr:75, reps:460, meso:2, focus:'Acumulación 2' },
    { w:7,  imr:78, reps:490, meso:2, focus:'Choque Mes 2', current: true },
    { w:8,  imr:65, reps:200, meso:2, focus:'Descarga' },
    { w:9,  imr:82, reps:440, meso:3, focus:'SPP · especificidad' },
    { w:10, imr:85, reps:420, meso:3, focus:'Intensificación' },
    { w:11, imr:88, reps:380, meso:3, focus:'Pico Mes 3' },
    { w:12, imr:70, reps:160, meso:3, focus:'Descarga' },
    { w:13, imr:90, reps:280, meso:4, focus:'Peaking · singles' },
    { w:14, imr:92, reps:240, meso:4, focus:'Peaking 2' },
    { w:15, imr:85, reps:160, meso:4, focus:'Taper' },
    { w:16, imr:100, reps:120, meso:4, focus:'Test PR · 100%+' },
  ],
  mesocycles: [
    { idx:1, name:'PREPARACIÓN GENERAL', weeks:[1,4], imrRange:'65-70%', focus:'Acondicionamiento + técnica',
      desc:'Foco en variantes Muscle/Hang/Power + squat. Sienta la base aeróbica y técnica del macrociclo completo.',
      color:'meso-1' },
    { idx:2, name:'FUERZA / ACUMULACIÓN', weeks:[5,8], imrRange:'72-78%', focus:'Fuerza máxima + acumulación',
      desc:'Acumula fuerza máxima en sentadillas y tirones para transferir a clásicos en Mes 3. Trabajo cuasi-isométrico en pulls.',
      color:'meso-2' },
    { idx:3, name:'SPP / INTENSIFICACIÓN', weeks:[9,12], imrRange:'82-88%', focus:'Especificidad clásicos',
      desc:'Transferencia de la fuerza acumulada a Snatch y C&J completos. Singles y doubles en zona competitiva.',
      color:'meso-3' },
    { idx:4, name:'PEAKING / TEST', weeks:[13,16], imrRange:'85-100%+', focus:'Picos + test PR',
      desc:'Taper progresivo · sesiones cortas de alta intensidad · test de PRs olímpicos en última semana.',
      color:'meso-4' },
  ],
  weekTypical: {
    label: 'Semana 7 · Choque Mes 2',
    days: [
      { d:'LUN', type:'vol', name:'VOL · Volumen', dur:95, tonelaje:4250,
        slots:[
          { slot:'ARRANQUE', ex:'Muscle Snatch · 4×4', pct:50, kg:46,  base:'1RM Sn 92kg',  plates:'1🟢 1🟡 1🔵 (×2)' },
          { slot:'ENVIÓN',   ex:'Muscle Clean · 4×4',  pct:50, kg:57,  base:'1RM C&J 115kg', plates:'2🟢 1🟡 1🔵 (×2)' },
          { slot:'FUERZA',   ex:'Back Squat · 5×6',    pct:65, kg:120, base:'1RM BS 185kg', plates:'2🔴 1🟡 (×2)' },
        ], rpe:'6-7' },
      { d:'MAR', type:'tec', name:'TEC · Técnica',   dur:75, tonelaje:2100,
        slots:[
          { slot:'TÉCNICA', ex:'Snatch tirón hasta rodilla · 5×3', pct:55, kg:50, base:'1RM Sn 92kg', plates:'1🟡 1🟢 (×2)' },
        ], rpe:'5-6' },
      { d:'MIÉ', type:'int', name:'INT · Intensidad', dur:90, tonelaje:3800,
        slots:[
          { slot:'ARRANQUE', ex:'Snatch · 5×2',        pct:82, kg:75, base:'1RM Sn 92kg',  plates:'1🔴 1🔵 1🟢 (×2)' },
          { slot:'ENVIÓN',   ex:'Clean & Jerk · 5×1',  pct:85, kg:97, base:'1RM C&J 115kg', plates:'1🔴 1🔵 1🟡 (×2)' },
        ], rpe:'8-9' },
      { d:'JUE', type:'med', name:'MED · Mediano',   dur:80, tonelaje:3100,
        slots:[
          { slot:'ARRANQUE', ex:'Hang Snatch · 4×3',  pct:68, kg:62,  base:'1RM Sn 92kg',  plates:'1🔴 1🟢 (×2)' },
          { slot:'FRONT SQ', ex:'Front Squat · 4×4',  pct:75, kg:115, base:'1RM FS 155kg', plates:'2🔴 (×2)' },
        ], rpe:'7' },
      { d:'VIE', type:'act', name:'ACT · Activación', dur:60, tonelaje:1450,
        slots:[
          { slot:'CLÁSICOS', ex:'C&J Power · 3×2', pct:60, kg:69, base:'1RM C&J 115kg', plates:'1🟡 1🟢 (×2)' },
        ], rpe:'5' },
    ],
  },
  user: { isActive: true, currentWeek: 7, pctComplete: 44, role: 'athlete', has1RM: true },
};

const DAY_TYPES = [
  { t:'vol', lbl:'VOL', full:'Volumen sub-máx · RPE 6-7' },
  { t:'med', lbl:'MED', full:'Mediano · transferencia' },
  { t:'int', lbl:'INT', full:'Intensidad · zona competitiva' },
  { t:'act', lbl:'ACT', full:'Activación · cargas livianas' },
  { t:'tec', lbl:'TEC', full:'Técnica · barra vacía + variantes' },
  { t:'rec', lbl:'REC', full:'Recuperación activa · zona 1' },
];

const ICONS: Record<string, ReactElement> = {
  back:    <><polyline points="15 18 9 12 15 6"/></>,
  more:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  chev:    <polyline points="9 18 15 12 9 6"/>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  play:    <polygon points="6 3 20 12 6 21 6 3"/>,
  wave:    <path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4 6 6 0"/>,
  pyramid: <><polyline points="3 21 12 5 21 21"/><line x1="3" y1="21" x2="21" y2="21"/></>,
  pulse:   <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
  check:   <polyline points="20 6 9 17 4 12"/>,
};
function Icon({ name, size = 14, stroke = 1.8, style, className }: { name: keyof typeof ICONS; size?: number; stroke?: number; style?: CSSProperties; className?: string }) {
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
// Hero
// ============================================================
function Hero({ m, onBack }: { m: MacroData; onBack: () => void }) {
  return (
    <section className="hd-hero" style={{ ['--c-school' as string]: m.schoolColor } as CSSProperties}>
      <div className="hd-hero-top">
        <button className="hd-back" aria-label="Volver al catálogo" onClick={onBack}>
          <Icon name="back" size={12}/> CATÁLOGO
        </button>
        <button className="hd-kebab" aria-label="Menú">
          <Icon name="more" size={14}/>
        </button>
      </div>
      <span className="hd-fam-badge">{m.family}</span>
      <h1 className="hd-hero-title">{m.name}</h1>
      <div className="hd-hero-sub">{m.subtitle}</div>
      <div className="hd-hero-stats">
        <div className="hd-stat"><span className="k">Intens.</span><span className="v">{m.intensity}<span className="u">/5</span></span></div>
        <div className="hd-stat"><span className="k">Volumen</span><span className="v">{m.volume}<span className="u">/5</span></span></div>
        <div className="hd-stat"><span className="k">Recovery</span><span className="v">{m.recovery}<span className="u">/5</span></span></div>
        <div className="hd-stat"><span className="k">Dificultad</span><span className="v">{m.difficulty}<span className="u">/5</span></span></div>
      </div>
      {m.user.isActive && (
        <div className="hd-progress-banner">
          <span>SEM <strong>{m.user.currentWeek}</strong> / {m.duration}</span>
          <div className="bar"><div className="fill" style={{ width: `${m.user.pctComplete}%` }}/></div>
          <span><strong>{m.user.pctComplete}%</strong></span>
        </div>
      )}
    </section>
  );
}

// ============================================================
// Philosophy
// ============================================================
function Philosophy() {
  const cards = [
    { name: 'Waviness · Ondulación', icon: 'wave' as const,
      desc: <>Las cargas <strong>suben y bajan</strong> dentro de la misma semana. Día pesado · ligero · mediano. Permite estímulo sin acumular fatiga lineal.</> },
    { name: 'GPP Extensa', icon: 'pyramid' as const,
      desc: <><strong>Preparación general amplia</strong> antes de especificidad. Variantes no-clásicas (Hang, Muscle, Power) para base técnica.</> },
    { name: 'Estructura 3:1', icon: 'pulse' as const,
      desc: <>Tres semanas de <strong>carga progresiva</strong> + una de descarga. Probado en programas soviéticos desde los 70s.</> },
  ];
  return (
    <>
      <div className="hd-section-head">
        <h3>¿Qué hace único al método ruso?</h3>
        <span className="meta">3 principios · scroll →</span>
      </div>
      <div className="hd-philo">
        {cards.map((c, i) => (
          <article key={i} className="hd-philo-card">
            <div className="ic"><Icon name={c.icon} size={36} stroke={1.5}/></div>
            <div className="name">{c.name}</div>
            <div className="desc">{c.desc}</div>
          </article>
        ))}
      </div>
    </>
  );
}

// ============================================================
// Chart · dual line IMR + Volume + meso bands
// ============================================================
function Chart({ weekly, currentWeek }: { weekly: WeeklyEntry[]; currentWeek: number | null }) {
  const W = 360, H = 180, PAD_L = 26, PAD_R = 12, PAD_T = 8, PAD_B = 20;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const n = weekly.length;
  const xAt = (i: number) => PAD_L + (i / (n - 1)) * innerW;
  const yIMR = (v: number) => PAD_T + (1 - v / 110) * innerH;
  const maxRep = Math.max(...weekly.map(w => w.reps)) * 1.05;
  const yVol = (v: number) => PAD_T + (1 - v / maxRep) * innerH;
  const imrPath = weekly.map((w, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yIMR(w.imr)}`).join(' ');
  const volPath = weekly.map((w, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yVol(w.reps)}`).join(' ');

  const bands: { meso: number; from: number; to: number }[] = [];
  let cur: { meso: number; from: number; to: number } | null = null;
  weekly.forEach((w, i) => {
    if (!cur || cur.meso !== w.meso) {
      if (cur) bands.push(cur);
      cur = { meso: w.meso, from: i, to: i };
    } else {
      cur.to = i;
    }
  });
  if (cur) bands.push(cur);

  const bandColors: Record<number, string> = {
    1: 'rgba(132,204,22,0.10)',
    2: 'rgba(251,191,36,0.10)',
    3: 'rgba(249,115,22,0.10)',
    4: 'rgba(239,68,68,0.12)',
  };

  return (
    <div className="hd-chart-wrap">
      <div className="hd-section-head" style={{ marginBottom: 4 }}>
        <h3>Intensidad &amp; Volumen · 16 semanas</h3>
        <span className="meta">curva IMR · reps</span>
      </div>
      <svg className="hd-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
           role="img" aria-label="Curva de intensidad y volumen por semana">
        {bands.map((b, i) => {
          const x0 = xAt(b.from) - (innerW / (n - 1) / 2);
          const x1 = xAt(b.to)   + (innerW / (n - 1) / 2);
          return (
            <rect key={i}
                  x={Math.max(PAD_L, x0)}
                  y={PAD_T}
                  width={Math.min(W - PAD_R, x1) - Math.max(PAD_L, x0)}
                  height={innerH}
                  fill={bandColors[b.meso]}/>
          );
        })}
        {[20, 40, 60, 80, 100].map(v => (
          <line key={v} x1={PAD_L} x2={W - PAD_R} y1={yIMR(v)} y2={yIMR(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
        ))}
        {weekly.map((w, i) => i % 2 === 0 && (
          <text key={i} x={xAt(i)} y={H - 6} fontSize="8" fill="rgba(148,163,184,0.6)" textAnchor="middle" fontFamily="JetBrains Mono, monospace">S{w.w}</text>
        ))}
        {[40, 70, 100].map(v => (
          <text key={v} x={PAD_L - 4} y={yIMR(v) + 3} fontSize="8" fill="#EF4444" textAnchor="end" fontFamily="JetBrains Mono, monospace">{v}%</text>
        ))}
        <path d={`${volPath} L ${xAt(n-1)} ${H - PAD_B} L ${PAD_L} ${H - PAD_B} Z`} fill="#3B82F6" opacity="0.08"/>
        <path d={volPath} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 3px #3B82F6)' }}/>
        <path d={imrPath} fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 3px #EF4444)' }}/>
        {currentWeek && (() => {
          const idx = weekly.findIndex(w => w.w === currentWeek);
          if (idx < 0) return null;
          const x = xAt(idx);
          return (
            <g>
              <line x1={x} x2={x} y1={PAD_T} y2={H - PAD_B} stroke="#00E5FF" strokeWidth="1.5" strokeDasharray="3 3" style={{ filter: 'drop-shadow(0 0 4px #00E5FF)' }}/>
              <circle cx={x} cy={yIMR(weekly[idx].imr)} r="3.5" fill="#00E5FF" style={{ filter: 'drop-shadow(0 0 4px #00E5FF)' }}/>
              <text x={x + 4} y={PAD_T + 10} fontSize="8" fill="#00E5FF" fontFamily="JetBrains Mono, monospace" fontWeight="700">HOY</text>
            </g>
          );
        })()}
      </svg>
      <div className="hd-chart-legend">
        <span className="l imr"><span className="line"/> IMR % 1RM</span>
        <span className="l vol"><span className="line"/> reps semana</span>
      </div>
      <div className="hd-chart-bands" aria-hidden="true">
        <span data-m="1">M1 · GPP</span>
        <span data-m="2">M2 · Fuerza</span>
        <span data-m="3">M3 · SPP</span>
        <span data-m="4">M4 · Peak</span>
      </div>
      <table className="sr-only">
        <caption>Intensidad media relativa (IMR%) y reps por semana</caption>
        <thead><tr><th>Sem</th><th>IMR%</th><th>Reps</th><th>Foco</th></tr></thead>
        <tbody>
          {weekly.map(w => (
            <tr key={w.w}><td>{w.w}</td><td>{w.imr}</td><td>{w.reps}</td><td>{w.focus}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Mesos
// ============================================================
function Mesos({ mesos, weekly, openIdx, setOpen, openWeek }: { mesos: Mesocycle[]; weekly: WeeklyEntry[]; openIdx: number | null; setOpen: (i: number | null) => void; openWeek: (w: number) => void }) {
  return (
    <>
      <div className="hd-section-head">
        <h3>4 mesociclos · estructura</h3>
        <span className="meta">tap para expandir</span>
      </div>
      <div className="hd-mesos">
        {mesos.map(m => {
          const open = openIdx === m.idx;
          const weeks = weekly.filter(w => w.meso === m.idx);
          return (
            <div key={m.idx} className="hd-meso" data-m={m.idx} data-open={open}>
              <div className="hd-meso-head"
                   onClick={() => setOpen(open ? null : m.idx)}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                       e.preventDefault();
                       setOpen(open ? null : m.idx);
                     }
                   }}
                   aria-expanded={open}>
                <div className="hd-meso-num">{m.idx}</div>
                <div className="hd-meso-meta">
                  <div className="hd-meso-name">MES {m.idx} · {m.name}</div>
                  <div className="hd-meso-sub">S{m.weeks[0]}-S{m.weeks[1]} · IMR {m.imrRange} · {m.focus}</div>
                </div>
                <Icon name="chev" size={16} className="hd-meso-chev"/>
              </div>
              <div className="hd-meso-body">
                <div className="goal"><strong>Objetivo ·</strong> {m.desc}</div>
                <div className="hd-meso-weeks">
                  {weeks.map(w => (
                    <div key={w.w} className="hd-meso-week" data-now={w.current}>
                      <span className="wk-num">S{w.w}</span>
                      <span className="nm">{w.focus}</span>
                      <span className="imr">IMR {w.imr}%</span>
                      <span className="reps">{w.reps} reps</span>
                    </div>
                  ))}
                </div>
                <button className="hd-meso-cta" onClick={() => openWeek(weeks[0].w)}>
                  Ver semana día por día <Icon name="chev" size={10}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// Week Drawer
// ============================================================
function WeekDrawer({ open, onClose, weekData }: { open: boolean; onClose: () => void; weekData: WeekTypical }) {
  const [dayIdx, setDayIdx] = useState(0);
  if (!open) return null;
  const day = weekData.days[dayIdx];
  const typeColor: Record<Day['type'], string> = {
    vol: '#3B82F6', med: '#FBBF24', int: '#EF4444',
    act: '#22C55E', tec: '#A855F7', rec: '#94A3B8',
  };
  return (
    <>
      <div className="hd-drawer-scrim" onClick={onClose}/>
      <div className="hd-drawer" style={{ ['--c' as string]: typeColor[day.type] } as CSSProperties}>
        <div className="hd-drawer-grip"/>
        <div className="hd-drawer-head">
          <div className="title">{weekData.label}</div>
          <button className="hd-drawer-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div className="hd-drawer-days" role="tablist">
          {weekData.days.map((d, i) => (
            <button key={i}
                    className="hd-drawer-day-tab"
                    data-active={dayIdx === i}
                    data-type={d.type}
                    onClick={() => setDayIdx(i)}>
              <span>{d.d}</span>
              <span className="dt">{d.type.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <div className="hd-drawer-body">
          <div className="hd-drawer-day-meta">
            <div className="name">{day.name}</div>
            <div className="dur">{day.dur} min</div>
          </div>
          {day.slots.map((s, i) => (
            <div key={i} className="hd-slot">
              <div className="hd-slot-head">
                <span>SLOT {i + 1} · {s.slot}</span>
                <span>RPE {day.rpe}</span>
              </div>
              <div className="hd-slot-name">{s.ex}</div>
              <div className="hd-slot-prescription">
                <strong>{s.pct}%</strong> de tu {s.base.split('·')[0].trim()} = <strong>{s.kg} kg</strong>
              </div>
              <div className="hd-slot-stack">
                <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-mid)'}}>→ {s.plates}</span>
              </div>
            </div>
          ))}
          <div className="hd-drawer-foot">
            <span>Tonelaje día <strong>{day.tonelaje.toLocaleString('es-CL')} kg</strong></span>
            <span>RPE obj <strong>{day.rpe}</strong></span>
          </div>
          <button className="hd-drawer-cta">
            <Icon name="play" size={12} stroke={2.2}/> EMPEZAR ESTA SESIÓN
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Day Types
// ============================================================
function DayTypes() {
  return (
    <>
      <div className="hd-section-head">
        <h3>Tipos de día · glosario</h3>
        <span className="meta">6 tipos · tap</span>
      </div>
      <div className="hd-types">
        {DAY_TYPES.map(t => (
          <div key={t.t} className="hd-type" data-t={t.t} tabIndex={0} title={t.full}>
            <span className="lbl">{t.lbl}</span>
            <span className="full">{t.full.split('·')[0].trim()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================
// Footer Context
// ============================================================
function FooterContext() {
  return (
    <>
      <div className="hd-section-head">
        <h3>Contexto y comparativos</h3>
        <span className="meta">3 cards</span>
      </div>
      <div className="hd-foot-cards">
        <div className="hd-fc">
          <div className="name">Atletas que lo completaron</div>
          <div className="hd-fc-avatars">
            {['LR','JO','PT','CF','EG','TD','SL','JS'].map(a => <div key={a} className="av">{a}</div>)}
            <div className="more">+47</div>
          </div>
          <div className="desc"><strong>Promedio · +6.2 kg Snatch</strong> tras 16 semanas (n=55).</div>
          <button className="hd-fc-link">Ver testimonios →</button>
        </div>
        <div className="hd-fc">
          <div className="name">Origen histórico</div>
          <div className="desc">
            Codificado por <strong>Alexei Medvedev</strong> y refinado por la escuela soviética.
            Base de prácticamente todos los sistemas modernos de halterofilia.
          </div>
          <button className="hd-fc-link">Leer paper completo →</button>
        </div>
        <div className="hd-fc">
          <div className="name">Macrociclos similares</div>
          <div className="hd-fc-similar">
            <div className="hd-fc-similar-chip"><strong>Coreano 5D</strong><span>12 sem · 5d</span></div>
            <div className="hd-fc-similar-chip"><strong>Polaco Michalak</strong><span>12 sem · 5d</span></div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Week Picker Modal · feature crítica coach (mock · sin backend)
// Coach elige desde QUÉ SEMANA arranca el atleta · no siempre S1.
// ============================================================
const REASONS: { id: string; label: string }[] = [
  { id: 'beginning',        label: 'Empezar desde el principio' },
  { id: 'previous_program', label: 'Atleta viene de otro programa similar' },
  { id: 'recovery',         label: 'Recovery post-lesión · empezar en deload' },
  { id: 'peaking',          label: 'Peaking · saltar a fase final' },
  { id: 'other',            label: 'Otro motivo' },
];

const MESO_COLOR: Record<number, string> = {
  1: '#84CC16', 2: '#FBBF24', 3: '#F97316', 4: '#EF4444',
};

function WeekPickerModal({
  open, onClose, macro, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  macro: MacroData;
  onConfirm: (startWeek: number, reason: string) => void;
}) {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [reason, setReason] = useState<string>('beginning');
  if (!open) return null;

  const weekInfo = macro.weekly.find(w => w.w === selectedWeek);

  return (
    <>
      <div className="hd-wp-scrim" onClick={onClose}/>
      <div className="hd-wp-modal" role="dialog" aria-labelledby="wp-title">
        <button className="hd-wp-close" onClick={onClose} aria-label="Cerrar">
          <Icon name="x" size={14}/>
        </button>

        <div className="hd-wp-head">
          <span className="hd-wp-tag">ASIGNAR MACROCICLO</span>
          <h2 id="wp-title">{macro.name}</h2>
          <p className="hd-wp-sub">¿Desde qué semana arranca este atleta?</p>
        </div>

        <div className="hd-wp-weeks-scroll">
          <div className="hd-wp-weeks">
            {macro.weekly.map(w => {
              const active = w.w === selectedWeek;
              return (
                <button
                  key={w.w}
                  type="button"
                  className="hd-wp-week"
                  data-active={active}
                  style={{ ['--meso-c' as string]: MESO_COLOR[w.meso] } as CSSProperties}
                  onClick={() => setSelectedWeek(w.w)}
                  aria-pressed={active}>
                  <span className="num">S{w.w}</span>
                  <span className="imr">{w.imr}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {weekInfo && (
          <div className="hd-wp-preview" style={{ ['--meso-c' as string]: MESO_COLOR[weekInfo.meso] } as CSSProperties}>
            <span className="hd-wp-preview-label">Semana {weekInfo.w} ·</span>
            <span className="hd-wp-preview-focus">{weekInfo.focus}</span>
            <span className="hd-wp-preview-meta">IMR {weekInfo.imr}% · {weekInfo.reps} reps</span>
          </div>
        )}

        <div className="hd-wp-reasons">
          <span className="hd-wp-reasons-label">Razón (opcional)</span>
          {REASONS.map(r => (
            <label key={r.id} className="hd-wp-reason" data-active={reason === r.id}>
              <input
                type="radio"
                name="wp-reason"
                value={r.id}
                checked={reason === r.id}
                onChange={() => setReason(r.id)}/>
              <span className="dot"/>
              <span>{r.label}</span>
            </label>
          ))}
        </div>

        <div className="hd-wp-actions">
          <button type="button" className="hd-wp-cancel" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="hd-wp-confirm"
            onClick={() => onConfirm(selectedWeek, reason)}>
            Asignar · empieza S{selectedWeek}
          </button>
        </div>

        <p className="hd-wp-note">
          Mock demo · cuando backend esté listo, esto crea las sesiones desde la semana elegida.
        </p>
      </div>
    </>
  );
}

// ============================================================
// Main
// ============================================================
export default function HolyOlyDetailV2() {
  const { back, navigate } = useNav();
  const m = MACRO;
  const [openMeso, setOpenMeso] = useState<number | null>(2);
  const [drawerWeek, setDrawerWeek] = useState<number | null>(null);
  // DEMO toggle · permite ver la pantalla como coach (sino UI muestra CTA atleta)
  const [viewAsCoach, setViewAsCoach] = useState<boolean>(m.user.role === 'coach');
  const [wpOpen, setWpOpen] = useState<boolean>(false);

  // ID que vino del catálogo (todavía no se usa · mock siempre Ruso)
  // const macroId = typeof window !== 'undefined' ? sessionStorage.getItem('ho:selectedMacroId') : null;

  const goBackToCatalog = () => {
    try {
      navigate('HO_MACRO_CATALOG');
    } catch {
      back();
    }
  };

  const onCtaClick = () => {
    if (viewAsCoach) {
      setWpOpen(true);
    } else if (m.user.isActive) {
      // atleta · iría a ver su semana actual
      setDrawerWeek(m.user.currentWeek);
    } else {
      window.alert('Demo · esto abriría chat con tu coach para solicitar este macrociclo.');
    }
  };

  const onWeekPickerConfirm = (startWeek: number, reason: string) => {
    setWpOpen(false);
    window.alert(
      `Mock demo · asignación creada\n\n` +
      `Macrociclo: ${m.name}\n` +
      `Semana inicio: S${startWeek}\n` +
      `Razón: ${reason}\n\n` +
      `Backend pendiente · cuando esté, esto crea las sesiones del atleta desde S${startWeek}.`
    );
  };

  return (
    <div className="hd-root">
      <div className="hd-scroll">
        <Hero m={m} onBack={goBackToCatalog}/>
        <div className="hd-body">
          <Philosophy/>
          <Chart weekly={m.weekly} currentWeek={m.user.isActive ? m.user.currentWeek : null}/>
          <Mesos
            mesos={m.mesocycles}
            weekly={m.weekly}
            openIdx={openMeso}
            setOpen={setOpenMeso}
            openWeek={(w) => setDrawerWeek(w)}/>
          <DayTypes/>
          <FooterContext/>
        </div>
      </div>

      {!drawerWeek && (
        <div className="hd-cta-bar">
          {/* Demo role toggle · solo en mock · remover cuando AuthContext maneje role real */}
          <button
            type="button"
            className="hd-role-toggle"
            onClick={() => setViewAsCoach(v => !v)}
            aria-label="Cambiar rol demo"
            title={viewAsCoach ? 'Ver como atleta' : 'Ver como coach'}>
            {viewAsCoach ? '🎓 COACH' : '🏋️ ATLETA'}
          </button>
          <button className="hd-cta" onClick={onCtaClick}>
            {viewAsCoach
              ? 'Asignar a atleta…'
              : (m.user.isActive ? 'Ver semana actual' : 'Solicitar a mi coach')}
          </button>
        </div>
      )}

      <WeekDrawer
        open={!!drawerWeek}
        onClose={() => setDrawerWeek(null)}
        weekData={m.weekTypical}/>

      <WeekPickerModal
        open={wpOpen}
        onClose={() => setWpOpen(false)}
        macro={m}
        onConfirm={onWeekPickerConfirm}/>
    </div>
  );
}

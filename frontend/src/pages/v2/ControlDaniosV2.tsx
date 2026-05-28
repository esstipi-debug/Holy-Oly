/**
 * ControlDaniosV2 · Pantalla Coach IA · Control de Daños.
 *
 * Portado de claude_design_drops/2026-05-27_pkql_v2/Control de Danos.html
 * Cambios:
 *  - HTML autocontenido (CSS+JSX inline) → TSX + CSS scoped en control-danios.css
 *  - jsx → tsx con tipos
 *  - useNav para volver (botón X cierra la pantalla)
 *  - scope CSS bajo .cd-root (sin frame .phone ni status-bar)
 *  - onclick inline del chip "¿Por qué este plan?" → useState con data-open
 *  - mock data inline (4 cards: diagnóstico, impacto, plan, mensaje IA)
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import { api, deviationsApi, type DeviationsResponse } from '../../lib/api';
import '../../styles/v2/control-danios.css';

// ============================================================
// Types
// ============================================================
interface Factor { tone: 'sleep' | 'rpe' | 'stress'; k: string; v: string; u?: string; sub: string }
interface Impact { k: string; sym: '↑' | '↓'; v: string; u?: string; note: string }
interface PlanRow { day: string; date: string; sessionTitle: string; change: string; delta: string; minus?: boolean }

// ============================================================
// Mock data
// ============================================================
const FACTORS: Factor[] = [
  { tone: 'sleep',  k: 'SLEEP',  v: '4.2', u: 'h',   sub: 'vs base 7.4h' },
  { tone: 'rpe',    k: 'RPE',    v: '9.5',           sub: 'obj. 7' },
  { tone: 'stress', k: 'STRESS', v: '8',   u: '/10', sub: 'crónico 3d' },
];

const IMPACTS: Impact[] = [
  { k: 'CNS',     sym: '↓', v: '12', u: '%', note: 'readiness' },
  { k: 'FATIGUE', sym: '↑', v: '18',         note: 'acute load' },
  { k: 'RISK',    sym: '↑', v: '35', u: '%', note: 'lesión 7d' },
];

const PLAN_ROWS: PlanRow[] = [
  { day: 'MAÑANA', date: 'vie · 28', sessionTitle: 'Técnica · OLY',       change: 'cargas 50% · sin top set',         delta: '−40%',   minus: true },
  { day: 'PASADO', date: 'sáb · 29', sessionTitle: 'Mobility + Z2',       change: '45min · zona aeróbica baja',       delta: 'REPLACE' },
  { day: 'DOM',    date: '30 may',   sessionTitle: 'Descanso completo',   change: 'forzado · sleep target ≥ 8h',      delta: 'REST' },
  { day: 'LUN',    date: '31 may',   sessionTitle: 'WOD reentrada',       change: 'Z2 + accesorios · check CNS',      delta: '−15%',   minus: true },
];

// ============================================================
// Icons
// ============================================================
function IconClose(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconAlert(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ic" style={{ color: 'var(--engine-macro)' }}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function IconImpact(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ic" style={{ color: 'var(--engine-macro)' }}>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
    </svg>
  );
}
function IconCalendar(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ic" style={{ color: 'var(--engine-oly)' }}>
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconClock(): ReactElement {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconCheckSmall(): ReactElement {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconSpark(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ic" style={{ color: 'var(--engine-stress)' }}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 10v6m11-11h-6m-10 0H1m17.5-6.5l-4.2 4.2m-6.6 6.6L3.5 20.5m0-17l4.2 4.2m6.6 6.6l4.2 4.2"/>
    </svg>
  );
}
function IconStar(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
function IconBulb(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ic">
      <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z"/>
    </svg>
  );
}
function IconCheckBig(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ============================================================
// Main
// ============================================================
export default function ControlDaniosV2(): ReactElement {
  const { back } = useNav();
  const [whyOpen, setWhyOpen] = useState<boolean>(false);
  const [deviations, setDeviations] = useState<DeviationsResponse | null>(null);
  const [source, setSource] = useState<'backend' | 'fallback'>('fallback');

  // Pipeline:
  // 1. GET /v1/macrocycles/me/active → busca macro activo del atleta logueado.
  // 2. Si hay macro → GET /v1/macrocycles/{id}/deviations → deviations reales.
  // 3. Si cualquier paso falla → fallback al mock estático (FACTORS/IMPACTS/PLAN_ROWS).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const active = await api.get<{ id?: string; macro_id?: string }>('/v1/macrocycles/me/active');
        if (cancelled) return;
        const macroId = active?.id ?? active?.macro_id;
        if (!macroId) return;
        const dev = await deviationsApi.get({ macro_id: macroId });
        if (cancelled) return;
        setDeviations(dev);
        setSource('backend');
      } catch {
        if (!cancelled) setSource('fallback');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="cd-root">
      {/* ============= HEADER ============= */}
      <header className="cd-header">
        <div className="cd-h-text">
          <span className="cd-h-eyebrow">
            <span className="pip"/> COACH IA · CONTROL DE DAÑOS
            <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 9, opacity: 0.6 }}>
              · {source === 'backend' ? 'live' : 'offline'}
            </span>
          </span>
          <h1 className="cd-h-title">Acompañemos <span className="accent">esto</span>.</h1>
          <p className="cd-h-sub">
            {deviations
              ? `${deviations.summary.total_deviations} desvíos en ${deviations.weeks_analyzed} semanas · severidad ${deviations.summary.severity}.`
              : 'Sin culpa · sin sermón. Vamos a recuperar el rumbo juntos.'}
          </p>
        </div>
        <button className="cd-h-x" aria-label="Cerrar" onClick={back}>
          <IconClose/>
        </button>
      </header>

      {/* ============= SCROLL ============= */}
      <div className="cd-scroll">

        {/* ====== CARD 1 · DIAGNÓSTICO ====== */}
        <div className="cd-card" data-tone="diag">
          <div className="cd-card-head">
            <span className="lbl">
              <IconAlert/>
              DIAGNÓSTICO
            </span>
            <span className="step"><span className="n">01</span> / 04</span>
          </div>

          <p className="cd-diag-summary">
            Entrenaste pesado con <span className="hi">3 banderas amarillas</span> activas a la vez. La combinación se acumuló silenciosa.
          </p>

          <div className="cd-factors">
            {FACTORS.map((f) => (
              <div key={f.tone} className="cd-factor" data-tone={f.tone}>
                <span className="k">{f.k}</span>
                <span className="v">
                  {f.v}{f.u && <span className="u">{f.u}</span>}
                </span>
                <span className="sub">{f.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ====== CARD 2 · IMPACTO ====== */}
        <div className="cd-card" data-tone="impact">
          <div className="cd-card-head">
            <span className="lbl">
              <IconImpact/>
              IMPACTO REAL · 48H POST
            </span>
            <span className="step"><span className="n">02</span> / 04</span>
          </div>

          <div className="cd-impact-grid">
            {IMPACTS.map((i) => (
              <div key={i.k} className="cd-impact">
                <span className="k">{i.k}</span>
                <span className="v">
                  <span className="sym">{i.sym}</span>{i.v}{i.u && <span className="u">{i.u}</span>}
                </span>
                <span className="note">{i.note}</span>
              </div>
            ))}
          </div>

          <div className="cd-impact-foot">
            <IconClock/>
            <span>Ventana de recuperación: <strong>~72h</strong> con plan modificado.</span>
          </div>
        </div>

        {/* ====== CARD 3 · PLAN ====== */}
        <div className="cd-card" data-tone="plan">
          <div className="cd-card-head">
            <span className="lbl">
              <IconCalendar/>
              PLAN DE RECUPERACIÓN · 4 SESIONES
            </span>
            <span className="step"><span className="n">03</span> / 04</span>
          </div>

          <p className="cd-plan-intro">
            Bajé la pista. Mantenemos rutina, <strong>cambia la dosis</strong>.
          </p>

          <div className="cd-plan-list">
            {PLAN_ROWS.map((r, idx) => (
              <div key={idx} className="cd-plan-row">
                <span className="day">
                  {r.day}
                  <span className="date">{r.date}</span>
                </span>
                <span className="session">
                  <strong>{r.sessionTitle}</strong>
                  <span className="change">{r.change}</span>
                </span>
                <span className={`delta${r.minus ? ' minus' : ''}`}>{r.delta}</span>
              </div>
            ))}
          </div>

          <div className="cd-plan-foot">
            <IconCheckSmall/>
            <span>Volvés a <strong>100%</strong> el martes si check-in verde.</span>
          </div>
        </div>

        {/* ====== CARD 4 · MENSAJE IA ====== */}
        <div className="cd-card ci-ai-card" data-tone="ai" data-open={whyOpen}>
          <div className="cd-card-head">
            <span className="lbl">
              <IconSpark/>
              MENSAJE PERSONAL
            </span>
            <span className="step"><span className="n">04</span> / 04</span>
          </div>

          <div className="cd-ai-head">
            <div className="cd-ai-avatar">
              <IconStar/>
            </div>
            <div className="cd-ai-meta">
              <div className="cd-ai-name">Mistral · Coach IA <span className="by">para Marco</span></div>
              <div className="cd-ai-tag">RESPUESTA EMPÁTICA · CONTEXTO LOCAL</div>
            </div>
          </div>

          <div className="cd-ai-body">
            <p>
              <strong>Marco, te leo.</strong> Anoche había stress alto, viste el WOD, y empujaste igual. Eso no te hace débil — te hace humano y competitivo. Es la decisión exacta que cualquier atleta serio toma alguna vez.
            </p>
            <p>
              El cuerpo te dejó una factura chica, no una catástrofe. Tu CNS bajó 12% y tu fatiga subió, pero <strong>nada está roto</strong>. Mi trabajo no es decirte "te lo dije" — es asegurarme que no se vuelva crónico.
            </p>
            <p>
              Cambié las próximas 4 sesiones. <strong>El objetivo del mes sigue intacto.</strong> Solo movemos el cómo. ¿Lo aceptamos juntos?
            </p>
          </div>

          <button
            type="button"
            className="cd-ai-chip"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((v) => !v)}>
            <span className="chev">▸</span> ¿POR QUÉ ESTE PLAN?
          </button>

          <div className="cd-ai-why">
            <div className="row"><span><strong>Sleep 4.2h</strong> · reduce MPS y síntesis hormonal · ventana 48-72h.</span></div>
            <div className="row"><span><strong>RPE 9.5 vs obj 7</strong> · accumulation phase no quería intensidad · estresa CNS.</span></div>
            <div className="row"><span><strong>Stress 8/10 × 3d</strong> · cortisol cronificado · prioridad: sueño y zona 2.</span></div>
            <div className="row"><span><strong>Modelo:</strong> framework Banister + ACWR ratio &gt; 1.5 — riesgo bajo si baja carga 4 sesiones.</span></div>
          </div>
        </div>

        {/* ====== EDUCATIONAL PILL ====== */}
        <div className="cd-edu">
          <IconBulb/>
          <span>Sleep <strong>&lt;6h</strong> reduce recovery <strong>40%</strong> en 24h post · evidencia consistente n=180.</span>
        </div>

      </div>

      {/* ============= ACTIONS ============= */}
      <div className="cd-actions">
        <button type="button" className="btn-primary" onClick={back}>
          <IconCheckBig/>
          Acepto el plan
        </button>
        <button type="button" className="btn-secondary" onClick={back}>
          Mantengo mi plan original
        </button>
      </div>
    </div>
  );
}

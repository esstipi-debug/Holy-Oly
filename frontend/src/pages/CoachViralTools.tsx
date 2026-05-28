import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';
import { athletes as mockAthletes } from '../data/athletes';
import type { AthleteProfile } from '../data/athletes';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/coach-viral.css';

/**
 * Coach Viral Tools — generador de contenido viral para coaches.
 *
 * El coach es el principal generador de loops virales (fuera de los atletas).
 * Esta pantalla ofrece 3 templates de cards 9:16 portrait optimizadas para
 * screenshot directo. Sin botón share — la imagen ES el share.
 *
 * Templates:
 *  A · ATLETA DEL MES — destaca a un atleta del roster
 *  B · RECAP SEMANAL DEL BOX — 4 KPIs grandes + top 3
 *  C · MOTIVACIONAL CON CITA — frase grande, branding del box
 */

type TemplateId = 'atleta-mes' | 'recap-semanal' | 'motivacional';

const TEMPLATES: { id: TemplateId; label: string; icon: string }[] = [
  { id: 'atleta-mes',    label: 'Atleta del mes', icon: '🏆' },
  { id: 'recap-semanal', label: 'Recap semanal',  icon: '📊' },
  { id: 'motivacional',  label: 'Motivacional',   icon: '💬' },
];

const MOTIVATIONAL_TAGS = [
  'Mostrando el camino',
  'Disciplina visible',
  'Inspira al box',
  'Constancia sin grietas',
  'Top performer del mes',
  'Referente silencioso',
];

const QUOTES = [
  'El peso no miente. La constancia tampoco.',
  'Cada rep cuenta. Cada día más.',
  'No buscás la motivación. La creás.',
  'La técnica es la pista. La voluntad, el motor.',
  'No se gana en el podio. Se gana en el calentamiento.',
  'El dolor de hoy es la victoria de mañana.',
  'Sumá un kilo. Sumá un día. Sumá una vida.',
  'Ningún atleta se construyó esperando estar listo.',
  'La fuerza no se hereda. Se levanta.',
  'Apareciste hoy. Eso ya te separa del 90%.',
];

// Card portrait dimensions (9:16) — se renderiza a tamaño fijo para screenshot
const CARD_W = 360;
const CARD_H = 640;

interface ColorScheme {
  accent: string;
  accentDim: string;
  bg: string;
  surface: string;
  line: string;
  text: string;
  muted: string;
  onAccent: string;
}

// Card color schemes · resolve against tokens.css (:root) — no hardcoded hex.
// HO = amber/red (engine-belt) · Volta = cyan (engine-stress). The card sub-
// components consume these as inline-style values, so CSS var() strings work.
const HO_SCHEME: ColorScheme = {
  accent: 'var(--engine-belt)',
  accentDim: 'color-mix(in oklab, var(--engine-belt) 16%, transparent)',
  bg: 'var(--bg-deep)',
  surface: 'var(--surface-1)',
  line: 'var(--border-soft)',
  text: 'var(--text-hi)',
  muted: 'var(--text-lo)',
  onAccent: '#1A1500',
};

const VOL_SCHEME: ColorScheme = {
  accent: 'var(--engine-stress)',
  accentDim: 'color-mix(in oklab, var(--engine-stress) 16%, transparent)',
  bg: 'var(--bg-deep)',
  surface: 'var(--surface-1)',
  line: 'var(--border-soft)',
  text: 'var(--text-hi)',
  muted: 'var(--text-lo)',
  onAccent: '#001A1F',
};

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fmt(n: number): string {
  return n.toLocaleString('es-AR');
}

// Tier de disco para "Atleta del mes" · derivado de PR (kg) + streak (señales reales).
// Mapea a la escala oficial de discos (white→red) sin inventar datos nuevos.
function deriveTier(prValue: number, streak: number): PlateTier {
  const score = prValue + streak * 4; // streak pondera la constancia
  if (score >= 180) return 'red';
  if (score >= 140) return 'blue';
  if (score >= 100) return 'yellow';
  if (score >= 60) return 'green';
  return 'white';
}

// Tier del top-mover (recap) · derivado de prior_fitness (señal real del engine).
function fitnessToTier(fitness: number): PlateTier {
  if (fitness >= 70) return 'red';
  if (fitness >= 60) return 'blue';
  if (fitness >= 50) return 'yellow';
  if (fitness >= 40) return 'green';
  return 'white';
}

const CoachViralTools: React.FC = () => {
  const { navigate } = useNav();
  const { allAthletes } = useAthlete();
  const { product } = useProduct();

  const C: ColorScheme = product === 'volta' ? VOL_SCHEME : HO_SCHEME;

  // Roster: usar allAthletes si hay; si no, fallback a mock
  const roster: AthleteProfile[] = useMemo(() => {
    return allAthletes && allAthletes.length > 0 ? allAthletes : mockAthletes;
  }, [allAthletes]);

  const [template, setTemplate] = useState<TemplateId>('atleta-mes');
  const [athleteIdx, setAthleteIdx] = useState(0);
  const [tagIdx, setTagIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const athlete = roster[athleteIdx % roster.length];

  const monthName = MONTHS_ES[new Date().getMonth()];
  const boxName = athlete?.club || 'Holy Oly Club';

  const cycleTemplate = () => {
    const order: TemplateId[] = ['atleta-mes', 'recap-semanal', 'motivacional'];
    const i = order.indexOf(template);
    setTemplate(order[(i + 1) % order.length]);
  };

  const cycleAthlete = () => setAthleteIdx(i => (i + 1) % Math.max(1, roster.length));
  const cycleTag = () => setTagIdx(i => (i + 1) % MOTIVATIONAL_TAGS.length);
  const cycleQuote = () => setQuoteIdx(i => (i + 1) % QUOTES.length);

  // ─── Stats derivadas del roster para templates B (RECAP) ───
  const recap = useMemo(() => {
    const completedSessions = roster.reduce((acc, a) => {
      const s = a.sessions_last_7 ?? [];
      return acc + s.filter(x => x.completed).length;
    }, 0);
    const totalVolume = roster.reduce((acc, a) => {
      const s = a.sessions_last_7 ?? [];
      return acc + s.reduce((sum, x) => sum + (x.load || 0), 0);
    }, 0);
    const rxCount = Math.max(0, Math.round(completedSessions * 0.65));
    // Top mover = mayor prior_fitness
    const topMover = [...roster].sort((a, b) => (b.prior_fitness ?? 0) - (a.prior_fitness ?? 0))[0];

    // Top 3 por tonelaje semanal acumulado
    const ranked = [...roster].map(a => {
      const s = a.sessions_last_7 ?? [];
      return { athlete: a, tonelaje: s.reduce((sum, x) => sum + (x.load || 0), 0) };
    }).sort((a, b) => b.tonelaje - a.tonelaje).slice(0, 3);

    return {
      sessions: completedSessions,
      volumeKg: Math.round(totalVolume),
      rxCount,
      topMover,
      top3: ranked,
    };
  }, [roster]);

  // ─── Stats del atleta para template A ───
  const atletaStats = useMemo(() => {
    if (!athlete) return null;
    // PR del mes: mayor entre snatch / C&J (en HO) o un proxy para VOL (back_squat)
    const prValue = product === 'volta'
      ? Math.max(athlete.maxes.back_squat, athlete.maxes.front_squat)
      : Math.max(athlete.maxes.snatch, athlete.maxes.clean, athlete.maxes.jerk);
    const prLabel = product === 'volta'
      ? (athlete.maxes.back_squat >= athlete.maxes.front_squat ? 'Back Squat' : 'Front Squat')
      : athlete.maxes.snatch >= Math.max(athlete.maxes.clean, athlete.maxes.jerk)
        ? 'Snatch'
        : athlete.maxes.clean >= athlete.maxes.jerk ? 'Clean' : 'Jerk';

    const sessions = athlete.sessions_last_7 ?? [];
    const completed = sessions.filter(s => s.completed).length;
    const planned = sessions.length;

    // Streak: días consecutivos completados desde el final
    let streak = 0;
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].completed) streak++;
      else if (sessions[i].notes?.toLowerCase().includes('descanso') || sessions[i].notes?.toLowerCase().includes('libre')) {
        // descanso programado no rompe streak
        continue;
      } else {
        break;
      }
    }

    return { prValue, prLabel, completed, planned, streak };
  }, [athlete, product]);

  // Tier del disco para el atleta del mes · derivado de PR + streak (señales reales).
  const athleteTier: PlateTier = useMemo(
    () => deriveTier(atletaStats?.prValue ?? 0, atletaStats?.streak ?? 0),
    [atletaStats],
  );

  // Tier del top-mover (recap) · derivado de prior_fitness (señal real).
  const topMoverTier: PlateTier = useMemo(
    () => fitnessToTier(recap.topMover?.prior_fitness ?? 0),
    [recap.topMover],
  );

  // Accent product-aware vía CSS vars sobre el root (HO amber/red · Volta cyan).
  const rootVars = product === 'volta'
    ? {
        '--cvt-accent': 'var(--engine-stress)',
        '--cvt-accent-2': 'var(--engine-stress)',
        '--cvt-accent-dim': 'color-mix(in oklab, var(--engine-stress) 16%, transparent)',
        '--cvt-glow': 'var(--glow-cyan)',
        '--cvt-on-accent': '#001A1F',
      } as React.CSSProperties
    : {
        '--cvt-accent': 'var(--engine-belt)',
        '--cvt-accent-2': 'var(--engine-streak)',
        '--cvt-accent-dim': 'color-mix(in oklab, var(--engine-belt) 16%, transparent)',
        '--cvt-glow': 'var(--glow-amber)',
        '--cvt-on-accent': '#1A1500',
      } as React.CSSProperties;

  return (
    <div className="cvt-root" style={rootVars}>
      {/* HEADER */}
      <div className="cvt-header">
        <button
          onClick={() => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH')}
          className="btn-press cvt-back"
        >← Volver</button>
        <p className="cvt-eyebrow">Coach · Contenido Viral</p>
        <h1 className="cvt-title">Generador de cards</h1>
        <p className="cvt-sub">Screenshot directo. La imagen ES el share.</p>
      </div>

      {/* TEMPLATE TABS */}
      <div className="cvt-tabs">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className="btn-press cvt-tab"
            data-active={template === t.id}
          >
            <span className="ic">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ATLETA SELECTOR (solo template A) */}
      {template === 'atleta-mes' && athlete && (
        <div className="cvt-selector">
          <button onClick={cycleAthlete} className="btn-press cvt-select-btn">
            <span className="cvt-select-k">Atleta</span>
            <span className="cvt-select-v">
              <span>{athlete.name}</span>
              <span className="cyc">↻</span>
            </span>
          </button>
        </div>
      )}

      {/* CARD PREVIEW · 9:16 portrait */}
      <div className="cvt-stage">
        <div className="cvt-card" style={{ width: CARD_W, height: CARD_H }}>
          {template === 'atleta-mes' && athlete && atletaStats && (
            <AtletaDelMes
              athlete={athlete}
              stats={atletaStats}
              tier={athleteTier}
              tag={MOTIVATIONAL_TAGS[tagIdx]}
              monthName={monthName}
              boxName={boxName}
              scheme={C}
              product={product}
            />
          )}
          {template === 'recap-semanal' && (
            <RecapSemanal
              recap={recap}
              topMoverTier={topMoverTier}
              boxName={boxName}
              scheme={C}
              product={product}
            />
          )}
          {template === 'motivacional' && (
            <Motivacional
              quote={QUOTES[quoteIdx]}
              boxName={boxName}
              scheme={C}
              product={product}
            />
          )}
        </div>
      </div>

      {/* CONTROLES DE TEMPLATE */}
      <div className="cvt-controls">
        {template === 'atleta-mes' && (
          <button onClick={cycleTag} className="btn-press cvt-btn-ghost">
            Cambiar frase ↻
          </button>
        )}
        {template === 'motivacional' && (
          <button onClick={cycleQuote} className="btn-press cvt-btn-ghost">
            Cambiar cita ({quoteIdx + 1}/{QUOTES.length}) ↻
          </button>
        )}
        <button onClick={cycleTemplate} className="btn-press cvt-btn-primary">
          Cambiar template →
        </button>
        <p className="cvt-hint">
          Tomá screenshot nativo (volumen + power) para compartir.
        </p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE A · ATLETA DEL MES
// ════════════════════════════════════════════════════════════════════════════

interface AtletaDelMesProps {
  athlete: AthleteProfile;
  stats: { prValue: number; prLabel: string; completed: number; planned: number; streak: number };
  tier: PlateTier;
  tag: string;
  monthName: string;
  boxName: string;
  scheme: ColorScheme;
  product: 'holy-oly' | 'volta';
}

const AtletaDelMes: React.FC<AtletaDelMesProps> = ({ athlete, stats, tier, tag, monthName, boxName, scheme: C, product }) => {
  const initial = athlete.name.charAt(0).toUpperCase();
  const firstName = athlete.name.split(' ')[0];
  const lastName = athlete.name.split(' ').slice(1).join(' ');

  return (
    <div style={{
      width: '100%', height: '100%',
      background: `radial-gradient(circle at 50% 25%, ${C.accentDim} 0%, ${C.bg} 65%)`,
      padding: '30px 24px 26px',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Eyebrow */}
      <p className="cvt-c-eyebrow" style={{ fontSize: 9, letterSpacing: '.24em' }}>
        Atleta del mes · {monthName}
      </p>

      {/* Avatar ring */}
      <div className="cvt-avatar" style={{ margin: '16px auto 10px', width: 132, height: 132 }}>
        <span style={{ fontSize: 56, fontStyle: 'italic' }}>{initial}</span>
      </div>

      {/* Tier disc · discos halterofilia · clasifica al atleta del mes */}
      <div className="cvt-plate" style={{ marginBottom: 8 }}>
        <PlateBadge tier={tier} size={44} showLabel />
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{
          fontSize: 24, fontWeight: 900, color: C.text,
          fontStyle: 'italic', letterSpacing: '-.02em', lineHeight: 1,
        }}>{firstName}</p>
        {lastName && (
          <p style={{
            fontSize: 17, fontWeight: 700, color: C.text,
            fontStyle: 'italic', letterSpacing: '-.01em', lineHeight: 1, marginTop: 4,
            opacity: 0.85,
          }}>{lastName}</p>
        )}
        <p style={{
          fontSize: 9, color: C.muted, fontWeight: 700,
          letterSpacing: '.16em', textTransform: 'uppercase', marginTop: 8,
        }}>{athlete.weight_class} · {athlete.macrocycle?.focus || 'Foco general'}</p>
      </div>

      {/* Stats grid */}
      <div style={{
        marginTop: 14,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
      }}>
        <Stat label="PR" value={`${stats.prValue}kg`} sub={stats.prLabel} />
        <Stat label="Asist" value={`${stats.completed}/${stats.planned || 7}`} sub="sesiones" />
        <Stat label="Streak" value={`${stats.streak}d`} sub="seguidos" />
      </div>

      {/* Tag motivacional */}
      <div className="cvt-tagpill" style={{ margin: '16px 0 0', padding: '10px 12px' }}>
        <p style={{ fontSize: 13, letterSpacing: '-.01em' }}>“{tag}”</p>
      </div>

      {/* Branding inferior */}
      <div className="cvt-c-brandbox" style={{ marginTop: 'auto', paddingTop: 14 }}>
        <p className="cvt-c-brandname" style={{ fontSize: 9 }}>{boxName}</p>
        <p className="cvt-c-hashtag" style={{ fontSize: 10 }}>#{product === 'volta' ? 'SimBox' : 'HolyOly'}</p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE B · RECAP SEMANAL
// ════════════════════════════════════════════════════════════════════════════

interface RecapSemanalProps {
  recap: {
    sessions: number;
    volumeKg: number;
    rxCount: number;
    topMover: AthleteProfile | undefined;
    top3: { athlete: AthleteProfile; tonelaje: number }[];
  };
  topMoverTier: PlateTier;
  boxName: string;
  scheme: ColorScheme;
  product: 'holy-oly' | 'volta';
}

const RecapSemanal: React.FC<RecapSemanalProps> = ({ recap, topMoverTier, boxName, scheme: C, product }) => {
  const topMoverName = recap.topMover?.name.split(' ')[0] || '—';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: `radial-gradient(circle at 50% 0%, ${C.accentDim} 0%, ${C.bg} 70%)`,
      padding: '30px 22px 22px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Eyebrow */}
      <p className="cvt-c-eyebrow" style={{ fontSize: 9, letterSpacing: '.24em' }}>
        Esta semana en el box
      </p>
      <p style={{
        fontSize: 22, fontWeight: 900, color: C.text,
        textAlign: 'center', marginTop: 6, letterSpacing: '-.02em',
        fontStyle: 'italic',
      }}>
        RECAP 7D
      </p>

      {/* KPIs 2×2 */}
      <div style={{
        marginTop: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        <KpiCard label="Sesiones" value={String(recap.sessions)} sub="totales" />
        <KpiCard label="Volumen" value={`${(recap.volumeKg / 1000).toFixed(1)}k`} sub="kg movidos" />
        <KpiCard label={product === 'volta' ? 'WODs Rx' : 'Sesiones Rx'} value={String(recap.rxCount)} sub="completos" />
        <KpiCard label="Top mover" value={topMoverName} sub="↑ fitness" small badge={topMoverTier} />
      </div>

      {/* TOP 3 */}
      <div style={{ marginTop: 14 }}>
        <p className="cvt-rank-lbl">Top 3 · tonelaje</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recap.top3.map((entry, i) => (
            <div key={entry.athlete.id} className="cvt-rank-row" data-lead={i === 0}>
              <span className="cvt-rank-pos">{i + 1}</span>
              <p className="cvt-rank-name">{entry.athlete.name}</p>
              <p className="cvt-rank-val">{fmt(entry.tonelaje)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Branding inferior */}
      <div className="cvt-c-brandbox" style={{ marginTop: 'auto', paddingTop: 12 }}>
        <p className="cvt-c-brandname" style={{ fontSize: 9 }}>{boxName}</p>
        <p className="cvt-c-hashtag" style={{ fontSize: 10 }}>#{product === 'volta' ? 'SimBox' : 'HolyOly'}</p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE C · MOTIVACIONAL CON CITA
// ════════════════════════════════════════════════════════════════════════════

interface MotivacionalProps {
  quote: string;
  boxName: string;
  scheme: ColorScheme;
  product: 'holy-oly' | 'volta';
}

const Motivacional: React.FC<MotivacionalProps> = ({ quote, boxName, scheme: C, product }) => {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `radial-gradient(circle at 50% 50%, ${C.accentDim} 0%, ${C.bg} 75%)`,
      padding: '40px 28px 28px',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Eyebrow */}
      <p className="cvt-c-eyebrow" style={{ fontSize: 9, letterSpacing: '.28em' }}>
        Frase de la semana
      </p>

      {/* Quote mark */}
      <p style={{
        fontSize: 90, color: C.accent, opacity: 0.25,
        textAlign: 'center', fontFamily: 'Georgia, serif',
        lineHeight: 0.8, marginTop: 18, marginBottom: -10,
      }}>“</p>

      {/* Quote */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px',
      }}>
        <p style={{
          fontSize: 24, lineHeight: 1.3, color: C.text,
          fontStyle: 'italic', fontWeight: 700,
          letterSpacing: '-.01em', textAlign: 'center',
        }}>
          {quote}
        </p>
      </div>

      {/* Author */}
      <p style={{
        fontSize: 11, color: C.accent, fontWeight: 800,
        letterSpacing: '.16em', textTransform: 'uppercase', textAlign: 'center',
        marginBottom: 20,
      }}>
        — Coach del box
      </p>

      {/* Branding */}
      <div className="cvt-c-brandbox" style={{ paddingTop: 14 }}>
        <p className="cvt-c-brandname" style={{ fontSize: 9 }}>{boxName}</p>
        <p className="cvt-c-hashtag" style={{ fontSize: 10 }}>#{product === 'volta' ? 'SimBox' : 'HolyOly'}</p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SHARED MICRO-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// Mini stat tile (template A) · styled via .cvt-stat (tokens).
const Stat: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div className="cvt-stat">
    <p className="k">{label}</p>
    <p className="v">{value}</p>
    <p className="s">{sub}</p>
  </div>
);

// KPI tile (template B) · styled via .cvt-kpi (tokens). `badge` renders a tier
// disc (PlateBadge) inside the tile — used for the "Top mover" highlight.
const KpiCard: React.FC<{ label: string; value: string; sub: string; small?: boolean; badge?: PlateTier }> = ({ label, value, sub, small, badge }) => (
  <div className="cvt-kpi">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
      <p className="k">{label}</p>
      {badge && <PlateBadge tier={badge} size={26} />}
    </div>
    <p className="v" style={{ fontSize: small ? 18 : 26 }}>{value}</p>
    <p className="s">{sub}</p>
  </div>
);

export default CoachViralTools;

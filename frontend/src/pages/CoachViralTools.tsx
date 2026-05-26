import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { useProduct } from '../context/ProductContext';
import { athletes as mockAthletes } from '../data/athletes';
import type { AthleteProfile } from '../data/athletes';

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

const HO_SCHEME: ColorScheme = {
  accent: '#F5C518',
  accentDim: 'rgba(245,197,24,0.18)',
  bg: '#07070F',
  surface: '#0F0F1C',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#7B7B9F',
  onAccent: '#1A1500',
};

const VOL_SCHEME: ColorScheme = {
  accent: '#00E5FF',
  accentDim: 'rgba(0,229,255,0.18)',
  bg: '#07070F',
  surface: '#0F0F1C',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  onAccent: '#001A1F',
};

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fmt(n: number): string {
  return n.toLocaleString('es-AR');
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

  // Tab styles
  const tabBtn = (active: boolean) => ({
    flex: 1,
    padding: '10px 8px',
    borderRadius: 12,
    background: active ? C.accent : C.surface,
    color: active ? C.onAccent : C.text,
    border: `1px solid ${active ? C.accent : C.line}`,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  });

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 110, color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '36px 20px 8px' }}>
        <button
          onClick={() => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH')}
          className="btn-press"
          style={{
            background: 'transparent', border: 'none', color: C.muted,
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', padding: 0, marginBottom: 8,
          }}
        >← Volver</button>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          Coach · Contenido Viral
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4, letterSpacing: '-.02em' }}>
          Generador de cards
        </h1>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>
          Screenshot directo. La imagen ES el share.
        </p>
      </div>

      {/* TEMPLATE TABS */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 8px' }}>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className="btn-press"
            style={tabBtn(template === t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ATLETA SELECTOR (solo template A) */}
      {template === 'atleta-mes' && athlete && (
        <div style={{ padding: '4px 16px 8px' }}>
          <button
            onClick={cycleAthlete}
            className="btn-press"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              background: C.surface, color: C.text,
              border: `1px solid ${C.line}`,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ color: C.muted, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              Atleta
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{athlete.name}</span>
              <span style={{ color: C.accent }}>↻</span>
            </span>
          </button>
        </div>
      )}

      {/* CARD PREVIEW · 9:16 portrait */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '12px 16px',
      }}>
        <div style={{
          width: CARD_W, maxWidth: '100%', height: CARD_H,
          borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${C.line}`,
          background: C.bg,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
          position: 'relative',
        }}>
          {template === 'atleta-mes' && athlete && atletaStats && (
            <AtletaDelMes
              athlete={athlete}
              stats={atletaStats}
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
      <div style={{ padding: '6px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {template === 'atleta-mes' && (
          <button
            onClick={cycleTag}
            className="btn-press"
            style={{
              width: '100%', padding: '10px 0', borderRadius: 12,
              background: 'transparent', color: C.accent,
              border: `1px solid ${C.accent}55`,
              fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Cambiar frase ↻</button>
        )}
        {template === 'motivacional' && (
          <button
            onClick={cycleQuote}
            className="btn-press"
            style={{
              width: '100%', padding: '10px 0', borderRadius: 12,
              background: 'transparent', color: C.accent,
              border: `1px solid ${C.accent}55`,
              fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Cambiar cita ({quoteIdx + 1}/{QUOTES.length}) ↻</button>
        )}
        <button
          onClick={cycleTemplate}
          className="btn-press"
          style={{
            width: '100%', padding: '12px 0', borderRadius: 14,
            background: C.accent, color: C.onAccent, border: 'none',
            fontSize: 12, fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Cambiar template →</button>
        <p style={{ fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 4 }}>
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
  tag: string;
  monthName: string;
  boxName: string;
  scheme: ColorScheme;
  product: 'holy-oly' | 'volta';
}

const AtletaDelMes: React.FC<AtletaDelMesProps> = ({ athlete, stats, tag, monthName, boxName, scheme: C, product }) => {
  const initial = athlete.name.charAt(0).toUpperCase();
  const firstName = athlete.name.split(' ')[0];
  const lastName = athlete.name.split(' ').slice(1).join(' ');

  return (
    <div style={{
      width: '100%', height: '100%',
      background: `radial-gradient(circle at 50% 25%, ${C.accentDim} 0%, ${C.bg} 65%)`,
      padding: '32px 24px 28px',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Eyebrow */}
      <p style={{
        fontSize: 9, color: C.accent, fontWeight: 900,
        letterSpacing: '.24em', textTransform: 'uppercase', textAlign: 'center',
      }}>
        Atleta del mes · {monthName}
      </p>

      {/* Avatar ring */}
      <div style={{
        margin: '20px auto 14px',
        width: 140, height: 140, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.surface} 0%, ${C.bg} 100%)`,
        border: `3px solid ${C.accent}`,
        boxShadow: `0 0 40px ${C.accentDim}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 60, fontWeight: 900, color: C.accent,
          fontStyle: 'italic', letterSpacing: '-.04em',
        }}>{initial}</span>
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{
          fontSize: 26, fontWeight: 900, color: C.text,
          fontStyle: 'italic', letterSpacing: '-.02em', lineHeight: 1,
        }}>{firstName}</p>
        {lastName && (
          <p style={{
            fontSize: 18, fontWeight: 700, color: C.text,
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
        marginTop: 18,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
      }}>
        <Stat label="PR" value={`${stats.prValue}kg`} sub={stats.prLabel} scheme={C} />
        <Stat label="Asist" value={`${stats.completed}/${stats.planned || 7}`} sub="sesiones" scheme={C} />
        <Stat label="Streak" value={`${stats.streak}d`} sub="seguidos" scheme={C} />
      </div>

      {/* Tag motivacional */}
      <div style={{
        margin: '18px 0 0',
        padding: '10px 12px',
        background: C.accentDim,
        border: `1px solid ${C.accent}55`,
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 13, color: C.accent, fontWeight: 800,
          fontStyle: 'italic', letterSpacing: '-.01em',
        }}>“{tag}”</p>
      </div>

      {/* Branding inferior */}
      <div style={{
        marginTop: 'auto', paddingTop: 16,
        textAlign: 'center', borderTop: `1px solid ${C.line}`,
      }}>
        <p style={{
          fontSize: 9, color: C.muted, fontWeight: 800,
          letterSpacing: '.2em', textTransform: 'uppercase',
        }}>{boxName}</p>
        <p style={{
          fontSize: 10, color: C.accent, fontWeight: 900,
          letterSpacing: '.12em', marginTop: 4,
        }}>#{product === 'volta' ? 'SimBox' : 'HolyOly'}</p>
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
  boxName: string;
  scheme: ColorScheme;
  product: 'holy-oly' | 'volta';
}

const RecapSemanal: React.FC<RecapSemanalProps> = ({ recap, boxName, scheme: C, product }) => {
  const topMoverName = recap.topMover?.name.split(' ')[0] || '—';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: `radial-gradient(circle at 50% 0%, ${C.accentDim} 0%, ${C.bg} 70%)`,
      padding: '32px 22px 24px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Eyebrow */}
      <p style={{
        fontSize: 9, color: C.accent, fontWeight: 900,
        letterSpacing: '.24em', textTransform: 'uppercase', textAlign: 'center',
      }}>
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
        marginTop: 18,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        <KpiCard label="Sesiones" value={String(recap.sessions)} sub="totales" scheme={C} />
        <KpiCard label="Volumen" value={`${(recap.volumeKg / 1000).toFixed(1)}k`} sub="kg movidos" scheme={C} />
        <KpiCard label={product === 'volta' ? 'WODs Rx' : 'Sesiones Rx'} value={String(recap.rxCount)} sub="completos" scheme={C} />
        <KpiCard label="Top mover" value={topMoverName} sub="↑ fitness" scheme={C} small />
      </div>

      {/* TOP 3 */}
      <div style={{ marginTop: 16 }}>
        <p style={{
          fontSize: 9, color: C.muted, fontWeight: 800,
          letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Top 3 · tonelaje
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recap.top3.map((entry, i) => (
            <div key={entry.athlete.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              borderLeft: i === 0 ? `3px solid ${C.accent}` : `1px solid ${C.line}`,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 6,
                background: i === 0 ? C.accent : C.line,
                color: i === 0 ? C.onAccent : C.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 900,
              }}>{i + 1}</span>
              <p style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.text }}>
                {entry.athlete.name}
              </p>
              <p style={{
                fontSize: 11, fontWeight: 900, color: C.accent,
                fontVariantNumeric: 'tabular-nums',
              }}>{fmt(entry.tonelaje)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Branding inferior */}
      <div style={{
        marginTop: 'auto', paddingTop: 14,
        textAlign: 'center', borderTop: `1px solid ${C.line}`,
      }}>
        <p style={{
          fontSize: 9, color: C.muted, fontWeight: 800,
          letterSpacing: '.2em', textTransform: 'uppercase',
        }}>{boxName}</p>
        <p style={{
          fontSize: 10, color: C.accent, fontWeight: 900,
          letterSpacing: '.12em', marginTop: 4,
        }}>#{product === 'volta' ? 'SimBox' : 'HolyOly'}</p>
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
      <p style={{
        fontSize: 9, color: C.accent, fontWeight: 900,
        letterSpacing: '.28em', textTransform: 'uppercase', textAlign: 'center',
      }}>
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
      <div style={{
        textAlign: 'center', borderTop: `1px solid ${C.line}`, paddingTop: 14,
      }}>
        <p style={{
          fontSize: 9, color: C.muted, fontWeight: 800,
          letterSpacing: '.2em', textTransform: 'uppercase',
        }}>{boxName}</p>
        <p style={{
          fontSize: 10, color: C.accent, fontWeight: 900,
          letterSpacing: '.12em', marginTop: 4,
        }}>#{product === 'volta' ? 'SimBox' : 'HolyOly'}</p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SHARED MICRO-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const Stat: React.FC<{ label: string; value: string; sub: string; scheme: ColorScheme }> = ({ label, value, sub, scheme: C }) => (
  <div style={{
    padding: '10px 6px',
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    textAlign: 'center',
  }}>
    <p style={{
      fontSize: 8, color: C.muted, fontWeight: 800,
      letterSpacing: '.14em', textTransform: 'uppercase',
    }}>{label}</p>
    <p style={{
      fontSize: 18, fontWeight: 900, color: C.accent,
      fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, marginTop: 4,
    }}>{value}</p>
    <p style={{
      fontSize: 8, color: C.muted, fontWeight: 600,
      marginTop: 2,
    }}>{sub}</p>
  </div>
);

const KpiCard: React.FC<{ label: string; value: string; sub: string; scheme: ColorScheme; small?: boolean }> = ({ label, value, sub, scheme: C, small }) => (
  <div style={{
    padding: '12px 12px',
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
  }}>
    <p style={{
      fontSize: 9, color: C.muted, fontWeight: 800,
      letterSpacing: '.14em', textTransform: 'uppercase',
    }}>{label}</p>
    <p style={{
      fontSize: small ? 18 : 26, fontWeight: 900, color: C.accent,
      fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginTop: 6,
      letterSpacing: '-.02em',
    }}>{value}</p>
    <p style={{
      fontSize: 9, color: C.muted, fontWeight: 700,
      marginTop: 4,
    }}>{sub}</p>
  </div>
);

export default CoachViralTools;

import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

/**
 * PreWOD Share — pantalla 9:16 portrait optimizada para screenshot.
 *
 * Loop viral C.10 del SPEC: antes del WOD el atleta comparte un card
 * con el WOD del día. El screenshot ES el share (sin botones encima).
 *
 * Patrón consistente con SocialCard:
 *  - Sin share/save buttons sobre el área shareable.
 *  - Selector de variante FUERA del card (Stadium / Minimalist).
 *  - Footer con CTA "Volver" fuera del area capturable.
 *
 * No leemos WOD del día desde context aún (no existe estructura).
 * Hardcode un ejemplo realista — cuando exista WodOfTheDayContext se enchufa acá.
 */

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#94A3B8',
  cyan: '#00E5FF',
  gold: '#F5C518',
};

type Variant = 'stadium' | 'minimalist';

interface Movement {
  reps: string;
  name: string;
  load?: string;
}

interface Wod {
  name: string;
  format: string; // e.g. "21-15-9" o "AMRAP 12"
  movements: Movement[];
  timeCap?: string;
  scaling: 'Rx' | 'Scaled';
}

// WOD ejemplo. Reemplazar cuando exista wodOfTheDay en context.
const TODAY_WOD: Wod = {
  name: 'FRAN',
  format: '21-15-9',
  movements: [
    { reps: '21-15-9', name: 'Thrusters', load: '43kg' },
    { reps: '21-15-9', name: 'Pull-ups' },
  ],
  timeCap: '8:00',
  scaling: 'Rx',
};

const todayLabel = () =>
  new Date()
    .toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

const PrewodShare: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();
  const [variant, setVariant] = useState<Variant>('stadium');

  const wod = TODAY_WOD;
  const athleteName = athlete?.name.toUpperCase() ?? 'ATLETA';
  const club = athlete?.club.toUpperCase() ?? 'HOLY OLY CLUB';

  const toggleVariant = () => setVariant(v => (v === 'stadium' ? 'minimalist' : 'stadium'));

  return (
    <div
      style={{
        background: C.bg,
        minHeight: '100%',
        paddingBottom: 90,
        color: C.text,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header chico fuera del area shareable */}
      <div style={{ width: '100%', padding: '48px 16px 8px', textAlign: 'center' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '.3em',
            color: C.muted,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Pre-WOD · Share
        </p>
        <p style={{ fontSize: 11, color: C.muted, margin: '6px 0 0' }}>
          Sacá screenshot · subí a stories
        </p>
      </div>

      {/* CARD 9:16 portrait — esto es lo que se captura */}
      <div style={{ padding: 16 }}>
        <div
          style={{
            width: 360,
            height: 640, // aspect 9:16 = 360 × 640
            maxWidth: '100%',
            borderRadius: 24,
            overflow: 'hidden',
            border: `1px solid ${C.cyan}33`,
            position: 'relative',
            boxShadow: `0 20px 60px -20px ${C.cyan}22, 0 0 0 1px ${C.line}`,
          }}
        >
          {variant === 'stadium' ? (
            <StadiumWodCard wod={wod} athleteName={athleteName} club={club} />
          ) : (
            <MinimalistWodCard wod={wod} athleteName={athleteName} club={club} />
          )}
        </div>
      </div>

      {/* CTAs fuera del card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          maxWidth: 360,
          padding: '4px 16px 24px',
        }}
      >
        <button
          onClick={toggleVariant}
          className="btn-press"
          style={{
            padding: 12,
            background: C.surface,
            color: C.text,
            border: `1px solid ${C.cyan}55`,
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
          }}
        >
          Cambiar variante · {variant === 'stadium' ? 'Stadium' : 'Minimalist'}
        </button>
        <button
          onClick={() => navigate('VOLTA_PREWOD')}
          className="btn-press"
          style={{
            padding: 12,
            background: 'transparent',
            color: C.muted,
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
          }}
        >
          ← Volver al check pre-WOD
        </button>
      </div>
    </div>
  );
};

/* ────────────────────────── STADIUM variant ────────────────────────── */

interface CardProps {
  wod: Wod;
  athleteName: string;
  club: string;
}

const StadiumWodCard: React.FC<CardProps> = ({ wod, athleteName, club }) => {
  const bg = `radial-gradient(ellipse at 50% 25%, ${C.cyan}22 0%, transparent 60%), linear-gradient(180deg, #0A0A14 0%, #050509 100%)`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        position: 'relative',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Grid pattern sutil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.06,
          backgroundImage: `repeating-linear-gradient(0deg, ${C.cyan} 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, ${C.cyan} 0 1px, transparent 1px 40px)`,
          pointerEvents: 'none',
        }}
      />
      {/* Glow halo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '160%',
          aspectRatio: '1 / 1',
          transform: 'translate(-50%, -55%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.cyan}33 0%, transparent 55%)`,
          opacity: 0.4,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.35em',
              color: C.cyan,
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            PRE-WOD · {todayLabel()}
          </p>
          <p
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '.25em',
              color: 'rgba(255,255,255,0.5)',
              margin: '6px 0 0',
              textTransform: 'uppercase',
            }}
          >
            Holy Oly · Volta
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '.15em',
            color: C.gold,
            background: `${C.gold}18`,
            border: `1px solid ${C.gold}55`,
            padding: '3px 10px',
            borderRadius: 999,
            textTransform: 'uppercase',
            fontStyle: 'italic',
          }}
        >
          VOL
        </span>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '.4em',
            color: C.cyan,
            margin: '0 0 8px',
            textTransform: 'uppercase',
          }}
        >
          TU WOD DE HOY
        </p>
        <h1
          style={{
            fontSize: 56,
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            margin: 0,
            color: '#fff',
            textShadow: `0 4px 30px ${C.cyan}55`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {wod.name}
        </h1>
        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '.3em',
            color: C.cyan,
            margin: '10px 0 18px',
            fontStyle: 'italic',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {wod.format}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {wod.movements.map((m, i) => (
            <div
              key={i}
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '.02em',
                textTransform: 'uppercase',
                fontStyle: 'italic',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {m.name}
              {m.load && (
                <span style={{ color: C.cyan, marginLeft: 6, fontStyle: 'italic' }}>
                  · {m.load}
                </span>
              )}
            </div>
          ))}
        </div>

        {wod.timeCap && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: `${C.gold}18`,
              border: `1px solid ${C.gold}66`,
              color: C.gold,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              fontStyle: 'italic',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ⏱ Time cap {wod.timeCap}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            borderRadius: 16,
            padding: 14,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.cyan}33`,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.2em', color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase' }}>
              ATLETA
            </p>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: '3px 0 0', letterSpacing: '-0.01em' }}>
              {athleteName}
            </p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '.15em' }}>
              {club}
            </p>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '.15em',
              color: wod.scaling === 'Rx' ? C.cyan : C.gold,
              background: wod.scaling === 'Rx' ? `${C.cyan}18` : `${C.gold}18`,
              border: `1px solid ${wod.scaling === 'Rx' ? C.cyan : C.gold}66`,
              padding: '6px 12px',
              borderRadius: 999,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {wod.scaling}
          </div>
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
            color: 'rgba(255,255,255,0.45)',
            margin: 0,
          }}
        >
          holyoly.app · #VoltaPreWOD
        </p>
      </div>
    </div>
  );
};

/* ────────────────────────── MINIMALIST variant ────────────────────────── */

const MinimalistWodCard: React.FC<CardProps> = ({ wod, athleteName, club }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.surface} 100%)`,
        position: 'relative',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Diagonal lines pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: `repeating-linear-gradient(45deg, ${C.cyan} 0 1px, transparent 1px 18px)`,
          pointerEvents: 'none',
        }}
      />
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.3em', color: C.cyan, margin: 0, textTransform: 'uppercase' }}>
            PRE-WOD
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', color: C.muted, margin: '4px 0 0', textTransform: 'uppercase' }}>
            {todayLabel()}
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: C.gold,
            fontStyle: 'italic',
            letterSpacing: '.15em',
          }}
        >
          VOL
        </span>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ height: 2, width: 48, background: `${C.cyan}88`, marginBottom: 18 }} />
        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            margin: 0,
            color: C.text,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {wod.name}
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '.25em',
            color: C.cyan,
            margin: '10px 0 24px',
            fontStyle: 'italic',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {wod.format}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {wod.movements.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                borderBottom: `1px solid ${C.line}`,
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: C.text,
                  letterSpacing: '-0.01em',
                  textTransform: 'uppercase',
                }}
              >
                {m.name}
              </span>
              {m.load && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.cyan,
                    fontStyle: 'italic',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.load}
                </span>
              )}
            </div>
          ))}
        </div>

        {wod.timeCap && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '.3em',
              color: C.gold,
              margin: '20px 0 0',
              textTransform: 'uppercase',
              fontStyle: 'italic',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Time cap · {wod.timeCap}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: `1px solid ${C.line}`,
            paddingTop: 14,
            marginBottom: 10,
          }}
        >
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.2em', color: C.muted, margin: 0, textTransform: 'uppercase' }}>
              ATLETA
            </p>
            <p style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: '3px 0 0', letterSpacing: '-0.01em' }}>
              {athleteName}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.2em', color: C.muted, margin: 0, textTransform: 'uppercase' }}>
              CLUB · {wod.scaling}
            </p>
            <p style={{ fontSize: 12, fontWeight: 900, color: C.text, margin: '3px 0 0', letterSpacing: '-0.01em' }}>
              {club}
            </p>
          </div>
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 900,
            fontStyle: 'italic',
            color: C.muted,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          holyoly.app · #VoltaPreWOD
        </p>
      </div>
    </div>
  );
};

export default PrewodShare;

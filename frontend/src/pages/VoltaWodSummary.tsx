import React from 'react';
import { useNav } from '../context/NavigationContext';

/**
 * Resumen post-WOD CrossFit (Volta).
 *
 * Muestra score (rondas + reps), tiempo total, scaling usado,
 * comparación vs último intento, ranking en box hipotético.
 */

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  cyan: '#00E5FF',
  green: '#00E676',
  amber: '#FFB300',
};

// Mock data — en prod vendría del state de VoltaActiveWod
const RESULT = {
  wodTitle: 'AMRAP 20',
  scale: 'Rx' as 'Rx' | 'Scaled' | 'Beginner',
  rounds: 7,
  extraReps: 18,
  totalReps: 7 * 30 + 18, // 30 reps por ronda
  timeUsed: '20:00',
  previousBest: { rounds: 6, extraReps: 25 },
  rxBoxRanking: { position: 8, total: 23 },
};

const VoltaWodSummary: React.FC = () => {
  const { navigate } = useNav();

  const prevTotal = RESULT.previousBest.rounds * 30 + RESULT.previousBest.extraReps;
  const isPR = RESULT.totalReps > prevTotal;
  const delta = RESULT.totalReps - prevTotal;

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 110, color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '52px 16px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: C.cyan, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          WOD Completado
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginTop: 4, letterSpacing: '-.02em' }}>
          {RESULT.wodTitle}
        </h1>
        <div style={{
          display: 'inline-block', marginTop: 8,
          fontSize: 10, fontWeight: 800, padding: '3px 10px',
          background: `${C.cyan}20`, color: C.cyan, borderRadius: 8,
          border: `1px solid ${C.cyan}40`, letterSpacing: '.06em',
        }}>{RESULT.scale.toUpperCase()}</div>
      </div>

      {/* SCORE HERO */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.cyan}15, ${C.green}10)`,
          border: `1px solid ${C.cyan}30`,
          borderRadius: 20, padding: '24px 20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Tu score
          </p>
          <p style={{
            fontSize: 56, fontWeight: 900, color: C.cyan, lineHeight: 1.1, letterSpacing: '-.04em',
            marginTop: 6, fontVariantNumeric: 'tabular-nums',
          }}>
            {RESULT.rounds}<span style={{ fontSize: 28, color: C.text }}> + {RESULT.extraReps}</span>
          </p>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            Rondas + reps · <span style={{ color: C.text }}>{RESULT.totalReps} reps totales</span> · {RESULT.timeUsed}
          </p>

          {isPR && (
            <div style={{
              marginTop: 14, padding: '8px 14px',
              background: `${C.green}20`, border: `1px solid ${C.green}40`,
              borderRadius: 10, display: 'inline-block',
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.green, letterSpacing: '.04em' }}>
                🏆 PR personal · +{delta} reps vs último
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RANKING */}
      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Ranking del box (Rx)
        </p>
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: C.amber, lineHeight: 1 }}>
              #{RESULT.rxBoxRanking.position}
            </p>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              de {RESULT.rxBoxRanking.total} atletas Rx
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>
              Top {Math.round((RESULT.rxBoxRanking.position / RESULT.rxBoxRanking.total) * 100)}%
            </p>
            <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>de tu box hoy</p>
          </div>
        </div>
      </div>

      {/* BREAKDOWN */}
      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Vs último intento
        </p>
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, color: C.muted }}>Anterior</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 2 }}>
                {RESULT.previousBest.rounds} + {RESULT.previousBest.extraReps}
              </p>
            </div>
            <span style={{ fontSize: 18, color: C.muted }}>→</span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: C.green }}>Hoy</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.green, marginTop: 2 }}>
                {RESULT.rounds} + {RESULT.extraReps}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTAS */}
      <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => navigate('VOLTA_WOD_LOG')}
          style={{
            padding: '14px 0', borderRadius: 14,
            background: `linear-gradient(135deg, ${C.cyan}, #0070FF)`, color: '#07070F', border: 'none',
            fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em',
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
            boxShadow: '0 8px 24px rgba(0,229,255,0.35)',
          }}
        >Loggear resultado oficial →</button>
        <button
          onClick={() => navigate('VOLTA_HOME')}
          style={{
            padding: '14px 0', borderRadius: 14,
            background: C.cyan + '22', color: C.cyan, border: `1px solid ${C.cyan}55`,
            fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em',
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}
        >Compartir en el box</button>
        <button
          onClick={() => navigate('VOLTA_HOME')}
          style={{
            padding: '12px 0', borderRadius: 14,
            background: C.surface, color: C.text, border: `1px solid ${C.line}`,
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}
        >Volver al inicio</button>
      </div>
    </div>
  );
};

export default VoltaWodSummary;

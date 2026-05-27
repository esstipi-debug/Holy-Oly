import React from 'react';
import { useNav } from '../context/NavigationContext';

/**
 * VoltaWodSummary · resumen post-WOD informativo.
 *
 * Diseño:
 *  - Score hero + scale badge
 *  - Detalle del WOD (qué ejercicios, reps por ronda, carga)
 *  - Stats: tonelaje total movido, tiempo por ronda, calorías est, ritmo cardíaco
 *  - Ranking del box
 *  - Vs último intento
 *  - Sin botones grandes (atleta toma screenshot)
 *
 * Mock data por ahora · TODO conectar con state de VoltaActiveWod cuando exista.
 */

const C = {
  bg: '#07070F', surface: '#0F0F1C', surface2: '#161626', line: '#1E1E32',
  text: '#EAEAF5', muted: '#94A3B8', dim: '#52527A',
  cyan: '#00E5FF', green: '#22C55E', amber: '#FFB300', red: '#FF3D00', primary: '#7C5CFF',
};

interface MovementInSession { name: string; reps_per_round: number; weight_kg?: number; equipment?: string; type: 'cardio' | 'strength' | 'gymnastics' }

const SESSION = {
  // WOD descriptor
  wodTitle:    'AMRAP 20',
  mode:        'AMRAP' as 'AMRAP' | 'FOR TIME' | 'EMOM',
  scale:       'Rx' as 'Rx+' | 'Rx' | 'Scaled' | 'Beginner',
  description: '20 min · 1 ronda = 5 C&J + 10 Pull-ups + 15 Burpees',
  movements: [
    { name: 'Clean & Jerk',    reps_per_round: 5,  weight_kg: 60, equipment: '60kg ♂ / 43kg ♀', type: 'strength' as const },
    { name: 'Pull-ups',        reps_per_round: 10, equipment: 'Kipping permitido',              type: 'gymnastics' as const },
    { name: 'Burpees over bar',reps_per_round: 15, equipment: 'Sobre la barra',                  type: 'cardio' as const },
  ] as MovementInSession[],

  // Resultado del atleta
  rounds:        7,
  extraReps:     18,
  timeUsed_sec:  1200,  // 20 min full

  // Métricas derivadas (calculadas)
  previousBest: { rounds: 6, extraReps: 25 },
  rxBoxRanking: { position: 8, total: 23 },
};

const VoltaWodSummary: React.FC = () => {
  const { navigate } = useNav();

  // Leer score real desde draft de VoltaActiveWod (si existe)
  const draft = (() => {
    try { return JSON.parse(localStorage.getItem('volta_wod:score_draft') ?? '{}') as Record<string, unknown>; }
    catch { return {} as Record<string, unknown>; }
  })();
  const rounds    = typeof draft.rounds    === 'number' ? draft.rounds    : SESSION.rounds;
  const extraReps = typeof draft.extra_reps === 'number' ? draft.extra_reps : SESSION.extraReps;
  const scale     = typeof draft.scale     === 'string'  ? draft.scale as typeof SESSION.scale : SESSION.scale;

  // Cálculos
  const repsPerRound = SESSION.movements.reduce((sum, m) => sum + m.reps_per_round, 0);
  const totalReps = rounds * repsPerRound + extraReps;
  const prevTotal = SESSION.previousBest.rounds * repsPerRound + SESSION.previousBest.extraReps;
  const isPR = totalReps > prevTotal;
  const delta = totalReps - prevTotal;

  // Tonelaje · solo cuenta movimientos con peso
  const tonelaje = SESSION.movements
    .filter(m => m.weight_kg)
    .reduce((sum, m) => sum + (m.weight_kg! * m.reps_per_round * rounds), 0);

  // Distribución por tipo (% de reps totales)
  const distByType = ['cardio', 'strength', 'gymnastics'].map(type => {
    const reps = SESSION.movements
      .filter(m => m.type === type)
      .reduce((sum, m) => sum + m.reps_per_round * rounds, 0);
    return { type, reps, pct: Math.round((reps / (repsPerRound * rounds)) * 100) };
  });

  // Tiempo por ronda promedio (segundos)
  const timePerRoundSec = rounds > 0 ? Math.round(SESSION.timeUsed_sec / rounds) : 0;
  const minPerRound = Math.floor(timePerRoundSec / 60);
  const secPerRound = timePerRoundSec % 60;

  // Calorías estimadas (heurística simple: 8-12 cal/min para CrossFit moderado · 10 cal/min × 20 min)
  const caloriesEst = Math.round((SESSION.timeUsed_sec / 60) * 10);

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '16px 16px 14px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: C.cyan, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          WOD COMPLETADO
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginTop: 4, letterSpacing: '-.02em', fontStyle: 'italic' }}>
          {SESSION.wodTitle}
        </h1>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '4px 10px',
            background: `${C.cyan}22`, color: C.cyan, borderRadius: 8,
            border: `1px solid ${C.cyan}44`, letterSpacing: '.06em',
          }}>{scale.toUpperCase()}</span>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>·</span>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{SESSION.mode}</span>
        </div>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 10, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          {SESSION.description}
        </p>
      </div>

      {/* SCORE HERO */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.cyan}15, ${C.green}10)`,
          border: `1px solid ${C.cyan}30`,
          borderRadius: 20, padding: '22px 20px', textAlign: 'center',
          boxShadow: `0 0 28px ${C.cyan}10`,
        }}>
          <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            TU SCORE
          </p>
          <p style={{
            fontSize: 64, fontWeight: 900, color: C.cyan, lineHeight: 1.1,
            letterSpacing: '-.04em', marginTop: 4, fontVariantNumeric: 'tabular-nums', fontStyle: 'italic',
          }}>
            {rounds}<span style={{ fontSize: 32, color: C.text }}> + {extraReps}</span>
          </p>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            <span style={{ color: C.text, fontWeight: 700 }}>{totalReps}</span> reps totales · {Math.floor(SESSION.timeUsed_sec/60)}:{String(SESSION.timeUsed_sec%60).padStart(2,'0')}
          </p>
          {isPR && (
            <div style={{
              marginTop: 14, padding: '8px 14px',
              background: `${C.green}22`, border: `1px solid ${C.green}55`,
              borderRadius: 10, display: 'inline-block',
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.green, letterSpacing: '.04em' }}>
                🏆 PR personal · +{delta} reps vs último
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MOVIMIENTOS DEL WOD */}
      <div style={{ padding: '0 16px 14px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Movimientos · {repsPerRound} reps por ronda
        </p>
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, overflow: 'hidden',
        }}>
          {SESSION.movements.map((m, i) => {
            const totalRepsForMovement = m.reps_per_round * rounds;
            const movementVolume = m.weight_kg ? m.weight_kg * totalRepsForMovement : null;
            return (
              <div
                key={m.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 900, padding: '3px 7px', borderRadius: 6,
                  background: m.type === 'cardio' ? 'rgba(86,204,242,0.15)'
                            : m.type === 'strength' ? 'rgba(245,197,24,0.15)'
                            : 'rgba(34,197,94,0.15)',
                  color: m.type === 'cardio' ? '#56CCF2' : m.type === 'strength' ? '#F5C518' : C.green,
                  textTransform: 'uppercase', letterSpacing: '.06em',
                }}>{m.type === 'cardio' ? 'CAR' : m.type === 'strength' ? 'STR' : 'GYM'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: 0 }}>
                    {m.reps_per_round} × {m.name}
                  </p>
                  <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0' }}>
                    {m.equipment}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 900, color: C.text, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {totalRepsForMovement}
                  </p>
                  <p style={{ fontSize: 9, color: C.muted, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    reps totales
                  </p>
                  {movementVolume != null && (
                    <p style={{ fontSize: 9, color: C.amber, margin: '2px 0 0', fontWeight: 800 }}>
                      {movementVolume.toLocaleString('es')} kg
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{ padding: '0 16px 14px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Métricas de la sesión
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Stat label="Tonelaje movido" value={tonelaje.toLocaleString('es')} unit="kg" sub={`${(tonelaje/1000).toFixed(2)} toneladas`} accent={C.amber} />
          <Stat label="Tiempo / ronda" value={`${minPerRound}:${String(secPerRound).padStart(2,'0')}`} unit="" sub={`${rounds} rondas completas`} accent={C.cyan} />
          <Stat label="Calorías est." value={String(caloriesEst)} unit="cal" sub="≈10 cal/min CF moderado" accent={C.red} />
          <Stat label="Ritmo" value={`${(totalReps / (SESSION.timeUsed_sec/60)).toFixed(1)}`} unit="reps/min" sub={`${totalReps} reps en 20 min`} accent={C.primary} />
        </div>
      </div>

      {/* DISTRIBUCIÓN POR TIPO */}
      <div style={{ padding: '0 16px 14px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Distribución del esfuerzo
        </p>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
          {distByType.filter(d => d.pct > 0).map(d => (
            <div key={d.type} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: 'capitalize' }}>{d.type}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: d.type === 'cardio' ? '#56CCF2' : d.type === 'strength' ? C.amber : C.green }}>
                  {d.pct}% · {d.reps} reps
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${d.pct}%`, transition: 'width .6s ease',
                  background: d.type === 'cardio' ? '#56CCF2' : d.type === 'strength' ? C.amber : C.green,
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RANKING */}
      <div style={{ padding: '0 16px 14px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Ranking del box (Rx)
        </p>
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`,
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: C.amber, lineHeight: 1, fontStyle: 'italic' }}>
              #{SESSION.rxBoxRanking.position}
            </p>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              de {SESSION.rxBoxRanking.total} atletas Rx
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: C.text, fontWeight: 800 }}>
              Top {Math.round((SESSION.rxBoxRanking.position / SESSION.rxBoxRanking.total) * 100)}%
            </p>
            <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>de tu box hoy</p>
          </div>
        </div>
      </div>

      {/* VS ÚLTIMO INTENTO */}
      <div style={{ padding: '0 16px 14px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Vs último intento
        </p>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Anterior</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 2 }}>
                {SESSION.previousBest.rounds} + {SESSION.previousBest.extraReps}
              </p>
              <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{prevTotal} reps</p>
            </div>
            <span style={{ fontSize: 20, color: isPR ? C.green : C.muted }}>→</span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: isPR ? C.green : C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Hoy</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: isPR ? C.green : C.text, marginTop: 2 }}>
                {rounds} + {extraReps}
              </p>
              <p style={{ fontSize: 9, color: isPR ? C.green : C.muted, marginTop: 2 }}>
                {isPR ? `+${delta}` : delta < 0 ? `${delta}` : '='} reps
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => navigate('VOLTA_WOD_LOG')}
          style={{
            padding: '14px 0', borderRadius: 14,
            background: `linear-gradient(135deg, ${C.cyan}, #0070FF)`, color: '#07070F', border: 'none',
            fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em',
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
            boxShadow: '0 8px 24px rgba(0,229,255,0.30)',
          }}
        >Loggear oficialmente →</button>
        <button
          onClick={() => navigate('VOLTA_HOME')}
          style={{
            padding: '12px 0', borderRadius: 14,
            background: C.surface2, color: C.muted,
            border: `1px solid ${C.line}`,
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}
        >Volver al inicio</button>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; unit: string; sub: string; accent: string }> = ({ label, value, unit, sub, accent }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.line}`,
    borderRadius: 12, padding: '12px 14px',
  }}>
    <p style={{ fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
      <span style={{ fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1, fontStyle: 'italic', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {unit && <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{unit}</span>}
    </div>
    <p style={{ fontSize: 9, color: C.muted, margin: '4px 0 0', lineHeight: 1.3 }}>{sub}</p>
  </div>
);

export default VoltaWodSummary;

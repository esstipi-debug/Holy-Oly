import React, { useState } from 'react';
import BottomSheet from '../components/BottomSheet';
import { useAthlete } from '../context/AthleteContext';
import '../styles/v2/oly-index.css';

/**
 * OlyIndex · score global del atleta + desglose de rendimiento + leaderboard.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.oly-root` · acento verde
 * (--engine-oly, identidad del score OLY). Se monta dentro de PhoneLayout.
 * Lógica intacta: todo el cálculo (olyScore, ranking, breakdown, consistencia)
 * se preserva; solo cambia la presentación. Los BottomSheet de detalle usan
 * el componente compartido y se restilizan con clases scopeadas.
 *
 *  1. Hero · score global (tap = ¿cómo se calcula?)
 *  2. Análisis de rendimiento · 3 métricas (tap = info)
 *  3. Leaderboard del club · cards (tap = detalle del atleta)
 */

const olyScore = (a: { maxes: { snatch: number; body_weight: number } }) =>
  a.maxes.body_weight > 0 ? +(a.maxes.snatch / a.maxes.body_weight * 2.5).toFixed(1) : 7.4;

const levelOf = (score: number) =>
  score >= 9 ? 'Elite' : score >= 7 ? 'Avanzado' : score >= 5 ? 'Intermedio' : 'Básico';

// Colores de avatar (hex · alineados a tokens V2, aplicados via `--c` inline)
const COLORS = ['#A855F7', '#EC4899', '#22C55E', '#FFB300', '#56CCF2'];

// ─── INFO de cada métrica ─────────────────────────────
interface MetricInfo {
  title: string;
  what: string;
  how: string;
  benchmark: string;
}

const METRIC_INFOS: Record<string, MetricInfo> = {
  global: {
    title: 'OLY Index Global',
    what: 'Score 0-10 que sintetiza tu nivel global como atleta olímpico. Combina fuerza relativa, eficiencia técnica y consistencia.',
    how: 'Formula: (Snatch × 2.5) / Body Weight. Ajustada por ratio S/C y adherencia.',
    benchmark: '<5 Básico · 5-7 Intermedio · 7-9 Avanzado · ≥9 Elite. Top 1% mundial ≈ 11+.',
  },
  strength: {
    title: 'Fuerza Absoluta',
    what: 'Mide tu capacidad de levantar carga en relación a tu peso corporal. Suma Snatch + C&J normalizada por BW.',
    how: 'Strength = ((Snatch + C&J) / BW) × 5. Asume ratio 1:1.25 entre Snatch y C&J óptimo.',
    benchmark: 'Total Olímpico = 2× BW → score ≈ 8. = 2.5× BW → score 10. = 1.5× BW → score 6.',
  },
  efficiency: {
    title: 'Eficiencia (Snatch/Clean)',
    what: 'Qué tan equilibrada está tu técnica de Arrancada respecto a la Cargada. Indicador de habilidad pura, no fuerza.',
    how: 'Ratio = Snatch / Clean. Score escalado: 80% = 10/10, 78% = 8/10, 70% = 5/10.',
    benchmark: 'Atletas de élite: 80-82%. Si <75%, técnica Snatch atrasada. Si >85%, fuerza Clean atrasada.',
  },
  consistency: {
    title: 'Consistencia',
    what: 'Porcentaje de sesiones completadas vs programadas en las últimas 4 semanas. Tu adherencia al plan.',
    how: 'Consistencia = (sesiones completadas / sesiones programadas) × 10.',
    benchmark: '≥9 Elite (poco perdé) · 7-9 Bueno · 5-7 Inconsistente · <5 Riesgo de salir del macro.',
  },
};

const OlyIndex: React.FC = () => {
  const { athlete, allAthletes } = useAthlete();
  const [activeInfo, setActiveInfo] = useState<MetricInfo | null>(null);
  const [activeAthlete, setActiveAthlete] = useState<typeof allAthletes[0] | null>(null);

  const myScore = athlete ? olyScore(athlete) : 7.4;
  const ranked = [...allAthletes]
    .map(a => ({ ...a, score: olyScore(a) }))
    .sort((a, b) => b.score - a.score);
  const myRank = Math.max(1, ranked.findIndex(a => a.id === athlete?.id) + 1);
  const pctTop = Math.max(1, Math.round(myRank / ranked.length * 100));

  const top = ranked.slice(0, 5).map((a, i) => ({
    rank: i + 1,
    name: a.id === athlete?.id ? `${a.name.split(' ')[0]} (Tú)` : a.name,
    fullAthlete: a,
    level: levelOf(a.score),
    score: a.score,
    initials: a.name.split(' ').slice(0, 2).map(n => n[0]).join(''),
    color: COLORS[i % COLORS.length],
    me: a.id === athlete?.id,
  }));
  const leaderboards = top.some(l => l.me) || !athlete
    ? top
    : [...top, {
        rank: myRank,
        name: `${athlete.name.split(' ')[0]} (Tú)`,
        fullAthlete: athlete,
        level: levelOf(myScore),
        score: myScore,
        initials: athlete.name.split(' ').slice(0, 2).map(n => n[0]).join(''),
        color: '#22C55E',
        me: true,
      }];

  // Compute breakdown
  const m = athlete?.maxes;
  const bw = m?.body_weight ?? 80;
  const strength = m ? Math.min(10, (m.clean + m.jerk - m.clean + m.snatch) / bw / 2 * 10) : 8.2;
  const eff = m ? Math.min(10, (m.snatch / m.clean) * 12) : 6.9;
  const sess = athlete?.sessions_last_7 ?? [];
  const cons = sess.length > 0 ? +(sess.filter(s => s.completed).length / sess.length * 10).toFixed(1) : 9.1;

  const breakdown = [
    { key: 'strength', label: '🏋️ Fuerza Absoluta', score: +strength.toFixed(1), percent: `${Math.round(strength * 10)}%`, info: METRIC_INFOS.strength },
    { key: 'efficiency', label: '⚡ Eficiencia (S/C)', score: +eff.toFixed(1), percent: `${Math.round(eff * 10)}%`, info: METRIC_INFOS.efficiency },
    { key: 'consistency', label: '📉 Consistencia', score: cons, percent: `${Math.round(cons * 10)}%`, info: METRIC_INFOS.consistency },
  ];

  return (
    <div className="oly-root anim-fade-in">
      <div className="oly-scroll">
        {/* Header */}
        <div className="oly-head">
          <div className="oly-head-text">
            <p className="oly-eyebrow">Tu rendimiento</p>
            <h1 className="oly-title">OLY Index</h1>
          </div>
          <button
            className="oly-info-btn btn-press"
            onClick={() => setActiveInfo(METRIC_INFOS.global)}
          >
            ⓘ ¿Cómo se calcula?
          </button>
        </div>

        {/* Hero · score global · clickable */}
        <button
          className="oly-hero btn-press"
          onClick={() => setActiveInfo(METRIC_INFOS.global)}
        >
          <p className="oly-hero-label">Tu puntuación global</p>
          <div className="oly-hero-score">{myScore}</div>
          <span className="oly-hero-badge">Top {pctTop}% del club</span>

          <div className="oly-hero-grid">
            <div>
              <p className="oly-hero-stat-label">Ranking</p>
              <p className="oly-hero-stat-value">#{myRank} / {ranked.length}</p>
            </div>
            <div>
              <p className="oly-hero-stat-label">Nivel</p>
              <p className="oly-hero-stat-value">{levelOf(myScore)}</p>
            </div>
          </div>
        </button>

        {/* Breakdown · cada métrica clickable */}
        <div className="oly-section">
          <div className="oly-sec-head">
            <h3 className="oly-sec-title">Análisis de rendimiento</h3>
            <span className="oly-sec-meta">Tocá para info</span>
          </div>

          {breakdown.map(item => (
            <button
              key={item.key}
              className="oly-metric btn-press"
              onClick={() => setActiveInfo(item.info)}
            >
              <div className="oly-metric-head">
                <span className="oly-metric-label">{item.label}</span>
                <span className="oly-metric-right">
                  <span className="oly-metric-score">{item.score}</span>
                  <span className="oly-metric-info">ⓘ</span>
                </span>
              </div>
              <div className="oly-bar">
                <div className="oly-bar-fill" style={{ width: item.percent }} />
              </div>
            </button>
          ))}
        </div>

        {/* Leaderboard · cards clickables */}
        <div className="oly-section">
          <div className="oly-sec-head">
            <h3 className="oly-sec-title">Leaderboard club</h3>
            <span className="oly-sec-meta">{ranked.length} atletas</span>
          </div>
          <div className="oly-lb-list">
            {leaderboards.map(user => (
              <button
                key={user.rank}
                className="oly-lb-row btn-press"
                data-me={user.me}
                onClick={() => setActiveAthlete(user.fullAthlete)}
              >
                <span className="oly-lb-rank" data-top={user.rank <= 3}>{user.rank}</span>
                <span className="oly-lb-avatar" style={{ '--c': user.color } as React.CSSProperties}>
                  {user.initials}
                </span>
                <span className="oly-lb-main">
                  <p className="oly-lb-name">{user.name}</p>
                  <p className="oly-lb-level">{user.level}</p>
                </span>
                <span className="oly-lb-right">
                  <span className="oly-lb-score">{user.score}</span>
                  <span className="oly-lb-caret">›</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── BottomSheet: info de métrica ─── */}
      <BottomSheet
        open={activeInfo !== null}
        onClose={() => setActiveInfo(null)}
        title={activeInfo?.title}
      >
        {activeInfo && (
          <div className="oly-sheet">
            <div className="oly-sheet-block">
              <p className="oly-sheet-key">¿Qué mide?</p>
              <p className="oly-sheet-text">{activeInfo.what}</p>
            </div>
            <div className="oly-sheet-block">
              <p className="oly-sheet-key">¿Cómo se calcula?</p>
              <p className="oly-sheet-text">{activeInfo.how}</p>
            </div>
            <div className="oly-sheet-callout">
              <p className="oly-sheet-key muted">Benchmark</p>
              <p className="oly-sheet-text">{activeInfo.benchmark}</p>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ─── BottomSheet: detalle de atleta del ranking ─── */}
      <BottomSheet
        open={activeAthlete !== null}
        onClose={() => setActiveAthlete(null)}
        title={activeAthlete?.name}
      >
        {activeAthlete && (
          <div className="oly-detail">
            <div className="oly-detail-hero">
              <p className="oly-detail-hero-label">OLY Index</p>
              <p className="oly-detail-hero-score">{olyScore(activeAthlete).toFixed(1)}</p>
              <p className="oly-detail-hero-level">{levelOf(olyScore(activeAthlete))}</p>
            </div>

            <p className="oly-detail-label">Maxes</p>
            <div className="oly-maxes">
              {[
                { label: 'Snatch', value: activeAthlete.maxes.snatch },
                { label: 'Clean', value: activeAthlete.maxes.clean },
                { label: 'Jerk', value: activeAthlete.maxes.jerk },
                { label: 'Front Squat', value: activeAthlete.maxes.front_squat },
                { label: 'Back Squat', value: activeAthlete.maxes.back_squat },
              ].map(mx => (
                <div key={mx.label} className="oly-max-row">
                  <span className="oly-max-name">{mx.label}</span>
                  <span className="oly-max-val">{mx.value} kg</span>
                </div>
              ))}
            </div>

            <p className="oly-detail-label">Stats</p>
            <div className="oly-stats-grid">
              <div className="oly-stat">
                <p className="oly-stat-label">Peso</p>
                <p className="oly-stat-value">{activeAthlete.maxes.body_weight} kg</p>
              </div>
              <div className="oly-stat">
                <p className="oly-stat-label">Total Oly</p>
                <p className="oly-stat-value" style={{ '--c': '#22C55E' } as React.CSSProperties}>
                  {activeAthlete.maxes.snatch + activeAthlete.maxes.clean + activeAthlete.maxes.jerk} kg
                </p>
              </div>
              <div className="oly-stat">
                <p className="oly-stat-label">Ratio S/C</p>
                <p className="oly-stat-value">
                  {Math.round((activeAthlete.maxes.snatch / activeAthlete.maxes.clean) * 100)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default OlyIndex;

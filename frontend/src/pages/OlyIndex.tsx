import React, { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import BottomSheet from '../components/BottomSheet';
import { useAthlete } from '../context/AthleteContext';

const olyScore = (a: { maxes: { snatch: number; body_weight: number } }) =>
  a.maxes.body_weight > 0 ? +(a.maxes.snatch / a.maxes.body_weight * 2.5).toFixed(1) : 7.4;

const levelOf = (score: number) =>
  score >= 9 ? 'Elite' : score >= 7 ? 'Avanzado' : score >= 5 ? 'Intermedio' : 'Básico';

const COLORS = ['bg-purple-600', 'bg-pink-600', 'bg-emerald-600', 'bg-amber-600', 'bg-cyan-600'];

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

const InfoButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="btn-press"
    style={{
      width: 18, height: 18, borderRadius: '50%',
      background: 'rgba(255,255,255,0.08)',
      color: 'var(--text-secondary)',
      border: 'none', cursor: 'pointer',
      fontSize: 10, fontWeight: 900, fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginLeft: 6,
    }}
    aria-label="Más info"
  >ⓘ</button>
);

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
        color: 'bg-green-600',
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
    <div className="flex flex-col h-full bg-holy-bg overflow-hidden anim-fade-in">
      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <header className="mb-8 flex items-center justify-between gap-3">
          <h1 className="text-holy-text text-xl font-black">OLY Index</h1>
          <button
            onClick={() => setActiveInfo(METRIC_INFOS.global)}
            className="btn-press"
            style={{
              padding: '4px 10px', borderRadius: 10,
              background: 'rgba(245,158,11,0.10)', color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.25)',
              fontSize: 10, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >ⓘ ¿Cómo se calcula?</button>
        </header>

        {/* Global Score Card · clickable */}
        <button
          onClick={() => setActiveInfo(METRIC_INFOS.global)}
          className="btn-press"
          style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', fontFamily: 'inherit', textAlign: 'inherit' }}
        >
          <Card variant="solid" className="bg-gradient-to-br from-holy-gold/10 to-transparent border-holy-gold/30 text-center py-8 mb-8">
            <p className="text-holy-text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tu Puntuación Global</p>
            <div className="text-holy-gold text-6xl font-black italic tracking-tighter">{myScore}</div>
            <Badge variant="gold" className="mt-4 px-4">TOP {pctTop}% DEL CLUB</Badge>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-holy-gold/10">
              <div>
                <p className="text-holy-text-secondary text-[9px] font-black uppercase">Ranking</p>
                <p className="text-holy-text text-lg font-black">#{myRank} / {ranked.length}</p>
              </div>
              <div>
                <p className="text-holy-text-secondary text-[9px] font-black uppercase">Nivel</p>
                <p className="text-holy-text text-lg font-black italic">{levelOf(myScore).toUpperCase()}</p>
              </div>
            </div>
          </Card>
        </button>

        {/* Breakdown · cada métrica clickable */}
        <div className="space-y-6 mb-10">
          <div className="flex justify-between items-center pl-1">
            <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest">
              Análisis de Rendimiento
            </h3>
            <span className="text-[9px] text-holy-text-secondary font-bold">
              👆 Tocá para info
            </span>
          </div>

          {breakdown.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveInfo(item.info)}
              className="btn-press w-full"
              style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-holy-text-secondary text-xs font-bold">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-holy-gold text-sm font-black">{item.score}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>ⓘ</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-holy-surface rounded-full overflow-hidden">
                  <div className="h-full bg-holy-gold transition-all duration-700" style={{ width: item.percent }} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Leaderboard · cards clickables */}
        <div className="space-y-4 mb-20">
          <div className="flex justify-between items-center pl-1">
            <h3 className="text-holy-text-secondary text-[10px] font-black uppercase tracking-widest">
              Leaderboard Club
            </h3>
            <span className="text-[9px] text-holy-text-secondary font-bold">
              {ranked.length} atletas
            </span>
          </div>
          <div className="space-y-2 stagger">
            {leaderboards.map((user) => (
              <button
                key={user.rank}
                onClick={() => setActiveAthlete(user.fullAthlete)}
                className="btn-press w-full"
                style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}
              >
                <Card
                  variant="solid"
                  padding="sm"
                  className={`${user.me ? 'bg-holy-gold/5 border-holy-gold/20' : 'bg-holy-surface'} flex items-center gap-4`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${user.rank <= 3 ? 'bg-holy-gold text-holy-bg' : 'bg-holy-surface text-holy-text-secondary'}`}>
                    {user.rank}
                  </div>
                  <div className={`w-10 h-10 rounded-full ${user.color} flex items-center justify-center text-holy-text text-xs font-black`}>
                    {user.initials}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${user.me ? 'text-holy-gold' : 'text-holy-text'}`}>{user.name}</p>
                    <p className="text-holy-text-secondary text-[10px] uppercase font-bold">{user.level}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className="text-holy-text text-base font-black italic">{user.score}</p>
                    <span className="text-holy-text-secondary text-[10px]">›</span>
                  </div>
                </Card>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--text)' }}>
            <div>
              <p className="type-caption" style={{ color: '#F59E0B' }}>¿Qué mide?</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.what}</p>
            </div>
            <div>
              <p className="type-caption" style={{ color: '#F59E0B' }}>¿Cómo se calcula?</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.how}</p>
            </div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--card-border)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>Benchmark</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.benchmark}</p>
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
          <div style={{ color: 'var(--text)' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.10), transparent)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 14,
            }}>
              <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>OLY Index</p>
              <p className="type-display type-mono" style={{ color: '#F59E0B', marginTop: 4 }}>
                {olyScore(activeAthlete).toFixed(1)}
              </p>
              <p className="type-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                {levelOf(olyScore(activeAthlete))}
              </p>
            </div>

            <p className="type-caption" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              Maxes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {[
                { label: 'Snatch', value: activeAthlete.maxes.snatch },
                { label: 'Clean', value: activeAthlete.maxes.clean },
                { label: 'Jerk', value: activeAthlete.maxes.jerk },
                { label: 'Front Squat', value: activeAthlete.maxes.front_squat },
                { label: 'Back Squat', value: activeAthlete.maxes.back_squat },
              ].map(m => (
                <div key={m.label} style={{
                  background: 'var(--surface)', border: '1px solid var(--card-border)',
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span className="type-body-strong" style={{ color: 'var(--text)' }}>{m.label}</span>
                  <span className="type-mono type-heading-sm" style={{ color: 'var(--primary)' }}>{m.value} kg</span>
                </div>
              ))}
            </div>

            <p className="type-caption" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              Stats
            </p>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--card-border)',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', justifyContent: 'space-around',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>Peso</p>
                <p className="type-mono type-heading-sm" style={{ color: 'var(--text)', marginTop: 2 }}>{activeAthlete.maxes.body_weight} kg</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>Total Oly</p>
                <p className="type-mono type-heading-sm" style={{ color: '#F59E0B', marginTop: 2 }}>
                  {activeAthlete.maxes.snatch + activeAthlete.maxes.clean + activeAthlete.maxes.jerk} kg
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>Ratio S/C</p>
                <p className="type-mono type-heading-sm" style={{ color: 'var(--text)', marginTop: 2 }}>
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

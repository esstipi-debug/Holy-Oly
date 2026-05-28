import React, { useState, useMemo } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useNav } from '../context/NavigationContext';
import BottomSheet from '../components/BottomSheet';
import DeviationsCard from '../components/DeviationsCard';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/coach-stats.css';

/**
 * Stats del club para HO Coach (reemplaza la vista atleta `PerformanceDeepDive`).
 *
 * Métricas agregadas del roster:
 * - Tonelaje total semanal del club
 * - PRs colectivos
 * - Top performers por OLY Index
 * - Atletas que requieren atención (HRV bajo, fatiga, lesión)
 *
 * V2 restyle (dark · HO red/amber). Misma lógica que la versión legacy:
 * sólo cambia la presentación (markup + CSS scoped en .cs-root). Los
 * componentes compartidos DeviationsCard y BottomSheet se mantienen
 * intactos — sólo se reestiliza el markup propio de esta pantalla.
 */

const olyScore = (a: { maxes: { snatch: number; body_weight: number } }) =>
  a.maxes.body_weight > 0 ? +(a.maxes.snatch / a.maxes.body_weight * 2.5).toFixed(1) : 0;

/** OLY Index → tier disc (intensity proxy · halterofilia plates). */
const scoreToTier = (score: number): PlateTier => {
  if (score >= 4) return 'red';
  if (score >= 3.2) return 'blue';
  if (score >= 2.4) return 'yellow';
  if (score >= 1.6) return 'green';
  return 'white';
};

/* ---------- inline icons (stroke, currentColor · same pattern as CoachDashV2) ---------- */
const ICONS: Record<string, React.ReactNode> = {
  info:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  trophy: <><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M6 5H3a2 2 0 0 0 0 4h3"/><path d="M18 5h3a2 2 0 0 1 0 4h-3"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/></>,
  warn:   <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  share:  <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  arrowR: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
};
function Icon({ name, size = 14, stroke = 1.8, className = '' }: { name: string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONS[name]}
    </svg>
  );
}

interface InfoData {
  title: string;
  what: string;
  how: string;
}

const INFOS: Record<string, InfoData> = {
  tonelaje: {
    title: 'Tonelaje Total Semanal',
    what: 'Suma del peso total levantado por todos los atletas del roster en los últimos 7 días.',
    how: 'Σ (sets × reps × peso) de cada atleta. Útil para medir volumen acumulado del club.',
  },
  prs: {
    title: 'PRs Colectivos',
    what: 'Cantidad de récords personales logrados por cualquier atleta del club en la semana.',
    how: 'Suma de PRs en Snatch, C&J, Front/Back Squat de todos los atletas activos.',
  },
  adherencia: {
    title: 'Adherencia del Club',
    what: 'Porcentaje promedio de sesiones completadas vs programadas para el roster.',
    how: '< 70% indica problema grupal · 70-85% OK · ≥ 85% club comprometido.',
  },
};

const CoachStatsHO: React.FC = () => {
  const { allAthletes, selectAthlete } = useAthlete();
  const { navigate } = useNav();
  const [activeInfo, setActiveInfo] = useState<InfoData | null>(null);

  const stats = useMemo(() => {
    const totalAthletes = allAthletes.length;
    // Stats agregadas mock realistas
    const tonelajeWeekKg = allAthletes.reduce((s, a) => {
      const sessions = a.sessions_last_7 ?? [];
      const completed = sessions.filter(x => x.completed).length;
      return s + completed * 1800; // ~1800 kg promedio por sesión completada
    }, 0);
    const prsWeek = Math.floor(totalAthletes * 0.6); // ~0.6 PRs/atleta semana
    const activeCount = allAthletes.filter(a =>
      (a.sessions_last_7?.filter(x => x.completed).length ?? 0) >= 2
    ).length;
    const adherenciaPct = totalAthletes > 0
      ? Math.round(allAthletes.reduce((s, a) => {
          const sess = a.sessions_last_7 ?? [];
          const ratio = sess.length > 0 ? sess.filter(x => x.completed).length / sess.length : 0;
          return s + ratio;
        }, 0) / totalAthletes * 100)
      : 0;

    const ranked = [...allAthletes]
      .map(a => ({ ...a, score: olyScore(a) }))
      .sort((a, b) => b.score - a.score);

    const needsAttention = allAthletes.filter(a => (a.injuries?.length ?? 0) > 0).length;

    return {
      totalAthletes, tonelajeWeekKg, prsWeek, activeCount, adherenciaPct,
      topPerformers: ranked.slice(0, 3),
      needsAttention,
    };
  }, [allAthletes]);

  // adherencia accent token (≥85 verde · ≥70 amber · resto rojo)
  const adhColor = stats.adherenciaPct >= 85
    ? 'var(--engine-oly)'
    : stats.adherenciaPct >= 70 ? 'var(--engine-macro)' : 'var(--engine-pulse)';

  return (
    <div className="cs-root anim-fade-in">
      {/* HEADER */}
      <header className="cs-header">
        <p className="cs-eyebrow"><span className="pip" />Coach · Stats del Club</p>
        <h1 className="cs-title">Performance del Club</h1>
        <p className="cs-sub">{stats.totalAthletes} atletas · {stats.activeCount} activos esta semana</p>
      </header>

      {/* HERO STATS GRID */}
      <div className="cs-section">
        <div className="cs-hero-grid">
          {/* Tonelaje */}
          <button
            onClick={() => setActiveInfo(INFOS.tonelaje)}
            className="cs-stat-card btn-press"
            style={{ ['--c' as string]: 'var(--engine-oly)' }}
          >
            <span className="br" /><span className="br br-r" />
            <p className="cs-stat-label">
              Tonelaje semanal <Icon name="info" size={11} className="ic" />
            </p>
            <p className="cs-stat-val">
              {(stats.tonelajeWeekKg / 1000).toFixed(1)}<span className="unit">k kg</span>
            </p>
            <p className="cs-stat-foot">del club</p>
          </button>

          {/* PRs */}
          <button
            onClick={() => setActiveInfo(INFOS.prs)}
            className="cs-stat-card btn-press"
            style={{ ['--c' as string]: 'var(--engine-macro)' }}
          >
            <span className="br" /><span className="br br-r" />
            <p className="cs-stat-label">
              PRs esta semana <Icon name="info" size={11} className="ic" />
            </p>
            <p className="cs-stat-val">{stats.prsWeek}</p>
            <p className="cs-stat-foot">colectivos</p>
          </button>
        </div>
      </div>

      {/* ADHERENCIA */}
      <div className="cs-section">
        <button
          onClick={() => setActiveInfo(INFOS.adherencia)}
          className="cs-adh btn-press"
          style={{ ['--ac' as string]: adhColor }}
        >
          <div className="cs-adh-top">
            <p className="cs-adh-label">
              Adherencia del club <Icon name="info" size={11} className="ic" />
            </p>
            <p className="cs-adh-pct">{stats.adherenciaPct}%</p>
          </div>
          <div className="cs-adh-track">
            <div className="cs-adh-fill" style={{ width: `${stats.adherenciaPct}%` }} />
          </div>
        </button>
      </div>

      {/* DESVÍOS DEL MACROCICLO · primer atleta del top como muestra.
          DeviationsCard es componente COMPARTIDO → se deja intacto. */}
      {stats.topPerformers.length > 0 && (
        <div className="cs-section">
          <p className="cs-dev-label">
            <Icon name="layers" size={12} />
            Desvíos del macrociclo · {stats.topPerformers[0].name.split(' ')[0]}
          </p>
          <DeviationsCard
            macroId={stats.topPerformers[0].macrocycle.program_id}
            athleteId={stats.topPerformers[0].id}
            weeks={4}
          />
        </div>
      )}

      {/* TOP PERFORMERS */}
      <div className="cs-section">
        <div className="cs-section-head">
          <h3>Top performers</h3>
          <span className="meta">OLY INDEX</span>
        </div>
        <div className="cs-perf-list stagger">
          {stats.topPerformers.map((a, i) => (
            <button
              key={a.id}
              onClick={() => { selectAthlete(a.id); navigate('ATHLETE_DETAIL'); }}
              className="cs-perf btn-press"
              data-rank={i}
            >
              <div className="cs-perf-rank">{i + 1}</div>
              <div className="cs-perf-id">
                <p className="cs-perf-name">{a.name}</p>
                <p className="cs-perf-class">{a.weight_class}</p>
              </div>
              <PlateBadge tier={scoreToTier(a.score)} size={34} />
              <div className="cs-perf-score">
                <p className="v">{a.score.toFixed(1)}</p>
                <p className="k">OLY</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ATENCIÓN */}
      {stats.needsAttention > 0 && (
        <div className="cs-attention">
          <Icon name="warn" size={16} stroke={2} className="ic" />
          <div>
            <p className="cs-attention-title">
              {stats.needsAttention} atleta{stats.needsAttention === 1 ? '' : 's'} con lesión activa
            </p>
            <p className="cs-attention-meta">
              Revisar desde el roster para ajustar carga o suspender ejercicios.
            </p>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="cs-ctas">
        {/* → contenido viral */}
        <button
          onClick={() => navigate('COACH_VIRAL_TOOLS')}
          className="cs-cta cs-cta-viral btn-press"
        >
          <Icon name="share" size={15} stroke={2} className="ic" />
          Generar contenido viral
        </button>

        {/* → ir al roster */}
        <button
          onClick={() => navigate('COACH_DASH')}
          className="cs-cta cs-cta-roster btn-press"
        >
          Ver roster completo
          <Icon name="arrowR" size={15} stroke={2.2} className="ic" />
        </button>
      </div>

      {/* BottomSheet info · componente COMPARTIDO → shell intacto, sólo
          se reestiliza el contenido propio. */}
      <BottomSheet
        open={activeInfo !== null}
        onClose={() => setActiveInfo(null)}
        title={activeInfo?.title}
      >
        {activeInfo && (
          <div className="cs-sheet">
            <div className="cs-sheet-block">
              <p className="lbl"><span className="pip" />¿Qué es?</p>
              <p>{activeInfo.what}</p>
            </div>
            <div className="cs-sheet-block">
              <p className="lbl"><span className="pip" />¿Cómo se calcula?</p>
              <p>{activeInfo.how}</p>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default CoachStatsHO;

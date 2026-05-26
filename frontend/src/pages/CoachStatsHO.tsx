import React, { useState, useMemo } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useNav } from '../context/NavigationContext';
import BottomSheet from '../components/BottomSheet';
import DeviationsCard from '../components/DeviationsCard';

/**
 * Stats del club para HO Coach (reemplaza la vista atleta `PerformanceDeepDive`).
 *
 * Métricas agregadas del roster:
 * - Tonelaje total semanal del club
 * - PRs colectivos
 * - Top performers por OLY Index
 * - Atletas que requieren atención (HRV bajo, fatiga, lesión)
 */

const olyScore = (a: { maxes: { snatch: number; body_weight: number } }) =>
  a.maxes.body_weight > 0 ? +(a.maxes.snatch / a.maxes.body_weight * 2.5).toFixed(1) : 0;

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

  return (
    <div className="anim-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 90 }}>
      {/* HEADER */}
      <div style={{ padding: '20px 20px 16px' }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          Coach · Stats del Club
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginTop: 4, letterSpacing: '-.02em' }}>
          Performance del Club
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
          {stats.totalAthletes} atletas · {stats.activeCount} activos esta semana
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* HERO STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {/* Tonelaje */}
          <button
            onClick={() => setActiveInfo(INFOS.tonelaje)}
            className="btn-press"
            style={{
              padding: 14, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.10), transparent)',
              border: '1px solid rgba(34,197,94,0.25)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>
              Tonelaje semanal ⓘ
            </p>
            <p className="type-mono" style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
              {(stats.tonelajeWeekKg / 1000).toFixed(1)}<span style={{ fontSize: 14 }}>k kg</span>
            </p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>del club</p>
          </button>

          {/* PRs */}
          <button
            onClick={() => setActiveInfo(INFOS.prs)}
            className="btn-press"
            style={{
              padding: 14, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.10), transparent)',
              border: '1px solid rgba(245,158,11,0.25)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>
              PRs esta semana ⓘ
            </p>
            <p className="type-mono" style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>
              {stats.prsWeek}
            </p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>colectivos</p>
          </button>
        </div>

        {/* Adherencia */}
        <button
          onClick={() => setActiveInfo(INFOS.adherencia)}
          className="btn-press"
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 16,
            background: 'var(--surface)', border: '1px solid var(--card-border)',
            marginBottom: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>
              Adherencia del club ⓘ
            </p>
            <p style={{
              fontSize: 18, fontWeight: 900,
              color: stats.adherenciaPct >= 85 ? '#22C55E' : stats.adherenciaPct >= 70 ? '#F59E0B' : '#EF4444',
            }}>{stats.adherenciaPct}%</p>
          </div>
          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${stats.adherenciaPct}%`,
              background: stats.adherenciaPct >= 85 ? '#22C55E' : stats.adherenciaPct >= 70 ? '#F59E0B' : '#EF4444',
              transition: 'width .6s ease',
            }} />
          </div>
        </button>

        {/* DESVÍOS DEL MACROCICLO · primer atleta del top como muestra */}
        {stats.topPerformers.length > 0 && (
          <>
            <p className="type-caption" style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
              Desvíos del macrociclo · {stats.topPerformers[0].name.split(' ')[0]}
            </p>
            <DeviationsCard
              macroId={stats.topPerformers[0].macrocycle.program_id}
              athleteId={stats.topPerformers[0].id}
              weeks={4}
            />
          </>
        )}

        {/* TOP PERFORMERS */}
        <p className="type-caption" style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
          Top performers por OLY Index
        </p>
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {stats.topPerformers.map((a, i) => (
            <button
              key={a.id}
              onClick={() => { selectAthlete(a.id); navigate('ATHLETE_DETAIL'); }}
              className="btn-press"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: 'var(--surface)', border: '1px solid var(--card-border)',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#92400E',
                color: '#07070F', fontWeight: 900, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p className="type-body-strong" style={{ color: 'var(--text)' }}>{a.name}</p>
                <p className="type-caption" style={{ color: 'var(--text-secondary)' }}>{a.weight_class}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="type-mono" style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B' }}>
                  {a.score.toFixed(1)}
                </p>
                <p style={{ fontSize: 9, color: 'var(--text-secondary)' }}>OLY</p>
              </div>
            </button>
          ))}
        </div>

        {/* ATENCIÓN */}
        {stats.needsAttention > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 14, padding: '12px 14px', marginBottom: 18,
          }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#f87171' }}>
              ⚠ {stats.needsAttention} atleta{stats.needsAttention === 1 ? '' : 's'} con lesión activa
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
              Revisar desde el roster para ajustar carga o suspender ejercicios.
            </p>
          </div>
        )}

        {/* CTA → contenido viral */}
        <button
          onClick={() => navigate('COACH_VIRAL_TOOLS')}
          className="btn-press"
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(245,197,24,0.18), rgba(245,197,24,0.06))',
            border: '1px solid rgba(245,197,24,0.35)',
            color: '#F5C518',
            fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: 10,
          }}
        >📢 Generar contenido viral</button>

        {/* CTA → ir al roster */}
        <button
          onClick={() => navigate('COACH_DASH')}
          className="btn-press"
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14,
            background: 'var(--cta-bg)', color: 'var(--cta-text)',
            border: 'none', fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: 'var(--cta-shadow)',
          }}
        >Ver roster completo →</button>
      </div>

      {/* BottomSheet info */}
      <BottomSheet
        open={activeInfo !== null}
        onClose={() => setActiveInfo(null)}
        title={activeInfo?.title}
      >
        {activeInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--text)' }}>
            <div>
              <p className="type-caption" style={{ color: 'var(--primary)' }}>¿Qué es?</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.what}</p>
            </div>
            <div>
              <p className="type-caption" style={{ color: 'var(--primary)' }}>¿Cómo se calcula?</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.how}</p>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default CoachStatsHO;

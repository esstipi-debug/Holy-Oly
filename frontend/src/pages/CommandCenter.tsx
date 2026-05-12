import React, { useMemo, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';

type Status = 'ACTIVE' | 'FATIGUED' | 'WARMUP' | 'IDLE' | 'INJURED';

const computeStatus = (a: ReturnType<typeof useAthlete>['allAthletes'][number]): Status => {
  if (a.injuries && a.injuries.length > 0) return 'INJURED';
  const ratio = a.prior_fatigue / Math.max(a.prior_fitness, 1);
  if (ratio > 0.9) return 'FATIGUED';
  const last = a.sessions_last_7.at(-1);
  if (last?.completed) return 'ACTIVE';
  if (a.sessions_last_7.some(s => s.completed)) return 'WARMUP';
  return 'IDLE';
};

const statusMeta: Record<Status, { color: string; bg: string; label: string; mood: string }> = {
  ACTIVE:   { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  label: 'ACTIVO',     mood: '🔥' },
  WARMUP:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'WARMUP',     mood: '⚡' },
  FATIGUED: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'FATIGADO',   mood: '😴' },
  IDLE:     { color: '#64748B', bg: 'rgba(100,116,139,0.12)',label: 'INACTIVO',   mood: '😐' },
  INJURED:  { color: '#A855F7', bg: 'rgba(168,85,247,0.12)', label: 'LESIÓN',     mood: '🩹' },
};

const CommandCenter: React.FC = () => {
  const { navigate } = useNav();
  const { allAthletes, selectAthlete } = useAthlete();
  const [filter, setFilter] = useState<'todos' | 'activos' | 'fatiga' | 'lesion'>('todos');

  const enriched = useMemo(() => allAthletes.map(a => {
    const status = computeStatus(a);
    const readiness = Math.max(0, Math.min(10, ((a.prior_fitness - a.prior_fatigue) / 12 + 0.5) * 10));
    return { athlete: a, status, readiness };
  }), [allAthletes]);

  const filtered = enriched.filter(e => {
    if (filter === 'todos') return true;
    if (filter === 'activos') return e.status === 'ACTIVE' || e.status === 'WARMUP';
    if (filter === 'fatiga') return e.status === 'FATIGUED';
    if (filter === 'lesion') return e.status === 'INJURED';
    return true;
  });

  const counts = {
    total: enriched.length,
    activos: enriched.filter(e => e.status === 'ACTIVE' || e.status === 'WARMUP').length,
    fatiga: enriched.filter(e => e.status === 'FATIGUED').length,
    lesion: enriched.filter(e => e.status === 'INJURED').length,
  };

  const openDetail = (id: string) => {
    selectAthlete(id);
    navigate('ATHLETE_DETAIL');
  };

  const openAssign = (id: string) => {
    selectAthlete(id);
    navigate('ASSIGN_MACRO');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 90 }}>

      {/* HEADER */}
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Coach
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginTop: 2 }}>
            Command Center
          </h1>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 14,
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>📡</div>
      </div>

      {/* TRIAGE STRIP */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
        {[
          { id: 'todos',   label: 'Total',    value: counts.total,   color: 'var(--text)' },
          { id: 'activos', label: 'Activos',  value: counts.activos, color: '#22C55E' },
          { id: 'fatiga',  label: 'Fatiga',   value: counts.fatiga,  color: '#EF4444' },
          { id: 'lesion',  label: 'Lesión',   value: counts.lesion,  color: '#A855F7' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as typeof filter)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 14,
              background: filter === t.id ? 'var(--surface)' : 'transparent',
              border: `1px solid ${filter === t.id ? 'var(--card-border)' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 900, color: t.color, lineHeight: 1 }}>{t.value}</p>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginTop: 4 }}>
              {t.label}
            </p>
          </button>
        ))}
      </div>

      {/* ATHLETE LIST */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Estado en tiempo real · {filtered.length}
          </p>
          <span style={{ fontSize: 9, color: '#22C55E', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
            ● LIVE
          </span>
        </div>

        {filtered.length === 0 && (
          <div style={{
            padding: '32px 16px', textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16,
            color: 'var(--text-secondary)', fontSize: 12,
          }}>
            No hay atletas en este filtro.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(({ athlete, status, readiness }) => {
            const meta = statusMeta[status];
            const initials = athlete.name.split(' ').slice(0, 2).map(n => n[0]).join('');
            const todaySession = athlete.sessions_last_7.at(-1);
            const block = todaySession?.notes ?? athlete.macrocycle.focus;

            return (
              <div
                key={athlete.id}
                onClick={() => openDetail(athlete.id)}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--card-border)',
                  borderRadius: 16, padding: 12, cursor: 'pointer',
                  transition: 'border-color .15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: 'linear-gradient(135deg, var(--primary), #3B82F6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900, color: 'var(--bg)',
                    }}>{initials}</div>
                    <div style={{
                      position: 'absolute', bottom: -3, right: -3,
                      width: 18, height: 18, borderRadius: '50%',
                      background: meta.color, border: '2px solid var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9,
                    }}>{meta.mood}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {athlete.name}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {athlete.weight_class} · {block}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: 18, fontWeight: 900,
                      color: readiness > 7 ? '#22C55E' : readiness < 4 ? '#EF4444' : '#F59E0B',
                      letterSpacing: '-.03em', lineHeight: 1,
                    }}>{readiness.toFixed(1)}</p>
                    <p style={{ fontSize: 8, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.06em', marginTop: 2 }}>
                      READY
                    </p>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--text-secondary)' }}>›</span>
                </div>

                {/* Quick actions for problematic states */}
                {(status === 'FATIGUED' || status === 'INJURED') && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--card-border)', display: 'flex', gap: 6 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDetail(athlete.id); }}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 10,
                        background: 'rgba(239,68,68,0.1)', color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.25)',
                        fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >Sugerir descanso</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openAssign(athlete.id); }}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 10,
                        background: 'var(--surface2, rgba(255,255,255,0.04))',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--card-border)',
                        fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >Ajustar macro</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => navigate('ASSIGN_MACRO')}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 14,
            background: 'transparent', color: 'var(--primary)',
            border: '1px solid var(--card-border)',
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Asignar macro</button>
        <button
          onClick={() => navigate('NEW_ATHLETE')}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 14,
            background: 'var(--cta-bg)', color: 'var(--cta-text)',
            border: 'none',
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >+ Nuevo atleta</button>
      </div>
    </div>
  );
};

export default CommandCenter;

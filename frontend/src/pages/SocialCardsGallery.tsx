import React, { useMemo } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { ACCENT_HEX, buildCelebrationCatalog } from '../data/celebrations';

const STORAGE_CELEBRATION = 'social:preferred_celebration';

const TYPE_LABEL: Record<string, string> = {
  pr_lift: 'PR',
  skill_milestone: 'Skill',
  streak: 'Racha',
  tier_up: 'Tier',
  wod_benchmark: 'Benchmark',
  total_olympic: 'Total',
  consistency_milestone: 'Constancia',
  anniversary: 'Aniversario',
  leaderboard: 'Ranking',
  first_movement: 'Primer mov',
  session_today: 'Sesión',
  volume_14d: 'Volumen',
  consecutive_days: 'Racha',
  weekly_intensity: 'Intensidad',
  adherence: 'Adherencia',
  progress_compare: 'Progreso',
  radar_ho: 'Radar HO',
  radar_vol: 'Radar VOL',
};

const SocialCardsGallery: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();
  const catalog = useMemo(() => buildCelebrationCatalog(athlete), [athlete]);

  const pick = (id: string) => {
    try { localStorage.setItem(STORAGE_CELEBRATION, id); } catch { /* ignore */ }
    navigate('SOCIAL');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 90 }}>
      {/* HEADER */}
      <div style={{ padding: '14px 20px 12px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Social
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginTop: 2 }}>
          Galería de cards
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
          {catalog.length} celebraciones disponibles · tocá una para previsualizar
        </p>
      </div>

      {/* GRID */}
      <div
        style={{
          padding: '8px 16px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {catalog.map((c) => {
          const accent = ACCENT_HEX[c.accent] ?? '#F5C518';
          const typeLabel = TYPE_LABEL[c.type] ?? c.type;
          return (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--card-border)',
                borderRadius: 14,
                padding: 10,
                minHeight: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent stripe */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: accent,
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: accent,
                    background: `${accent}22`,
                    padding: '2px 6px',
                    borderRadius: 6,
                  }}
                >
                  {typeLabel}
                </span>
              </div>
              <div style={{ paddingLeft: 4 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--text)',
                    letterSpacing: '-.01em',
                    lineHeight: 1.15,
                  }}
                >
                  {c.title}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: 'var(--text-secondary)',
                    marginTop: 3,
                    fontWeight: 600,
                  }}
                >
                  {c.value}{c.unit ? ` ${c.unit}` : ''}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SocialCardsGallery;

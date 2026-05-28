import React, { useMemo } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { ACCENT_HEX, buildCelebrationCatalog } from '../data/celebrations';
import '../styles/v2/social-cards-gallery.css';

/**
 * SocialCardsGallery · galería de celebraciones "share-worthy".
 * Estilo V2 dark "Macrociclos" · scoped bajo `.scg-root` · acento ámbar
 * (--engine-macro). Se monta dentro de PhoneLayout. Lógica intacta: el
 * catálogo (buildCelebrationCatalog), pick() + localStorage y la navegación
 * se preservan; solo cambia la presentación. Cada card tiñe su barra de
 * acento y el chip de tipo con el hex de ACCENT_HEX[c.accent] via `--c`.
 */

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
    <div className="scg-root anim-fade-in">
      <div className="scg-scroll">
        {/* Header */}
        <div className="scg-head">
          <p className="scg-eyebrow">Social</p>
          <h1 className="scg-title">Galería de cards</h1>
          <p className="scg-meta">
            {catalog.length} celebraciones disponibles · tocá una para previsualizar
          </p>
        </div>

        {/* Grid · 2 columnas */}
        <div className="scg-grid">
          {catalog.map((c) => {
            const accent = ACCENT_HEX[c.accent] ?? '#F5C518';
            const typeLabel = TYPE_LABEL[c.type] ?? c.type;
            return (
              <button
                key={c.id}
                onClick={() => pick(c.id)}
                className="scg-card btn-press"
                style={{ '--c': accent } as React.CSSProperties}
              >
                <div className="scg-card-top">
                  <span className="scg-card-icon">{c.icon}</span>
                  <span className="scg-card-type">{typeLabel}</span>
                </div>
                <div className="scg-card-body">
                  <p className="scg-card-title">{c.title}</p>
                  <p className="scg-card-value">
                    {c.value}{c.unit ? ` ${c.unit}` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SocialCardsGallery;

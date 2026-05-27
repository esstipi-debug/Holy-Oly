// @ts-nocheck — CSS vars custom tier-driven
/**
 * AthleteCardSimple · vista ATLETA · palabras claras · CTA hoy.
 *
 * Diseño anti-FIFA · prioriza comprensión sobre status.
 * Útil para: home atleta · profile · onboarding.
 *
 * Para coach: usar AthleteCardV2 (FIFA con tooltips).
 */

import React from 'react';
import '../../lib/web-components';
import '../../styles/v2/athlete-card-simple.css';

export type AthleteTier = 0 | 1 | 2 | 3 | 4;
export type AthleteProduct = 'volta' | 'holy-oly' | 'axon';

export interface SimpleStats {
  fuerza: number;          // 0-99
  resistencia: number;
  movilidad: number;
  recuperacion: number;
  consistencia: number;
  tecnica: number;
}

export interface AthleteCardSimpleData {
  name: string;
  initials?: string;
  product: AthleteProduct;
  tier: AthleteTier;
  overall: number;            // 0-99
  /** % al próximo tier · 0-100 */
  progressToNextTier: number;
  stats: SimpleStats;
  boxName?: string;
  countryFlag?: string;
  /** CTA del día · ej "Hoy: AMRAP 20 · Fran" */
  todayCta?: string;
  /** Insight automático · ej "Tu punto fuerte: Resistencia" */
  insight?: string;
}

const TIER_META = {
  0: { color: '#F5F5F7', name: 'BLANCO',   label: 'Empezando',    next: 'Verde'    },
  1: { color: '#22C55E', name: 'VERDE',    label: 'Iniciante',    next: 'Amarillo' },
  2: { color: '#FBBF24', name: 'AMARILLO', label: 'Intermedio',   next: 'Azul'     },
  3: { color: '#3B82F6', name: 'AZUL',     label: 'Avanzado',     next: 'Rojo'     },
  4: { color: '#EF4444', name: 'ROJO',     label: 'Élite',        next: 'Maestría' },
};

const PRODUCT_LABEL = {
  'volta':    'CrossFit',
  'holy-oly': 'Halterofilia',
  'axon':     'HYROX',
};

const STAT_META = [
  { key: 'fuerza',        emoji: '💪', label: 'Fuerza',        color: '#EF4444', desc: 'Cuánto podés levantar relativo a tu peso' },
  { key: 'resistencia',   emoji: '🫁', label: 'Resistencia',   color: '#00E5FF', desc: 'Capacidad de mantener esfuerzo prolongado' },
  { key: 'movilidad',     emoji: '🤸', label: 'Movilidad',     color: '#A855F7', desc: 'Rango articular · técnica posicional' },
  { key: 'recuperacion',  emoji: '😴', label: 'Recuperación',  color: '#22C55E', desc: 'Sueño · stress · capacidad de regenerar' },
  { key: 'consistencia',  emoji: '📅', label: 'Consistencia',  color: '#FBBF24', desc: 'Días que entrenás · adherencia plan' },
  { key: 'tecnica',       emoji: '🎯', label: 'Técnica',       color: '#EC4899', desc: 'Skills dominadas · evaluación coach' },
] as const;

interface Props {
  data: AthleteCardSimpleData;
  /** Si true · muestra panel con descripciones al expandir. */
  expandable?: boolean;
}

export const AthleteCardSimple: React.FC<Props> = ({ data, expandable = false }) => {
  const meta = TIER_META[data.tier];
  const initials = data.initials ?? data.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const [openStat, setOpenStat] = React.useState<string | null>(null);

  // Insight automático si no se pasa
  const computedInsight = React.useMemo(() => {
    if (data.insight) return data.insight;
    const sorted = STAT_META.map(s => ({ ...s, value: data.stats[s.key] })).sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const bottom = sorted[5];
    return `Tu fortaleza: ${top.label} · Mejorá: ${bottom.label}`;
  }, [data.stats, data.insight]);

  return (
    <div
      className="acs-card"
      style={{ '--tier-c': meta.color }}
      data-tier={data.tier}
    >
      {/* HEADER · tier + progress */}
      <div className="acs-header">
        <div className="acs-tier-block">
          <plate-3d tier={String(data.tier)} size="40"></plate-3d>
          <div className="acs-tier-text">
            <div className="acs-tier-name">{meta.name}</div>
            <div className="acs-tier-sublabel">{meta.label}</div>
          </div>
        </div>
        <div className="acs-progress-block">
          <div className="acs-progress-pct">{data.progressToNextTier}%</div>
          <div className="acs-progress-to">al {meta.next}</div>
        </div>
      </div>

      <div className="acs-progress-bar">
        <div className="acs-progress-fill" style={{ width: `${data.progressToNextTier}%` }} />
      </div>

      {/* AVATAR + IDENTITY */}
      <div className="acs-identity">
        <div className="acs-avatar">
          <div className="acs-avatar-inner">{initials}</div>
        </div>
        <h2 className="acs-name">{data.name}</h2>
        <div className="acs-product">
          {PRODUCT_LABEL[data.product]}
          {data.boxName && <span> · {data.boxName}</span>}
        </div>
      </div>

      {/* STATS · palabras claras */}
      <div className="acs-stats-block">
        <div className="acs-stats-title">Tus 6 dimensiones hoy</div>
        <div className="acs-stats-list">
          {STAT_META.map(s => {
            const value = data.stats[s.key];
            const isOpen = openStat === s.key;
            return (
              <div
                key={s.key}
                className={`acs-stat ${isOpen ? 'open' : ''}`}
                onClick={expandable ? () => setOpenStat(isOpen ? null : s.key) : undefined}
                role={expandable ? 'button' : undefined}
                tabIndex={expandable ? 0 : undefined}
              >
                <div className="acs-stat-row">
                  <span className="acs-stat-emoji">{s.emoji}</span>
                  <span className="acs-stat-label">{s.label}</span>
                  <div className="acs-stat-bar">
                    <div
                      className="acs-stat-fill"
                      style={{ width: `${value}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)` }}
                    />
                  </div>
                  <span className="acs-stat-value" style={{ color: value >= 85 ? s.color : '#F1F5F9' }}>
                    {value}
                  </span>
                </div>
                {expandable && isOpen && (
                  <div className="acs-stat-desc">{s.desc}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* INSIGHT */}
      <div className="acs-insight">
        <span className="acs-insight-icon">💡</span>
        <span className="acs-insight-text">{computedInsight}</span>
      </div>

      {/* CTA HOY */}
      {data.todayCta && (
        <button className="acs-cta">
          <span className="acs-cta-arrow">→</span>
          {data.todayCta}
        </button>
      )}
    </div>
  );
};

export default AthleteCardSimple;

// @ts-nocheck — CSS vars custom (--tier-c · --tier-rgb)
/**
 * AthleteCardV2 · FIFA Modo Leyenda style.
 * Portada desde .claude-design-import-v2/Athlete Card.html.
 *
 * 280×426 (1:1.52) · tier-driven colors · 6 stats bars · disco 3D header.
 */

import React from 'react';
import '../../styles/v2/athlete-card.css';
import '../../lib/web-components';

export type AthleteTier = 0 | 1 | 2 | 3 | 4;
export type AthleteProduct = 'volta' | 'holy-oly' | 'axon';

export interface AthleteCardStats {
  strength: number;
  conditioning: number;
  mobility: number;
  recovery: number;
  consistency: number;
  technique: number;
}

export interface AthleteCardV2Data {
  name: string;
  initials?: string;
  product: AthleteProduct;
  tier: AthleteTier;
  overall: number;            // 0-99 OVR
  stats: AthleteCardStats;
  countryFlag?: string;       // emoji 🇨🇱
  boxName?: string;
  weightLabel?: string;       // "VERDE · 10kg"
}

const TIER_META = {
  0: { color: '#F5F5F7', rgb: '245, 245, 247', label: 'BLANCO',   weight: '0kg'  },
  1: { color: '#22C55E', rgb: '34, 197, 94',    label: 'VERDE',    weight: '10kg' },
  2: { color: '#FBBF24', rgb: '251, 191, 36',   label: 'AMARILLO', weight: '15kg' },
  3: { color: '#3B82F6', rgb: '59, 130, 246',   label: 'AZUL',     weight: '20kg' },
  4: { color: '#EF4444', rgb: '239, 68, 68',    label: 'ROJO',     weight: '25kg' },
};

const PRODUCT_LABEL = {
  'volta':    'VOLTA',
  'holy-oly': 'HOLY OLY',
  'axon':     'AXON',
};

const STAT_INFO = {
  STR: { label: 'Fuerza', desc: 'Cuánto podés levantar relativo a tu peso · normalizado OLY Index (Sn+CJ)/BW' },
  CND: { label: 'Resistencia', desc: 'Capacidad aeróbica + anaeróbica · benchmarks Fran/Helen + Pulse zones' },
  MOB: { label: 'Movilidad', desc: 'Rango articular · técnica posicional · baselines OH squat depth' },
  REC: { label: 'Recuperación', desc: 'Combina sueño + stress + HRV · medido por Stress engine Banister' },
  CON: { label: 'Consistencia', desc: 'Días que entrenás + adherencia plan · alimentado por Smart Streak' },
  TEC: { label: 'Técnica', desc: 'Skills dominadas en SkillTree + evaluaciones del coach' },
};

const TIER_DESC = {
  0: 'Blanco · onboarding · sin sesiones aún',
  1: 'Verde · iniciante · 10kg disco IWF · base técnica',
  2: 'Amarillo · intermedio · 15kg disco IWF · hábito consolidado',
  3: 'Azul · avanzado · 20kg disco IWF · disciplina probada',
  4: 'Rojo · élite · 25kg disco IWF · maestría',
};

interface Props {
  data: AthleteCardV2Data;
  variant?: 'standard' | 'hero';
  /** Tag bajo la card · 'STANDARD' default. */
  tag?: string;
  /** Si true · click en stats/OVR/tier muestra tooltip explicativo. */
  expandable?: boolean;
}

export const AthleteCardV2: React.FC<Props> = ({ data, variant = 'standard', tag, expandable = false }) => {
  const meta = TIER_META[data.tier];
  const initials = data.initials ?? data.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const [tooltip, setTooltip] = React.useState<string | null>(null);

  const showTooltip = (key: string) => {
    if (!expandable) return;
    setTooltip(tooltip === key ? null : key);
  };

  return (
    <div className="card-cell">
      <article
        className={`ac-card ${variant === 'hero' ? 'hero' : ''} ${expandable ? 'expandable' : ''}`}
        data-tier={data.tier}
        style={{ '--tier-c': meta.color, '--tier-rgb': meta.rgb }}
      >
        <span className="br-bl"></span>
        <span className="br-br"></span>

        {variant === 'hero' && <span className="hero-badge">LEGEND</span>}

        <header className="ac-head">
          <div
            className="ac-disc-wrap"
            onClick={() => showTooltip('tier')}
            style={expandable ? { cursor: 'pointer' } : undefined}
          >
            <plate-3d tier={String(data.tier)} size="56"></plate-3d>
            <span className="ac-tier-label">{meta.label}</span>
          </div>
          <div
            className="ac-ovr-block"
            onClick={() => showTooltip('ovr')}
            style={expandable ? { cursor: 'pointer' } : undefined}
          >
            <span className="ac-ovr">{data.overall}</span>
            <span className="ac-ovr-lbl">OVR</span>
          </div>
        </header>

        <div className="ac-avatar">{initials}</div>

        <div className="ac-id">
          <div className="ac-name">{data.name}</div>
          <div className="ac-product">{PRODUCT_LABEL[data.product]}</div>
        </div>

        <div className="ac-stats">
          <Stat k="STR" v={data.stats.strength}     onClick={() => showTooltip('STR')} expandable={expandable} />
          <Stat k="CND" v={data.stats.conditioning} onClick={() => showTooltip('CND')} expandable={expandable} />
          <Stat k="MOB" v={data.stats.mobility}     onClick={() => showTooltip('MOB')} expandable={expandable} />
          <Stat k="REC" v={data.stats.recovery}     onClick={() => showTooltip('REC')} expandable={expandable} />
          <Stat k="CON" v={data.stats.consistency}  onClick={() => showTooltip('CON')} expandable={expandable} />
          <Stat k="TEC" v={data.stats.technique}    onClick={() => showTooltip('TEC')} expandable={expandable} />
        </div>

        <footer className="ac-foot">
          <span className="box">
            {data.countryFlag && <span className="flag">{data.countryFlag}</span>}
            {' '}{data.boxName ?? '—'}
          </span>
          <span
            className="tier-w"
            onClick={() => showTooltip('tier')}
            style={expandable ? { cursor: 'pointer' } : undefined}
          >
            {data.weightLabel ?? `${meta.label} · ${meta.weight}`}
          </span>
        </footer>

        {/* Tooltip expandible · aparece dentro de la card sobre footer */}
        {expandable && tooltip && (
          <div className="ac-tooltip" onClick={() => setTooltip(null)}>
            <span className="ac-tooltip-close">×</span>
            <div className="ac-tooltip-title">
              {tooltip === 'ovr' && 'Overall · promedio de tus 6 dimensiones'}
              {tooltip === 'tier' && `${meta.label} · ${meta.weight}`}
              {tooltip in STAT_INFO && STAT_INFO[tooltip].label}
            </div>
            <div className="ac-tooltip-body">
              {tooltip === 'ovr' && (
                <>
                  <p>Tu Overall ({data.overall}) es el promedio ponderado de las 6 dimensiones (STR · CND · MOB · REC · CON · TEC).</p>
                  <p>0-50 principiante · 50-70 intermedio · 70-85 avanzado · 85+ élite.</p>
                </>
              )}
              {tooltip === 'tier' && (
                <>
                  <p>{TIER_DESC[data.tier]}</p>
                  <p>Los colores siguen el estándar IWF de discos olímpicos · el peso del disco representa tu nivel de progresión.</p>
                </>
              )}
              {tooltip in STAT_INFO && (
                <>
                  <p>{STAT_INFO[tooltip].desc}</p>
                  <p style={{ marginTop: 6, opacity: 0.75 }}>
                    Tu valor actual: <strong>{data.stats[tooltip === 'STR' ? 'strength' : tooltip === 'CND' ? 'conditioning' : tooltip === 'MOB' ? 'mobility' : tooltip === 'REC' ? 'recovery' : tooltip === 'CON' ? 'consistency' : 'technique']}</strong> / 99
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </article>

      {tag && (
        <div className="ac-card-tag">
          {tag}
          <span className="v">OVR {data.overall} · T{data.tier}</span>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ k: string; v: number; onClick?: () => void; expandable?: boolean }> = ({ k, v, onClick, expandable }) => (
  <div
    className={`ac-stat ${k.toLowerCase()}`}
    onClick={onClick}
    style={expandable ? { cursor: 'pointer' } : undefined}
  >
    <span className="k">{k}</span>
    <div className="bar">
      <div className="fill" style={{ width: `${v}%` }}></div>
    </div>
    <span className="v">{v}</span>
  </div>
);

export default AthleteCardV2;

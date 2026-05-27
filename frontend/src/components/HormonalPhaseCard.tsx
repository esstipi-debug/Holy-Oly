import React, { useEffect, useState } from 'react';
import { hormonalApi, PHASE_COLORS, type HormonalCurrent } from '../lib/hormonal';

/**
 * Engine 13 · Card de fase hormonal actual.
 *
 * Renderiza una card compacta con la fase actual + día del ciclo + ajuste de carga.
 * Si el usuario no tiene tracking habilitado (/current devuelve 404), no renderiza
 * nada (silent · sin spam visual). El onboarding se hace desde Profile.
 */
const HormonalPhaseCard: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const [data, setData] = useState<HormonalCurrent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hormonalApi.current()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const colors = PHASE_COLORS[data.phase];
  const loadDeltaPct = Math.round((data.recommendation.load_multiplier - 1) * 100);
  const sign = loadDeltaPct > 0 ? '+' : '';

  return (
    <button
      onClick={onClick}
      className="btn-press"
      style={{
        width: '100%',
        background: colors.bg,
        border: `1px solid ${colors.primary}40`,
        borderRadius: 16,
        padding: '12px 14px',
        marginBottom: 12,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'inherit',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `${colors.primary}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{colors.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.12em',
          color: colors.primary, textTransform: 'uppercase', margin: 0,
        }}>
          Ciclo · Día {data.day_of_cycle}
        </p>
        <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', margin: '2px 0' }}>
          {colors.label}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
          {loadDeltaPct !== 0 && (
            <span style={{ color: colors.primary, fontWeight: 700 }}>
              {sign}{loadDeltaPct}% carga
            </span>
          )}
          {loadDeltaPct !== 0 && ' · '}
          {data.recommendation.focus.replace(/_/g, ' ')}
        </p>
      </div>
      {onClick && <span style={{ color: colors.primary, fontSize: 16, fontWeight: 900 }}>›</span>}
    </button>
  );
};

export default HormonalPhaseCard;

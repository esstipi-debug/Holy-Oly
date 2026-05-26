import React, { useEffect, useState } from 'react';
import WellnessCheckinModal from './WellnessCheckinModal';
import MetricHistoryModal, { type MetricType } from './MetricHistoryModal';
import { wellness, type WellnessCheckinResponse } from '../lib/wellness';

/**
 * WellnessButton · botón palpitante que invita al check-in diario.
 *
 * Estado:
 *  - No hay check-in hoy → animación pulse + label "Check-in de hoy"
 *  - Hay check-in       → estático + label "Check-in OK · ver historial"
 *
 * Tap:
 *  - No hay → abre WellnessCheckinModal (form)
 *  - Hay    → abre MetricHistoryModal sobre 'readiness' (vista 14d)
 *
 * La animación CSS @keyframes wellness-pulse se inyecta inline en un <style>
 * la primera vez que monta el componente (idempotente vía id="wellness-pulse-css"),
 * evita tocar App.css y mantiene el componente autocontenido.
 *
 * Offline-first: lib/wellness.ts cae a localStorage si el backend está caído.
 */

const ACCENT = '#F5C518';
const ACCENT_OK = '#22C55E';

const PULSE_CSS = `
@keyframes wellness-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245,197,24,0.6); }
  50%      { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(245,197,24,0); }
}
.wellness-pending { animation: wellness-pulse 2s ease-in-out infinite; }
`;

const injectPulseCss = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('wellness-pulse-css')) return;
  const tag = document.createElement('style');
  tag.id = 'wellness-pulse-css';
  tag.textContent = PULSE_CSS;
  document.head.appendChild(tag);
};

interface Props {
  /** Mostrar como pill compacta (default) o full-width */
  variant?: 'pill' | 'full';
  /** Color accent override (Volta usa cyan/green; HO usa gold) */
  accentPending?: string;
  /** Si se pasa el wise score actual, se usa para el historial modal */
  currentReadiness?: number | null;
  /** Métrica a mostrar en el historial cuando ya hay check-in (default 'readiness') */
  historyMetric?: MetricType;
  style?: React.CSSProperties;
}

const WellnessButton: React.FC<Props> = ({
  variant = 'pill',
  accentPending = ACCENT,
  currentReadiness,
  historyMetric = 'readiness',
  style,
}) => {
  const [today, setToday] = useState<WellnessCheckinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openCheckin, setOpenCheckin] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  useEffect(() => {
    injectPulseCss();
    let cancelled = false;
    wellness.today()
      .then(res => { if (!cancelled) setToday(res); })
      .catch(() => { if (!cancelled) setToday(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const hasCheckin = today !== null;
  const color = hasCheckin ? ACCENT_OK : accentPending;
  const label = loading
    ? 'Cargando…'
    : hasCheckin
      ? '✓ Check-in OK · ver historial'
      : '📋 Check-in de hoy';

  const handleClick = () => {
    if (loading) return;
    if (hasCheckin) setOpenHistory(true);
    else setOpenCheckin(true);
  };

  const handleSaved = (data: WellnessCheckinResponse) => {
    setToday(data);
  };

  const baseStyle: React.CSSProperties = variant === 'full'
    ? {
        width: '100%',
        padding: '12px 16px',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 10,
      }
    : {
        padding: '8px 14px',
        borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', gap: 8,
      };

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={hasCheckin ? 'Ver historial wellness' : 'Hacer check-in de hoy'}
        className={!loading && !hasCheckin ? 'wellness-pending' : undefined}
        style={{
          ...baseStyle,
          background: `${color}14`,
          border: `1px solid ${color}55`,
          color,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '.02em',
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background .2s ease, border-color .2s ease',
          ...style,
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 8, height: 8, borderRadius: '50%',
            background: color,
            boxShadow: hasCheckin ? 'none' : `0 0 6px ${color}AA`,
          }}
        />
        {label}
      </button>

      <WellnessCheckinModal
        open={openCheckin}
        onClose={() => setOpenCheckin(false)}
        onSaved={handleSaved}
      />

      {openHistory && (
        <MetricHistoryModal
          metric={historyMetric}
          currentValue={currentReadiness ?? today?.motivation ?? 70}
          accent={ACCENT_OK}
          onClose={() => setOpenHistory(false)}
        />
      )}
    </>
  );
};

export default WellnessButton;

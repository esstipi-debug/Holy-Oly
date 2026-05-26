import React, { useEffect, useState } from 'react';
import { getActiveSlot } from '../lib/plannedSessions';

/**
 * Overlay pill que aparece en top-right cuando hay un slot activo (AM/PM).
 *
 * Diseñado para montarse globalmente (en App.tsx o en una capa de layout) sin
 * que ActiveSession.tsx tenga que saber del concepto de slots. Lee
 * `localStorage.active_session:slot` y se auto-oculta si === null o === 'full'.
 *
 * Re-evalúa cada vez que cambia la ruta (vía el evento `storage` y un poll
 * suave de 500ms — necesario porque localStorage no dispara `storage` en el
 * mismo tab).
 */
const SessionSlotBadge: React.FC = () => {
  const [slot, setSlot] = useState<'am' | 'pm' | null>(null);

  useEffect(() => {
    const read = () => {
      const s = getActiveSlot();
      setSlot(s === 'am' || s === 'pm' ? s : null);
    };
    read();
    const id = window.setInterval(read, 500);
    window.addEventListener('storage', read);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', read);
    };
  }, []);

  if (!slot) return null;

  const HO_GOLD = '#F5C518';
  return (
    <div
      aria-label={`Sesión activa: ${slot.toUpperCase()}`}
      style={{
        position: 'absolute',
        top: 50,
        right: 14,
        zIndex: 950,
        background: `${HO_GOLD}E6`,
        color: '#07070F',
        border: `1px solid ${HO_GOLD}`,
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '.12em',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        pointerEvents: 'none',
        fontFamily: 'inherit',
      }}
    >
      {slot.toUpperCase()}
    </div>
  );
};

export default SessionSlotBadge;

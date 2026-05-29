import React, { useState, useEffect } from 'react';
import { useNav } from '../context/NavigationContext';
import SessionSlotBadge from '../components/SessionSlotBadge';

export type NavTab = 'home' | 'train' | 'stats' | 'profile' | 'wod' | 'logros' | 'roster';

interface PhoneLayoutProps {
  children: React.ReactNode;
  activeNav?: NavTab;
  onNavChange?: (tab: NavTab) => void;
  product?: 'holy-oly' | 'volta';
  role?: 'atleta' | 'coach';
  showBack?: boolean;
  hideNav?: boolean;
}

const TRAIN_ITEM = {
  id: 'train' as const,
  label: 'Entrenar',
  icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="10" width="4" height="4" rx="1" fill={active ? 'var(--primary)' : '#475569'} />
      <rect x="18" y="10" width="4" height="4" rx="1" fill={active ? 'var(--primary)' : '#475569'} />
      <rect x="6" y="7" width="12" height="10" rx="2" fill={active ? 'var(--primary)' : 'none'}
        stroke={active ? 'var(--primary)' : '#475569'} strokeWidth="1.8" />
      <line x1="12" y1="7" x2="12" y2="17" stroke={active ? 'var(--primary-text)' : '#475569'} strokeWidth="1.8" />
    </svg>
  ),
};

// Coach home: en HO el dashboard del coach ES el roster — usamos icono de gente y label "Atletas"
const COACH_HOME_ITEM = {
  id: 'home' as const,
  label: 'Atletas',
  icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="9" r="3" fill={active ? 'var(--primary)' : 'none'} stroke={active ? 'var(--primary)' : '#475569'} strokeWidth="1.6" />
      <circle cx="16" cy="9" r="3" fill={active ? 'var(--primary)' : 'none'} stroke={active ? 'var(--primary)' : '#475569'} strokeWidth="1.6" />
      <path d="M2 19c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" stroke={active ? 'var(--primary)' : '#475569'} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M14 14.5c3.3 0 6 2 6 4.5" stroke={active ? 'var(--primary)' : '#475569'} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  ),
};

const NAV_ITEMS_BASE = [
  {
    id: 'home' as const,
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          fill={active ? 'var(--primary)' : 'none'}
          stroke={active ? 'var(--primary)' : '#475569'}
          strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'stats' as const,
    label: 'Stats',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="14" width="4" height="7" rx="1" fill={active ? 'var(--primary)' : '#475569'} opacity={active ? 1 : 0.6} />
        <rect x="10" y="9" width="4" height="12" rx="1" fill={active ? 'var(--primary)' : '#475569'} opacity={active ? 1 : 0.8} />
        <rect x="17" y="4" width="4" height="17" rx="1" fill={active ? 'var(--primary)' : '#475569'} />
      </svg>
    ),
  },
  {
    id: 'profile' as const,
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          fill={active ? 'var(--primary)' : 'none'}
          stroke={active ? 'var(--primary)' : '#475569'}
          strokeWidth="1.8" />
        <path d="M4 20C4 17 7.58 15 12 15C16.42 15 20 17 20 20"
          stroke={active ? 'var(--primary)' : '#475569'}
          strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Volta nav atleta: Inicio / WOD / Stats / Logros / Perfil
const VOLTA_NAV_ATLETA: { id: NavTab; label: string; icon: string }[] = [
  { id: 'home',    label: 'Inicio', icon: '🏠' },
  { id: 'wod',     label: 'WOD',    icon: '⚡' },
  { id: 'stats',   label: 'Stats',  icon: '📊' },
  { id: 'logros',  label: 'Logros', icon: '🏅' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

// Volta nav coach: Inicio / WOD / Macro / Box / Perfil
const VOLTA_NAV_COACH: { id: NavTab; label: string; icon: string }[] = [
  { id: 'home',    label: 'Inicio', icon: '🏠' },
  { id: 'wod',     label: 'WOD',    icon: '⚡' },
  { id: 'stats',   label: 'Macro',  icon: '🎯' },
  { id: 'logros',  label: 'Box',    icon: '📦' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

const PhoneLayout: React.FC<PhoneLayoutProps> = ({
  children,
  activeNav = 'home',
  onNavChange,
  product = 'holy-oly',
  role = 'atleta',
  showBack = false,
  hideNav = false,
}) => {
  // HO: atleta tiene 4 tabs (Inicio/Entrenar/Stats/Perfil); coach tiene 3 (Atletas/Stats/Perfil)
  const NAV_ITEMS = role === 'coach'
    ? [COACH_HOME_ITEM, NAV_ITEMS_BASE[1], NAV_ITEMS_BASE[2]]
    : [NAV_ITEMS_BASE[0], TRAIN_ITEM, NAV_ITEMS_BASE[1], NAV_ITEMS_BASE[2]];
  const { back, canGoBack } = useNav();
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Fullscreen en cualquier dispositivo táctil (pointer: coarse) o viewport ≤820px:
  // la app llena la pantalla sin el marco/mockup (que en un celular parece
  // "simulador"). Cubre todos los teléfonos sin importar el device-pixel-ratio
  // (ej. 1080p @ DPR 2.0 = 540px CSS, que un breakpoint de 480 no atrapaba).
  // En desktop (mouse, ancho) se conserva el mockup 390×844 para mostrar/vender.
  const FULLSCREEN_MQ = '(max-width: 820px), (pointer: coarse)';
  const [fullscreen, setFullscreen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(FULLSCREEN_MQ).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(FULLSCREEN_MQ);
    const onChange = () => setFullscreen(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0D0D18', padding: fullscreen ? 0 : 16 }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: fullscreen ? '100%' : 390,
          height: fullscreen ? '100dvh' : 844,
          background: 'var(--bg)',
          borderRadius: fullscreen ? 0 : 44,
          border: fullscreen ? 'none' : '2px solid #2a2a3a',
          overflow: 'hidden',
          boxShadow: fullscreen ? 'none' : '0 0 80px rgba(99,102,241,0.15), 0 0 0 1px #1e1e30, 0 40px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Status Bar · solo en el mockup (desktop). En fullscreen el browser/OS ya muestra la suya. */}
        {!fullscreen && (
        <div
          className="flex items-center justify-between px-7 flex-shrink-0"
          style={{ height: 44, background: 'var(--bg)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {time}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Signal */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#94a3b8" />
              <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#94a3b8" />
              <rect x="9" y="2" width="3" height="10" rx="0.5" fill="#94a3b8" />
              <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill="#94a3b8" opacity="0.3" />
            </svg>
            {/* WiFi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 10.5a1 1 0 100-2 1 1 0 000 2z" fill="#94a3b8" />
              <path d="M5 7.5C5.9 6.6 6.9 6 8 6s2.1.6 3 1.5" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <path d="M2.5 5C4.1 3.4 5.9 2.5 8 2.5s3.9.9 5.5 2.5" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
            </svg>
            {/* Battery */}
            <div className="flex items-center gap-0.5">
              <div
                className="relative flex items-center"
                style={{ width: 22, height: 11, background: 'transparent', border: '1.5px solid #94a3b8', borderRadius: 3 }}
              >
                <div style={{ width: '75%', height: '100%', background: 'var(--primary)', borderRadius: 1.5 }} />
              </div>
              <div style={{ width: 2, height: 5, background: '#94a3b8', borderRadius: 1 }} />
            </div>
          </div>
        </div>
        )}

        {/* Header bar reservada cuando hay back — evita que el botón pise el contenido */}
        {showBack && canGoBack && (
          <div
            className="flex items-center flex-shrink-0"
            style={{
              height: 44,
              padding: '0 14px',
              background: 'var(--bg)',
              borderBottom: '1px solid transparent',
              zIndex: 50,
            }}
          >
            <button
              onClick={back}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit', flexShrink: 0,
              }}
              aria-label="Atrás"
            >←</button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', paddingBottom: hideNav ? 0 : 76 }}>
          {children}
        </div>

        {/* Overlay global · pill AM/PM cuando hay slot activo (doble sesión) */}
        <SessionSlotBadge />

        {/* Bottom Nav */}
        {!hideNav && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-around"
          style={{
            height: 76,
            background: product === 'volta' ? 'rgba(7,7,15,0.95)' : 'var(--surface)',
            borderTop: `1px solid ${product === 'volta' ? '#1E1E32' : 'var(--card-border)'}`,
            paddingBottom: 12,
            backdropFilter: product === 'volta' ? 'blur(12px)' : 'none',
          }}
        >
          {product === 'volta' ? (
            (role === 'coach' ? VOLTA_NAV_COACH : VOLTA_NAV_ATLETA).map(({ id, label, icon }) => {
              const active = activeNav === id;
              return (
                <button
                  key={id}
                  onClick={() => onNavChange?.(id)}
                  className="flex flex-col items-center gap-1 transition-opacity"
                  style={{ opacity: active ? 1 : 0.5, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: active ? '#00E5FF' : '#52527A' }}>
                    {label}
                  </span>
                  {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 6px #00E5FF' }} />}
                </button>
              );
            })
          ) : (
            NAV_ITEMS.map(({ id, label, icon }) => {
              const active = activeNav === id;
              return (
                <button
                  key={id}
                  onClick={() => onNavChange?.(id)}
                  className="flex flex-col items-center gap-1 transition-opacity"
                  style={{ opacity: active ? 1 : 0.45 }}
                >
                  {icon(active)}
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: active ? 'var(--primary)' : '#475569' }}
                  >
                    {label}
                  </span>
                </button>
              );
            })
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default PhoneLayout;

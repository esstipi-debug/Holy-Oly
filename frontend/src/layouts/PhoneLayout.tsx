import React from 'react';

interface PhoneLayoutProps {
  children: React.ReactNode;
  activeNav?: 'home' | 'train' | 'stats' | 'profile';
  onNavChange?: (tab: 'home' | 'train' | 'stats' | 'profile') => void;
}

const NAV_ITEMS = [
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

const PhoneLayout: React.FC<PhoneLayoutProps> = ({
  children,
  activeNav = 'home',
  onNavChange,
}) => {
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0D0D18' }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: 390,
          height: 844,
          background: 'var(--bg)',
          borderRadius: 44,
          border: '2px solid #2a2a3a',
          overflow: 'hidden',
          boxShadow: '0 0 80px rgba(99,102,241,0.15), 0 0 0 1px #1e1e30, 0 40px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Status Bar */}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', paddingBottom: 76 }}>
          {children}
        </div>

        {/* Bottom Nav */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-around"
          style={{
            height: 76,
            background: 'var(--surface)',
            borderTop: '1px solid var(--card-border)',
            paddingBottom: 12,
          }}
        >
          {NAV_ITEMS.map(({ id, label, icon }) => {
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
          })}
        </div>
      </div>
    </div>
  );
};

export default PhoneLayout;

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'ghost' | 'primary';
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  dot = false,
  className = '',
}) => {
  const style: React.CSSProperties =
    variant === 'success' || variant === 'primary'
      ? {
          background: 'var(--status-bg)',
          color: 'var(--status-text)',
          border: '1px solid var(--status-border)',
        }
      : variant === 'warning'
      ? { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }
      : variant === 'danger'
      ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
      : variant === 'info'
      ? { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }
      : variant === 'gold'
      ? { background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }
      : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' };

  const dotColor =
    variant === 'success' || variant === 'primary' ? 'var(--primary)'
    : variant === 'warning' ? '#f59e0b'
    : variant === 'danger' ? '#ef4444'
    : variant === 'gold' ? '#F59E0B'
    : '#64748b';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${className}`}
      style={style}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: dotColor }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;

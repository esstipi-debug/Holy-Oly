import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  style,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
    xl: 'px-8 py-5 text-lg',
  };

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--cta-bg)',
          color: 'var(--cta-text)',
          border: '1px solid var(--cta-border)',
          boxShadow: 'var(--cta-shadow)',
          borderRadius: 'var(--radius)',
        }
      : variant === 'secondary'
      ? {
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
        }
      : variant === 'gold'
      ? {
          background: '#F59E0B',
          color: '#07070F',
          border: 'none',
          boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
          borderRadius: 'var(--radius)',
        }
      : variant === 'danger'
      ? {
          background: 'rgba(239,68,68,0.1)',
          color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius)',
        }
      : {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: 'none',
          borderRadius: 'var(--radius)',
        };

  return (
    <button
      className={`${base} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

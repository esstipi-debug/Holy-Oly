import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'whileTap' | 'whileHover'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

const Spinner: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 0.7s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="40 60" strokeLinecap="round" opacity="0.85" />
  </svg>
);

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const base = 'inline-flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:pointer-events-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
    xl: 'px-8 py-5 text-lg',
  };

  const spinnerSizes = { sm: 12, md: 14, lg: 16, xl: 18 };

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
    <motion.button
      className={`${base} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...variantStyle, ...style }}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      whileHover={isDisabled ? undefined : { filter: 'brightness(1.08)' }}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {loading && <Spinner size={spinnerSizes[size]} />}
      <span>{children}</span>
    </motion.button>
  );
};

export default Button;

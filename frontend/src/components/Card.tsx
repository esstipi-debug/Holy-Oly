import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-8' };

  const base = 'transition-all duration-300 overflow-hidden';
  const style: React.CSSProperties = {
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--card-shadow)',
  };

  if (variant === 'glass' || variant === 'solid') {
    style.background = variant === 'solid' ? 'var(--surface)' : 'var(--card-bg)';
    style.border = '1px solid var(--card-border)';
    if (variant === 'glass') style.backdropFilter = 'blur(12px)';
  } else {
    style.background = 'transparent';
    style.border = '1px solid var(--card-border)';
  }

  return (
    <div
      className={`${base} ${paddings[padding]} ${hover ? 'cursor-pointer hover:brightness-110' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;

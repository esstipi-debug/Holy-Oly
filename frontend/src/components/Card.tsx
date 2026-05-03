import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-300 overflow-hidden';
  
  const variants = {
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    solid: 'bg-holy-surface border border-slate-800',
    outline: 'bg-transparent border border-slate-800',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  const hoverStyles = hover ? 'hover:border-holy-primary/30 hover:bg-white/[0.08] cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;

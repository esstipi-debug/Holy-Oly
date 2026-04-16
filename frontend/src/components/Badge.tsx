import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'ghost';
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'info', 
  dot = false 
}) => {
  const variants = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    gold: 'bg-holy-gold/10 text-holy-gold border-holy-gold/20',
    ghost: 'bg-white/5 text-slate-500 border-white/10',
  };

  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    gold: 'bg-holy-gold',
    ghost: 'bg-slate-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export default Badge;

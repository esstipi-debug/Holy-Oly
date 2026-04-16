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
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl';
  
  const variants = {
    primary: 'bg-holy-primary text-white shadow-lg shadow-holy-primary/20 hover:brightness-110',
    secondary: 'bg-holy-surface border border-slate-800 text-slate-300 hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-400 hover:bg-white/5',
    danger: 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20',
    gold: 'bg-holy-gold text-holy-bg shadow-lg shadow-holy-gold/20 hover:brightness-110',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
    xl: 'px-8 py-5 text-lg rounded-2xl',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

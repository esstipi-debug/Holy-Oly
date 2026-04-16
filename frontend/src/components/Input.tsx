import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  error, 
  icon, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-holy-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-holy-surface border border-slate-800 rounded-xl px-4 py-3.5
            text-white placeholder:text-slate-700 text-sm
            focus:outline-none focus:border-holy-primary/50 focus:ring-1 focus:ring-holy-primary/20
            transition-all group-hover:border-slate-700
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-400 mt-1 ml-1 uppercase">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

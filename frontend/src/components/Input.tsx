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
  style,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          className="block text-xs font-bold uppercase tracking-wider ml-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl px-4 py-3.5 text-sm transition-all outline-none ${icon ? 'pl-11' : ''} ${className}`}
          style={{
            background: 'var(--surface)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--card-border)'}`,
            color: 'var(--text)',
            borderRadius: 'var(--radius)',
            ...style,
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-400 mt-1 ml-1 uppercase">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

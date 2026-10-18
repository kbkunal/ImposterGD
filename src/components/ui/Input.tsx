import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  disabled,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-inner">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          type={effectiveType}
          disabled={disabled}
          className={`w-full bg-[#12182C] text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500 ${
            leftIcon ? 'pl-10' : ''
          } ${showPasswordToggle && isPassword ? 'pr-11' : ''} ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40'
              : 'border-slate-800 hover:border-slate-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''} ${className}`}
          {...props}
        />
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 font-medium pl-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 font-normal pl-1">{helperText}</p>}
    </div>
  );
};

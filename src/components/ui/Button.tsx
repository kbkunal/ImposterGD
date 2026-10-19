import React from 'react';
import { soundEngine } from '../../services/game/soundEngine';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'amber' | 'cyan' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  suppressSound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  suppressSound = false,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!suppressSound && !disabled && !isLoading) {
      soundEngine.playClick();
    }
    onClick?.(e);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-black tracking-wide rounded-2xl select-none transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B14] active:translate-y-[2px] shadow-md';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 gap-1.5 min-h-[40px]',
    md: 'text-sm px-5 py-2.5 gap-2 min-h-[46px]',
    lg: 'text-base sm:text-lg px-7 py-3.5 gap-2.5 min-h-[54px]',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-b from-[#9333EA] to-[#7928CA] hover:from-[#A855F7] hover:to-[#8B2BE2] text-white border-t border-purple-400/40 border-b-4 border-[#581C87] shadow-purple-950/60 hover:shadow-purple-700/50 focus-visible:ring-purple-400',
    secondary:
      'bg-gradient-to-b from-[#1E293B] to-[#0F172A] hover:from-[#334155] hover:to-[#1E293B] text-slate-200 hover:text-white border-t border-slate-600/40 border-b-4 border-[#090D16] shadow-black/60 focus-visible:ring-slate-400',
    amber:
      'bg-gradient-to-b from-[#F59E0B] to-[#D97706] hover:from-[#FBBF24] hover:to-[#F59E0B] text-slate-950 border-t border-amber-200/50 border-b-4 border-[#92400E] shadow-amber-950/60 hover:shadow-amber-600/40 focus-visible:ring-amber-300',
    cyan:
      'bg-gradient-to-b from-[#0EA5E9] to-[#0284C7] hover:from-[#38BDF8] hover:to-[#0EA5E9] text-white border-t border-sky-300/40 border-b-4 border-[#0369A1] shadow-sky-950/60 focus-visible:ring-cyan-400',
    success:
      'bg-gradient-to-b from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-white border-t border-emerald-300/40 border-b-4 border-[#047857] shadow-emerald-950/60 focus-visible:ring-emerald-400',
    danger:
      'bg-gradient-to-b from-[#F43F5E] to-[#E11D48] hover:from-[#FB7185] hover:to-[#F43F5E] text-white border-t border-rose-300/40 border-b-4 border-[#9F1239] shadow-rose-950/60 focus-visible:ring-rose-400',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/80 shadow-none focus-visible:ring-purple-400 active:translate-y-0',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

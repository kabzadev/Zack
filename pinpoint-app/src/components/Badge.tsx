import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  showDot?: boolean;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = false,
  dot,
  icon,
  className = '',
}) => {
  const variantClasses = {
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    neutral: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
  };

  const dotColors = {
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
    neutral: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        border backdrop-blur-sm
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {(showDot || dot) && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {icon && (
        <span className="flex items-center">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

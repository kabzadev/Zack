import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target';

  const variantClasses = {
    primary: 'bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.96] shadow-lg shadow-white/10',
    secondary: 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 active:scale-[0.96]',
    ghost: 'text-slate-400 hover:text-white hover:bg-white/5 active:scale-[0.96]',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.96] shadow-lg shadow-red-600/20',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
    >
      {loading && (
        <Loader2 size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} className="animate-spin" />
      )}
      {!loading && (icon || leftIcon) && (
        <span className="flex items-center">
          {icon || leftIcon}
        </span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="flex items-center">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string | boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  name?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputMode?: string;
  maxLength?: number;
  step?: string;
  min?: string | number;
  max?: string | number;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  inputClassName = '',
  name,
  autoComplete,
  autoFocus,
  onKeyDown,
  maxLength,
  step,
}) => {
  const hasError = !!error;

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          maxLength={maxLength}
          step={step}
          className={`
            w-full bg-slate-800/50 rounded-xl px-4 py-3.5 text-white placeholder-slate-500
            border-2 transition-all duration-200
            focus:outline-none focus:bg-slate-800
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${hasError 
              ? 'border-red-500/50 focus:border-red-500' 
              : 'border-slate-700/50 focus:border-blue-500'
            }
            ${inputClassName}
          `}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && typeof error === 'string' && (
        <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-400 rounded-full" />
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-sm text-slate-500 mt-2">
          {helperText}
        </p>
      )}
    </div>
  );
};

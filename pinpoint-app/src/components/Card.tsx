import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hoverable' | 'clickable';
  hoverable?: boolean;
  clickable?: boolean;
  header?: {
    title: string;
    action?: React.ReactNode;
  };
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  animationDelay?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable,
  clickable,
  header,
  padding = 'md',
  className = '',
  onClick,
  animationDelay = 0,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'app-card',
    hoverable: 'app-card app-card-hover',
    clickable: 'app-card app-card-hover cursor-pointer',
  };

  // Support shorthand boolean props
  let effectiveVariant = variant;
  if (clickable) effectiveVariant = 'clickable';
  else if (hoverable) effectiveVariant = 'hoverable';

  const baseClasses = variantClasses[effectiveVariant];
  const paddingClass = paddingClasses[padding];

  return (
    <div
      className={`
        ${baseClasses}
        ${paddingClass}
        ${className}
      `}
      onClick={onClick}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {header && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {header.title}
            </h3>
            {header.action && (
              <div className="flex items-center gap-2">
                {header.action}
              </div>
            )}
          </div>
          <div className="gradient-divider mb-4" />
        </>
      )}
      {children}
    </div>
  );
};

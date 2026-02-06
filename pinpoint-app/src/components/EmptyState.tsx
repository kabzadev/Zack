import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  emoji,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {/* Icon or Emoji */}
      {emoji && (
        <div className="text-6xl mb-4 animate-scale-in">
          {emoji}
        </div>
      )}
      {icon && !emoji && (
        <div className="
          w-16 h-16 rounded-2xl bg-slate-800/50 
          flex items-center justify-center text-slate-400 mb-4
          animate-scale-in
        ">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-slate-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="
            px-6 py-3 rounded-xl font-semibold
            bg-white text-slate-950
            hover:bg-slate-100
            active:scale-95
            transition-all duration-200
            shadow-lg shadow-white/10
          "
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

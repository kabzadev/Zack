import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightActions?: React.ReactNode;
  onBack?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightActions,
  onBack,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="app-header">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left side - Back button or spacer */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              className="
                flex items-center justify-center w-10 h-10 rounded-xl
                bg-slate-800/50 text-slate-300 
                hover:bg-slate-700/50 hover:text-white
                active:scale-95
                transition-all duration-200
                touch-target
              "
              aria-label="Go back"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
          )}

          {/* Title and subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Action buttons */}
        {rightActions && (
          <div className="flex items-center gap-2 ml-3">
            {rightActions}
          </div>
        )}
      </div>
    </header>
  );
};

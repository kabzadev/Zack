import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} mx-4 mb-0 sm:mb-4
          bg-slate-900/95 backdrop-blur-xl border border-slate-800/50
          rounded-t-3xl sm:rounded-3xl shadow-2xl
          animate-slide-up sm:animate-scale-in
          max-h-[85vh] flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800/50">
          <div className="flex-1 min-w-0 pr-4">
            {title && (
              <h2 className="text-xl font-bold text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="
              flex items-center justify-center w-10 h-10 rounded-xl
              bg-slate-800/50 text-slate-400
              hover:bg-slate-700/50 hover:text-white
              active:scale-95
              transition-all duration-200
              touch-target
            "
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-momentum">
          {children}
        </div>
      </div>
    </div>
  );
};

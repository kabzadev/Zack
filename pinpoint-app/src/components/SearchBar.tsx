import React, { useState, useEffect, useRef } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFilterClick?: () => void;
  showFilter?: boolean;
  debounceMs?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onFilterClick,
  showFilter = false,
  debounceMs = 300,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced callback
    debounceTimerRef.current = setTimeout(() => {
      onChange?.(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex-1">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search size={20} />
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          className="
            w-full bg-slate-800/50 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-slate-500
            border-2 border-slate-700/50 transition-all duration-200
            focus:outline-none focus:bg-slate-800 focus:border-blue-500
          "
        />

        {/* Clear Button */}
        {internalValue && (
          <button
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-lg
              flex items-center justify-center
              text-slate-400 hover:text-white hover:bg-slate-700/50
              active:scale-95
              transition-all duration-200
            "
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Button */}
      {showFilter && (
        <button
          onClick={onFilterClick}
          className="
            flex items-center justify-center w-12 h-12 rounded-xl
            bg-slate-800/50 text-slate-400 border-2 border-slate-700/50
            hover:bg-slate-700/50 hover:text-white hover:border-blue-500
            active:scale-95
            transition-all duration-200
            touch-target
          "
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={20} />
        </button>
      )}
    </div>
  );
};

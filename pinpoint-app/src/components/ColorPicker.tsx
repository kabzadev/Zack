import { useState, useMemo, useCallback } from 'react';
import { Search, X, Check, Copy, Palette } from 'lucide-react';
import {
  SHERWIN_WILLIAMS_COLORS,
  COLOR_FAMILIES,
  searchColors,
} from '../data/sherwin-williams-colors';
import type { SWColor, ColorFamily } from '../data/sherwin-williams-colors';
import { ColorSwatch } from './ColorSwatch';

interface ColorPickerProps {
  onColorSelect?: (color: SWColor) => void;
  initialColor?: SWColor | null;
  initialSearch?: string;
  selectButtonLabel?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  onColorSelect,
  initialColor = null,
  initialSearch = '',
  selectButtonLabel,
}) => {
  const [query, setQuery] = useState(initialSearch);
  const [activeFamily, setActiveFamily] = useState<ColorFamily | null>(null);
  const [selectedColor, setSelectedColor] = useState<SWColor | null>(initialColor);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filtered colors
  const filteredColors = useMemo(() => {
    if (!query && !activeFamily) return SHERWIN_WILLIAMS_COLORS;
    return searchColors(query, activeFamily ?? undefined);
  }, [query, activeFamily]);

  // Handle swatch tap
  const handleSwatchSelect = useCallback((color: SWColor) => {
    setSelectedColor((prev) => (prev?.code === color.code ? null : color));
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // clipboard not available
    }
  }, []);

  // Confirm selection
  const handleConfirm = useCallback(() => {
    if (selectedColor && onColorSelect) {
      onColorSelect(selectedColor);
    }
  }, [selectedColor, onColorSelect]);

  // Determine if preview text should be dark or light
  const previewTextDark = selectedColor
    ? (0.299 * selectedColor.rgb.r +
        0.587 * selectedColor.rgb.g +
        0.114 * selectedColor.rgb.b) /
        255 >
      0.55
    : false;

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search by name or SW code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full bg-slate-800/50 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-slate-500
              border-2 border-slate-700/50 transition-all duration-200
              focus:outline-none focus:bg-slate-800 focus:border-blue-500
            "
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                w-8 h-8 rounded-lg flex items-center justify-center
                text-slate-400 hover:text-white hover:bg-slate-700/50
                active:scale-95 transition-all duration-200
              "
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Color Family Pills */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* All pill */}
          <button
            onClick={() => setActiveFamily(null)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0
              ${!activeFamily
                ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
              }
            `}
          >
            <Palette size={14} />
            All
            <span className={`text-xs ${!activeFamily ? 'text-slate-600' : 'text-slate-500'}`}>
              {SHERWIN_WILLIAMS_COLORS.length}
            </span>
          </button>

          {COLOR_FAMILIES.map((fam) => {
            const count = SHERWIN_WILLIAMS_COLORS.filter(
              (c) => c.family === fam.key
            ).length;
            const isActive = activeFamily === fam.key;
            return (
              <button
                key={fam.key}
                onClick={() =>
                  setActiveFamily(isActive ? null : fam.key)
                }
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                  whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0
                  ${isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
                  }
                `}
              >
                <span className="text-sm">{fam.emoji}</span>
                {fam.label}
                <span className={`text-xs ${isActive ? 'text-slate-600' : 'text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="px-5 pb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {filteredColors.length} color{filteredColors.length !== 1 ? 's' : ''}
          {query && ` matching "${query}"`}
        </p>
      </div>

      {/* Color Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredColors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-600" />
            </div>
            <p className="text-white font-semibold mb-1">No colors found</p>
            <p className="text-sm text-slate-500">
              Try a different search or filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 sm:gap-4">
            {filteredColors.map((color, i) => (
              <ColorSwatch
                key={color.code}
                color={color}
                isSelected={selectedColor?.code === color.code}
                onSelect={handleSwatchSelect}
                animationDelay={Math.min(i * 15, 300)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Color Detail Panel */}
      {selectedColor && (
        <div
          className="
            mx-4 mb-4 rounded-2xl overflow-hidden
            bg-slate-900/80 backdrop-blur-xl
            border border-slate-700/50
            shadow-2xl
            animate-fade-in-up
          "
        >
          {/* Large Color Preview */}
          <div
            className="h-28 sm:h-32 w-full relative"
            style={{
              backgroundColor: selectedColor.hex,
            }}
          >
            {/* Color name overlay */}
            <div className="absolute inset-0 flex items-end p-4">
              <div>
                <h3
                  className={`text-xl font-bold ${
                    previewTextDark ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {selectedColor.name}
                </h3>
                <p
                  className={`text-sm font-medium ${
                    previewTextDark ? 'text-slate-700' : 'text-white/70'
                  }`}
                >
                  {selectedColor.code}
                </p>
              </div>
            </div>
          </div>

          {/* Color Info */}
          <div className="p-4 space-y-3">
            {/* Color Data Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* HEX */}
              <button
                onClick={() => handleCopy(selectedColor.hex, 'hex')}
                className="
                  flex flex-col items-center gap-1 p-2.5 rounded-xl
                  bg-slate-800/50 border border-slate-700/30
                  hover:bg-slate-700/50 active:scale-95
                  transition-all duration-200
                "
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  HEX
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  {selectedColor.hex}
                  {copiedField === 'hex' ? (
                    <Check size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} className="text-slate-600" />
                  )}
                </span>
              </button>

              {/* RGB */}
              <button
                onClick={() =>
                  handleCopy(
                    `${selectedColor.rgb.r}, ${selectedColor.rgb.g}, ${selectedColor.rgb.b}`,
                    'rgb'
                  )
                }
                className="
                  flex flex-col items-center gap-1 p-2.5 rounded-xl
                  bg-slate-800/50 border border-slate-700/30
                  hover:bg-slate-700/50 active:scale-95
                  transition-all duration-200
                "
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  RGB
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  {selectedColor.rgb.r},{selectedColor.rgb.g},{selectedColor.rgb.b}
                  {copiedField === 'rgb' ? (
                    <Check size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} className="text-slate-600" />
                  )}
                </span>
              </button>

              {/* Code */}
              <button
                onClick={() => handleCopy(selectedColor.code, 'code')}
                className="
                  flex flex-col items-center gap-1 p-2.5 rounded-xl
                  bg-slate-800/50 border border-slate-700/30
                  hover:bg-slate-700/50 active:scale-95
                  transition-all duration-200
                "
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  CODE
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  {selectedColor.code.replace('SW ', '')}
                  {copiedField === 'code' ? (
                    <Check size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} className="text-slate-600" />
                  )}
                </span>
              </button>
            </div>

            {/* Select Button */}
            {onColorSelect && (
              <button
                onClick={handleConfirm}
                className={`
                  w-full py-3.5 rounded-xl font-semibold text-base
                  shadow-lg active:scale-[0.97]
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  ${selectButtonLabel
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600'
                    : 'bg-white text-slate-950 shadow-white/10 hover:bg-slate-100'
                  }
                `}
              >
                <Check size={20} strokeWidth={2.5} />
                {selectButtonLabel ? `${selectButtonLabel} — ${selectedColor.name}` : `Select ${selectedColor.name}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

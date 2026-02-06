import type { SWColor } from '../data/sherwin-williams-colors';

interface ColorSwatchProps {
  color: SWColor;
  isSelected: boolean;
  onSelect: (color: SWColor) => void;
  animationDelay?: number;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  isSelected,
  onSelect,
  animationDelay = 0,
}) => {
  // Determine if the swatch color is light (needs dark checkmark) or dark
  const { r, g, b } = color.rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.55;

  return (
    <button
      onClick={() => onSelect(color)}
      className="group relative flex flex-col items-center gap-1.5 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-label={`${color.name} ${color.code}`}
    >
      {/* Swatch Circle */}
      <div
        className={`
          w-14 h-14 sm:w-16 sm:h-16 rounded-2xl
          transition-all duration-300 ease-out
          shadow-lg
          ${isSelected
            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 shadow-xl'
            : 'hover:scale-105 hover:shadow-xl active:scale-95'
          }
        `}
        style={{
          backgroundColor: color.hex,
          boxShadow: isSelected
            ? `0 8px 24px ${color.hex}55`
            : `0 4px 12px ${color.hex}33`,
        }}
      >
        {/* Selected Checkmark */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
            <svg
              className={`w-6 h-6 ${isLight ? 'text-slate-900' : 'text-white'} drop-shadow-md`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Color Name */}
      <span
        className={`
          text-[10px] sm:text-xs font-medium leading-tight text-center
          w-16 sm:w-18 truncate
          transition-colors duration-200
          ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}
        `}
      >
        {color.name}
      </span>
    </button>
  );
};

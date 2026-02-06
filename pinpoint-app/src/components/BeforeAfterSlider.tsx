import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPositionFromEvent = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return 50;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      return Math.max(0, Math.min(100, percentage));
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setSliderPosition(getPositionFromEvent(e.clientX));
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [getPositionFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setSliderPosition(getPositionFromEvent(e.clientX));
    },
    [isDragging, getPositionFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSliderPosition((prev) => Math.max(0, prev - 2));
      } else if (e.key === 'ArrowRight') {
        setSliderPosition((prev) => Math.min(100, prev + 2));
      }
    };
    const el = containerRef.current;
    el?.addEventListener('keydown', handleKeyDown);
    return () => el?.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden select-none touch-none bg-black ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      tabIndex={0}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* After Image (background, full) */}
      <div className="relative w-full">
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-auto block"
          draggable={false}
        />
      </div>

      {/* Before Image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-auto block"
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        {/* Handle */}
        <div
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-10 h-10 rounded-full bg-white shadow-lg shadow-black/30
            flex items-center justify-center pointer-events-auto cursor-grab
            transition-transform duration-150
            ${isDragging ? 'scale-110 cursor-grabbing' : 'hover:scale-105'}
          `}
        >
          <GripVertical size={18} className="text-slate-700" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm pointer-events-none">
        <span className="text-xs font-semibold text-white/80">{beforeLabel}</span>
      </div>
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm pointer-events-none">
        <span className="text-xs font-semibold text-white/80">{afterLabel}</span>
      </div>
    </div>
  );
};

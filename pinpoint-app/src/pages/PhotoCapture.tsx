import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { PageHeader } from '../components/PageHeader';
import { PhotoUploader } from '../components/PhotoUploader';
import {
  Palette,
  Sparkles,
  MapPin,
  Trash2,
  Undo2,
} from 'lucide-react';
import type { SWColor } from '../data/sherwin-williams-colors';
import { SHERWIN_WILLIAMS_COLORS } from '../data/sherwin-williams-colors';

interface Region {
  id: string;
  x: number; // percentage
  y: number; // percentage
  label: string;
}

export const PhotoCapture = () => {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<SWColor | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleImageCapture = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl);
    setRegions([]);
    setSelectedRegion(null);
  }, []);

  const handleImageTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current || !capturedImage) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      const newRegion: Region = {
        id: `region-${Date.now()}`,
        x,
        y,
        label: `Area ${regions.length + 1}`,
      };

      setRegions((prev) => [...prev, newRegion]);
      setSelectedRegion(newRegion.id);
    },
    [capturedImage, regions.length]
  );

  const removeRegion = (id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
    if (selectedRegion === id) setSelectedRegion(null);
  };

  const undoLastRegion = () => {
    setRegions((prev) => {
      const updated = prev.slice(0, -1);
      setSelectedRegion(updated.length > 0 ? updated[updated.length - 1].id : null);
      return updated;
    });
  };

  const handleVisualize = () => {
    if (!capturedImage || !selectedColor) return;
    // Store data in sessionStorage for the visualization page
    sessionStorage.setItem('visualizer-image', capturedImage);
    sessionStorage.setItem('visualizer-color', JSON.stringify(selectedColor));
    sessionStorage.setItem('visualizer-regions', JSON.stringify(regions));
    navigate('/ai-visualization');
  };

  // Quick color picks — grab a few popular colors
  const quickColors = SHERWIN_WILLIAMS_COLORS.filter((c) =>
    ['Naval', 'Alabaster', 'Agreeable Gray', 'Urbane Bronze', 'Evergreen Fog', 'Redend Point'].includes(c.name)
  );

  return (
    <Layout>
      <PageHeader title="Color Visualizer" showBack onBack={() => navigate('/')} />

      <div className="px-5 py-4 space-y-5">
        {/* Photo Upload / Capture */}
        {!capturedImage && (
          <div className="animate-fade-in-up">
            <PhotoUploader onImageCapture={handleImageCapture} />
          </div>
        )}

        {/* Image with Region Overlay */}
        {capturedImage && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Instructions */}
            <div className="flex items-center gap-2 px-1">
              <MapPin size={14} className="text-blue-400" />
              <p className="text-xs text-slate-400">
                Tap on the photo to mark areas you want to recolor
              </p>
            </div>

            {/* Photo Container */}
            <div
              ref={imageContainerRef}
              className="relative rounded-2xl overflow-hidden bg-black/30 border border-white/10 cursor-crosshair"
              onClick={handleImageTap}
            >
              <img
                src={capturedImage}
                alt="Project"
                className="w-full h-auto block"
                draggable={false}
              />

              {/* Region Pins */}
              {regions.map((region, i) => (
                <div
                  key={region.id}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRegion(region.id);
                  }}
                >
                  {/* Pulse ring */}
                  <div
                    className={`absolute inset-0 -m-3 rounded-full animate-ping ${
                      selectedRegion === region.id
                        ? 'bg-blue-400/30'
                        : 'bg-white/20'
                    }`}
                    style={{ animationDuration: '2s' }}
                  />
                  {/* Pin */}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      shadow-lg transition-all duration-200
                      ${
                        selectedRegion === region.id
                          ? 'bg-blue-500 text-white scale-110 shadow-blue-500/40'
                          : 'bg-white text-slate-900 shadow-black/30'
                      }
                    `}
                  >
                    {i + 1}
                  </div>
                </div>
              ))}

              {/* Color overlay preview (if color selected) */}
              {selectedColor && regions.length > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-color opacity-20"
                  style={{ backgroundColor: selectedColor.hex }}
                />
              )}
            </div>

            {/* Region Actions */}
            {regions.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={undoLastRegion}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm"
                >
                  <Undo2 size={14} />
                  Undo
                </button>
                {selectedRegion && (
                  <button
                    onClick={() => removeRegion(selectedRegion)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm"
                  >
                    <Trash2 size={14} />
                    Remove Pin
                  </button>
                )}
                <div className="flex-1" />
                <span className="text-xs text-slate-600">
                  {regions.length} pin{regions.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Color Selection */}
            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-blue-400" />
                  <p className="text-sm font-semibold text-white">Choose Color</p>
                </div>
                <button
                  onClick={() => navigate('/colors')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Browse All →
                </button>
              </div>

              {/* Quick Color Swatches */}
              <div className="flex flex-wrap gap-2">
                {quickColors.map((color) => (
                  <button
                    key={color.code}
                    onClick={() => setSelectedColor(color)}
                    className={`
                      group relative w-10 h-10 rounded-xl transition-all duration-200
                      ${
                        selectedColor?.code === color.code
                          ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-110'
                          : 'hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} (${color.code})`}
                  >
                    {selectedColor?.code === color.code && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Color Info */}
              {selectedColor && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <div
                    className="w-12 h-12 rounded-xl shadow-lg flex-shrink-0"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {selectedColor.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedColor.code} · {selectedColor.hex}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Visualize Button */}
            <button
              onClick={handleVisualize}
              disabled={!selectedColor || regions.length === 0}
              className={`
                w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base
                transition-all duration-300 shadow-lg active:scale-[0.98]
                ${
                  selectedColor && regions.length > 0
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600'
                    : 'bg-slate-800/50 text-slate-600 cursor-not-allowed shadow-none'
                }
              `}
            >
              <Sparkles size={20} />
              Visualize with AI
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                setCapturedImage(null);
                setRegions([]);
                setSelectedRegion(null);
                setSelectedColor(null);
              }}
              className="w-full py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

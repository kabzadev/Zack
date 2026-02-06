import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components';
import { PageHeader } from '../components/PageHeader';
import { PhotoUploader } from '../components/PhotoUploader';
import { telemetry } from '../utils/telemetry';
import {
  Palette,
  Sparkles,
  ChevronRight,
  Home,
  PanelTop,
  DoorOpen,
  Paintbrush,
} from 'lucide-react';
import type { SWColor } from '../data/sherwin-williams-colors';
import { SHERWIN_WILLIAMS_COLORS } from '../data/sherwin-williams-colors';

interface ColorZone {
  id: 'body' | 'trim' | 'doors' | 'accent';
  label: string;
  icon: React.ReactNode;
  color: SWColor | null;
}

// Serializable version of zones for sessionStorage
interface SavedZone {
  id: string;
  color: SWColor | null;
}

export const PhotoCapture = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Restore state from sessionStorage if returning from color picker
  const savedImage = sessionStorage.getItem('pc-image');
  const savedZonesStr = sessionStorage.getItem('pc-zones');
  const savedActiveZone = sessionStorage.getItem('pc-activeZone');
  const returnedColor = searchParams.get('selectedColor'); // JSON-encoded SWColor

  const [capturedImage, setCapturedImage] = useState<string | null>(savedImage);
  const [activeZone, setActiveZone] = useState<string>(savedActiveZone || 'body');
  const [colorSearch, setColorSearch] = useState('');
  // Rebuild zones with saved colors if available
  const buildInitialZones = (): ColorZone[] => {
    const defaults: ColorZone[] = [
      { id: 'body', label: 'Body / Walls', icon: <Home size={16} />, color: null },
      { id: 'trim', label: 'Trim', icon: <PanelTop size={16} />, color: null },
      { id: 'doors', label: 'Doors', icon: <DoorOpen size={16} />, color: null },
      { id: 'accent', label: 'Accent', icon: <Paintbrush size={16} />, color: null },
    ];
    if (savedZonesStr) {
      try {
        const saved: SavedZone[] = JSON.parse(savedZonesStr);
        return defaults.map(z => {
          const s = saved.find(sv => sv.id === z.id);
          return s?.color ? { ...z, color: s.color } : z;
        });
      } catch { /* ignore */ }
    }
    return defaults;
  };

  const [zones, setZones] = useState<ColorZone[]>(buildInitialZones);

  // Handle color returned from the full color picker
  useEffect(() => {
    if (returnedColor) {
      try {
        const color: SWColor = JSON.parse(decodeURIComponent(returnedColor));
        const zone = savedActiveZone || 'body';
        telemetry.color('returned_from_picker', { color: color.name, code: color.code, zone });
        setZones(prev => prev.map(z => z.id === zone ? { ...z, color } : z));
        // Clear the URL param
        navigate('/photo-capture', { replace: true });
      } catch (e) { 
        telemetry.error('color:return_parse_fail', { raw: returnedColor?.slice(0, 100), error: String(e) });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedColor]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (capturedImage) {
      sessionStorage.setItem('pc-image', capturedImage);
    }
  }, [capturedImage]);

  useEffect(() => {
    const toSave: SavedZone[] = zones.map(z => ({ id: z.id, color: z.color }));
    sessionStorage.setItem('pc-zones', JSON.stringify(toSave));
  }, [zones]);

  useEffect(() => {
    sessionStorage.setItem('pc-activeZone', activeZone);
  }, [activeZone]);

  const handleImageCapture = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl);
  }, []);

  const setZoneColor = (zoneId: string, color: SWColor) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, color } : z));
  };

  const handleVisualize = () => {
    if (!capturedImage) return;
    const assignedZones = zones.filter(z => z.color !== null);
    if (assignedZones.length === 0) return;
    telemetry.color('visualize', { zones: assignedZones.map(z => ({ id: z.id, color: z.color?.name })) });

    sessionStorage.setItem('visualizer-image', capturedImage);
    sessionStorage.setItem('visualizer-zones', JSON.stringify(
      assignedZones.map(z => ({
        id: z.id,
        label: z.label,
        colorName: z.color!.name,
        colorCode: z.color!.code,
        colorHex: z.color!.hex,
      }))
    ));
    navigate('/ai-visualization');
  };

  // Popular colors for quick picks
  const popularColors = SHERWIN_WILLIAMS_COLORS.filter(c =>
    ['Naval', 'Alabaster', 'Agreeable Gray', 'Repose Gray', 'Sea Salt',
     'Pure White', 'Iron Ore', 'Tricorn Black', 'Snowbound', 'Dover White',
     'Urbane Bronze', 'Evergreen Fog', 'Redend Point', 'Extra White',
     'Accessible Beige', 'City Loft'].includes(c.name)
  );

  // Filter colors by search
  const filteredColors = colorSearch.trim()
    ? SHERWIN_WILLIAMS_COLORS.filter(c => {
        const q = colorSearch.toLowerCase().replace(/\s+/g, '');
        const name = c.name.toLowerCase().replace(/\s+/g, '');
        const code = c.code.toLowerCase().replace(/\s+/g, '');
        return name.includes(q) || code.includes(q);
      }).slice(0, 24)
    : popularColors;

  const assignedCount = zones.filter(z => z.color !== null).length;

  return (
    <Layout>
      <PageHeader title="Color Visualizer" showBack onBack={() => navigate('/')} />

      <div className="px-5 py-4 pb-32 space-y-5">
        {/* Photo Upload */}
        {!capturedImage && (
          <div className="animate-fade-in-up">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">Upload a Photo</h2>
              <p className="text-sm text-slate-400">Take or upload a photo of the house, then pick colors for each area.</p>
            </div>
            <PhotoUploader onImageCapture={handleImageCapture} />
          </div>
        )}

        {/* Image + Color Zones */}
        {capturedImage && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Photo Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black/30 border border-white/10">
              <img src={capturedImage} alt="Project" className="w-full h-auto block" draggable={false} />
              {/* Color zone indicators overlaid */}
              {assignedCount > 0 && (
                <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                  {zones.filter(z => z.color).map(z => (
                    <div key={z.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                      <div className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: z.color!.hex }} />
                      <span className="text-[10px] text-white font-medium">{z.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zone Selector Tabs */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Pick colors for each area
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {zones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => setActiveZone(zone.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all text-sm font-medium ${
                      activeZone === zone.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : zone.color
                          ? 'bg-slate-800/60 text-white border border-slate-700/50'
                          : 'bg-slate-900/40 text-slate-500 border border-slate-800/30'
                    }`}
                  >
                    {zone.color ? (
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: zone.color.hex }} />
                    ) : (
                      <span className="text-slate-500">{zone.icon}</span>
                    )}
                    {zone.label}
                    {zone.color && <span className="text-[10px] text-slate-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Zone Color Picker */}
            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-blue-400" />
                  <p className="text-sm font-semibold text-white">
                    {zones.find(z => z.id === activeZone)?.label} Color
                  </p>
                </div>
                <button
                  onClick={() => navigate('/colors?returnTo=photo-capture')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Browse All →
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search colors (e.g., Naval, SW 6244)"
                value={colorSearch}
                onChange={e => setColorSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
              />

              {/* Color Grid */}
              <div className="grid grid-cols-6 gap-2">
                {filteredColors.map(color => {
                  const currentZone = zones.find(z => z.id === activeZone);
                  const isSelected = currentZone?.color?.code === color.code;
                  return (
                    <button
                      key={color.code}
                      onClick={() => setZoneColor(activeZone, color)}
                      className={`relative aspect-square rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-110 z-10'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name} (${color.code})`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Color Detail */}
              {zones.find(z => z.id === activeZone)?.color && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <div
                    className="w-12 h-12 rounded-xl shadow-lg flex-shrink-0 border border-white/10"
                    style={{ backgroundColor: zones.find(z => z.id === activeZone)!.color!.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {zones.find(z => z.id === activeZone)!.color!.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {zones.find(z => z.id === activeZone)!.color!.code} · {zones.find(z => z.id === activeZone)!.color!.hex}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Color Summary */}
            {assignedCount > 0 && (
              <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Color Scheme</p>
                <div className="space-y-2">
                  {zones.filter(z => z.color).map(z => (
                    <div key={z.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: z.color!.hex }} />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{z.label}</p>
                        <p className="text-xs text-slate-500">{z.color!.name} ({z.color!.code})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visualize Button */}
            <button
              onClick={handleVisualize}
              disabled={assignedCount === 0}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all duration-300 shadow-lg active:scale-[0.98] ${
                assignedCount > 0
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600'
                  : 'bg-slate-800/50 text-slate-600 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles size={20} />
              Visualize with AI ({assignedCount} color{assignedCount !== 1 ? 's' : ''})
              <ChevronRight size={18} />
            </button>

            {/* Reset */}
            <button
              onClick={() => { setCapturedImage(null); setZones(z => z.map(zone => ({ ...zone, color: null }))); setColorSearch(''); sessionStorage.removeItem('pc-image'); sessionStorage.removeItem('pc-zones'); sessionStorage.removeItem('pc-activeZone'); }}
              className="w-full py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Start Over with New Photo
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { ColorPicker } from '../components/ColorPicker';
import { Palette } from 'lucide-react';
import type { SWColor } from '../data/sherwin-williams-colors';

// Zone labels for display
const ZONE_LABELS: Record<string, string> = {
  body: 'Body / Walls',
  trim: 'Trim',
  doors: 'Doors',
  accent: 'Accent',
};

export const ColorPickerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const returnTo = searchParams.get('returnTo');
  const isSelectionMode = returnTo === 'photo-capture';

  // Get the active zone name from sessionStorage
  const activeZone = typeof window !== 'undefined' ? sessionStorage.getItem('pc-activeZone') || 'body' : 'body';
  const zoneName = ZONE_LABELS[activeZone] || activeZone;

  const handleColorSelect = (color: SWColor) => {
    if (returnTo) {
      const encoded = encodeURIComponent(JSON.stringify(color));
      navigate(`/${returnTo}?selectedColor=${encoded}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <Layout>
      <PageHeader
        title={isSelectionMode ? `Pick ${zoneName} Color` : 'Paint Colors'}
        subtitle={isSelectionMode ? 'Select a color, then tap the button below' : 'Sherwin-Williams Collection'}
        showBack
      />

      {/* Selection mode banner */}
      {isSelectionMode && (
        <div className="mx-5 mb-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Palette size={16} className="text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            Picking color for <strong>{zoneName}</strong>. Tap a swatch, then hit the select button. Your photo and other colors are saved.
          </p>
        </div>
      )}

      <div className="flex flex-col" style={{ height: isSelectionMode ? 'calc(100vh - 200px)' : 'calc(100vh - 140px)' }}>
        <ColorPicker
          onColorSelect={handleColorSelect}
          initialSearch={initialSearch}
          selectButtonLabel={isSelectionMode ? `Use for ${zoneName}` : undefined}
        />
      </div>
    </Layout>
  );
};

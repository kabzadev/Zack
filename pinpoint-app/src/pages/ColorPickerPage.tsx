import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { ColorPicker } from '../components/ColorPicker';
import type { SWColor } from '../data/sherwin-williams-colors';

export const ColorPickerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const returnTo = searchParams.get('returnTo');

  const handleColorSelect = (color: SWColor) => {
    if (returnTo) {
      // Return to the calling page with the selected color
      const encoded = encodeURIComponent(JSON.stringify(color));
      navigate(`/${returnTo}?selectedColor=${encoded}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <Layout>
      <PageHeader
        title={returnTo ? 'Pick a Color' : 'Paint Colors'}
        subtitle={returnTo ? 'Tap a color to select it' : 'Sherwin-Williams Collection'}
        showBack
      />
      <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        <ColorPicker onColorSelect={handleColorSelect} initialSearch={initialSearch} />
      </div>
    </Layout>
  );
};

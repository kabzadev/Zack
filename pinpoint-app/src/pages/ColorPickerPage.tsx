import { useNavigate } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { ColorPicker } from '../components/ColorPicker';
import type { SWColor } from '../data/sherwin-williams-colors';

export const ColorPickerPage = () => {
  const navigate = useNavigate();

  const handleColorSelect = (color: SWColor) => {
    // For now, log the selection — this will integrate with the estimate builder
    console.log('Selected color:', color);
    // Navigate back or use however needed
    navigate(-1);
  };

  return (
    <Layout>
      <PageHeader
        title="Paint Colors"
        subtitle="Sherwin-Williams Collection"
        showBack
      />
      <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        <ColorPicker onColorSelect={handleColorSelect} />
      </div>
    </Layout>
  );
};

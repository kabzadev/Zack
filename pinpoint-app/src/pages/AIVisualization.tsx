import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { PageHeader } from '../components/PageHeader';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import {
  Download,
  Share2,
  Palette,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';
import type { SWColor } from '../data/sherwin-williams-colors';

export const AIVisualization = () => {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [recoloredImage, setRecoloredImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<SWColor | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate mock AI recolored image using canvas blend modes
  const generateMockRecolor = useCallback(
    (imageSrc: string, color: SWColor): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageSrc);
            return;
          }

          // Draw original
          ctx.drawImage(img, 0, 0);

          // Apply color overlay with "color" blend mode to simulate recoloring
          ctx.globalCompositeOperation = 'color';
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = color.hex;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Restore and enhance contrast slightly
          ctx.globalCompositeOperation = 'overlay';
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = color.hex;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.src = imageSrc;
      });
    },
    []
  );

  useEffect(() => {
    const image = sessionStorage.getItem('visualizer-image');
    const colorStr = sessionStorage.getItem('visualizer-color');

    if (!image || !colorStr) {
      navigate('/photo-capture');
      return;
    }

    const color: SWColor = JSON.parse(colorStr);
    setOriginalImage(image);
    setSelectedColor(color);

    // Simulate AI processing delay
    const timer = setTimeout(async () => {
      const recolored = await generateMockRecolor(image, color);
      setRecoloredImage(recolored);
      setIsProcessing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, generateMockRecolor]);

  const handleSave = async () => {
    if (!recoloredImage) return;

    try {
      // Convert data URL to blob and trigger download
      const response = await fetch(recoloredImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pinpoint-visualizer-${selectedColor?.name.replace(/\s+/g, '-').toLowerCase() || 'recolor'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      // Fallback: open in new tab
      window.open(recoloredImage, '_blank');
    }
  };

  const handleShare = async () => {
    if (!recoloredImage) return;

    if (navigator.share) {
      try {
        const response = await fetch(recoloredImage);
        const blob = await response.blob();
        const file = new File([blob], 'pinpoint-visualization.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: `Color Visualization - ${selectedColor?.name}`,
          text: `Check out this color visualization using ${selectedColor?.name} (${selectedColor?.code}) from Sherwin-Williams!`,
          files: [file],
        });
      } catch {
        // User cancelled or share failed — that's fine
      }
    } else {
      // Fallback: copy image URL
      handleSave();
    }
  };

  if (!originalImage) return null;

  return (
    <Layout>
      <PageHeader title="AI Visualization" showBack onBack={() => navigate('/photo-capture')} />

      <div className="px-5 py-4 space-y-5">
        {/* Processing State */}
        {isProcessing && (
          <div className="animate-fade-in-up">
            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
                  <Sparkles size={28} className="text-white" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border border-blue-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Processing your photo...</p>
                <p className="text-sm text-slate-500 mt-1">AI is visualizing your color selection</p>
              </div>
              <div className="w-full max-w-[200px] h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: '70%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isProcessing && recoloredImage && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Color Info Bar */}
            {selectedColor && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10">
                <div
                  className="w-11 h-11 rounded-xl shadow-lg flex-shrink-0 border border-white/10"
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
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10">
                  <Palette size={12} className="text-green-400" />
                  <span className="text-xs font-medium text-green-400">Applied</span>
                </div>
              </div>
            )}

            {/* Before/After Slider */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Comparison
              </p>
              <BeforeAfterSlider
                beforeImage={originalImage}
                afterImage={recoloredImage}
                beforeLabel="Original"
                afterLabel={selectedColor?.name || 'Recolored'}
                className="min-h-[250px]"
              />
              <p className="text-xs text-slate-600 text-center mt-2">
                Drag the slider to compare before &amp; after
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm
                  transition-all duration-300 active:scale-[0.98]
                  ${
                    isSaved
                      ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                      : 'bg-slate-800/80 text-white hover:bg-slate-800 border border-white/5'
                  }
                `}
              >
                {isSaved ? <Check size={18} /> : <Download size={18} />}
                {isSaved ? 'Saved!' : 'Save'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600 transition-all active:scale-[0.98]"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>

            {/* Try Another Color */}
            <button
              onClick={() => navigate('/photo-capture')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <RotateCcw size={16} />
              Try Another Color
            </button>

            {/* Mock Disclaimer */}
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
              <p className="text-xs text-amber-500/70 text-center leading-relaxed">
                <span className="font-semibold">Preview Mode:</span> This is a simulated color visualization.
                Actual results may vary based on lighting, surface texture, and paint finish.
              </p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </Layout>
  );
};

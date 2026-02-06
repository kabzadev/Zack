import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { PageHeader } from '../components/PageHeader';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import {
  Download,
  Share2,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// OpenAI API key — loaded from VITE_OPENAI_API_KEY env var
// In production, this should go through a backend proxy
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface ColorZoneInfo {
  id: string;
  label: string;
  colorName: string;
  colorCode: string;
  colorHex: string;
}

export const AIVisualization = () => {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [recoloredImage, setRecoloredImage] = useState<string | null>(null);
  const [zones, setZones] = useState<ColorZoneInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStep, setProcessingStep] = useState('Analyzing photo...');
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const buildPrompt = useCallback((colorZones: ColorZoneInfo[]): string => {
    const colorList = colorZones.map(z => 
      `${z.label}: ${z.colorName} (Sherwin-Williams ${z.colorCode}, hex ${z.colorHex})`
    ).join('\n');

    return `Repaint this house photo with the following Sherwin-Williams paint colors. Apply each color ONLY to its designated area. Keep all architectural details, landscaping, shadows, lighting, and surroundings exactly the same. The result should look like a realistic, professional photograph — not a render or illustration.

Color assignments:
${colorList}

Requirements:
- Apply colors realistically with proper shadows and highlights
- Maintain all textures (wood grain, stucco, brick, siding, etc.)
- Keep the exact same perspective, lighting, and composition
- Preserve all non-painted elements (windows, roof, landscaping, sky, driveway)
- The paint finish should look wet/fresh and professionally applied
- Output should be photorealistic quality`;
  }, []);

  const generateWithOpenAI = useCallback(async (imageSrc: string, colorZones: ColorZoneInfo[]) => {
    setProcessingStep('Sending to AI...');
    
    // Convert data URL to blob
    const response = await fetch(imageSrc);
    const imageBlob = await response.blob();
    
    // Resize if too large (OpenAI has limits)
    const resizedBlob = await resizeImage(imageBlob, 1024);
    
    const prompt = buildPrompt(colorZones);
    
    setProcessingStep('AI is painting your house...');

    // Use OpenAI Images Edit API
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('image', resizedBlob, 'house.png');
    formData.append('prompt', prompt);
    formData.append('size', '1024x1024');
    formData.append('quality', 'high');

    const apiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      const errData = await apiResponse.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    
    if (data.data?.[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    } else if (data.data?.[0]?.url) {
      return data.data[0].url;
    }
    
    throw new Error('No image returned from AI');
  }, [buildPrompt]);

  // Fallback: enhanced CSS recoloring for when API is unavailable
  const generateFallbackRecolor = useCallback(async (imageSrc: string, colorZones: ColorZoneInfo[]): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(imageSrc); return; }

        ctx.drawImage(img, 0, 0);

        // Use the body/primary color for the overlay
        const primaryColor = colorZones.find(z => z.id === 'body') || colorZones[0];
        if (primaryColor) {
          ctx.globalCompositeOperation = 'color';
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = primaryColor.colorHex;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.globalCompositeOperation = 'overlay';
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = primaryColor.colorHex;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = imageSrc;
    });
  }, []);

  const processImage = useCallback(async (image: string, colorZones: ColorZoneInfo[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      let result: string;

      if (OPENAI_API_KEY) {
        setProcessingStep('Connecting to AI...');
        result = await generateWithOpenAI(image, colorZones);
      } else {
        setProcessingStep('Generating preview...');
        // Simulate delay for fallback
        await new Promise(r => setTimeout(r, 1500));
        result = await generateFallbackRecolor(image, colorZones);
      }

      setRecoloredImage(result);
      setIsProcessing(false);
    } catch (err) {
      console.error('AI visualization error:', err);
      // Fall back to CSS blend
      setProcessingStep('Falling back to preview mode...');
      try {
        const fallback = await generateFallbackRecolor(image, colorZones);
        setRecoloredImage(fallback);
        setError(`AI service unavailable — showing preview. (${err instanceof Error ? err.message : 'Unknown error'})`);
      } catch {
        setError('Failed to generate visualization. Please try again.');
      }
      setIsProcessing(false);
    }
  }, [generateWithOpenAI, generateFallbackRecolor]);

  useEffect(() => {
    const image = sessionStorage.getItem('visualizer-image');
    const zonesStr = sessionStorage.getItem('visualizer-zones');

    if (!image || !zonesStr) {
      navigate('/photo-capture');
      return;
    }

    const parsedZones: ColorZoneInfo[] = JSON.parse(zonesStr);
    setOriginalImage(image);
    setZones(parsedZones);
    processImage(image, parsedZones);
  }, [navigate, processImage]);

  const handleRetry = () => {
    if (originalImage && zones.length > 0) {
      processImage(originalImage, zones);
    }
  };

  const handleSave = async () => {
    if (!recoloredImage) return;
    try {
      const response = await fetch(recoloredImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const colorNames = zones.map(z => z.colorName.replace(/\s+/g, '-').toLowerCase()).join('_');
      a.download = `pinpoint-visualizer-${colorNames}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      if (recoloredImage) window.open(recoloredImage, '_blank');
    }
  };

  const handleShare = async () => {
    if (!recoloredImage || !navigator.share) { handleSave(); return; }
    try {
      const response = await fetch(recoloredImage);
      const blob = await response.blob();
      const file = new File([blob], 'pinpoint-visualization.jpg', { type: 'image/jpeg' });
      await navigator.share({
        title: 'Color Visualization — Pinpoint Painting',
        text: `Color scheme: ${zones.map(z => `${z.label}: ${z.colorName} (${z.colorCode})`).join(', ')}`,
        files: [file],
      });
    } catch { /* cancelled */ }
  };

  if (!originalImage) return null;

  return (
    <Layout>
      <PageHeader title="AI Visualization" showBack onBack={() => navigate('/photo-capture')} />

      <div className="px-5 py-4 pb-32 space-y-5">
        {/* Processing */}
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
                <p className="text-white font-semibold text-lg">{processingStep}</p>
                <p className="text-sm text-slate-500 mt-1">This may take 10-20 seconds</p>
              </div>
              <div className="w-full max-w-[200px] h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: '80%' }} />
              </div>

              {/* Color scheme being applied */}
              <div className="flex gap-3 mt-2">
                {zones.map(z => (
                  <div key={z.id} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-lg border border-white/20 shadow-lg" style={{ backgroundColor: z.colorHex }} />
                    <span className="text-[9px] text-slate-600">{z.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isProcessing && recoloredImage && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Error banner (for fallback mode) */}
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-400 leading-relaxed">{error}</p>
                  <button onClick={handleRetry} className="mt-1.5 flex items-center gap-1 text-xs text-amber-300 font-semibold hover:text-amber-200">
                    <RefreshCw size={12} /> Try again with AI
                  </button>
                </div>
              </div>
            )}

            {/* Color Scheme Applied */}
            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Applied Colors</p>
              <div className="flex gap-4">
                {zones.map(z => (
                  <div key={z.id} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl shadow-lg border border-white/10" style={{ backgroundColor: z.colorHex }} />
                    <div>
                      <p className="text-xs font-semibold text-white">{z.label}</p>
                      <p className="text-[10px] text-slate-500">{z.colorName}</p>
                      <p className="text-[10px] text-slate-600">{z.colorCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Before/After */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Before & After</p>
              <BeforeAfterSlider
                beforeImage={originalImage}
                afterImage={recoloredImage}
                beforeLabel="Original"
                afterLabel="Visualized"
                className="min-h-[250px]"
              />
              <p className="text-xs text-slate-600 text-center mt-2">Drag the slider to compare</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  isSaved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                    : 'bg-slate-800/80 text-white hover:bg-slate-800 border border-white/5'
                }`}
              >
                {isSaved ? <Check size={18} /> : <Download size={18} />}
                {isSaved ? 'Saved!' : 'Save'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600 transition-all active:scale-[0.98]"
              >
                <Share2 size={18} />
                Share with Customer
              </button>
            </div>

            <button
              onClick={() => navigate('/photo-capture')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <RotateCcw size={16} />
              Try Different Colors
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Utility: resize image to max dimension while keeping aspect ratio
async function resizeImage(blob: Blob, maxDim: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => resolve(b || blob), 'image/png');
    };
    img.src = URL.createObjectURL(blob);
  });
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { PageHeader } from '../components/PageHeader';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { telemetry } from '../utils/telemetry';
import {
  Download,
  Share2,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// Gemini API — use backend proxy when available, fallback to direct
import { API_URL } from '../utils/api';
const GEMINI_PROXY_URL = API_URL ? `${API_URL.replace('/api', '')}/api/gemini/generate` : '';
const GEMINI_API_KEY = 'AIzaSyD4F5xs2nayiYdKJ1q3jqUdGt53Lla3AkA';
const GEMINI_MODEL = 'nano-banana-pro-preview'; // Gemini 3 Pro — much better at selective image editing
const GEMINI_DIRECT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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
      `- ${z.label}: ${z.colorName} (Sherwin-Williams ${z.colorCode}, hex color ${z.colorHex})`
    ).join('\n');

    const hasWallsOnly = colorZones.length === 1 && (colorZones[0].id === 'body' || colorZones[0].label.toLowerCase().includes('wall'));
    const isLikelyInterior = hasWallsOnly; // Single wall color = probably interior room

    if (isLikelyInterior) {
      const z = colorZones[0];
      return `You are a professional interior paint visualization tool. Take this photo of a room and change ONLY the wall color to ${z.colorName} (${z.colorHex}).

CRITICAL RULES:
1. IDENTIFY the walls first — they are the large flat vertical surfaces in the room
2. CHANGE the color of ONLY those wall surfaces to ${z.colorHex}
3. DO NOT apply a color filter or tint over the entire image
4. DO NOT change: ceiling, floor, furniture, doors, windows, trim, baseboards, outlets, light fixtures, curtains, or any objects in the room
5. The walls should show realistic paint coverage with natural light and shadow variation
6. Keep the exact same camera angle, perspective, and composition
7. The final image must look like a real photograph of the room with freshly painted walls
8. Maintain wall texture — do not make walls look flat or artificially smooth

OUTPUT: A photorealistic edited version of this photo where only the walls have been repainted.`;
    }

    return `You are a professional paint visualization tool. Take this photo and repaint ONLY the specified areas with these Sherwin-Williams colors:

${colorList}

CRITICAL RULES:
1. IDENTIFY each area (body/siding, trim, door, etc.) in the photo
2. CHANGE the color of ONLY those specific areas — nothing else
3. DO NOT apply a color filter or tint over the entire image  
4. DO NOT change: windows, glass, landscaping, ground, sky, vehicles, fixtures, or any non-painted surfaces
5. Paint should look realistic with proper light, shadow, and surface texture
6. Maintain the exact same camera angle, perspective, and composition
7. Keep wood grain on wood, siding lines on siding, brick pattern on brick
8. The final image must look like a real photograph, not a rendering

OUTPUT: A photorealistic edited version where only the designated areas have been repainted.`;
  }, []);

  const generateWithGemini = useCallback(async (imageSrc: string, colorZones: ColorZoneInfo[]) => {
    setProcessingStep('Sending to AI...');
    telemetry.color('gemini:start', { zones: colorZones.length, zoneDetails: colorZones.map(z => `${z.label}:${z.colorName}`) });

    // Get the base64 image data (strip data URL prefix)
    let base64Data: string;
    let mimeType: string;

    if (imageSrc.startsWith('data:')) {
      const [header, data] = imageSrc.split(',');
      base64Data = data;
      mimeType = header.split(':')[1].split(';')[0];
    } else {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      mimeType = blob.type;
      base64Data = await blobToBase64(blob);
    }

    const originalSize = base64Data.length;
    // Resize if very large to stay under API limits
    if (base64Data.length > 4_000_000) {
      telemetry.color('gemini:resize', { originalSize, maxDim: 1024 });
      const resized = await resizeImageBase64(imageSrc, 1024);
      base64Data = resized.data;
      mimeType = resized.mime;
    }

    const prompt = buildPrompt(colorZones);
    telemetry.color('gemini:sending', { imageSize: base64Data.length, mimeType, promptLength: prompt.length });

    setProcessingStep('AI is painting your house...');

    const requestBody = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    };

    const startTime = Date.now();

    // Try backend proxy first, fall back to direct API call
    let response: Response;
    if (GEMINI_PROXY_URL) {
      try {
        response = await fetch(GEMINI_PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        telemetry.color('gemini:via_proxy', { status: response.status });
      } catch {
        telemetry.color('gemini:proxy_failed_fallback_direct');
        response = await fetch(GEMINI_DIRECT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      }
    } else {
      response = await fetch(GEMINI_DIRECT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    }

    const elapsed = Date.now() - startTime;
    telemetry.color('gemini:response', { status: response.status, ok: response.ok, elapsedMs: elapsed });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `API error: ${response.status}`;
      telemetry.error('gemini:api_error', { status: response.status, message: errMsg });
      throw new Error(errMsg);
    }

    const data = await response.json();

    // Extract the generated image from response
    const candidates = data.candidates || [];
    telemetry.color('gemini:candidates', { 
      count: candidates.length, 
      partsPerCandidate: candidates.map((c: { content?: { parts?: unknown[] } }) => c.content?.parts?.length || 0),
      finishReason: candidates[0]?.finishReason,
    });

    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          telemetry.color('gemini:success', { resultMime: mime, resultSize: part.inlineData.data.length, elapsedMs: elapsed });
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    }

    // Check if there's a text-only response (model refused to generate image)
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          telemetry.error('gemini:text_only', { text: part.text.slice(0, 300) });
          throw new Error(`AI responded with text only: "${part.text.slice(0, 200)}"`);
        }
      }
    }

    telemetry.error('gemini:no_image', { rawCandidates: JSON.stringify(candidates).slice(0, 500) });
    throw new Error('No image returned from AI');
  }, [buildPrompt]);

  // Fallback: CSS blend mode recoloring
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
    telemetry.color('process:start', { zoneCount: colorZones.length });

    try {
      setProcessingStep('Connecting to AI...');
      const result = await generateWithGemini(image, colorZones);
      telemetry.color('process:complete', { success: true });
      setRecoloredImage(result);
      setIsProcessing(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      telemetry.error('process:failed', { message: errMsg });
      console.error('AI visualization error:', err);
      setProcessingStep('Falling back to preview mode...');
      try {
        const fallback = await generateFallbackRecolor(image, colorZones);
        telemetry.color('process:fallback_used');
        setRecoloredImage(fallback);
        setError(`AI generation failed — showing color preview. (${errMsg})`);
      } catch {
        telemetry.error('process:fallback_failed');
        setError('Failed to generate visualization. Please try again.');
      }
      setIsProcessing(false);
    }
  }, [generateWithGemini, generateFallbackRecolor]);

  useEffect(() => {
    const image = sessionStorage.getItem('visualizer-image');
    const zonesStr = sessionStorage.getItem('visualizer-zones');

    telemetry.color('ai_page:mount', { hasImage: !!image, hasZones: !!zonesStr });

    if (!image || !zonesStr) {
      telemetry.error('ai_page:missing_data', { hasImage: !!image, hasZones: !!zonesStr });
      navigate('/photo-capture');
      return;
    }

    try {
      const parsedZones: ColorZoneInfo[] = JSON.parse(zonesStr);
      telemetry.color('ai_page:zones_parsed', { count: parsedZones.length, zones: parsedZones.map(z => `${z.label}=${z.colorName}`) });
      setOriginalImage(image);
      setZones(parsedZones);
      processImage(image, parsedZones);
    } catch (e) {
      telemetry.error('ai_page:parse_error', { error: String(e), rawZones: zonesStr?.slice(0, 200) });
      navigate('/photo-capture');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                <p className="text-sm text-slate-500 mt-1">This may take 10-30 seconds</p>
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
            {/* Error/fallback banner */}
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-400 leading-relaxed">{error}</p>
                  <button onClick={handleRetry} className="mt-1.5 flex items-center gap-1 text-xs text-amber-300 font-semibold hover:text-amber-200">
                    <RefreshCw size={12} /> Try again
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

// Utility: convert Blob to base64 string (without data URL prefix)
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Utility: resize image and return base64 + mime
async function resizeImageBase64(src: string, maxDim: number): Promise<{ data: string; mime: string }> {
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const [header, data] = dataUrl.split(',');
      const mime = header.split(':')[1].split(';')[0];
      resolve({ data, mime });
    };
    img.src = src;
  });
}

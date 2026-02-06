import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, RotateCw, Crop, X, Image as ImageIcon } from 'lucide-react';
import { telemetry } from '../utils/telemetry';

// Detect mobile/tablet — use native camera instead of getUserMedia
const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

interface PhotoUploaderProps {
  onImageCapture: (imageDataUrl: string) => void;
  className?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onImageCapture, className = '' }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const startCamera = async () => {
    // On mobile, use the native camera (full-screen, high quality)
    if (isMobileDevice()) {
      telemetry.nav('camera:native_mobile');
      fileInputRef.current?.click();
      return;
    }

    // Desktop: use getUserMedia for in-browser camera
    try {
      telemetry.nav('camera:getUserMedia');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      // Camera not available — fall back to file upload
      telemetry.nav('camera:fallback_file');
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPreview(dataUrl);
    setRotation(0);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const confirmImage = () => {
    if (!preview) return;
    // Apply rotation if needed
    if (rotation === 0) {
      onImageCapture(preview);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const isRotated90 = rotation === 90 || rotation === 270;
      canvas.width = isRotated90 ? img.height : img.width;
      canvas.height = isRotated90 ? img.width : img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      onImageCapture(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = preview;
  };

  const clearPreview = () => {
    setPreview(null);
    setRotation(0);
  };

  // Camera active view
  if (isCameraActive) {
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-black ${className}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover min-h-[300px]"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={stopCamera}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <X size={20} />
            </button>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/20 hover:scale-105 transition-transform active:scale-95"
            >
              <div className="w-14 h-14 rounded-full border-2 border-slate-900" />
            </button>
            <div className="w-12 h-12" /> {/* Spacer */}
          </div>
        </div>
      </div>
    );
  }

  // Preview view
  if (preview) {
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-white/10 ${className}`}>
        <div className="relative min-h-[300px] flex items-center justify-center bg-black/30 overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-[400px] object-contain transition-transform duration-300"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
          <button
            onClick={clearPreview}
            className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={rotateImage}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-all"
          >
            <RotateCw size={16} />
            <span className="text-sm font-medium">Rotate</span>
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-all"
          >
            <Crop size={16} />
            <span className="text-sm font-medium">Replace</span>
          </button>
          <button
            onClick={confirmImage}
            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
          >
            <span className="text-sm">Use This Photo</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    );
  }

  // Upload / capture view
  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${isDragging
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-slate-700 bg-slate-900/50 backdrop-blur-xl hover:border-slate-600'
          }
        `}
      >
        <div className="p-8 flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5">
            <ImageIcon size={32} className="text-slate-500" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-1">Add a photo of your project</p>
            <p className="text-sm text-slate-500">Take a photo or upload from your gallery</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              <Camera size={18} />
              <span className="text-sm">Camera</span>
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/80 text-white font-medium hover:bg-slate-800 transition-all border border-white/5 active:scale-[0.98]"
            >
              <Upload size={18} />
              <span className="text-sm">Upload</span>
            </button>
          </div>
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <p className="text-blue-400 font-semibold text-lg">Drop image here</p>
            </div>
          )}
        </div>
      </div>
      {/* Camera input (with capture attribute — opens camera directly on mobile) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      {/* Gallery input (NO capture attribute — opens photo gallery/file picker) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

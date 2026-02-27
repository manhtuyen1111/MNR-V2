import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Zap } from 'lucide-react';

interface CameraCaptureProps {
  images: string[];
  onAddImage: (imageData: string) => void;
  onRemoveImage: (index: number) => void;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onFocus: () => void;
}
const CameraCapture: React.FC<CameraCaptureProps> = ({
  images,
  onAddImage,
  onRemoveImage,
  isActive,
  isCompleted,
  isDisabled,
  onFocus
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [isZoomSupported, setIsZoomSupported] = useState(false);
  const ZOOM_PRESETS = isZoomSupported
  ? [
      Number(minZoom.toFixed(1)),
      Number(((minZoom + maxZoom) / 2).toFixed(1)),
      Number(maxZoom.toFixed(1)),
    ]
  : [1];
  
  // ===== PINCH ZOOM STATE =====
const initialPinchDistance = useRef<number | null>(null);
const initialZoom = useRef<number>(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ================= START CAMERA ================= */
  const startCamera = async () => {
    if (isDisabled) return;
    onFocus();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1000 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setIsCameraOpen(true);
      setZoom(1);
      const track = mediaStream.getVideoTracks()[0];

if (track) {
  const capabilities = track.getCapabilities() as any;

  // Torch
  setIsTorchSupported(!!capabilities?.torch);

  // Zoom
  if (capabilities?.zoom) {
    setIsZoomSupported(true);
    setMinZoom(capabilities.zoom.min || 1);
    setMaxZoom(capabilities.zoom.max || 3);
    setZoom(capabilities.zoom.min || 1);
  } else {
    setIsZoomSupported(false);
    setMinZoom(1);
    setMaxZoom(1);
    setZoom(1);
  }
}
  }catch (err) {
      console.error("Error accessing camera:", err);
      alert("Không thể mở camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  /* ================= STOP CAMERA ================= */
  const stopCamera = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];

      if (track && isTorchOn) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: false }]
          });
        } catch {}
      }

      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setIsTorchOn(false);
    setIsCameraOpen(false);
    setZoom(1);
    setMinZoom(1);
    setMaxZoom(1);
    setIsZoomSupported(false);
  };

  /* ================= TOGGLE FLASH ================= */
  const toggleTorch = async () => {
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !isTorchOn }]
      });

      setIsTorchOn(!isTorchOn);
    } catch {
      console.log("Torch not supported");
    }
  };
  // ===== PINCH UTILS =====
const getDistance = (touches: React.TouchList) => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const handleTouchStart = (e: React.TouchEvent) => {
  if (!isZoomSupported) return;

  if (e.touches.length === 2) {
    initialPinchDistance.current = getDistance(e.touches);
    initialZoom.current = zoom;
  }
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!isZoomSupported) return;

  if (e.touches.length === 2 && initialPinchDistance.current) {
    e.preventDefault();

    const currentDistance = getDistance(e.touches);
    const scale = currentDistance / initialPinchDistance.current;

    let newZoom = initialZoom.current * scale;

    // clamp
    newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

    handleZoomChange(newZoom);
  }
};

const handleTouchEnd = () => {
if (!isZoomSupported) return;

  if (ZOOM_PRESETS.length > 1) {
    const closest = ZOOM_PRESETS.reduce((prev, curr) =>
      Math.abs(curr - zoom) < Math.abs(prev - zoom) ? curr : prev
    );

    handleZoomChange(closest);
  }

  initialPinchDistance.current = null;
};
  /* ================= HANDLE ZOOM ================= */
const handleZoomChange = (value: number) => {
  if (!stream) return;

  const track = stream.getVideoTracks()[0];
  if (!track) return;

  // Không await để tránh delay khi pinch nhanh
  (track as any).applyConstraints({
    advanced: [{ zoom: value }]
  }).catch(() => {});

  setZoom(value);
};
  /* ================= CAPTURE PHOTO ================= */
 const capturePhoto = () => {
  if (!videoRef.current || !canvasRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;

  const QUALITY = 0.7;

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

canvas.width = videoWidth;
canvas.height = videoHeight;

const ctx = canvas.getContext("2d");
if (!ctx) return;

ctx.filter = "brightness(1.22) contrast(1.1) saturate(1.05)";

ctx.drawImage(
  video,
  0,
  0,
  videoWidth,
  videoHeight
);

ctx.filter = "none";

  canvas.toBlob(
    (blob) => {
      if (!blob) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        onAddImage(reader.result as string);
      };
      reader.readAsDataURL(blob);
    },
    "image/jpeg",
    QUALITY
  );

  navigator.vibrate?.(30);
};
  /* ================= EFFECTS ================= */
  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  /* ================= FULL SCREEN MODE ================= */
  if (isCameraOpen) {
    return (
     <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-[fadeIn_.25s_ease-out]">
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">

          <div className="flex items-center space-x-2">
            <span className="text-white font-bold text-sm tracking-wider shadow-sm drop-shadow-md bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
              {images.length} ẢNH
            </span>

            {isTorchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-full backdrop-blur-md transition ${
                  isTorchOn
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/20 text-white'
                }`}
              >
                <Zap className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            onClick={stopCamera}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
<div
  className="flex-1 relative bg-black flex items-center justify-center overflow-hidden touch-none"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
<video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  className="absolute w-full h-full object-cover"
/>

{isZoomSupported && (
  <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-4">
    {ZOOM_PRESETS.map((z) => (
      <button
        key={z}
        onClick={() => handleZoomChange(z)}
        className={`
          w-14 h-14 rounded-full text-sm font-bold
          backdrop-blur-md transition-all
     ${Math.abs(zoom - z) < 0.05
            ? "bg-white text-black scale-110"
            : "bg-white/20 text-white"}
        `}
      >
        {z % 1 === 0 ? z.toFixed(0) : z.toFixed(1)}x
      </button>
    ))}
  </div>
)}
       
</div>

        <div className="h-48 bg-black/90 pb-safe flex flex-col shrink-0 border-t border-white/10">
          <div className="h-20 flex items-center px-4 space-x-3 overflow-x-auto scrollbar-hide bg-white/5">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 border-white/20">
                <img src={img} className="w-full h-full object-cover" />
                <div
                  className="absolute top-0 right-0 bg-red-600 w-5 h-5 flex items-center justify-center rounded-bl-lg cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onRemoveImage(idx); }}
                >
                  <X className="w-3 h-3 text-white" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 flex items-center justify-between px-8">
            <div className="w-12"></div>

            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-[5px] border-white/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>

            <button
              onClick={stopCamera}
              className="w-16 h-12 bg-sky-600 rounded-xl flex items-center justify-center space-x-1"
            >
              <span className="text-white font-black text-sm">OK</span>
              <Check className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= DEFAULT VIEW ================= */
return (
  <div
    onClick={!isDisabled ? startCamera : undefined}
    className={`
      transition-all duration-300 rounded-2xl p-4 border flex flex-col bg-white cursor-pointer
      ${isActive
        ? 'scale-[1.03] shadow-md border-sky-600'
        : isDisabled
          ? 'opacity-60 grayscale border-slate-200 bg-slate-50 pointer-events-none'
          : isCompleted
            ? 'border-green-500'
            : 'border-slate-200'
      }
    `}
  >
    {/* 1 dòng CHỤP ẢNH và nút + */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Camera className="w-5 h-5 text-slate-600" />
        <span className="font-bold text-sm text-slate-600">
          CHẠM ĐỂ CHỤP ẢNH ({images.length})
        </span>
      </div>

      {/* nút + chọn ảnh thư viện */}
      <label
        onClick={(e) => e.stopPropagation()}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-600 text-white text-lg font-bold active:scale-95 transition"
      >
        +
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (!files) return;

            onFocus();

            Array.from(files).forEach((file) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result) {
                  onAddImage(reader.result as string);
                }
              };
              reader.readAsDataURL(file);
            });

            e.target.value = '';
          }}
        />
      </label>
    </div>
       {/* ===== THÊM ĐOẠN NÀY NGAY TẠI ĐÂY ===== */}
    {images.length > 0 && (
      <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-hide">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0"
          >
            <img
              src={img}
              alt={`preview-${idx}`}
              className="w-full h-full object-cover"
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(idx);
              }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);
};
export default CameraCapture;

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
          width: { ideal: 1200 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setIsCameraOpen(true);

      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities() as any;
        setIsTorchSupported(!!capabilities?.torch);
      }

    } catch (err) {
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

  /* ================= CAPTURE PHOTO ================= */
  const capturePhoto = () => {
  if (!videoRef.current || !canvasRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;

  const MAX_W = 1000;
  const MAX_H = 750;
  const QUALITY = 0.65;

  let w = video.videoWidth;
  let h = video.videoHeight;

  if (w > MAX_W || h > MAX_H) {
    const scale = Math.min(MAX_W / w, MAX_H / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.filter = "brightness(1.22) contrast(1.1) saturate(1.05)";
  ctx.drawImage(video, 0, 0, w, h);
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
    'image/jpeg',
    QUALITY
  );

  // rung nhẹ khi chụp
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
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
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

        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute w-full h-full object-cover"
          />
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
            className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0"
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

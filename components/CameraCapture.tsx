import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check } from 'lucide-react';

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
  images, onAddImage, onRemoveImage, isActive, isCompleted, isDisabled, onFocus 
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Start Camera Stream
  const startCamera = async () => {
    if (isDisabled) return;
    onFocus();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Không thể mở camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // Capture Photo from Video Stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onAddImage(dataUrl);
      }
    }
  };

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

  // --- FULL SCREEN CAMERA MODE ---
  if (isCameraOpen) {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                <span className="text-white font-bold text-sm tracking-wider shadow-sm drop-shadow-md">
                    {images.length} ẢNH
                </span>
                <button onClick={stopCamera} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/30 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sky-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sky-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sky-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sky-400"></div>
                </div>
            </div>
            <div className="h-48 bg-black/90 pb-safe flex flex-col shrink-0">
                <div className="h-20 flex items-center px-4 space-x-3 overflow-x-auto scrollbar-hide bg-white/5 border-t border-white/10">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded overflow-hidden shrink-0 border border-white/30">
                            <img src={img} className="w-full h-full object-cover" />
                            <div className="absolute top-0 right-0 bg-red-500 w-4 h-4 flex items-center justify-center" onClick={(e) => {e.stopPropagation(); onRemoveImage(idx);}}>
                                <X className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    ))}
                    {images.length === 0 && <span className="text-white/40 text-xs pl-2">Chưa có ảnh nào...</span>}
                </div>
                <div className="flex-1 flex items-center justify-between px-8">
                    <div className="w-12"></div>
                    <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <div className="w-16 h-16 bg-white rounded-full"></div>
                    </button>
                    <button 
                        onClick={stopCamera}
                        className="w-16 h-12 bg-sky-600 rounded-xl flex items-center justify-center space-x-1 shadow-lg active:scale-95 transition-transform"
                    >
                        <span className="text-white font-black text-sm">OK</span>
                        <Check className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- DEFAULT VIEW ---
  return (
    <div 
      onClick={!isDisabled ? startCamera : undefined}
      className={`
        transition-all duration-500 ease-out rounded-xl p-4 border-2 bg-white flex flex-col min-h-[160px] cursor-pointer
        ${isActive 
          ? 'scale-105 shadow-2xl z-20 border-sky-600 ring-4 ring-sky-100 translate-y-[-5px]' 
          : isDisabled
            ? 'opacity-40 grayscale scale-95 border-slate-200 pointer-events-none'
            : 'border-green-500 shadow-sm opacity-90 scale-100' // Completed
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${isActive ? 'bg-sky-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-500'}`}>3</span>
            <label className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-sky-700' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
            HÌNH ẢNH ({images.length})
            </label>
         </div>
         {isCompleted && !isActive && <Check className="w-6 h-6 text-green-500" />}
      </div>

      <div className="flex-1 flex flex-col justify-center items-center space-y-3">
         {images.length === 0 ? (
             <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-600 transition-colors">
                <Camera className="w-10 h-10 mb-2 opacity-50" />
                <span className="font-bold text-sm">NHẤN ĐỂ CHỤP ẢNH</span>
             </div>
         ) : (
             <div className="w-full">
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative">
                             <img src={img} className="w-full h-full object-cover" />
                             {idx === 3 && images.length > 4 && (
                                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs">
                                     +{images.length - 4}
                                 </div>
                             )}
                        </div>
                    ))}
                </div>
                <button className="w-full py-3 bg-sky-100 text-sky-700 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 hover:bg-sky-200">
                    <Camera className="w-5 h-5" />
                    <span>CHỤP THÊM</span>
                </button>
             </div>
         )}
      </div>
    </div>
  );
};

export default CameraCapture;
import React, { useRef } from 'react';
import { Camera, X, Plus, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureProps {
  images: string[];
  onAddImage: (imageData: string) => void;
  onRemoveImage: (index: number) => void;
  isActive: boolean;
  onFocus: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  images, onAddImage, onRemoveImage, isActive, onFocus 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
             onAddImage(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus();
    fileInputRef.current?.click();
  };

  return (
    <div 
      onClick={onFocus}
      className={`
        flex-1 flex flex-col min-h-0 transition-all duration-300 ease-out rounded-2xl p-3 border-2
        ${isActive 
          ? 'bg-white border-sky-600 shadow-[0_10px_40px_-10px_rgba(14,165,233,0.3)] scale-[1.02] z-20 translate-y-[-4px]' 
          : 'bg-white border-slate-200 shadow-sm scale-100 opacity-90'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center space-x-2">
            <div className={`p-1 rounded-md ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <span className="text-[10px] font-bold px-1">03</span>
            </div>
            <label className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-sky-700' : 'text-slate-500'}`}>
               Hình Ảnh ({images.length})
            </label>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple 
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Content Area - Flex Grow */}
      <div className="flex-1 flex flex-col justify-center min-h-0 space-y-3">
          
          {/* Main Camera Button */}
          <button
            onClick={triggerCamera}
            className={`
                w-full relative overflow-hidden group transition-all duration-300
                ${images.length === 0 ? 'h-24' : 'h-16'}
                rounded-xl bg-slate-900 flex items-center justify-center space-x-3 shadow-lg shadow-slate-300
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="relative z-10 text-left">
                <span className="block text-sm font-black text-white uppercase tracking-wider">CHỤP ẢNH</span>
                <span className="block text-[10px] text-sky-100 font-medium">Camera chính</span>
            </div>
          </button>

          {/* Horizontal Gallery */}
          {images.length > 0 ? (
            <div className="flex space-x-2 overflow-x-auto pb-2 h-24 shrink-0 scrollbar-hide">
                {images.map((img, index) => (
                    <div key={index} className="relative aspect-square h-full rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img src={img} alt={`Img ${index}`} className="w-full h-full object-cover" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveImage(index); }}
                            className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 shadow-sm"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 bg-slate-900/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-tr-md">
                            #{index + 1}
                        </div>
                    </div>
                ))}
                 <button 
                    onClick={triggerCamera}
                    className="aspect-square h-full rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors shrink-0"
                 >
                    <Plus className="w-6 h-6" />
                 </button>
            </div>
          ) : (
              <div className="flex-1 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center">
                  <span className="text-xs text-slate-400 font-medium">Chưa có ảnh</span>
              </div>
          )}
      </div>
    </div>
  );
};

export default CameraCapture;
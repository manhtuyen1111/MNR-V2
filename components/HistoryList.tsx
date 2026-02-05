import React, { useState, useRef, useEffect } from 'react';
import { RepairRecord } from '../types';
import { formatDate, compressImage } from '../utils';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, Trash2, Image as ImageIcon, X, Camera, Check, Save } from 'lucide-react';

interface HistoryListProps {
  records: RepairRecord[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateRecord: (updatedRecord: RepairRecord, newImagesOnly: string[]) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onRetry, onDelete, onUpdateRecord }) => {
  const [viewingRecord, setViewingRecord] = useState<RepairRecord | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="bg-slate-200 p-8 rounded-full mb-6 border-4 border-white shadow-inner">
            <Clock className="w-12 h-12 text-slate-400" />
        </div>
        <span className="font-bold text-xl text-slate-600">Lịch sử trống</span>
        <span className="text-sm mt-2 text-slate-400 text-center max-w-[200px]">Các container đã nghiệm thu sẽ hiển thị tại đây</span>
      </div>
    );
  }

  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
        <div className="p-4 space-y-4 pb-24 animate-fadeIn">
        <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-black text-slate-600 uppercase tracking-wider">Lịch sử gần đây</h2>
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg">{records.length} hồ sơ</span>
        </div>

        {sortedRecords.map((record) => (
            <div 
                key={record.id} 
                onClick={() => setViewingRecord(record)}
                className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
            >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                     record.status === 'synced' ? 'bg-green-500' :
                     record.status === 'error' ? 'bg-red-500' : 'bg-amber-400'
                }`}></div>

                <div className="flex items-center space-x-4 overflow-hidden pl-2">
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                        record.status === 'synced' ? 'bg-green-50 border-green-100 text-green-600' :
                        record.status === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
                        'bg-amber-50 border-amber-100 text-amber-600'
                    }`}>
                        {record.status === 'synced' && <CheckCircle className="w-6 h-6" />}
                        {record.status === 'error' && <AlertTriangle className="w-6 h-6" />}
                        {record.status === 'pending' && <Clock className="w-6 h-6" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline space-x-2">
                             <span className="font-black text-lg text-slate-800 font-mono tracking-tighter">
                                {record.containerNumber.slice(0, 4)}
                                <span className="text-red-600">{record.containerNumber.slice(4)}</span>
                            </span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-500 space-x-2 font-bold mt-1">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">{record.teamName}</span>
                            <span className="flex items-center text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                <ImageIcon className="w-3 h-3 mr-1" /> {record.images.length}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 pl-0.5">
                            {formatDate(record.timestamp)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-2 pl-2">
                    {record.status === 'error' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRetry(record.id); }}
                            className="p-3 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 border border-sky-100 shadow-sm"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                        className="p-3 bg-white text-slate-300 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 shadow-sm"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        ))}
        </div>

        {viewingRecord && (
            <ImageViewer 
                record={viewingRecord} 
                onClose={() => setViewingRecord(null)} 
                onUpdate={(newTotalImages, newOnlyImages) => {
                    const updated = { ...viewingRecord, images: newTotalImages, status: 'pending' as const };
                    setViewingRecord(updated);
                    onUpdateRecord(updated, newOnlyImages);
                }}
            />
        )}
    </>
  );
};

const ImageViewer: React.FC<{ 
    record: RepairRecord, 
    onClose: () => void,
    onUpdate: (allImages: string[], newImages: string[]) => void
}> = ({ record, onClose, onUpdate }) => {
    const [mode, setMode] = useState<'view' | 'camera'>('view');
    const [tempImages, setTempImages] = useState<string[]>(record.images);
    const [stagedImages, setStagedImages] = useState<string[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        setMode('camera');
        try {
            const ms = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            setStream(ms);
        } catch (e) {
            console.error(e);
            alert('Không thể mở camera');
            setMode('view');
        }
    };

    useEffect(() => {
        if (mode === 'camera' && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [mode, stream]);

    const stopCamera = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(null);
        setMode('view');
    };

    const capture = async () => {
        if (videoRef.current && canvasRef.current) {
            const v = videoRef.current;
            const c = canvasRef.current;
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext('2d');
            if (ctx) {
                ctx.drawImage(v, 0, 0);
                const raw = c.toDataURL('image/jpeg', 0.8);
                const compressed = await compressImage(raw);
                setStagedImages(prev => [...prev, compressed]);
            }
        }
    };

    const handleConfirmUpdate = () => {
        if (stagedImages.length === 0) return;
        const newTotal = [...tempImages, ...stagedImages];
        setTempImages(newTotal);
        onUpdate(newTotal, stagedImages);
        setStagedImages([]);
        stopCamera();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fadeIn">
            {mode === 'view' ? (
                <>
                    <div className="h-16 flex items-center justify-between px-4 bg-white/10 backdrop-blur-md border-b border-white/10 shrink-0">
                        <div className="flex flex-col">
                            <span className="text-white font-black font-mono text-xl tracking-wider">
                                {record.containerNumber}
                            </span>
                            <div className="flex items-center space-x-2 text-white/60 text-xs font-bold uppercase">
                                <span>{record.teamName}</span>
                                <span>•</span>
                                <span>{tempImages.length} Ảnh</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-1 bg-[#121212]">
                        <div className="grid grid-cols-4 gap-1">
                            {tempImages.map((img, idx) => (
                                <div key={idx} className="aspect-square relative group bg-gray-900 overflow-hidden rounded-md">
                                    <img src={img} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] font-bold px-1 py-0.5 rounded backdrop-blur-sm">
                                        #{idx + 1}
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                onClick={startCamera}
                                className="aspect-square bg-white/5 border border-dashed border-white/20 rounded-md flex flex-col items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all"
                            >
                                <Camera className="w-5 h-5 mb-1" />
                                <span className="text-[8px] font-bold uppercase">Thêm</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-black border-t border-white/10 pb-safe">
                        <button 
                            onClick={startCamera}
                            className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                        >
                            <Camera className="w-5 h-5" />
                            <span>CHỤP BỔ SUNG</span>
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full bg-black relative">
                    <canvas ref={canvasRef} className="hidden" />
                    <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" />
                    
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex flex-col">
                            <span className="text-white text-xs font-bold bg-sky-600 px-3 py-1 rounded-full shadow-lg">ĐANG CHỤP BỔ SUNG</span>
                            {stagedImages.length > 0 && (
                                <span className="text-white text-[10px] font-bold mt-2 ml-1">Đã chụp: {stagedImages.length} ảnh mới</span>
                            )}
                        </div>
                        <button onClick={stopCamera} className="p-2 bg-black/50 text-white rounded-full backdrop-blur-md">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="h-44 bg-black/90 absolute bottom-0 left-0 right-0 flex flex-col border-t border-white/10">
                         {/* Staged photos preview */}
                         <div className="h-14 flex items-center px-4 space-x-2 overflow-x-auto scrollbar-hide py-2">
                             {stagedImages.map((img, idx) => (
                                 <div key={idx} className="h-full aspect-square rounded border border-white/20 overflow-hidden shrink-0 relative">
                                     <img src={img} className="w-full h-full object-cover" />
                                     <button 
                                        onClick={() => setStagedImages(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-0 right-0 bg-red-600 p-0.5"
                                     >
                                        <X className="w-3 h-3 text-white" />
                                     </button>
                                 </div>
                             ))}
                             {stagedImages.length === 0 && <span className="text-white/30 text-[10px] italic">Chưa có ảnh mới nào được chụp...</span>}
                         </div>

                         <div className="flex-1 flex items-center justify-between px-8 pb-safe">
                             <div className="w-12"></div>
                             <button 
                                onClick={capture}
                                className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center active:scale-90 transition-transform"
                             >
                                 <div className="w-16 h-16 bg-white rounded-full"></div>
                             </button>
                             
                             <div className="w-12">
                                {stagedImages.length > 0 && (
                                    <button 
                                        onClick={handleConfirmUpdate}
                                        className="w-12 h-12 rounded-2xl bg-green-600 flex flex-col items-center justify-center text-white shadow-lg shadow-green-900/40 animate-fadeIn"
                                    >
                                        <Save className="w-5 h-5 mb-0.5" />
                                        <span className="text-[8px] font-black">LƯU</span>
                                    </button>
                                )}
                             </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryList;
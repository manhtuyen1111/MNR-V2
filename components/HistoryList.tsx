
import React, { useState, useRef, useEffect } from 'react';
import { RepairRecord } from '../types';
import { formatDate, compressImage } from '../utils';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, Trash2, Image as ImageIcon, X, Camera, Save, Filter, Calendar, Users, ChevronDown } from 'lucide-react';
import { REPAIR_TEAMS } from '../constants';

interface HistoryListProps {
  records: RepairRecord[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateRecord: (updatedRecord: RepairRecord, newImagesOnly: string[]) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onRetry, onDelete, onUpdateRecord }) => {
  const [viewingRecord, setViewingRecord] = useState<RepairRecord | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [quickDate, setQuickDate] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');

  // Filtering logic
  const filteredRecords = records.filter(record => {
    // Team Filter
    if (filterTeam !== 'all' && record.teamId !== filterTeam) return false;

    // Date Filter
    const recordDate = new Date(record.timestamp);
    recordDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (quickDate === 'today') {
      if (recordDate.getTime() !== today.getTime()) return false;
    } else if (quickDate === 'yesterday') {
      if (recordDate.getTime() !== yesterday.getTime()) return false;
    } else if (quickDate === 'custom') {
      if (filterDateRange.start) {
        const start = new Date(filterDateRange.start);
        start.setHours(0, 0, 0, 0);
        if (recordDate < start) return false;
      }
      if (filterDateRange.end) {
        const end = new Date(filterDateRange.end);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }
    }

    return true;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => b.timestamp - a.timestamp);

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

  return (
    <>
        <div className="p-4 space-y-4 pb-24 animate-fadeIn">
        
        {/* OPTIMIZED FILTER BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-2">
            <div className="flex items-center space-x-2 mb-2">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Bộ lọc</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Team Selector Dropdown */}
                <div className="relative">
                    <select 
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 pl-3 pr-8 text-[11px] font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-all"
                    >
                        <option value="all">Tất cả tổ đội</option>
                        {REPAIR_TEAMS.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Date Type Selector Dropdown */}
                <div className="relative">
                    <select 
                        value={quickDate}
                        onChange={(e) => {
                            setQuickDate(e.target.value as any);
                            if (e.target.value !== 'custom') {
                                setFilterDateRange({start: '', end: ''});
                            }
                        }}
                        className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 pl-3 pr-8 text-[11px] font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-all"
                    >
                        <option value="all">Tất cả thời gian</option>
                        <option value="today">Hôm nay</option>
                        <option value="yesterday">Hôm qua</option>
                        <option value="custom">Tùy chọn ngày...</option>
                    </select>
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Custom Date Inputs (Only visible if 'custom' is selected) */}
            {quickDate === 'custom' && (
                <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-3 animate-fadeIn">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 pl-1">Từ ngày</label>
                        <input 
                            type="date"
                            value={filterDateRange.start}
                            onChange={(e) => setFilterDateRange(prev => ({...prev, start: e.target.value}))}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-[10px] font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 pl-1">Đến ngày</label>
                        <input 
                            type="date"
                            value={filterDateRange.end}
                            onChange={(e) => setFilterDateRange(prev => ({...prev, end: e.target.value}))}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-[10px] font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KẾT QUẢ TÌM KIẾM ({sortedRecords.length})</h2>
        </div>

        {sortedRecords.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-400 text-xs font-bold animate-fadeIn">
                Không tìm thấy hồ sơ nào...
            </div>
        ) : (
            sortedRecords.map((record) => (
                <div 
                    key={record.id} 
                    onClick={() => setViewingRecord(record)}
                    className="bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                >
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                         record.status === 'synced' ? 'bg-green-500' :
                         record.status === 'error' ? 'bg-red-500' : 'bg-amber-400'
                    }`}></div>

                    <div className="flex items-center space-x-4 overflow-hidden pl-2">
                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm ${
                            record.status === 'synced' ? 'bg-green-50 border-green-100 text-green-600' :
                            record.status === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
                            'bg-amber-50 border-amber-100 text-amber-600'
                        }`}>
                            {record.status === 'synced' && <CheckCircle className="w-6 h-6" />}
                            {record.status === 'error' && <AlertTriangle className="w-6 h-6" />}
                            {record.status === 'pending' && <Clock className="w-6 h-6 animate-pulse" />}
                        </div>

                        <div className="flex flex-col min-w-0">
                            <div className="flex items-baseline space-x-2">
                                 <span className="font-black text-xl text-slate-800 font-mono tracking-tighter leading-none">
                                    {record.containerNumber.slice(0, 4)}
                                    <span className="text-red-600">{record.containerNumber.slice(4)}</span>
                                </span>
                            </div>
                            
                            <div className="flex items-center text-[10px] text-slate-400 space-x-2 font-black mt-2 uppercase tracking-tight">
                                <span className="bg-slate-50 px-2 py-0.5 rounded-lg text-slate-600 border border-slate-100">{record.teamName}</span>
                                <span className="flex items-center text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                                    <ImageIcon className="w-3 h-3 mr-1" /> {record.images.length} ẢNH
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-300 font-bold mt-1.5 pl-0.5">
                                {formatDate(record.timestamp)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pl-2">
                        {record.status === 'error' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRetry(record.id); }}
                                className="p-3 bg-sky-50 text-sky-600 rounded-2xl hover:bg-sky-100 border border-sky-100 shadow-sm transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                            className="p-3 bg-white text-slate-200 rounded-2xl border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 shadow-sm transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))
        )}
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
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
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
        setStagedImages([]);
    };

    const capture = async () => {
        if (videoRef.current && canvasRef.current) {
            const v = videoRef.current;
            const c = canvasRef.current;
            
            // Optimized Capture: 900x600 Max
            const MAX_W = 900;
            const MAX_H = 600;
            let w = v.videoWidth;
            let h = v.videoHeight;
            const scale = Math.min(MAX_W / w, MAX_H / h);
            if (scale < 1) {
                w *= scale;
                h *= scale;
            }

            c.width = w;
            c.height = h;

            const ctx = c.getContext('2d');
            if (ctx) {
                ctx.drawImage(v, 0, 0, w, h);
                // Direct compression: 0.5 quality
                const compressed = c.toDataURL('image/jpeg', 0.5);
                setStagedImages(prev => [...prev, compressed]);
                if (navigator.vibrate) navigator.vibrate(30);
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
                    <div className="h-20 flex items-center justify-between px-6 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 shrink-0">
                        <div className="flex flex-col">
                            <span className="text-white font-black font-mono text-2xl tracking-tighter uppercase leading-none">
                                {record.containerNumber}
                            </span>
                            <div className="flex items-center space-x-2 text-sky-400 text-[10px] font-black uppercase tracking-widest mt-2">
                                <Users className="w-3 h-3" />
                                <span>{record.teamName}</span>
                                <span className="text-white/20">•</span>
                                <span>{tempImages.length} ẢNH</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-colors">
                            <X className="w-7 h-7" />
                        </button>
                    </div>
                    
                    {/* OPTIMIZED 4-COLUMN GRID */}
                    <div className="flex-1 overflow-y-auto p-1 bg-[#121212]">
                        <div className="grid grid-cols-4 gap-1">
                            {tempImages.map((img, idx) => (
                                <div key={idx} className="aspect-square relative group bg-gray-900 overflow-hidden rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                    <img src={img} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">
                                        #{idx + 1}
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                onClick={startCamera}
                                className="aspect-square bg-sky-600/10 border border-dashed border-sky-500/30 rounded flex flex-col items-center justify-center text-sky-500 active:bg-sky-500 active:text-white transition-all"
                            >
                                <Camera className="w-6 h-6 mb-1" />
                                <span className="text-[8px] font-black uppercase">Thêm</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-5 bg-black border-t border-white/5 pb-safe">
                        <button 
                            onClick={startCamera}
                            className="w-full bg-gradient-to-r from-sky-600 to-blue-700 text-white font-black py-4.5 rounded-[1.25rem] shadow-2xl shadow-sky-900/40 flex items-center justify-center space-x-3 active:scale-95 transition-transform border border-sky-400/30"
                        >
                            <Camera className="w-6 h-6" />
                            <span className="uppercase tracking-widest text-sm">Chụp ảnh bổ sung</span>
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full bg-black relative">
                    <canvas ref={canvasRef} className="hidden" />
                    <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" />
                    
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/90 to-transparent">
                        <div className="flex flex-col">
                            <span className="text-white text-[10px] font-black bg-sky-600 px-4 py-2 rounded-full shadow-2xl border border-sky-400 uppercase tracking-widest">Đang chụp bổ sung</span>
                            <span className="text-white/60 text-[10px] font-bold mt-2 font-mono uppercase tracking-tighter">Container: {record.containerNumber}</span>
                        </div>
                        <button onClick={stopCamera} className="w-12 h-12 flex items-center justify-center bg-black/50 text-white rounded-2xl backdrop-blur-md border border-white/10">
                            <X className="w-7 h-7" />
                        </button>
                    </div>

                    <div className="h-56 bg-[#0a0a0a] absolute bottom-0 left-0 right-0 flex flex-col border-t border-white/5 px-4 pb-safe">
                         {/* Staged photos preview */}
                         <div className="h-20 flex items-center space-x-2 overflow-x-auto scrollbar-hide py-3">
                             {stagedImages.map((img, idx) => (
                                 <div key={idx} className="h-full aspect-square rounded-xl border border-white/20 overflow-hidden shrink-0 relative shadow-2xl">
                                     <img src={img} className="w-full h-full object-cover" />
                                     <button 
                                        onClick={() => setStagedImages(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-0 right-0 bg-red-600/90 p-1.5 backdrop-blur-sm rounded-bl-xl"
                                     >
                                        <X className="w-3.5 h-3.5 text-white" />
                                     </button>
                                 </div>
                             ))}
                             {stagedImages.length === 0 && (
                                <div className="h-full flex items-center justify-center px-4 w-full">
                                    <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse italic">Sẵn sàng thu thập ảnh mới</span>
                                </div>
                             )}
                         </div>

                         <div className="flex-1 flex items-center justify-between px-6 pb-4">
                             <div className="w-16"></div>
                             
                             <button 
                                onClick={capture}
                                className="w-24 h-24 rounded-full border-[6px] border-white/10 flex items-center justify-center active:scale-90 transition-all bg-transparent group"
                             >
                                 <div className="w-20 h-20 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] group-active:bg-slate-200 transition-colors"></div>
                             </button>
                             
                             <div className="w-16 flex justify-end">
                                {stagedImages.length > 0 && (
                                    <button 
                                        onClick={handleConfirmUpdate}
                                        className="w-16 h-16 rounded-[1.5rem] bg-green-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-green-900/40 animate-fadeIn border border-green-400 transform active:scale-95"
                                    >
                                        <Save className="w-7 h-7 mb-0.5" />
                                        <span className="text-[8px] font-black uppercase text-center leading-[1.1]">Cập nhật<br/>bổ sung</span>
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

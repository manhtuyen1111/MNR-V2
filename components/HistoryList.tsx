import React, { useState } from 'react';
import { RepairRecord } from '../types';
import { formatDate } from '../utils';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, Trash2, Image as ImageIcon, X } from 'lucide-react';

interface HistoryListProps {
  records: RepairRecord[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onRetry, onDelete }) => {
  const [viewingRecord, setViewingRecord] = useState<RepairRecord | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="bg-slate-100 p-6 rounded-full mb-4 border-4 border-white shadow-sm">
            <Clock className="w-10 h-10 text-slate-300" />
        </div>
        <span className="font-bold text-lg text-slate-500">Trống trơn!</span>
        <span className="text-sm mt-1 text-slate-400 text-center">Các lượt nghiệm thu sẽ xuất hiện ở đây</span>
      </div>
    );
  }

  // Sort by newest first
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
        <div className="p-4 space-y-3 pb-24 animate-fadeIn">
        <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Lịch sử gần đây</h2>
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">{records.length}</span>
        </div>

        {sortedRecords.map((record) => (
            <div 
                key={record.id} 
                onClick={() => setViewingRecord(record)}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between group active:scale-[0.98] transition-transform cursor-pointer"
            >
                <div className="flex items-center space-x-3 overflow-hidden">
                    {/* Status Icon */}
                    <div className={`shrink-0 p-2.5 rounded-xl border-2 ${
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
                                <span className="text-red-700">{record.containerNumber.slice(4)}</span>
                            </span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-500 space-x-2 font-bold mt-1">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">{record.teamName}</span>
                            <span className="flex items-center text-sky-600">
                                <ImageIcon className="w-3 h-3 mr-1" /> {record.images.length}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-1">
                            {formatDate(record.timestamp)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-3 pl-2">
                    {record.status === 'error' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRetry(record.id); }}
                            className="p-2.5 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 border border-sky-100 shadow-sm"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                        className="p-2.5 bg-white text-slate-400 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 shadow-sm"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        ))}
        </div>

        {/* IMAGE VIEWER MODAL */}
        {viewingRecord && (
            <ImageViewer record={viewingRecord} onClose={() => setViewingRecord(null)} />
        )}
    </>
  );
};

// Sub-component for viewing images
const ImageViewer: React.FC<{ record: RepairRecord, onClose: () => void }> = ({ record, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fadeIn">
            <div className="h-14 flex items-center justify-between px-4 bg-white/10 backdrop-blur-md border-b border-white/10">
                <div className="flex flex-col">
                    <span className="text-white font-black font-mono text-lg tracking-wider">
                        {record.containerNumber}
                    </span>
                    <span className="text-white/60 text-xs font-bold">{record.teamName} • {record.images.length} Ảnh</span>
                </div>
                <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {record.images.map((img, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden border-2 border-white/20 bg-black shadow-2xl relative group">
                        <img src={img} className="w-full h-auto object-contain" loading="lazy" />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                            #{idx + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryList;
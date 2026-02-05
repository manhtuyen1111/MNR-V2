import React from 'react';
import { RepairRecord } from '../types';
import { formatDate } from '../utils';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, Trash2, Image as ImageIcon } from 'lucide-react';

interface HistoryListProps {
  records: RepairRecord[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onRetry, onDelete }) => {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Clock className="w-8 h-8" />
        </div>
        <span className="font-bold text-sm">Chưa có lịch sử nghiệm thu</span>
        <span className="text-xs mt-1">Các lượt nghiệm thu sẽ xuất hiện ở đây</span>
      </div>
    );
  }

  // Sort by newest first
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-4 space-y-3 pb-24 animate-fadeIn">
      <div className="flex items-center justify-between mb-2 px-1">
         <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Lịch sử gần đây</h2>
         <span className="text-xs font-bold text-slate-400">{records.length} Hồ sơ</span>
      </div>

      {sortedRecords.map((record) => (
        <div 
            key={record.id} 
            className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between group"
        >
            <div className="flex items-center space-x-3 overflow-hidden">
                {/* Status Icon */}
                <div className={`shrink-0 p-2 rounded-lg ${
                    record.status === 'synced' ? 'bg-green-100 text-green-600' :
                    record.status === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                }`}>
                    {record.status === 'synced' && <CheckCircle className="w-5 h-5" />}
                    {record.status === 'error' && <AlertTriangle className="w-5 h-5" />}
                    {record.status === 'pending' && <Clock className="w-5 h-5" />}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-800 font-mono tracking-tight truncate">
                        {record.containerNumber}
                    </span>
                    <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <span className="truncate max-w-[100px]">{record.teamName}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" /> {record.images.length}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {formatDate(record.timestamp)}
                    </span>
                </div>
            </div>

            <div className="flex items-center space-x-2 pl-2">
                {record.status === 'error' && (
                    <button 
                        onClick={() => onRetry(record.id)}
                        className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 active:scale-95 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={() => onDelete(record.id)}
                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
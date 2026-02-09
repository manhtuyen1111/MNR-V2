import React, { useState, useRef, useEffect } from 'react';
import { RepairRecord, Team } from '../types';
import { formatDate } from '../utils';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  X,
  Camera,
  Save,
  Filter,
  Calendar,
  Users,
  ChevronDown
} from 'lucide-react';

interface HistoryListProps {
  records: RepairRecord[];
  teams: Team[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateRecord: (updatedRecord: RepairRecord, newImagesOnly: string[]) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  records,
  teams,
  onRetry,
  onDelete,
  onUpdateRecord
}) => {
  const [viewingRecord, setViewingRecord] = useState<RepairRecord | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [quickDate, setQuickDate] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [searchCont, setSearchCont] = useState('');

  // ================= FILTER LOGIC =================
  const filteredRecords = records.filter(record => {
    // Team filter
    if (filterTeam !== 'all' && record.teamId !== filterTeam) return false;

    // Date filter
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

    // 🔍 SEARCH CONTAINER NUMBER
    if (searchCont.trim()) {
      if (
        !record.containerNumber
          .toLowerCase()
          .includes(searchCont.trim().toLowerCase())
      ) {
        return false;
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
        <span className="text-sm mt-2 text-slate-400 text-center max-w-[200px]">
          Các container đã nghiệm thu sẽ hiển thị tại đây
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4 pb-24 animate-fadeIn">
        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-2">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Bộ lọc
            </span>
          </div>

          {/* SEARCH CONTAINER */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchCont}
              onChange={(e) => setSearchCont(e.target.value)}
              placeholder="Nhập số container..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 pl-3 pr-9 text-[11px] font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
            {searchCont && (
              <button
                onClick={() => setSearchCont('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Team */}
            <div className="relative">
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 pl-3 pr-8 text-[11px] font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-all"
              >
                <option value="all">Tất cả tổ đội</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Date */}
            <div className="relative">
              <select
                value={quickDate}
                onChange={(e) => {
                  setQuickDate(e.target.value as any);
                  if (e.target.value !== 'custom') {
                    setFilterDateRange({ start: '', end: '' });
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

          {quickDate === 'custom' && (
            <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-3 animate-fadeIn">
              <input
                type="date"
                value={filterDateRange.start}
                onChange={(e) =>
                  setFilterDateRange(prev => ({ ...prev, start: e.target.value }))
                }
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-[10px] font-bold text-slate-700"
              />
              <input
                type="date"
                value={filterDateRange.end}
                onChange={(e) =>
                  setFilterDateRange(prev => ({ ...prev, end: e.target.value }))
                }
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-[10px] font-bold text-slate-700"
              />
            </div>
          )}
        </div>

        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          KẾT QUẢ TÌM KIẾM ({sortedRecords.length})
        </h2>

        {sortedRecords.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-400 text-xs font-bold">
            Không tìm thấy hồ sơ nào...
          </div>
        ) : (
          sortedRecords.map(record => (
            <div
              key={record.id}
              onClick={() => setViewingRecord(record)}
              className="bg-white rounded-[1.5rem] p-4 shadow border border-slate-100 flex justify-between cursor-pointer active:scale-[0.98]"
            >
              <div>
                <span className="font-black font-mono text-xl text-slate-800">
                  {record.containerNumber}
                </span>
                <div className="text-[10px] text-slate-400 font-bold mt-1">
                  {record.teamName} • {formatDate(record.timestamp)}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(record.id);
                }}
                className="text-red-500"
              >
                <Trash2 />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default HistoryList;

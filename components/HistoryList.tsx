import React, { useState } from 'react';
import { RepairRecord, Team } from '../types';
import { formatDate } from '../utils';
import {
  Clock,
  Trash2,
  Filter,
  Calendar,
  ChevronDown,
  X,
  RefreshCw
} from 'lucide-react';

interface HistoryListProps {
  records: RepairRecord[];
  teams: Team[];
  onRetry: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onUpdateRecord: (updatedRecord: RepairRecord, newImagesOnly?: string[]) => void | Promise<void>;
}

const HistoryList: React.FC<HistoryListProps> = ({
  records,
  teams,
  onRetry,
  onDelete,
  onUpdateRecord
}) => {
  const [filterTeam, setFilterTeam] = useState('all');
  const [quickDate, setQuickDate] =
    useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [searchCont, setSearchCont] = useState('');

  const filteredRecords = records.filter(r => {
    if (filterTeam !== 'all' && r.teamId !== filterTeam) return false;

    const d = new Date(r.timestamp);
    d.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (quickDate === 'today' && d.getTime() !== today.getTime()) return false;
    if (quickDate === 'yesterday' && d.getTime() !== yesterday.getTime()) return false;

    if (quickDate === 'custom') {
      if (filterDateRange.start) {
        const s = new Date(filterDateRange.start);
        s.setHours(0, 0, 0, 0);
        if (d < s) return false;
      }
      if (filterDateRange.end) {
        const e = new Date(filterDateRange.end);
        e.setHours(23, 59, 59, 999);
        if (d > e) return false;
      }
    }

    if (searchCont.trim()) {
      if (!r.containerNumber.toLowerCase().includes(searchCont.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filteredRecords].sort((a, b) => b.timestamp - a.timestamp);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <Clock className="w-10 h-10 mb-3" />
        <span>Lịch sử trống</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* FILTER */}
      <div className="bg-white rounded-xl p-3 border">
        <div className="flex items-center space-x-2 mb-2">
          <Filter className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold">BỘ LỌC</span>
        </div>

        {/* SEARCH */}
        <div className="relative mb-3">
          <input
            value={searchCont}
            onChange={e => setSearchCont(e.target.value)}
            placeholder="Nhập số container..."
            className="w-full border rounded-lg py-2 px-3 text-sm"
          />
          {searchCont && (
            <button
              onClick={() => setSearchCont('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterTeam}
            onChange={e => setFilterTeam(e.target.value)}
            className="border rounded-lg p-2 text-sm"
          >
            <option value="all">Tất cả tổ đội</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={quickDate}
            onChange={e => setQuickDate(e.target.value as any)}
            className="border rounded-lg p-2 text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="today">Hôm nay</option>
            <option value="yesterday">Hôm qua</option>
            <option value="custom">Tùy chọn</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      {sorted.map(r => (
        <div
          key={r.id}
          className="bg-white rounded-xl p-4 border flex justify-between"
        >
          <div>
            <div className="font-mono font-bold text-lg">
              {r.containerNumber}
            </div>
            <div className="text-xs text-slate-500">
              {r.teamName} • {formatDate(r.timestamp)}
            </div>
          </div>

          <div className="flex space-x-2">
            {r.status === 'error' && (
              <button onClick={() => onRetry(r.id)}>
                <RefreshCw className="w-5 h-5 text-sky-600" />
              </button>
            )}
            <button onClick={() => onDelete(r.id)}>
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;

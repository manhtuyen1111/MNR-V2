import React, { useState } from 'react';
import { RepairRecord, Team } from '../types';
import { formatDate } from '../utils';
import {
  Clock,
  Trash2,
  Filter,
  Calendar,
  ChevronDown,
  X
} from 'lucide-react';

interface HistoryListProps {
  records: RepairRecord[];
  teams: Team[];
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  records,
  teams,
  onDelete
}) => {
  const [filterTeam, setFilterTeam] = useState('all');
  const [quickDate, setQuickDate] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [searchCont, setSearchCont] = useState('');

  const filteredRecords = records.filter(record => {
    // team
    if (filterTeam !== 'all' && record.teamId !== filterTeam) return false;

    // date
    const recordDate = new Date(record.timestamp);
    recordDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (quickDate === 'today' && recordDate.getTime() !== today.getTime()) return false;
    if (quickDate === 'yesterday' && recordDate.getTime() !== yesterday.getTime()) return false;

    if (quickDate === 'custom') {
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

    // search container
    if (searchCont.trim()) {
      if (!record.containerNumber.toLowerCase().includes(searchCont.trim().toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => b.timestamp - a.timestamp);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <Clock className="w-12 h-12 mb-4" />
        <span className="font-bold">Lịch sử trống</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* FILTER */}
      <div className="bg-white rounded-2xl p-3 border">
        <div className="flex items-center space-x-2 mb-2">
          <Filter className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-slate-600">BỘ LỌC</span>
        </div>

        {/* SEARCH */}
        <div className="relative mb-3">
          <input
            value={searchCont}
            onChange={e => setSearchCont(e.target.value)}
            placeholder="Nhập số container..."
            className="w-full border rounded-xl py-2 px-3 text-sm"
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

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="w-full border rounded-xl py-2 px-3 text-sm"
            >
              <option value="all">Tất cả tổ đội</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4" />
          </div>

          <div className="relative">
            <select
              value={quickDate}
              onChange={e => setQuickDate(e.target.value as any)}
              className="w-full border rounded-xl py-2 px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="custom">Tùy chọn</option>
            </select>
            <Calendar className="absolute right-2 top-2.5 w-4 h-4" />
          </div>
        </div>

        {quickDate === 'custom' && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input
              type="date"
              value={filterDateRange.start}
              onChange={e => setFilterDateRange(p => ({ ...p, start: e.target.value }))}
              className="border rounded-xl p-2 text-sm"
            />
            <input
              type="date"
              value={filterDateRange.end}
              onChange={e => setFilterDateRange(p => ({ ...p, end: e.target.value }))}
              className="border rounded-xl p-2 text-sm"
            />
          </div>
        )}
      </div>

      {/* LIST */}
      {sortedRecords.map(r => (
        <div
          key={r.id}
          className="bg-white rounded-xl p-4 border flex justify-between"
        >
          <div>
            <div className="font-mono font-bold text-lg">{r.containerNumber}</div>
            <div className="text-xs text-slate-500">
              {r.teamName} • {formatDate(r.timestamp)}
            </div>
          </div>
          <button onClick={() => onDelete(r.id)}>
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;

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
          <span className="text-xs fo

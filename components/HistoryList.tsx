import React, { useMemo, useState } from 'react';
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
  Filter,
  Calendar,
  Users,
  ChevronDown,
  Search,
} from 'lucide-react';
import CameraCapture from './CameraCapture';

/* ================= PROPS ================= */

interface HistoryListProps {
  records: RepairRecord[];
  teams: Team[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateRecord: (updated: RepairRecord, newImages: string[]) => void;
}

/* ================= MAIN ================= */

const HistoryList: React.FC<HistoryListProps> = ({
  records,
  teams,
  onRetry,
  onDelete,
  onUpdateRecord,
}) => {
  const [viewing, setViewing] = useState<RepairRecord | null>(null);
  const [filterTeam, setFilterTeam] = useState('all');
  const [quickDate, setQuickDate] =
    useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [range, setRange] = useState({ start: '', end: '' });
  const [searchCont, setSearchCont] = useState('');

  /* ===== SEARCH GỢI Ý CONT ===== */
  const contSuggestions = useMemo(() => {
    if (!searchCont.trim()) return [];
    const key = searchCont.toLowerCase();
    return Array.from(
      new Set(
        records
          .map((r) => r.containerNumber)
          .filter((c) => c.toLowerCase().startsWith(key))
      )
    ).slice(0, 5);
  }, [searchCont, records]);

  /* ===== FILTER ===== */
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (
        searchCont &&
        !r.containerNumber.toLowerCase().includes(searchCont.toLowerCase())
      )
        return false;

      if (filterTeam !== 'all' && r.teamId !== filterTeam) return false;

      const d = new Date(r.timestamp);
      d.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const y = new Date(today);
      y.setDate(y.getDate() - 1);

      if (quickDate === 'today' && d.getTime() !== today.getTime()) return false;
      if (
        quickDate === 'yesterday' &&
        d.getTime() !== y.getTime()
      )
        return false;

      if (quickDate === 'custom') {
        if (range.start && d < new Date(range.start)) return false;
        if (range.end && d > new Date(range.end)) return false;
      }

      return true;
    });
  }, [records, searchCont, filterTeam, quickDate, range]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.timestamp - a.timestamp),
    [filtered]
  );

  /* ================= UI ================= */

  return (
    <>
      <div className="p-4 space-y-4 pb-28">
        {/* ===== FILTER BAR ===== */}
        <div className="bg-white rounded-2xl border p-3 space-y-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-black uppercase tracking-widest">
              Bộ lọc
            </span>
          </div>

          {/* SEARCH CONT */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={searchCont}
              onChange={(e) => setSearchCont(e.target.value)}
              placeholder="Nhập số container..."
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm font-mono"
            />
            {contSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
                {contSuggestions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSearchCont(c)}
                    className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-sky-50"
                  >
                    {c.slice(0, 4)}
                    <span className="text-red-600">{c.slice(4)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* TEAM */}
            <div className="relative">
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-2 text-xs font-bold"
              >
                <option value="all">Tất cả tổ đội</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            </div>

            {/* DATE */}
            <div className="relative">
              <select
                value={quickDate}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setQuickDate(v);
                  if (v !== 'custom') setRange({ start: '', end: '' });
                }}
                className="w-full bg-slate-50 border rounded-xl p-2 text-xs font-bold"
              >
                <option value="all">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="custom">Tùy chọn</option>
              </select>
              <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {quickDate === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={range.start}
                onChange={(e) =>
                  setRange((p) => ({ ...p, start: e.target.value }))
                }
                className="border rounded-xl p-2 text-xs"
              />
              <input
                type="date"
                value={range.end}
                onChange={(e) =>
                  setRange((p) => ({ ...p, end: e.target.value }))
                }
                className="border rounded-xl p-2 text-xs"
              />
            </div>
          )}
        </div>

        {/* ===== LIST ===== */}
        {sorted.map((r) => (
          <div
            key={r.id}
            onClick={() => setViewing(r)}
            className="bg-white rounded-2xl p-4 border shadow-sm flex justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex space-x-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  r.status === 'synced'
                    ? 'bg-green-100 text-green-600'
                    : r.status === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {r.status === 'synced' && <CheckCircle />}
                {r.status === 'error' && <AlertTriangle />}
                {r.status === 'pending' && <Clock />}
              </div>

              <div>
                <div className="font-mono font-black text-xl tracking-tight">
                  {r.containerNumber.slice(0, 4)}
                  <span className="text-red-600">
                    {r.containerNumber.slice(4)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs mt-1">
                  <span className="bg-slate-100 px-2 rounded font-bold">
                    {r.teamName}
                  </span>
                  <span className="flex items-center space-x-1 text-sky-600 font-bold">
                    <ImageIcon className="w-3 h-3" />
                    <span>{r.images.length}</span>
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1">
                  {formatDate(r.timestamp)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {r.status === 'error' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry(r.id);
                  }}
                  className="p-2 bg-sky-100 rounded-xl"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(r.id);
                }}
                className="p-2 bg-red-50 rounded-xl"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <ImageViewer
          record={viewing}
          onClose={() => setViewing(null)}
          onUpdate={(all, added) => {
  const updated: RepairRecord = {
    ...viewing,
    images: all,
    status: 'pending', // ✅ đúng SyncStatus
  };
  setViewing(updated);
  onUpdateRecord(updated, added);
          }}
        />
      )}
    </>
  );
};

/* ================= IMAGE VIEWER ================= */

const ImageViewer: React.FC<{
  record: RepairRecord;
  onClose: () => void;
  onUpdate: (all: string[], added: string[]) => void;
}> = ({ record, onClose, onUpdate }) => {
  const [images, setImages] = useState<string[]>(record.images);
  const [added, setAdded] = useState<string[]>([]);

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div className="h-20 px-6 flex justify-between items-center bg-black/80 text-white">
        <div>
          <div className="font-mono font-black text-xl">
            {record.containerNumber}
          </div>
          <div className="flex items-center text-xs text-sky-400 space-x-2">
            <Users className="w-3 h-3" />
            <span>{record.teamName}</span>
            <span>• {images.length} ảnh</span>
          </div>
        </div>
        <button onClick={onClose}>
          <X />
        </button>
      </div>

      <div className="p-3 grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            className="aspect-square object-cover rounded"
          />
        ))}
      </div>

      <div className="p-4">
        <CameraCapture
          images={added}
          onAddImage={(img) => {
            setImages((p) => [...p, img]);
            setAdded((p) => [...p, img]);
          }}
          onRemoveImage={(i) =>
            setAdded((p) => p.filter((_, idx) => idx !== i))
          }
          isActive
          isCompleted={false}
          isDisabled={false}
          onFocus={() => {}}
        />
      </div>

      {added.length > 0 && (
        <div className="p-4">
          <button
            onClick={() => onUpdate(images, added)}
            className="w-full bg-green-600 text-white font-black py-4 rounded-xl"
          >
            LƯU ẢNH BỔ SUNG
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryList;

import React, { useMemo, useState, useEffect } from 'react';
import { RepairRecord, Team } from '../types';
import { formatDate } from '../utils';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  X,
  Users,
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
      if (quickDate === 'yesterday' && d.getTime() !== y.getTime()) return false;

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

  return (
    <>
      <div className="p-4 space-y-3 pb-28 relative">
        {/* CARD ĐẾM */}
        <div className="absolute top-3 right-4 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm shadow-sm border border-slate-200 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
            <span className="font-semibold text-indigo-600">{sorted.length}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-500">{records.length}</span>
          </div>
        </div>

        {/* FILTER */}
        <div className="bg-white rounded-xl border p-3 space-y-2">
          <input
            value={searchCont}
            onChange={(e) => setSearchCont(e.target.value)}
            placeholder="Tìm container..."
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
          />

          {contSuggestions.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              {contSuggestions.map((c) => (
                <button
                  key={c}
                  onClick={() => setSearchCont(c)}
                  className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-slate-100"
                >
                  {c.slice(0, 4)}
                  <span className="text-red-600">{c.slice(4)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="border rounded-lg p-2 text-xs font-semibold"
            >
              <option value="all">Tất cả tổ đội</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              value={quickDate}
              onChange={(e) => {
                const v = e.target.value as any;
                setQuickDate(v);
                if (v !== 'custom') setRange({ start: '', end: '' });
              }}
              className="border rounded-lg p-2 text-xs font-semibold"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="custom">Tùy chọn</option>
            </select>
          </div>

          {quickDate === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={range.start}
                onChange={(e) =>
                  setRange((p) => ({ ...p, start: e.target.value }))
                }
                className="border rounded-lg p-2 text-xs"
              />
              <input
                type="date"
                value={range.end}
                onChange={(e) =>
                  setRange((p) => ({ ...p, end: e.target.value }))
                }
                className="border rounded-lg p-2 text-xs"
              />
            </div>
          )}
        </div>

        {/* LIST */}
        {sorted.length > 0 ? (
          sorted.map((r) => (
            <div
              key={r.id}
              onClick={() => setViewing(r)}
              className="bg-white rounded-xl px-3 py-2 border flex justify-between items-center cursor-pointer hover:bg-slate-50"
            >
              <div className="flex items-center space-x-3">
                {/* STATUS ICON */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    r.status === 'synced'
                      ? 'bg-green-100 text-green-600'
                      : r.status === 'error'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {r.status === 'synced' && <CheckCircle size={18} />}
                  {r.status === 'error' && <AlertTriangle size={18} />}
                  {r.status === 'pending' && <Clock size={18} />}
                </div>

                {/* ====== HIỂN THỊ 1 DÒNG THEO YÊU CẦU ====== */}
                <div className="flex items-baseline gap-1.5 font-mono">
                  {/* CONTAINER */}
                  <div className="font-bold text-sm">
                    <span className="text-black">
                      {r.containerNumber.slice(0, 4)}
                    </span>
                    <span className="text-red-600">
                      {r.containerNumber.slice(4)}
                    </span>
                  </div>

                  {/* META */}
                  <div className="text-[10.5px] text-slate-400 whitespace-nowrap">
                    {r.teamName} {r.images.length}ẢNH{' '}
                    {formatDate(r.timestamp)}
                  </div>
                </div>
              </div>

              {/* ACTION */}
              <div className="flex items-center space-x-2">
                {r.status === 'error' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(r.id);
                    }}
                    className="p-2 rounded-lg bg-slate-100"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(r.id);
                  }}
                  className="p-2 rounded-lg bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500 italic">
            Không có bản ghi nào khớp với bộ lọc hiện tại
          </div>
        )}
      </div>

      {viewing && (
        <ImageViewer
          record={viewing}
          onClose={() => setViewing(null)}
          onUpdate={(all, added) => {
            const updated: RepairRecord = {
              ...viewing,
              images: all,
              status: 'pending',
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

  useEffect(() => {
    setImages(record.images);
    setAdded([]);
  }, [record]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="h-16 px-5 flex justify-between items-center bg-black/80 text-white">
        <div>
          <div className="font-mono font-bold text-lg">
            {record.containerNumber}
          </div>
          <div className="flex items-center text-xs text-slate-300 space-x-2">
            <Users size={12} />
            <span>{record.teamName}</span>
            <span>• {images.length} ảnh</span>
          </div>
        </div>
        <button onClick={onClose}>
          <X />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="aspect-square object-cover rounded"
            />
          ))}
        </div>
      </div>

      <div className="p-4">
        <CameraCapture
          images={added}
          onAddImage={(img) => {
            setImages((p) => [...p, img]);
            setAdded((p) => [...p, img]);
          }}
          onRemoveImage={(i) => {
            setImages((p) =>
              p.filter((_, idx) => idx !== record.images.length + i)
            );
            setAdded((p) => p.filter((_, idx) => idx !== i));
          }}
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
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl"
          >
            LƯU ẢNH BỔ SUNG
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryList;

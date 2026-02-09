import React, { useEffect, useRef, useState } from 'react';
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
  onRetry: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateRecord: (
    updatedRecord: RepairRecord,
    newImagesOnly?: string[]
  ) => Promise<void>;
}

const HistoryList: React.FC<HistoryListProps> = ({
  records,
  teams,
  onRetry,
  onDelete,
  onUpdateRecord
}) => {
  const [viewingRecord, setViewingRecord] = useState<RepairRecord | null>(null);
  const [filterTeam, setFilterTeam] = useState('all');
  const [quickDate, setQuickDate] =
    useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [filterDateRange, setFilterDateRange] = useState({
    start: '',
    end: ''
  });

  const [searchCont, setSearchCont] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ================= FILTER LOGIC ================= */

  const filteredRecords = records.filter(r => {
    if (filterTeam !== 'all' && r.teamId !== filterTeam) return false;

    const recordDate = new Date(r.timestamp);
    recordDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (quickDate === 'today' && recordDate.getTime() !== today.getTime())
      return false;

    if (
      quickDate === 'yesterday' &&
      recordDate.getTime() !== yesterday.getTime()
    )
      return false;

    if (quickDate === 'custom') {
      if (filterDateRange.start) {
        const s = new Date(filterDateRange.start);
        s.setHours(0, 0, 0, 0);
        if (recordDate < s) return false;
      }
      if (filterDateRange.end) {
        const e = new Date(filterDateRange.end);
        e.setHours(23, 59, 59, 999);
        if (recordDate > e) return false;
      }
    }

    if (
      searchCont &&
      !r.containerNumber
        .toLowerCase()
        .includes(searchCont.toLowerCase())
    )
      return false;

    return true;
  });

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  const suggestions = searchCont
    ? records
        .filter(r =>
          r.containerNumber
            .toLowerCase()
            .includes(searchCont.toLowerCase())
        )
        .slice(0, 5)
    : [];

  /* ================= UI ================= */

  return (
    <>
      <div className="p-4 space-y-4 pb-24">
        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl border p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-black">BỘ LỌC</span>
          </div>

          {/* SEARCH */}
          <div className="relative mb-3">
            <input
              ref={searchRef}
              value={searchCont}
              onChange={e => {
                setSearchCont(e.target.value);
                setShowSuggest(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="Nhập số container..."
              className="w-full border rounded-xl py-2 px-3 text-sm"
            />

            {searchCont && (
              <button
                onClick={() => {
                  setSearchCont('');
                  searchRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}

            {showSuggest && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-xl mt-1 shadow">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onMouseDown={() => {
                      setSearchCont(s.containerNumber);
                      setShowSuggest(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    {s.containerNumber}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TEAM FILTER */}
          <div className="relative mb-3">
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="w-full border rounded-xl p-2 text-sm appearance-none"
            >
              <option value="all">Tất cả tổ đội</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* DATE FILTER */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={quickDate}
              onChange={e =>
                setQuickDate(e.target.value as typeof quickDate)
              }
              className="border rounded-xl p-2 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="custom">Tuỳ chọn</option>
            </select>

            {quickDate === 'custom' && (
              <>
                <input
                  type="date"
                  value={filterDateRange.start}
                  onChange={e =>
                    setFilterDateRange(v => ({
                      ...v,
                      start: e.target.value
                    }))
                  }
                  className="border rounded-xl p-2 text-sm"
                />
                <input
                  type="date"
                  value={filterDateRange.end}
                  onChange={e =>
                    setFilterDateRange(v => ({
                      ...v,
                      end: e.target.value
                    }))
                  }
                  className="border rounded-xl p-2 text-sm"
                />
              </>
            )}
          </div>
        </div>

        {/* LIST */}
        {sortedRecords.map(r => (
          <div
            key={r.id}
            onClick={() => setViewingRecord(r)}
            className="bg-white rounded-xl p-4 border flex justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center space-x-2">
                {r.status === 'synced' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {r.status === 'pending' && (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
                {r.status === 'error' && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-mono font-bold">
                  {r.containerNumber}
                </span>
              </div>

              <div className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
                <Users className="w-3 h-3" />
                <span>{r.teamName}</span>
                <Calendar className="w-3 h-3 ml-2" />
                <span>{formatDate(r.timestamp)}</span>
                <ImageIcon className="w-3 h-3 ml-2" />
                <span>{r.images.length}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              {r.status === 'error' && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRetry(r.id);
                  }}
                >
                  <RefreshCw className="w-5 h-5 text-sky-600" />
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(r.id);
                }}
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewingRecord && (
        <ImageViewer
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onUpdate={(all, onlyNew) => {
            const updated: RepairRecord = {
              ...viewingRecord,
              images: all,
              status: 'pending'
            };
            setViewingRecord(updated);
            onUpdateRecord(updated, onlyNew);
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
  onUpdate: (all: string[], onlyNew: string[]) => void;
}> = ({ record, onClose, onUpdate }) => {
  const [mode, setMode] = useState<'view' | 'camera'>('view');
  const [images, setImages] = useState<string[]>(record.images);
  const [staged, setStaged] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [mode, stream]);

  const startCamera = async () => {
    const ms = await navigator.mediaDevices.getUserMedia({ video: true });
    setStream(ms);
    setMode('camera');
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setMode('view');
    setStaged([]);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    setStaged(s => [...s, c.toDataURL('image/jpeg', 0.5)]);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 text-white">
      {mode === 'view' ? (
        <>
          <div className="p-4 flex justify-between">
            <span>{record.containerNumber}</span>
            <button onClick={onClose}>
              <X />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2">
            {images.map((img, i) => (
              <img key={i} src={img} />
            ))}
            <button onClick={startCamera}>
              <Camera />
            </button>
          </div>
        </>
      ) : (
        <>
          <canvas ref={canvasRef} className="hidden" />
          <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
          <button onClick={capture}>CAPTURE</button>
          {staged.length > 0 && (
            <button
              onClick={() => {
                const all = [...images, ...staged];
                setImages(all);
                onUpdate(all, staged);
                stopCamera();
              }}
            >
              <Save />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryList;

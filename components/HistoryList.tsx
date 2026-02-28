import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  memo,
} from 'react';
import {
  FixedSizeList as List,
  ListChildComponentProps
} from 'react-window';
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

/* ================= DEBOUNCE HOOK ================= */

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/* ================= HISTORY ITEM ================= */

interface HistoryItemProps {
  record: RepairRecord;
  retryingId: string | null;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (r: RepairRecord) => void;
}

const HistoryItem = memo(
  ({ record, retryingId, onRetry, onDelete, onView }: HistoryItemProps) => {
    const isOver2Minutes =
      record.status === 'pending' &&
      Date.now() - record.timestamp > 120000;

    return (
      <div
        onClick={() => onView(record)}
        className="bg-white rounded-xl px-3 py-2 border flex justify-between items-center cursor-pointer hover:bg-slate-50"
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              record.status === 'synced'
                ? 'bg-green-100 text-green-600'
                : record.status === 'error'
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {record.status === 'synced' && <CheckCircle size={18} />}
            {record.status === 'error' && <AlertTriangle size={18} />}
            {record.status === 'pending' && <Clock size={18} />}
          </div>

          {(record.status === 'error' || isOver2Minutes) && (
            <button
              disabled={retryingId === record.id}
              onClick={(e) => {
                e.stopPropagation();
                onRetry(record.id);
              }}
              className={`p-2 rounded-lg ${
                retryingId === record.id
                  ? 'bg-amber-100 text-amber-400 opacity-50'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              <RefreshCw
                size={16}
                className={retryingId === record.id ? 'animate-spin' : ''}
              />
            </button>
          )}

          <div className="flex items-baseline gap-1.5 font-mono">
            <div className="font-bold text-lg">
              <span>{record.containerNumber.slice(0, 4)}</span>
              <span className="text-green-700">
                {record.containerNumber.slice(4)}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 whitespace-nowrap">
              {record.teamName} {formatDate(record.timestamp)}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(record.id);
          }}
          className="p-2 rounded-lg bg-red-50 text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }
);

/* ================= MAIN ================= */

interface HistoryListProps {
  records: RepairRecord[];
  teams: Team[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateRecord: (updated: RepairRecord, newImages: string[]) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  records,
  teams,
  onRetry,
  onDelete,
  onUpdateRecord,
}) => {
const [viewing, setViewing] = useState<RepairRecord | null>(null);
const [isMaintenanceMode, setIsMaintenanceMode] = useState(true);  // Đặt là true để giả lập chế độ bảo trì
  const [filterTeam, setFilterTeam] = useState('all');
  const [quickDate, setQuickDate] =
    useState<'all' | 'today' | 'yesterday' | 'custom'>('today');
  const [range, setRange] = useState({ start: '', end: '' });
  const [searchInput, setSearchInput] = useState('');
  const searchCont = useDebounce(searchInput, 300);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  /* ===== FILTER ===== */

  const filtered = useMemo(() => {
    const searchLower = searchCont.trim().toLowerCase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return records.filter((r) => {
      if (
        searchLower &&
        !r.containerNumber.toLowerCase().includes(searchLower)
      )
        return false;

      if (filterTeam !== 'all' && r.teamId !== filterTeam) return false;

      const d = new Date(r.timestamp);
      d.setHours(0, 0, 0, 0);

      if (quickDate === 'today' && d.getTime() !== today.getTime())
        return false;

      if (quickDate === 'yesterday' && d.getTime() !== yesterday.getTime())
        return false;

      if (quickDate === 'custom') {
        if (range.start) {
          const start = new Date(range.start);
          start.setHours(0, 0, 0, 0);
          if (d < start) return false;
        }

        if (range.end) {
          const end = new Date(range.end);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }

      return true;
    });
  }, [records, searchCont, filterTeam, quickDate, range]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.timestamp - a.timestamp),
    [filtered]
  );

  /* ===== RESET RETRY ===== */

  useEffect(() => {
    if (retryingId) {
      const record = records.find((r) => r.id === retryingId);
      if (!record || record.status !== 'pending') {
        setRetryingId(null);
      }
    }
  }, [records, retryingId]);

  /* ===== HANDLERS ===== */

  const handleRetry = useCallback(
    (id: string) => {
      setRetryingId(id);
      onRetry(id);
    },
    [onRetry]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
    },
    [onDelete]
  );

  /* ===== VIRTUAL ROW ===== */

const Row = ({ index, style }: ListChildComponentProps) => {
    const record = sorted[index];
    return (
      <div style={style}>
        <HistoryItem
          record={record}
          retryingId={retryingId}
          onRetry={handleRetry}
          onDelete={handleDelete}
          onView={setViewing}
        />
      </div>
    );
  };

 return (
  <>
    <div className="p-4 space-y-3 pb-28 relative">
      {isMaintenanceMode && (
        <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-center p-3 font-bold">
          BẢO TRÌ HỆ THỐNG - VUI LÒNG QUAY LẠI SAU!
        </div>
      )}

      {/* Phần giao diện khác */}
      <div className="absolute top-3 right-4 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm shadow-sm border px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
          <span className="font-semibold text-indigo-600">
            {sorted.length}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-500">{records.length}</span>
        </div>
      </div>


        {/* FILTER */}
        <div className="bg-white rounded-xl border p-3 space-y-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm container..."
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
            disabled={isMaintenanceMode} // Vô hiệu hóa input khi bảo trì
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="border rounded-lg p-2 text-xs font-semibold"
               disabled={isMaintenanceMode} // Vô hiệu hóa dropdown khi bảo trì
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
          <List
            height={600}
            itemCount={sorted.length}
            itemSize={72}
            width="100%"
          >
            {Row}
          </List>
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
          onRetry={handleRetry}
          retryingId={retryingId}
           onUpdate={(all: string[], added: string[]) => {
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

interface ImageViewerProps {
  record: RepairRecord;
  onClose: () => void;
  onRetry: (id: string) => void;
  retryingId: string | null;
  onUpdate: (all: string[], added: string[]) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  record,
  onClose,
  onRetry,
  retryingId,
  onUpdate,
}) => {
  const [images, setImages] = useState<string[]>(record.images);
  const [added, setAdded] = useState<string[]>([]);
  
  /*  Bấm nút 🔁 Retry, Hiện modal nhập mật khẩu */
  
  const [showAuth, setShowAuth] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setImages(record.images);
    setAdded([]);
  }, [record]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="h-16 px-5 flex justify-between items-center bg-black/80 text-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-mono font-bold text-lg">
              {record.containerNumber}
            </div>
            <button
              disabled={retryingId === record.id}
              onClick={() => setShowAuth(true)}
              className="p-1.5 rounded-lg bg-amber-100 text-amber-600"
            >
              <RefreshCw
                size={16}
                className={retryingId === record.id ? 'animate-spin' : ''}
              />
            </button>
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
              key={img + i}
              src={img}
              loading="lazy"
              decoding="async"
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
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-xl p-5 w-80 space-y-3">
            <div className="font-semibold text-lg text-center">
             VUI LÒNG NHẬP OTP TỪ QTV
            </div>

            <input
              type="password"
              value={secretInput}
              onChange={(e) => {
                setSecretInput(e.target.value);
                setAuthError('');
              }}
              placeholder="Mã bí mật của QTV "
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            {authError && (
              <div className="text-sky-700 text-xs text-center">
                {authError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAuth(false);
                  setSecretInput('');
                  setAuthError('');
                }}
                className="flex-1 border rounded-lg py-2"
              >
                Hủy
              </button>

              <button
                onClick={() => {
                  const SECRET =
                    import.meta.env.VITE_RETRY_SECRET || '321';

                  if (secretInput === SECRET) {
                    setShowAuth(false);
                    setSecretInput('');
                    onRetry(record.id);
                  } else {
                    setAuthError('Sai mật khẩu');
                  }
                }}
                className="flex-1 bg-sky-700 text-white rounded-lg py-2"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 


export default HistoryList;

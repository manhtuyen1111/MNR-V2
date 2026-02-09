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
  ChevronDown,
} from 'lucide-react';

/* ======================= HISTORY LIST ======================= */

interface HistoryListProps {
  records: RepairRecord[];
  teams: Team[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateRecord: (
    updatedRecord: RepairRecord,
    newImagesOnly: string[]
  ) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  records,
  teams,
  onRetry,
  onDelete,
  onUpdateRecord,
}) => {
  const [viewingRecord, setViewingRecord] =
    useState<RepairRecord | null>(null);

  const [filterTeam, setFilterTeam] = useState('all');
  const [quickDate, setQuickDate] =
    useState<'all' | 'today' | 'yesterday' | 'custom'>('all');

  const [filterDateRange, setFilterDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });

  const filteredRecords = records.filter((record) => {
    if (filterTeam !== 'all' && record.teamId !== filterTeam) return false;

    const recordDate = new Date(record.timestamp);
    recordDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (quickDate === 'today' && recordDate.getTime() !== today.getTime())
      return false;

    if (
      quickDate === 'yesterday' &&
      recordDate.getTime() !== yesterday.getTime()
    )
      return false;

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

    return true;
  });

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <Clock className="w-12 h-12 mb-4" />
        <span className="font-bold text-lg">Lịch sử trống</span>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4 pb-24">
        {/* FILTER */}
        <div className="bg-white rounded-2xl border p-3 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Filter className="w-4 h-4 text-sky-600" />
            BỘ LỌC
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl py-2 pl-3 pr-8 text-xs font-bold"
              >
                <option value="all">Tất cả tổ đội</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={quickDate}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setQuickDate(v);
                  if (v !== 'custom')
                    setFilterDateRange({ start: '', end: '' });
                }}
                className="w-full bg-slate-50 border rounded-xl py-2 pl-3 pr-8 text-xs font-bold"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="custom">Tùy chọn</option>
              </select>
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {quickDate === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filterDateRange.start}
                onChange={(e) =>
                  setFilterDateRange((p) => ({
                    ...p,
                    start: e.target.value,
                  }))
                }
                className="border rounded-xl p-2 text-xs"
              />
              <input
                type="date"
                value={filterDateRange.end}
                onChange={(e) =>
                  setFilterDateRange((p) => ({
                    ...p,
                    end: e.target.value,
                  }))
                }
                className="border rounded-xl p-2 text-xs"
              />
            </div>
          )}
        </div>

        {/* LIST */}
        {sortedRecords.map((record) => (
          <div
            key={record.id}
            onClick={() => setViewingRecord(record)}
            className="bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md active:scale-[0.98] transition cursor-pointer flex justify-between"
          >
            <div className="flex gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center
                ${
                  record.status === 'synced'
                    ? 'bg-green-100 text-green-600'
                    : record.status === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {record.status === 'synced' && <CheckCircle />}
                {record.status === 'error' && <AlertTriangle />}
                {record.status === 'pending' && <Clock />}
              </div>

              <div>
                <div className="font-mono font-black text-lg">
                  <span className="text-slate-700">
                    {record.containerNumber.slice(0, 4)}
                  </span>
                  <span className="text-red-600 tracking-widest ml-1">
                    {record.containerNumber.slice(4)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">
                    {record.teamName}
                  </span>
                  <span className="flex items-center gap-1 bg-sky-100 px-2 py-0.5 rounded text-sky-700">
                    <ImageIcon className="w-3 h-3" />
                    {record.images.length}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1">
                  {formatDate(record.timestamp)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {record.status === 'error' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry(record.id);
                  }}
                  className="p-2 rounded-xl bg-sky-50 text-sky-600"
                >
                  <RefreshCw />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(record.id);
                }}
                className="p-2 rounded-xl bg-red-50 text-red-600"
              >
                <Trash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewingRecord && (
        <ImageViewer
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onUpdate={(all, newly) => {
            const updated = {
              ...viewingRecord,
              images: all,
              status: 'pending' as const,
            };
            setViewingRecord(updated);
            onUpdateRecord(updated, newly);
          }}
        />
      )}
    </>
  );
};

export default HistoryList;

/* ======================= IMAGE VIEWER ======================= */

const ImageViewer: React.FC<{
  record: RepairRecord;
  onClose: () => void;
  onUpdate: (allImages: string[], newImages: string[]) => void;
}> = ({ record, onClose, onUpdate }) => {
  const [mode, setMode] = useState<'view' | 'camera'>('view');
  const [tempImages, setTempImages] = useState<string[]>(record.images);
  const [stagedImages, setStagedImages] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    setMode('camera');
    const ms = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    setStream(ms);
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setMode('view');
    setStagedImages([]);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const img = c.toDataURL('image/jpeg', 0.5);
    setStagedImages((p) => [...p, img]);
  };

  const handleConfirmUpdate = () => {
    const merged = [...tempImages, ...stagedImages];
    setTempImages(merged);
    onUpdate(merged, stagedImages);
    stopCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {mode === 'view' ? (
        <>
          <div className="h-20 flex items-center justify-between px-6 bg-black/80 text-white">
            <div>
              <div className="font-mono font-black text-xl">
                {record.containerNumber}
              </div>
              <div className="text-xs text-sky-400 flex items-center gap-2">
                <Users className="w-3 h-3" />
                {record.teamName} • {tempImages.length} ảnh
              </div>
            </div>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1">
            {tempImages.map((img, i) => (
              <img
                key={i}
                src={img}
                className="aspect-square object-cover"
              />
            ))}
            <button
              onClick={startCamera}
              className="aspect-square flex flex-col items-center justify-center border border-dashed text-sky-500"
            >
              <Camera />
              <span className="text-[10px]">Thêm</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full">
          <canvas ref={canvasRef} className="hidden" />
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="flex-1 object-cover"
          />
          <div className="p-4 flex justify-between items-center">
            <button onClick={stopCamera}>
              <X className="text-white" />
            </button>
            <button
              onClick={capture}
              className="w-20 h-20 rounded-full bg-white"
            />
            {stagedImages.length > 0 && (
              <button
                onClick={handleConfirmUpdate}
                className="bg-green-600 p-3 rounded-xl text-white"
              >
                <Save />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

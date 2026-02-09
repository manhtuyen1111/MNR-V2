import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ContainerInput from './components/ContainerInput';
import TeamSelector from './components/TeamSelector';
import CameraCapture from './components/CameraCapture';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';
import HistoryList from './components/HistoryList';
import TeamManager from './components/TeamManager';
import Login from './components/Login';

import { TabView, Team, AppSettings, RepairRecord, User } from './types';
import { REPAIR_TEAMS } from './constants';
import { compressImage, dbService } from './utils';
import {
  Check,
  AlertTriangle,
  Send,
  Loader2,
  WifiOff,
  ShieldAlert,
  Zap,
} from 'lucide-react';

/* ================= HASH ================= */
async function getImageHash(base64: string): Promise<string> {
  try {
    const binary = atob(base64.split(',')[1]);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

const App: React.FC = () => {
  /* ================= AUTH ================= */
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<TabView>('capture');

  /* ================= SETTINGS ================= */
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved
      ? JSON.parse(saved)
      : {
          googleScriptUrl:
            'https://script.google.com/macros/s/AKfycbzbjPA2yD7YcpZXNCeD20f8aI8mD9-XczQdq-sqDbbgJCUWFmpdUDvDeQ96kpashwLm/exec',
        };
  });

  /* ================= DATA ================= */
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('repairTeams');
    return saved ? JSON.parse(saved) : REPAIR_TEAMS;
  });

  const [records, setRecords] = useState<RepairRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  /* ================= CAPTURE ================= */
  const [containerNum, setContainerNum] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  /* ================= DERIVED ================= */
  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete =
    isContainerValid && isTeamSelected && images.length > 0;

  const pendingCount = records.filter(
    (r) => r.status === 'pending' || r.status === 'error'
  ).length;

  /* ================= LOAD ================= */
  useEffect(() => {
    dbService.getAllRecords().then((r) => {
      setRecords(r);
      setIsLoadingRecords(false);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('repairTeams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ================= AUTO RETRY ONLINE ================= */
  useEffect(() => {
    if (!navigator.onLine || !settings.googleScriptUrl) return;

    const retry = async () => {
      for (const r of records) {
        if (r.status !== 'error') continue;

        const startIdx = r.uploadedCount || 0;
        const imgs = r.images.slice(startIdx);
        if (imgs.length === 0) continue;

        const hashes =
          r.imageHashes?.slice(startIdx) ??
          (await Promise.all(imgs.map(getImageHash)));

        const ok = await syncRecord(r, imgs, startIdx, hashes);
        if (ok) {
          const updated: RepairRecord = {
            ...r,
            status: 'synced',
            uploadedCount: r.images.length,
            imageHashes: r.imageHashes,
          };
          await dbService.saveRecord(updated);
          setRecords((p) => p.map((x) => (x.id === r.id ? updated : x)));
        }
      }
    };

    retry();
  }, [records, settings.googleScriptUrl]);

  /* ================= API ================= */
  const syncRecord = async (
    record: RepairRecord,
    imgs?: string[],
    startIdx = 0,
    hashes?: string[]
  ): Promise<boolean> => {
    try {
      const res = await fetch(settings.googleScriptUrl, {
        method: 'POST',
        body: JSON.stringify({
          id: record.id,
          containerNumber: record.containerNumber,
          team: record.teamName,
          timestamp: new Date(record.timestamp).toISOString(),
          images: imgs ?? record.images,
          startIdx,
          imageHashes: hashes ?? [],
          editor: user?.username ?? 'unknown',
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  /* ================= ACTIONS ================= */
  const handleLogin = (u: User) => {
    localStorage.setItem('currentUser', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const handleAddImage = async (img: string) => {
    const c = await compressImage(img);
    setImages((p) => [...p, c]);
  };

  const handleSaveData = async () => {
    if (!isFormComplete) return;
    setIsSubmitting(true);

    const hashes = await Promise.all(images.map(getImageHash));

    const record: RepairRecord = {
      id: Date.now().toString(),
      containerNumber: containerNum,
      teamId: selectedTeamId,
      teamName:
        teams.find((t) => t.id === selectedTeamId)?.name ?? 'Unknown',
      images,
      timestamp: Date.now(),
      status: 'pending',
      uploadedCount: 0,
      imageHashes: hashes,
    };

    await dbService.saveRecord(record);
    setRecords((p) => [record, ...p]);

    setContainerNum('');
    setImages([]);
    setActiveStep(1);
    setIsSubmitting(false);

    setToast({ message: 'Đã lưu – chờ sync', type: 'info' });
  };

  const handleRetry = async (id: string) => {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    const start = r.uploadedCount || 0;
    const imgs = r.images.slice(start);
    const hashes = r.imageHashes?.slice(start) ?? [];
    const ok = await syncRecord(r, imgs, start, hashes);

    if (ok) {
      const updated: RepairRecord = {
        ...r,
        status: 'synced',
        uploadedCount: r.images.length,
      };
      await dbService.saveRecord(updated);
      setRecords((p) => p.map((x) => (x.id === id ? updated : x)));
    }
  };

  const handleDelete = async (id: string) => {
    await dbService.deleteRecord(id);
    setRecords((p) => p.filter((x) => x.id !== id));
  };

  const handleUpdateRecord = async (r: RepairRecord) => {
    await dbService.saveRecord(r);
    setRecords((p) => p.map((x) => (x.id === r.id ? r : x)));
  };

  /* ================= RENDER ================= */
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-100">
      <Header />

      <div className="bg-slate-900 text-white px-4 py-2 text-xs flex justify-between">
        <span>NHÂN VIÊN: {user.name}</span>
        <button onClick={handleLogout} className="text-sky-400">
          ĐĂNG XUẤT
        </button>
      </div>

      <main className="flex-1 overflow-hidden max-w-md mx-auto w-full">
        {activeTab === 'capture' && (
          <div className="p-4 space-y-4">
            <ContainerInput
              value={containerNum}
              onChange={setContainerNum}
              isValid={isContainerValid}
              isActive={activeStep === 1}
              isCompleted={isContainerValid}
              isDisabled={false}
              onFocus={() => setActiveStep(1)}
            />

            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onSelect={setSelectedTeamId}
              onManageTeams={() => setIsTeamManagerOpen(true)}
              isActive={activeStep === 2}
              isCompleted={isTeamSelected}
              isDisabled={!isContainerValid}
              onFocus={() => setActiveStep(2)}
              assignedTeamId={user.assignedTeamId}
              userRole={user.role}
            />

            <CameraCapture
              images={images}
              onAddImage={handleAddImage}
              onRemoveImage={(i) =>
                setImages((p) => p.filter((_, idx) => idx !== i))
              }
              isActive={activeStep === 3}
              isCompleted={images.length > 0}
              isDisabled={!isTeamSelected}
              onFocus={() => setActiveStep(3)}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryList
            records={records}
            teams={teams}
            onRetry={handleRetry}
            onDelete={handleDelete}
            onUpdateRecord={handleUpdateRecord}
          />
        )}

        {activeTab === 'settings' &&
          (user.role === 'admin' ? (
            <Settings
              settings={settings}
              onSave={(s) => {
                setSettings(s);
                localStorage.setItem('appSettings', JSON.stringify(s));
              }}
            />
          ) : (
            <div className="p-8 text-center text-slate-400">
              <ShieldAlert className="mx-auto mb-4" />
              Không đủ quyền
            </div>
          ))}
      </main>

      {activeTab === 'capture' && isFormComplete && (
        <button
          onClick={handleSaveData}
          disabled={isSubmitting}
          className="fixed bottom-24 right-4 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-xl"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'LƯU'}
        </button>
      )}

      <BottomNav
        currentTab={activeTab}
        onChangeTab={setActiveTab}
        pendingCount={pendingCount}
        userRole={user.role}
      />

      {isTeamManagerOpen && (
        <TeamManager
          teams={teams}
          onUpdateTeams={setTeams}
          onClose={() => setIsTeamManagerOpen(false)}
        />
      )}
    </div>
  );
};

export default App;

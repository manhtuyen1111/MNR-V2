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
import {
  TabView,
  Team,
  AppSettings,
  RepairRecord,
  User,
  SyncStatus,
} from './types';
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

/* ================= HASH IMAGE ================= */

async function getImageHash(base64: string): Promise<string> {
  try {
    const binary = atob(base64.split(',')[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

/* ================= APP ================= */

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<TabView>('capture');

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved
      ? JSON.parse(saved)
      : {
          googleScriptUrl: '',
        };
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('repairTeams');
    return saved ? JSON.parse(saved) : REPAIR_TEAMS;
  });

  const [containerNum, setContainerNum] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const [records, setRecords] = useState<RepairRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  /* ================= LOAD ================= */

  useEffect(() => {
    dbService.getAllRecords().then((r) => {
      setRecords(r);
      setIsLoadingRecords(false);
    });
  }, []);

  useEffect(() => {
    if (user?.assignedTeamId) {
      setSelectedTeamId(user.assignedTeamId);
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ================= VALID ================= */

  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete =
    isContainerValid && isTeamSelected && images.length > 0;

  /* ================= AUTH ================= */

  const handleLogin = (u: User) => {
    localStorage.setItem('currentUser', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  /* ================= SAVE ================= */

  const syncRecordToSheet = async (
    record: RepairRecord,
    imagesToSend: string[],
    startIdx: number,
    hashes: string[]
  ): Promise<boolean> => {
    try {
      const res = await fetch(settings.googleScriptUrl, {
        method: 'POST',
        body: JSON.stringify({
          id: record.id,
          timestamp: new Date(record.timestamp).toISOString(),
          containerNumber: record.containerNumber,
          team: record.teamName,
          images: imagesToSend,
          startIdx,
          imageHashes: hashes,
          editor: user?.username || 'unknown',
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSaveData = async () => {
    if (!isFormComplete) return;

    setIsSubmitting(true);

    const imageHashes = await Promise.all(
      images.map((img) => getImageHash(img))
    );

    const newRecord: RepairRecord = {
      id: Date.now().toString(),
      containerNumber: containerNum,
      teamId: selectedTeamId,
      teamName:
        teams.find((t) => t.id === selectedTeamId)?.name || 'Unknown',
      images,
      timestamp: Date.now(),
      status: 'pending',
      uploadedCount: 0,
      imageHashes,
    };

    await dbService.saveRecord(newRecord);
    setRecords((p) => [newRecord, ...p]);

    setContainerNum('');
    setImages([]);
    setActiveStep(1);
    setIsSubmitting(false);

    if (!settings.googleScriptUrl) {
      setToast({ message: 'Đã lưu offline', type: 'warning' });
      return;
    }

    const ok = await syncRecordToSheet(
      newRecord,
      images,
      0,
      imageHashes
    );

    const updated: RepairRecord = {
      ...newRecord,
      status: ok ? ('synced' as const) : ('error' as const),
      uploadedCount: ok ? images.length : 0,
    };

    await dbService.saveRecord(updated);
    setRecords((p) =>
      p.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  /* ================= RETRY ================= */

  const handleRetry = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record || !settings.googleScriptUrl) return;

    const startIdx = record.uploadedCount;
    const imgs = record.images.slice(startIdx);
    const hashes = record.imageHashes?.slice(startIdx) || [];

    setRecords((p) =>
      p.map((r) =>
        r.id === id ? { ...r, status: 'pending' as const } : r
      )
    );

    const ok = await syncRecordToSheet(
      record,
      imgs,
      startIdx,
      hashes
    );

    const updated: RepairRecord = {
      ...record,
      status: ok ? ('synced' as const) : ('error' as const),
      uploadedCount: ok ? record.images.length : record.uploadedCount,
    };

    await dbService.saveRecord(updated);
    setRecords((p) =>
      p.map((r) => (r.id === id ? updated : r))
    );
  };

  /* ================= RENDER ================= */

  if (!user) return <Login onLogin={handleLogin} />;

  const pendingCount = records.filter(
    (r) => r.status !== 'synced'
  ).length;

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <Header />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'capture' && (
          <div className="p-4 space-y-5">
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
              onAddImage={async (img) =>
                setImages((p) => [...p, await compressImage(img)])
              }
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
            onDelete={async (id) => {
              await dbService.deleteRecord(id);
              setRecords((p) => p.filter((r) => r.id !== id));
            }}
            onUpdateRecord={async (r) => {
              await dbService.saveRecord(r);
              setRecords((p) =>
                p.map((x) => (x.id === r.id ? r : x))
              );
            }}
          />
        )}

        {activeTab === 'settings' && user.role === 'admin' && (
          <Settings
            settings={settings}
            onSave={(s) => {
              setSettings(s);
              localStorage.setItem(
                'appSettings',
                JSON.stringify(s)
              );
            }}
          />
        )}
      </main>

      <BottomNav
        currentTab={activeTab}
        onChangeTab={setActiveTab}
        pendingCount={pendingCount}
        userRole={user.role}
      />
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef } from 'react';
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

/* =========================
   HASH IMAGE (ANTI DUP)
========================= */
async function getImageHash(base64: string): Promise<string> {
  try {
    const binary = atob(base64.split(',')[1]);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

const App: React.FC = () => {
  /* =========================
      AUTH
  ========================= */
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('currentUser');
    return u ? JSON.parse(u) : null;
  });

  /* =========================
      STATE
  ========================= */
  const [activeTab, setActiveTab] = useState<TabView>('capture');
  const [teams, setTeams] = useState<Team[]>(() => {
    const t = localStorage.getItem('repairTeams');
    return t ? JSON.parse(t) : REPAIR_TEAMS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = localStorage.getItem('appSettings');
    return s
      ? JSON.parse(s)
      : { googleScriptUrl: '' };
  });

  const [containerNum, setContainerNum] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const [records, setRecords] = useState<RepairRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const isSyncingRef = useRef(false);

  /* =========================
      LOAD DATA
  ========================= */
  useEffect(() => {
    dbService.getAllRecords().then(r => {
      setRecords(r);
      setIsLoadingRecords(false);
    });
  }, []);

  /* =========================
      AUTO STEP
  ========================= */
  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete = isContainerValid && isTeamSelected && images.length > 0;

  useEffect(() => {
    if (activeStep === 1 && isContainerValid)
      setTimeout(() => setActiveStep(2), 300);
  }, [containerNum]);

  useEffect(() => {
    if (activeStep === 2 && isTeamSelected)
      setTimeout(() => setActiveStep(3), 300);
  }, [selectedTeamId]);

  /* =========================
      AUTO RETRY ONLINE
  ========================= */
  useEffect(() => {
    if (!settings.googleScriptUrl) return;

    const onOnline = async () => {
      if (isSyncingRef.current) return;

      const needRetry = records.filter(
        r => r.status === 'error' || r.status === 'pending'
      );

      if (needRetry.length === 0) return;

      isSyncingRef.current = true;

      setToast({
        message: `Có mạng – tự động gửi ${needRetry.length} hồ sơ`,
        type: 'info',
      });

      for (const r of needRetry) {
        await handleRetry(r.id);
      }

      isSyncingRef.current = false;
    };

    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [settings.googleScriptUrl, records]);

  /* =========================
      SYNC CORE
  ========================= */
  const syncRecordToSheet = async (
    record: RepairRecord,
    imgs?: string[],
    startIdx = 0,
    hashes?: string[]
  ) => {
    try {
      const res = await fetch(settings.googleScriptUrl!, {
        method: 'POST',
        body: JSON.stringify({
          id: record.id,
          containerNumber: record.containerNumber,
          team: record.teamName,
          images: imgs || record.images,
          startIdx,
          imageHashes: hashes || [],
          editor: user?.username,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  /* =========================
      SAVE DATA
  ========================= */
  const handleSaveData = async () => {
    if (!isFormComplete) return;
    setIsSubmitting(true);

    const hashes = await Promise.all(images.map(getImageHash));

    const record: RepairRecord = {
      id: Date.now().toString(),
      containerNumber: containerNum,
      teamId: selectedTeamId,
      teamName: teams.find(t => t.id === selectedTeamId)?.name || '',
      images,
      timestamp: Date.now(),
      status: 'pending',
      uploadedCount: 0,
      imageHashes: hashes,
    };

    await dbService.saveRecord(record);
    setRecords(r => [record, ...r]);

    setImages([]);
    setContainerNum('');
    setActiveStep(1);
    setIsSubmitting(false);

    if (!settings.googleScriptUrl) return;

    const ok = await syncRecordToSheet(record, undefined, 0, hashes);

    if (ok) {
      const synced = { ...record, status: 'synced', uploadedCount: images.length };
      await dbService.saveRecord(synced);
      setRecords(r => r.map(x => (x.id === record.id ? synced : x)));
    }
  };

  /* =========================
      RETRY
  ========================= */
  const handleRetry = async (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    const startIdx = record.uploadedCount || 0;
    const imgs = record.images.slice(startIdx);
    const hashes = record.imageHashes?.slice(startIdx) || [];

    if (imgs.length === 0) {
      const done = { ...record, status: 'synced' };
      await dbService.saveRecord(done);
      setRecords(r => r.map(x => (x.id === id ? done : x)));
      return;
    }

    const ok = await syncRecordToSheet(record, imgs, startIdx, hashes);

    if (ok) {
      const done = {
        ...record,
        status: 'synced',
        uploadedCount: record.images.length,
      };
      await dbService.saveRecord(done);
      setRecords(r => r.map(x => (x.id === id ? done : x)));
    } else {
      const err = { ...record, status: 'error' };
      await dbService.saveRecord(err);
      setRecords(r => r.map(x => (x.id === id ? err : x)));
    }
  };

  /* =========================
      AUTH
  ========================= */
  if (!user) return <Login onLogin={u => setUser(u)} />;

  const pendingCount = records.filter(
    r => r.status === 'error' || r.status === 'pending'
  ).length;

  /* =========================
      RENDER
  ========================= */
  return (
    <div className="h-screen flex flex-col">
      <Header />

      {activeTab === 'history' ? (
        <HistoryList
          records={records}
          teams={teams}
          onRetry={handleRetry}
          onDelete={id => dbService.deleteRecord(id)}
          onUpdateRecord={() => {}}
        />
      ) : (
        <div className="flex-1 p-4 space-y-4">
          <ContainerInput value={containerNum} onChange={setContainerNum} />
          <TeamSelector
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelect={setSelectedTeamId}
          />
          <CameraCapture images={images} onAddImage={async i => {
            const c = await compressImage(i);
            setImages(p => [...p, c]);
          }} />
        </div>
      )}

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

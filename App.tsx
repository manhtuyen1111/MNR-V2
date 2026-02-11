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
import { dbService } from './utils';
import { Check, AlertTriangle, Send, Loader2, WifiOff, ShieldAlert, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState<TabView>('capture');

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved
      ? JSON.parse(saved)
      : {
          googleScriptUrl:
            'https://script.google.com/macros/s/AKfycbzbjPA2yD7YcpZXNCeD20f8aI8mD9-XczQdq-sqDbbgJCUWFmpdUDvDeQ96kpashwLm/exec',
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
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

  const [records, setRecords] = useState<RepairRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    if (user?.assignedTeamId) {
      setSelectedTeamId(user.assignedTeamId);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      const savedRecords = await dbService.getAllRecords();
      setRecords(savedRecords);
      setIsLoadingRecords(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('repairTeams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete =
    isContainerValid && isTeamSelected && images.length > 0;

  const handleAddImage = (imgData: string) => {
    setImages((prev) => [...prev, imgData]);
  };

  const handleLogin = (u: User) => {
    localStorage.setItem('currentUser', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
    setToast({ message: 'Đã lưu cấu hình', type: 'success' });
  };

  const syncRecordToSheet = async (
    record: RepairRecord,
    specificImages?: string[],
    startIdx: number = 0
  ): Promise<boolean> => {
    if (!settings.googleScriptUrl) return false;

    try {
      const imagesToSend = specificImages || record.images;

      const payload = {
        id: record.id,
        timestamp: new Date(record.timestamp).toISOString(),
        containerNumber: record.containerNumber,
        team: record.teamName,
        images: imagesToSend,
        startIdx,
        editor: user?.username || 'unknown',
      };

      const response = await fetch(settings.googleScriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSaveData = async () => {
    if (!isFormComplete) return;

    setIsSubmitting(true);

    const teamName =
      teams.find((t) => t.id === selectedTeamId)?.name || 'Unknown';

    const newRecord: RepairRecord = {
      id: Date.now().toString(),
      containerNumber: containerNum,
      teamId: selectedTeamId,
      teamName,
      images,
      timestamp: Date.now(),
      status: 'pending',
      uploadedCount: 0,
    };

    await dbService.saveRecord(newRecord);
    setRecords((prev) => [newRecord, ...prev]);

    setContainerNum('');
    setImages([]);
    setSelectedTeamId(user?.assignedTeamId || '');
    setActiveStep(1);
    setIsSubmitting(false);

    if (!settings.googleScriptUrl) {
      setToast({ message: 'Đã lưu offline', type: 'warning' });
      return;
    }

    setToast({ message: 'Đang gửi ngầm...', type: 'info' });

    const success = await syncRecordToSheet(newRecord);

    const updated = {
      ...newRecord,
      status: success ? 'synced' : 'error',
      uploadedCount: success ? newRecord.images.length : 0,
    };

    await dbService.saveRecord(updated);
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleRetry = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;

    const success = await syncRecordToSheet(record);

    const updated = {
      ...record,
      status: success ? 'synced' : 'error',
      uploadedCount: success ? record.images.length : 0,
    };

    await dbService.saveRecord(updated);
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? updated : r))
    );
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const pendingCount = records.filter(
    (r) => r.status === 'error' || r.status === 'pending'
  ).length;

  return (
    <div className="h-[100dvh] bg-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 overflow-hidden">
        {activeTab === 'capture' && (
          <div className="p-4 space-y-4">
            <ContainerInput
              value={containerNum}
              onChange={setContainerNum}
              isValid={isContainerValid}
              isActive
              isCompleted={isContainerValid}
              isDisabled={false}
              onFocus={() => {}}
            />

            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onSelect={setSelectedTeamId}
              onManageTeams={() => setIsTeamManagerOpen(true)}
              isActive
              isCompleted={isTeamSelected}
              isDisabled={!isContainerValid}
              onFocus={() => {}}
              assignedTeamId={user.assignedTeamId}
              userRole={user.role}
            />

            <CameraCapture
              images={images}
              onAddImage={handleAddImage}
              onRemoveImage={(idx) =>
                setImages((prev) =>
                  prev.filter((_, i) => i !== idx)
                )
              }
              isActive
              isCompleted={images.length > 0}
              isDisabled={!isTeamSelected}
              onFocus={() => {}}
            />

            {isFormComplete && (
              <button
                onClick={handleSaveData}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ĐANG LƯU...
                  </>
                ) : (
                  <>
                    HOÀN TẤT LƯU
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryList
            records={records}
            teams={teams}
            onRetry={handleRetry}
            onDelete={() => {}}
            onUpdateRecord={() => {}}
          />
        )}

        {activeTab === 'settings' && user.role === 'admin' && (
          <Settings settings={settings} onSave={handleSaveSettings} />
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

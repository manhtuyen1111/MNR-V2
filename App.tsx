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
import { Check, AlertTriangle, Send, Loader2, WifiOff, ShieldAlert, Zap } from 'lucide-react';

/* ================= IMAGE HASH ================= */

async function getImageHash(base64: string): Promise<string> {
  try {
    const binary = atob(base64.split(',')[1]);
    const arrayBuffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arrayBuffer[i] = binary.charCodeAt(i);
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error calculating image hash:', err);
    return '';
  }
}

/* ================= APP ================= */

const App: React.FC = () => {

  /* ================= AUTH ================= */

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData: User) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  /* ================= STATE ================= */

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

  /* ================= VALIDATION ================= */

  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete = isContainerValid && isTeamSelected && images.length > 0;

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (user.assignedTeamId) {
      setSelectedTeamId(user.assignedTeamId);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedRecords = await dbService.getAllRecords();
        setRecords(savedRecords);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingRecords(false);
      }
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

  /* ================= HANDLERS ================= */

  const handleAddImage = async (imgData: string) => {
    const compressed = await compressImage(imgData);
    setImages(prev => [...prev, compressed]);
  };

  const handleSelectTeam = (id: string) => {
    if (user.assignedTeamId && id !== user.assignedTeamId) return;
    setSelectedTeamId(id);
  };

  const handleSaveData = async () => {
    if (!isFormComplete) return;

    setIsSubmitting(true);

    try {
      const imageHashes = await Promise.all(images.map(img => getImageHash(img)));

      const newRecord: RepairRecord = {
        id: Date.now().toString(),
        containerNumber: containerNum,
        teamId: selectedTeamId,
        teamName:
          teams.find(t => t.id === selectedTeamId)?.name || 'Unknown',
        images,
        timestamp: Date.now(),
        status: 'pending',
        uploadedCount: 0,
        imageHashes,
      };

      await dbService.saveRecord(newRecord);
      setRecords(prev => [newRecord, ...prev]);

      setContainerNum('');
      setImages([]);
      setActiveStep(1);

      setToast({ message: 'Đã lưu thành công!', type: 'success' });

    } catch (err) {
      console.error(err);
      setToast({ message: 'Lỗi khi lưu dữ liệu', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= RENDER ================= */

  const pendingCount = records.filter(
    r => r.status === 'error' || r.status === 'pending'
  ).length;

  return (
    <div className="h-[100dvh] bg-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto overflow-hidden">

        {toast && (
          <div className="absolute top-4 left-4 right-4 z-50">
            <div className="px-4 py-3 rounded-xl shadow text-white bg-blue-600 flex items-center gap-2">
              {toast.type === 'success' && <Check />}
              {toast.type === 'error' && <AlertTriangle />}
              {toast.type === 'info' && <Zap />}
              {toast.type === 'warning' && <WifiOff />}
              {toast.message}
            </div>
          </div>
        )}

        {activeTab === 'capture' && (
          <div className="flex-1 flex flex-col px-4 py-4 space-y-4 overflow-y-auto">
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
              onSelect={handleSelectTeam}
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
              onRemoveImage={(idx) =>
                setImages(prev => prev.filter((_, i) => i !== idx))
              }
              isActive={activeStep === 3}
              isCompleted={images.length > 0}
              isDisabled={!isTeamSelected}
              onFocus={() => setActiveStep(3)}
            />

            {isFormComplete && (
              <button
                onClick={handleSaveData}
                disabled={isSubmitting}
                className="bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                LƯU
              </button>
            )}
          </div>
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

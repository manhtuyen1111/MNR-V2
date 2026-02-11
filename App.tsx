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

const App: React.FC = () => {

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState<TabView>('capture');

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      googleScriptUrl: 'https://script.google.com/macros/s/AKfycbzbjPA2yD7YcpZXNCeD20f8aI8mD9-XczQdq-sqDbbgJCUWFmpdUDvDeQ96kpashwLm/exec'
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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  useEffect(() => {
    if (user?.assignedTeamId) {
      setSelectedTeamId(user.assignedTeamId);
    }
  }, [user]);

  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete = isContainerValid && isTeamSelected && images.length > 0;

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

  const handleLogin = (userData: User) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const handleAddImage = async (imgData: string) => {
    const compressed = await compressImage(imgData);
    setImages(prev => [...prev, compressed]);
  };

  // 🚀 PARALLEL UPLOAD VERSION
  const syncRecordToSheet = async (
    record: RepairRecord,
    specificImages?: string[],
    startIdx: number = 0,
    imageHashes?: string[]
  ): Promise<boolean> => {

    if (!settings.googleScriptUrl) return false;

    try {
      const imagesToSend = specificImages || record.images;
      const hashesToSend =
        imageHashes || record.imageHashes?.slice(startIdx) || [];

      const uploadPromises = imagesToSend.map((img, index) => {
        const payload = {
          id: record.id,
          timestamp: new Date(record.timestamp).toISOString(),
          containerNumber: record.containerNumber,
          team: record.teamName,
          images: [img],
          startIdx: startIdx + index,
          imageHashes: [hashesToSend[index]],
          editor: user?.username || 'unknown'
        };

        return fetch(settings.googleScriptUrl, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      });

      const responses = await Promise.all(uploadPromises);
      return responses.every(res => res.ok);

    } catch (error) {
      console.error("Parallel upload error:", error);
      return false;
    }
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
        teamName: teams.find(t => t.id === selectedTeamId)?.name || 'Unknown',
        images,
        timestamp: Date.now(),
        status: 'pending',
        uploadedCount: 0,
        imageHashes
      };

      await dbService.saveRecord(newRecord);
      setRecords(prev => [newRecord, ...prev]);

      setContainerNum('');
      setImages([]);
      setActiveStep(1);

      setIsSubmitting(false);

      syncRecordToSheet(newRecord, undefined, 0, imageHashes).then(async (success) => {
        const updated = {
          ...newRecord,
          status: success ? 'synced' : 'error',
          uploadedCount: success ? newRecord.images.length : 0
        };
        await dbService.saveRecord(updated);
        setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      });

    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto p-4">
        <ContainerInput value={containerNum} onChange={setContainerNum} isValid={isContainerValid} isActive={true} isCompleted={isContainerValid} isDisabled={false} onFocus={() => {}} />
        <TeamSelector teams={teams} selectedTeamId={selectedTeamId} onSelect={setSelectedTeamId} onManageTeams={() => setIsTeamManagerOpen(true)} isActive={true} isCompleted={isTeamSelected} isDisabled={false} onFocus={() => {}} assignedTeamId={user.assignedTeamId} userRole={user.role} />
        <CameraCapture images={images} onAddImage={handleAddImage} onRemoveImage={(i) => setImages(prev => prev.filter((_, idx) => idx !== i))} isActive={true} isCompleted={images.length > 0} isDisabled={false} onFocus={() => {}} />

        {isFormComplete && (
          <button onClick={handleSaveData} disabled={isSubmitting} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl">
            {isSubmitting ? 'ĐANG LƯU...' : 'HOÀN TẤT LƯU'}
          </button>
        )}
      </main>
      <BottomNav currentTab={activeTab} onChangeTab={setActiveTab} pendingCount={0} userRole={user.role} />
    </div>
  );
};

export default App;

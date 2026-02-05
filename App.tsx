import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ContainerInput from './components/ContainerInput';
import TeamSelector from './components/TeamSelector';
import CameraCapture from './components/CameraCapture';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';
import HistoryList from './components/HistoryList';
import { TabView, Team, AppSettings, RepairRecord } from './types';
import { REPAIR_TEAMS } from './constants';
import { compressImage } from './utils';
import { Check, AlertTriangle, Send, Loader2, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('capture');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
     const saved = localStorage.getItem('appSettings');
     return saved ? JSON.parse(saved) : { googleScriptUrl: '' };
  });

  // Data State
  const [teams, setTeams] = useState<Team[]>(REPAIR_TEAMS);
  const [containerNum, setContainerNum] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Records State (Offline First)
  const [records, setRecords] = useState<RepairRecord[]>(() => {
      const saved = localStorage.getItem('repairRecords');
      return saved ? JSON.parse(saved) : [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isFormComplete = isContainerValid && selectedTeamId !== '' && images.length > 0;
  
  // Persist records
  useEffect(() => {
      localStorage.setItem('repairRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
     if (toast) {
         const timer = setTimeout(() => setToast(null), 3000);
         return () => clearTimeout(timer);
     }
  }, [toast]);

  const handleSaveSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      setToast({ message: 'Đã lưu cấu hình!', type: 'success' });
      setActiveTab('capture');
  };

  const handleAddTeam = (name: string) => {
      const newTeam: Team = {
          id: `custom-${Date.now()}`,
          name: name,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          isCustom: true
      };
      setTeams([...teams, newTeam]);
      setSelectedTeamId(newTeam.id);
  };

  const handleAddImage = async (imgData: string) => {
      // Compress image before adding to state
      const compressed = await compressImage(imgData);
      setImages(prev => [...prev, compressed]);
  };

  const syncRecordToSheet = async (record: RepairRecord): Promise<boolean> => {
      if (!settings.googleScriptUrl) return false;
      try {
        const payload = {
            timestamp: new Date(record.timestamp).toISOString(),
            containerNumber: record.containerNumber,
            team: record.teamName,
            images: record.images,
        };
        await fetch(settings.googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return true;
      } catch (e) {
        console.error("Sync error", e);
        return false;
      }
  };

  const handleSaveData = async () => {
    if (!isFormComplete) return;
    
    setIsSubmitting(true);

    const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Unknown';
    const newRecord: RepairRecord = {
        id: Date.now().toString(),
        containerNumber: containerNum,
        teamId: selectedTeamId,
        teamName,
        images: images,
        timestamp: Date.now(),
        status: 'pending' // Default to pending
    };

    // 1. Save locally first (Optimistic UI)
    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);

    // Reset Form immediately
    setContainerNum('');
    setSelectedTeamId('');
    setImages([]);
    setActiveStep(1);

    // 2. Try to Sync
    if (!settings.googleScriptUrl) {
        setToast({ message: 'Đã lưu offline (Chưa cấu hình URL)', type: 'warning' });
        setIsSubmitting(false);
        return;
    }

    try {
        const success = await syncRecordToSheet(newRecord);
        if (success) {
            setRecords(prev => prev.map(r => r.id === newRecord.id ? { ...r, status: 'synced' } : r));
            setToast({ message: 'Đã lưu và gửi dữ liệu thành công!', type: 'success' });
        } else {
             setRecords(prev => prev.map(r => r.id === newRecord.id ? { ...r, status: 'error' } : r));
             setToast({ message: 'Gửi thất bại. Đã lưu offline.', type: 'warning' });
        }
    } catch (error) {
         setRecords(prev => prev.map(r => r.id === newRecord.id ? { ...r, status: 'error' } : r));
         setToast({ message: 'Lỗi mạng. Đã lưu offline.', type: 'warning' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRetry = async (id: string) => {
      const record = records.find(r => r.id === id);
      if (!record || !settings.googleScriptUrl) return;

      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' } : r));
      setToast({ message: 'Đang thử gửi lại...', type: 'warning' });

      const success = await syncRecordToSheet(record);
      if (success) {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'synced' } : r));
        setToast({ message: 'Gửi lại thành công!', type: 'success' });
      } else {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'error' } : r));
        setToast({ message: 'Vẫn chưa gửi được.', type: 'error' });
      }
  };

  const handleDeleteRecord = (id: string) => {
      if (window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) {
          setRecords(prev => prev.filter(r => r.id !== id));
      }
  };

  const pendingCount = records.filter(r => r.status === 'error' || r.status === 'pending').length;

  return (
    <div className="h-[100dvh] bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto">
        
        {toast && (
            <div className="absolute top-4 left-4 right-4 z-[100] animate-fadeIn">
                <div className={`px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 text-white font-bold text-sm ${
                    toast.type === 'success' ? 'bg-green-600' : 
                    toast.type === 'error' ? 'bg-red-600' : 'bg-orange-500'
                }`}>
                    {toast.type === 'success' ? <Check className="w-4 h-4" /> : 
                     toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <WifiOff className="w-4 h-4"/>}
                    <span>{toast.message}</span>
                </div>
            </div>
        )}

        {activeTab === 'capture' ? (
          <div className="flex-1 flex flex-col px-4 py-2 space-y-3 min-h-0">
            <div className="flex-1 flex flex-col space-y-3 min-h-0">
                <ContainerInput 
                    value={containerNum} 
                    onChange={setContainerNum}
                    isValid={isContainerValid}
                    isActive={activeStep === 1}
                    onFocus={() => setActiveStep(1)}
                />

                <TeamSelector 
                    teams={teams}
                    selectedTeamId={selectedTeamId}
                    onSelect={(id) => { setSelectedTeamId(id); setActiveStep(2); }}
                    onAddTeam={handleAddTeam}
                    isActive={activeStep === 2}
                    onFocus={() => setActiveStep(2)}
                />

                <CameraCapture 
                    images={images}
                    onAddImage={handleAddImage}
                    onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))}
                    isActive={activeStep === 3}
                    onFocus={() => setActiveStep(3)}
                />
            </div>

            <div className="shrink-0 pb-20 pt-2">
                 <button
                    onClick={handleSaveData}
                    disabled={!isFormComplete || isSubmitting}
                    className={`
                        w-full flex items-center justify-center space-x-2 h-14 rounded-xl font-black text-base shadow-lg transition-all transform
                        ${isFormComplete 
                            ? 'bg-sky-700 text-white shadow-sky-700/30 hover:bg-sky-800 active:scale-[0.98]' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}
                    `}
                 >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            <span>LƯU DỮ LIỆU</span>
                        </>
                    )}
                 </button>
            </div>
          </div>
        ) : activeTab === 'history' ? (
            <div className="flex-1 overflow-y-auto">
                <HistoryList records={records} onRetry={handleRetry} onDelete={handleDeleteRecord} />
            </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
             <Settings settings={settings} onSave={handleSaveSettings} />
          </div>
        )}
      </main>

      <BottomNav currentTab={activeTab} onChangeTab={setActiveTab} pendingCount={pendingCount} />
    </div>
  );
};

export default App;
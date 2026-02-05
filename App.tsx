import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ContainerInput from './components/ContainerInput';
import TeamSelector from './components/TeamSelector';
import CameraCapture from './components/CameraCapture';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';
import HistoryList from './components/HistoryList';
import TeamManager from './components/TeamManager';
import { TabView, Team, AppSettings, RepairRecord } from './types';
import { REPAIR_TEAMS } from './constants';
import { compressImage } from './utils';
import { Check, AlertTriangle, Send, Loader2, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('capture');
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
     const saved = localStorage.getItem('appSettings');
     return saved ? JSON.parse(saved) : { googleScriptUrl: '' };
  });

  // Data State
  const [teams, setTeams] = useState<Team[]>(() => {
      const saved = localStorage.getItem('repairTeams');
      return saved ? JSON.parse(saved) : REPAIR_TEAMS;
  });
  
  const [containerNum, setContainerNum] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Flow State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

  // Validation
  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete = isContainerValid && isTeamSelected && images.length > 0;
  
  // Records State (Offline First)
  const [records, setRecords] = useState<RepairRecord[]>(() => {
      const saved = localStorage.getItem('repairRecords');
      return saved ? JSON.parse(saved) : [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // Persist Data
  useEffect(() => {
      localStorage.setItem('repairRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
      localStorage.setItem('repairTeams', JSON.stringify(teams));
  }, [teams]);

  // Auto Advance Steps Logic
  useEffect(() => {
      if (activeStep === 1 && isContainerValid) {
          // Add small delay for user to see the "Check"
          const timer = setTimeout(() => setActiveStep(2), 500);
          return () => clearTimeout(timer);
      }
  }, [containerNum, isContainerValid]);

  const handleSelectTeam = (id: string) => {
      setSelectedTeamId(id);
      setTimeout(() => setActiveStep(3), 300);
  };

  const handleStepClick = (step: 1 | 2 | 3) => {
      // Logic for clicking steps manually
      if (step === 1) {
          setActiveStep(1);
      } else if (step === 2) {
          if (isContainerValid) setActiveStep(2);
      } else if (step === 3) {
          if (isContainerValid && isTeamSelected) setActiveStep(3);
      }
  };

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

  const handleAddImage = async (imgData: string) => {
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

    // 1. Save locally
    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);

    // Reset Form
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
    <div className="h-[100dvh] bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto">
        
        {/* Toast Notification */}
        {toast && (
            <div className="absolute top-4 left-4 right-4 z-[100] animate-fadeIn">
                <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-white font-bold text-sm border border-white/20 backdrop-blur-md ${
                    toast.type === 'success' ? 'bg-green-600/95' : 
                    toast.type === 'error' ? 'bg-red-600/95' : 'bg-orange-500/95'
                }`}>
                    {toast.type === 'success' ? <Check className="w-5 h-5" /> : 
                     toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <WifiOff className="w-5 h-5"/>}
                    <span className="drop-shadow-sm">{toast.message}</span>
                </div>
            </div>
        )}

        {/* Team Manager Modal */}
        {isTeamManagerOpen && (
            <TeamManager 
                teams={teams}
                onUpdateTeams={setTeams}
                onClose={() => setIsTeamManagerOpen(false)}
            />
        )}

        {activeTab === 'capture' ? (
          <div className="flex-1 flex flex-col px-4 py-4 space-y-4 min-h-0 overflow-y-auto pb-24">
                
                {/* STEP 1: CONTAINER */}
                <ContainerInput 
                    value={containerNum} 
                    onChange={setContainerNum}
                    isValid={isContainerValid}
                    isActive={activeStep === 1}
                    isCompleted={isContainerValid}
                    isDisabled={false} // Step 1 is never disabled
                    onFocus={() => handleStepClick(1)}
                />

                {/* STEP 2: TEAM */}
                <TeamSelector 
                    teams={teams}
                    selectedTeamId={selectedTeamId}
                    onSelect={handleSelectTeam}
                    onManageTeams={() => setIsTeamManagerOpen(true)}
                    isActive={activeStep === 2}
                    isCompleted={isTeamSelected}
                    isDisabled={!isContainerValid} // Disable if Step 1 invalid
                    onFocus={() => handleStepClick(2)}
                />

                {/* STEP 3: CAMERA */}
                <CameraCapture 
                    images={images}
                    onAddImage={handleAddImage}
                    onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))}
                    isActive={activeStep === 3}
                    isCompleted={images.length > 0}
                    isDisabled={!isTeamSelected} // Disable if Step 2 not selected
                    onFocus={() => handleStepClick(3)}
                />

                <div className="pt-2">
                     <button
                        onClick={handleSaveData}
                        disabled={!isFormComplete || isSubmitting}
                        className={`
                            w-full flex items-center justify-center space-x-2 h-16 rounded-2xl font-black text-lg shadow-xl transition-all transform duration-300
                            ${isFormComplete 
                                ? 'bg-gradient-to-r from-sky-700 to-blue-800 text-white shadow-sky-900/20 scale-100 cursor-pointer hover:scale-[1.02]' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none scale-95 opacity-50'}
                        `}
                     >
                        {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                <span>HOÀN THÀNH & LƯU</span>
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
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
import { Check, AlertTriangle, Send, Loader2, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>('capture');
  
  // Settings (Small data -> Keep in LocalStorage)
  const [settings, setSettings] = useState<AppSettings>(() => {
     const saved = localStorage.getItem('appSettings');
     return saved ? JSON.parse(saved) : { googleScriptUrl: '' };
  });

  // Teams (Small data -> Keep in LocalStorage)
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

  // Records State (Large data -> Use IndexedDB)
  const [records, setRecords] = useState<RepairRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // --- CHECK LOGIN SESSION (Optional persistence) ---
  // For now, we require login on refresh as per typical industry app security or just keep in memory.
  // We won't persist user to localStorage to ensure security unless requested.

  // --- USER TEAM LOCK LOGIC ---
  useEffect(() => {
      if (user && user.assignedTeamId) {
          setSelectedTeamId(user.assignedTeamId);
          // If a team is assigned, auto move to step 3 IF container is valid
          if (/^[A-Z]{4}\d{7}$/.test(containerNum)) {
               // Logic handled in auto-advance effect below
          }
      } else {
          // If logging out or changing users (not implemented but good practice), reset team selection if needed
          // But here we keep selectedTeamId if user is admin
      }
  }, [user]);

  // Validation
  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isTeamSelected = selectedTeamId !== '';
  const isFormComplete = isContainerValid && isTeamSelected && images.length > 0;

  // Load Records from IndexedDB on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedRecords = await dbService.getAllRecords();
        setRecords(savedRecords);
      } catch (err) {
        console.error("Failed to load records from DB", err);
      } finally {
        setIsLoadingRecords(false);
      }
    };
    loadData();
  }, []);

  // Persist Teams & Settings (LocalStorage)
  useEffect(() => {
      localStorage.setItem('repairTeams', JSON.stringify(teams));
  }, [teams]);

  // Auto Advance Steps Logic
  useEffect(() => {
      if (activeStep === 1 && isContainerValid) {
          const timer = setTimeout(() => setActiveStep(2), 400);
          return () => clearTimeout(timer);
      }
  }, [containerNum, isContainerValid]);

  // Auto Advance from Team to Camera
  useEffect(() => {
      if (activeStep === 2 && isTeamSelected) {
           // If user has assigned team, they might skip this step visually, 
           // but logically we wait for container to be valid first.
           const timer = setTimeout(() => setActiveStep(3), 400);
           return () => clearTimeout(timer);
      }
  }, [selectedTeamId, activeStep, isTeamSelected]);

  const handleSelectTeam = (id: string) => {
      if (user?.assignedTeamId && id !== user.assignedTeamId) return; // Prevent selection if locked
      setSelectedTeamId(id);
  };

  const handleStepClick = (step: 1 | 2 | 3) => {
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
            id: record.id,
            timestamp: new Date(record.timestamp).toISOString(),
            containerNumber: record.containerNumber,
            team: record.teamName,
            images: record.images,
            editor: user?.username || 'unknown' // Track who edited
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
    
    try {
        const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Unknown';
        
        // Construct new record
        const newRecord: RepairRecord = {
            id: Date.now().toString(),
            containerNumber: containerNum,
            teamId: selectedTeamId,
            teamName,
            images: images,
            timestamp: Date.now(),
            status: 'pending' // Default to pending
        };

        // 1. Save to IndexedDB
        await dbService.saveRecord(newRecord);
        setRecords(prev => [...prev, newRecord]);

        // Reset Form
        setContainerNum('');
        // Do NOT reset team if assigned
        if (!user?.assignedTeamId) {
            setSelectedTeamId('');
        }
        setImages([]);
        setActiveStep(1);

        // 2. Sync
        if (!settings.googleScriptUrl) {
            setToast({ message: 'Đã lưu offline (Chưa cấu hình URL)', type: 'warning' });
            setIsSubmitting(false);
            return;
        }

        try {
            const success = await syncRecordToSheet(newRecord);
            if (success) {
                const syncedRecord = { ...newRecord, status: 'synced' as const };
                await dbService.saveRecord(syncedRecord);
                setRecords(prev => prev.map(r => r.id === newRecord.id ? syncedRecord : r));
                setToast({ message: 'Đã lưu và gửi dữ liệu thành công!', type: 'success' });
            } else {
                const errorRecord = { ...newRecord, status: 'error' as const };
                await dbService.saveRecord(errorRecord);
                setRecords(prev => prev.map(r => r.id === newRecord.id ? errorRecord : r));
                setToast({ message: 'Gửi thất bại. Đã lưu offline.', type: 'warning' });
            }
        } catch (error) {
             const errorRecord = { ...newRecord, status: 'error' as const };
             await dbService.saveRecord(errorRecord);
             setRecords(prev => prev.map(r => r.id === newRecord.id ? errorRecord : r));
             setToast({ message: 'Lỗi mạng. Đã lưu offline.', type: 'warning' });
        }
    } catch (criticalError) {
        console.error("CRITICAL SAVE ERROR", criticalError);
        setToast({ message: 'Lỗi nghiêm trọng: Không thể lưu dữ liệu', type: 'error' });
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
        const updated = { ...record, status: 'synced' as const };
        await dbService.saveRecord(updated);
        setRecords(prev => prev.map(r => r.id === id ? updated : r));
        setToast({ message: 'Gửi lại thành công!', type: 'success' });
      } else {
        const updated = { ...record, status: 'error' as const };
        await dbService.saveRecord(updated);
        setRecords(prev => prev.map(r => r.id === id ? updated : r));
        setToast({ message: 'Vẫn chưa gửi được.', type: 'error' });
      }
  };

  const handleDeleteRecord = async (id: string) => {
      if (window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) {
          await dbService.deleteRecord(id);
          setRecords(prev => prev.filter(r => r.id !== id));
      }
  };

  // Called when adding photos to an existing history record
  const handleUpdateRecord = async (updatedRecord: RepairRecord) => {
      try {
          // Update DB
          await dbService.saveRecord(updatedRecord);
          // Update State
          setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
          
          // Try to sync update
          if (settings.googleScriptUrl) {
              const success = await syncRecordToSheet(updatedRecord);
              if (success) {
                   const finalRecord = { ...updatedRecord, status: 'synced' as const };
                   await dbService.saveRecord(finalRecord);
                   setRecords(prev => prev.map(r => r.id === updatedRecord.id ? finalRecord : r));
              } else {
                  // Keep as pending/error if failed
                   const errorRecord = { ...updatedRecord, status: 'error' as const };
                   await dbService.saveRecord(errorRecord);
                   setRecords(prev => prev.map(r => r.id === updatedRecord.id ? errorRecord : r));
              }
          }
      } catch (e) {
          console.error("Failed to update record", e);
      }
  };

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!user) {
      return <Login onLogin={setUser} />;
  }

  const pendingCount = records.filter(r => r.status === 'error' || r.status === 'pending').length;

  return (
    <div className="h-[100dvh] bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden select-none">
      <Header />
      
      {/* User Info Bar */}
      <div className="bg-slate-800 text-white px-4 py-1 text-xs font-bold flex justify-between items-center shadow-md z-30">
          <span>Xin chào, {user.name}</span>
          <button onClick={() => setUser(null)} className="text-sky-300 hover:text-white transition-colors">Đăng xuất</button>
      </div>

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

        {/* Team Manager Modal (Only allow for admins or unassigned users if strictly needed, but logic here allows admin/qc) */}
        {isTeamManagerOpen && (
            <TeamManager 
                teams={teams}
                onUpdateTeams={setTeams}
                onClose={() => setIsTeamManagerOpen(false)}
            />
        )}

        {activeTab === 'capture' ? (
          <div className="flex-1 flex flex-col px-4 py-4 space-y-5 min-h-0 overflow-y-auto pb-32 scrollbar-hide">
                
                {/* STEP 1: CONTAINER */}
                <ContainerInput 
                    value={containerNum} 
                    onChange={setContainerNum}
                    isValid={isContainerValid}
                    isActive={activeStep === 1}
                    isCompleted={isContainerValid}
                    isDisabled={false} 
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
                    isDisabled={!isContainerValid}
                    onFocus={() => handleStepClick(2)}
                    assignedTeamId={user.assignedTeamId}
                />

                {/* STEP 3: CAMERA */}
                <CameraCapture 
                    images={images}
                    onAddImage={handleAddImage}
                    onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))}
                    isActive={activeStep === 3}
                    isCompleted={images.length > 0}
                    isDisabled={!isTeamSelected}
                    onFocus={() => handleStepClick(3)}
                />
          </div>
        ) : activeTab === 'history' ? (
            <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50">
                {isLoadingRecords ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-xs">Đang tải dữ liệu...</span>
                    </div>
                ) : (
                    <HistoryList 
                        records={records} 
                        onRetry={handleRetry} 
                        onDelete={handleDeleteRecord} 
                        onUpdateRecord={handleUpdateRecord}
                    />
                )}
            </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
             <Settings settings={settings} onSave={handleSaveSettings} />
          </div>
        )}

        {/* Floating Action Button for Saving */}
        {activeTab === 'capture' && isFormComplete && (
            <div className="fixed bottom-24 right-4 z-40 animate-fadeIn">
                 <button
                    onClick={handleSaveData}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 bg-gradient-to-tr from-sky-600 to-blue-700 text-white px-6 py-4 rounded-2xl shadow-xl shadow-sky-900/30 hover:scale-105 active:scale-95 transition-all border-2 border-white/20"
                 >
                    {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            <span className="font-black text-lg">LƯU & XONG</span>
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Send className="w-5 h-5" />
                            </div>
                        </>
                    )}
                 </button>
            </div>
        )}

      </main>

      <BottomNav currentTab={activeTab} onChangeTab={setActiveTab} pendingCount={pendingCount} />
    </div>
  );
};

export default App;
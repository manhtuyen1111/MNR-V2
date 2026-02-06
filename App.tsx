
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

const App: React.FC = () => {
  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>('capture');
  
  // Settings (Small data -> Keep in LocalStorage)
  const [settings, setSettings] = useState<AppSettings>(() => {
     const saved = localStorage.getItem('appSettings');
     // Cập nhật link mặc định ban đầu
     return saved ? JSON.parse(saved) : { googleScriptUrl: 'https://script.google.com/macros/s/AKfycbxhbNED5rPbjHnMOtIRJtu6B86tLA59qfFKiqqeqwGBH7TX9kGKD3_3FJe_zgiNrT5l/exec' };
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
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning' | 'info'} | null>(null);

  // --- USER TEAM LOCK LOGIC ---
  useEffect(() => {
      if (user && user.assignedTeamId) {
          setSelectedTeamId(user.assignedTeamId);
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
           const timer = setTimeout(() => setActiveStep(3), 400);
           return () => clearTimeout(timer);
      }
  }, [selectedTeamId, activeStep, isTeamSelected]);

  const handleSelectTeam = (id: string) => {
      if (user?.assignedTeamId && id !== user.assignedTeamId) return; 
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

  const syncRecordToSheet = async (record: RepairRecord, specificImages?: string[]): Promise<boolean> => {
      if (!settings.googleScriptUrl) return false;
      try {
        const payload = {
            id: record.id,
            timestamp: new Date(record.timestamp).toISOString(),
            containerNumber: record.containerNumber,
            team: record.teamName,
            images: specificImages || record.images, 
            editor: user?.username || 'unknown'
        };
        
        const response = await fetch(settings.googleScriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            return true;
        }
        return false;
      } catch (e) {
        console.error("Sync error", e);
        return false;
      }
  };

  const handleSaveData = async () => {
    if (!isFormComplete) return;
    
    // BLOCK UI ONLY FOR DB SAVE (FAST)
    setIsSubmitting(true);
    
    try {
        const systemTeamNames: Record<string, string> = {
            't1': 'TỔ 1',
            't2': 'TỔ 2',
            't3': 'TỔ 3',
            't4': 'TỔ 4'
        };
        const teamName = systemTeamNames[selectedTeamId] || teams.find(t => t.id === selectedTeamId)?.name || 'Unknown';
        
        const newRecord: RepairRecord = {
            id: Date.now().toString(),
            containerNumber: containerNum,
            teamId: selectedTeamId,
            teamName,
            images: images,
            timestamp: Date.now(),
            status: 'pending' 
        };

        // 1. SAVE TO LOCAL DB
        await dbService.saveRecord(newRecord);
        // Prepend to top of list
        setRecords(prev => [newRecord, ...prev]);

        // 2. RESET UI IMMEDIATELY
        setContainerNum('');
        setImages([]);
        setActiveStep(1);
        if (user?.assignedTeamId) {
            setSelectedTeamId(user.assignedTeamId);
        } else {
            setSelectedTeamId('');
        }

        // 3. UNBLOCK UI
        setIsSubmitting(false);

        // 4. BACKGROUND UPLOAD
        if (!settings.googleScriptUrl) {
            setToast({ message: 'Đã lưu offline (Chưa cấu hình URL)', type: 'warning' });
            return;
        }

        // Notify user but let them continue
        setToast({ message: 'Đã lưu! Đang gửi ngầm...', type: 'info' });

        // Trigger Sync asynchronously (Fire and Forget from UI perspective)
        syncRecordToSheet(newRecord).then(async (success) => {
            if (success) {
                const syncedRecord = { ...newRecord, status: 'synced' as const };
                await dbService.saveRecord(syncedRecord);
                setRecords(prev => prev.map(r => r.id === newRecord.id ? syncedRecord : r));
                // Optional: Silent success or small indicator, don't spam toast if user is typing
            } else {
                const errorRecord = { ...newRecord, status: 'error' as const };
                await dbService.saveRecord(errorRecord);
                setRecords(prev => prev.map(r => r.id === newRecord.id ? errorRecord : r));
                setToast({ message: 'Lỗi gửi ngầm. Đã lưu offline.', type: 'warning' });
            }
        }).catch(async () => {
             const errorRecord = { ...newRecord, status: 'error' as const };
             await dbService.saveRecord(errorRecord);
             setRecords(prev => prev.map(r => r.id === newRecord.id ? errorRecord : r));
        });

    } catch (criticalError) {
        console.error("CRITICAL SAVE ERROR", criticalError);
        setToast({ message: 'Lỗi nghiêm trọng: Không thể lưu dữ liệu', type: 'error' });
        setIsSubmitting(false);
    }
  };

  const handleRetry = async (id: string) => {
      const record = records.find(r => r.id === id);
      if (!record || !settings.googleScriptUrl) return;

      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' } : r));
      setToast({ message: 'Đang thử gửi lại...', type: 'warning' });

      // Non-blocking retry
      syncRecordToSheet(record).then(async (success) => {
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
      });
  };

  const handleDeleteRecord = async (id: string) => {
      if (window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) {
          await dbService.deleteRecord(id);
          setRecords(prev => prev.filter(r => r.id !== id));
      }
  };

  const handleUpdateRecord = async (updatedRecord: RepairRecord, newImagesOnly: string[] = []) => {
      try {
          await dbService.saveRecord(updatedRecord);
          setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
          
          if (newImagesOnly.length === 0) return;

          if (settings.googleScriptUrl) {
              setToast({ message: `Đang gửi ngầm ${newImagesOnly.length} ảnh...`, type: 'info' });
              
              // Non-blocking update
              syncRecordToSheet(updatedRecord, newImagesOnly).then(async (success) => {
                  if (success) {
                       const finalRecord = { ...updatedRecord, status: 'synced' as const };
                       await dbService.saveRecord(finalRecord);
                       setRecords(prev => prev.map(r => r.id === updatedRecord.id ? finalRecord : r));
                       setToast({ message: 'Đã bổ sung ảnh thành công!', type: 'success' });
                  } else {
                       const errorRecord = { ...updatedRecord, status: 'error' as const };
                       await dbService.saveRecord(errorRecord);
                       setRecords(prev => prev.map(r => r.id === updatedRecord.id ? errorRecord : r));
                       setToast({ message: 'Lỗi gửi ảnh bổ sung.', type: 'error' });
                  }
              });
          }
      } catch (e) {
          console.error("Failed to update record", e);
      }
  };

  if (!user) {
      return <Login onLogin={setUser} />;
  }

  const pendingCount = records.filter(r => r.status === 'error' || r.status === 'pending').length;

  return (
    <div className="h-[100dvh] bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden select-none">
      <Header />
      
      {/* User Info Bar */}
      <div className="bg-[#0f172a] text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex justify-between items-center shadow-lg z-30 border-b border-white/5">
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span>NHÂN VIÊN: {user.name}</span>
          </div>
          <button onClick={() => setUser(null)} className="text-sky-400 font-black hover:text-white transition-colors border-l border-white/10 pl-3">ĐĂNG XUẤT</button>
      </div>

      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto overflow-hidden">
        
        {/* Toast Notification */}
        {toast && (
            <div className="absolute top-4 left-4 right-4 z-[100] animate-fadeIn">
                <div className={`px-4 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 text-white font-black text-xs border border-white/10 backdrop-blur-xl ${
                    toast.type === 'success' ? 'bg-green-600/90' : 
                    toast.type === 'error' ? 'bg-red-600/90' : 
                    toast.type === 'info' ? 'bg-sky-600/90' : 'bg-orange-500/90'
                }`}>
                    {toast.type === 'success' ? <Check className="w-5 h-5" /> : 
                     toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : 
                     toast.type === 'info' ? <Zap className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5"/>}
                    <span className="uppercase tracking-tight">{toast.message}</span>
                </div>
            </div>
        )}

        {isTeamManagerOpen && (
            <TeamManager 
                teams={teams}
                onUpdateTeams={setTeams}
                onClose={() => setIsTeamManagerOpen(false)}
            />
        )}

        {activeTab === 'capture' ? (
          <div className="flex-1 flex flex-col px-4 py-4 space-y-5 min-h-0 overflow-y-auto pb-32 scrollbar-hide">
                <ContainerInput 
                    value={containerNum} 
                    onChange={setContainerNum}
                    isValid={isContainerValid}
                    isActive={activeStep === 1}
                    isCompleted={isContainerValid}
                    isDisabled={false} 
                    onFocus={() => handleStepClick(1)}
                />

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
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide bg-slate-50">
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
             {user.role === 'admin' ? (
                 <Settings settings={settings} onSave={handleSaveSettings} />
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-fadeIn">
                    <div className="bg-slate-200 p-6 rounded-full mb-6 shadow-inner border border-white">
                        <ShieldAlert className="w-16 h-16 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight">Quyền hạn hạn chế</h3>
                    <p className="text-sm mt-3 text-slate-500 max-w-[250px] leading-relaxed">
                        Chỉ tài khoản <span className="font-bold text-slate-800">Admin</span> mới được phép thay đổi cấu hình hệ thống.
                    </p>
                    <div className="mt-8 px-4 py-2 bg-slate-200/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-300/30">
                        User Role: {user.role.toUpperCase()}
                    </div>
                 </div>
             )}
          </div>
        )}

        {activeTab === 'capture' && isFormComplete && (
            <div className="fixed bottom-24 right-4 z-40 animate-fadeIn">
                 <button
                    onClick={handleSaveData}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 bg-gradient-to-tr from-sky-600 to-blue-700 text-white px-6 py-4.5 rounded-2xl shadow-2xl shadow-sky-900/40 hover:scale-105 active:scale-95 transition-all border-2 border-white/20"
                 >
                    {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            <span className="font-black text-lg uppercase tracking-tight">Hoàn tất lưu</span>
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Send className="w-5 h-5" />
                            </div>
                        </>
                    )}
                 </button>
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

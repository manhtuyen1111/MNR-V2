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
import { dbService } from './utils';
import { Check, AlertTriangle, Send, Loader2, WifiOff, ShieldAlert, Zap } from 'lucide-react';

// Hàm tính hash SHA-256 cho ảnh base64 (để tránh duplicate trên server)
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
  // --- AUTHENTICATION STATE ---
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
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning' | 'info'} | null>(null);

  useEffect(() => {
    if (user && user.assignedTeamId) {
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
        console.error("Failed to load records from DB", err);
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
    if (activeStep === 1 && isContainerValid) {
      const timer = setTimeout(() => setActiveStep(2), 400);
      return () => clearTimeout(timer);
    }
  }, [containerNum, isContainerValid]);

  useEffect(() => {
    if (activeStep === 2 && isTeamSelected) {
      const timer = setTimeout(() => setActiveStep(3), 400);
      return () => clearTimeout(timer);
    }
  }, [selectedTeamId, activeStep, isTeamSelected]);

  const handleLogin = (userData: User) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

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
 const handleAddImage = (imgData: string) => {
  setImages(prev => [...prev, imgData]);
  };

  const compressed = await compressImage(imgData);
  setImages(prev => [...prev, compressed]);
};
  // Hàm sync được cập nhật để gửi imageHashes
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

  // 🚀 Upload song song từng ảnh
  const uploadPromises = imagesToSend.map((img, index) => {
    const payload = {
      id: record.id,
      timestamp: new Date(record.timestamp).toISOString(),
      containerNumber: record.containerNumber,
      team: record.teamName,
      images: [img], // mỗi request chỉ 1 ảnh
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

    setIsSubmitting(true);

    try {
      const systemTeamNames: Record<string, string> = {
        't1': 'TỔ 1',
        't2': 'TỔ 2',
        't3': 'TỔ 3',
        't4': 'TỔ 4'
      };
      const teamName = systemTeamNames[selectedTeamId] || teams.find(t => t.id === selectedTeamId)?.name || 'Unknown';

      // Tính hash cho tất cả ảnh để tránh duplicate khi retry
      const imageHashes = await Promise.all(images.map(img => getImageHash(img)));

      const newRecord: RepairRecord = {
        id: Date.now().toString(),
        containerNumber: containerNum,
        teamId: selectedTeamId,
        teamName,
        images: images,
        timestamp: Date.now(),
        status: 'pending',
        uploadedCount: 0,
        imageHashes,                          // <-- Mới: lưu hashes vào record
      };

      await dbService.saveRecord(newRecord);
      setRecords(prev => [newRecord, ...prev]);

      setContainerNum('');
      setImages([]);
      setActiveStep(1);
      if (user?.assignedTeamId) {
        setSelectedTeamId(user.assignedTeamId);
      } else {
        setSelectedTeamId('');
      }

      setIsSubmitting(false);

      if (!settings.googleScriptUrl) {
        setToast({ message: 'Đã lưu offline (Chưa cấu hình URL)', type: 'warning' });
        return;
      }

      setToast({ message: 'Đã lưu! Đang gửi ngầm...', type: 'info' });

      syncRecordToSheet(newRecord, undefined, 0, imageHashes).then(async (success) => {
        if (success) {
          const syncedRecord = { ...newRecord, status: 'synced' as const, uploadedCount: newRecord.images.length };
          await dbService.saveRecord(syncedRecord);
          setRecords(prev => prev.map(r => r.id === newRecord.id ? syncedRecord : r));
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

    const startIdx = record.uploadedCount || 0;
    const imagesToSync = record.images.slice(startIdx);

    if (imagesToSync.length === 0) {
      const updated = { ...record, status: 'synced' as const };
      await dbService.saveRecord(updated);
      setRecords(prev => prev.map(r => r.id === id ? updated : r));
      setToast({ message: 'Dữ liệu đã đầy đủ. Cập nhật trạng thái.', type: 'success' });
      return;
    }

    // Lấy hoặc tính hashes cho phần ảnh cần retry
    let hashesToSync = record.imageHashes?.slice(startIdx) || [];
    if (hashesToSync.length !== imagesToSync.length) {
      hashesToSync = await Promise.all(imagesToSync.map(img => getImageHash(img)));
    }

    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' } : r));
    setToast({ message: `Đang gửi tiếp ${imagesToSync.length} ảnh...`, type: 'warning' });

    syncRecordToSheet(record, imagesToSync, startIdx, hashesToSync).then(async (success) => {
      if (success) {
        const updated = { 
          ...record, 
          status: 'synced' as const,
          uploadedCount: record.images.length
        };
        await dbService.saveRecord(updated);
        setRecords(prev => prev.map(r => r.id === id ? updated : r));
        setToast({ message: 'Gửi thành công!', type: 'success' });
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

        const startIdx = updatedRecord.images.length - newImagesOnly.length;

        // Tính hash cho ảnh mới
        const newHashes = await Promise.all(newImagesOnly.map(img => getImageHash(img)));

        syncRecordToSheet(updatedRecord, newImagesOnly, startIdx, newHashes).then(async (success) => {
          if (success) {
            const finalRecord = { 
              ...updatedRecord, 
              status: 'synced' as const,
              uploadedCount: updatedRecord.images.length,
              imageHashes: [...(updatedRecord.imageHashes || []), ...newHashes]
            };
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
    return <Login onLogin={handleLogin} />;
  }

  const pendingCount = records.filter(r => r.status === 'error' || r.status === 'pending').length;

  // Phần JSX return giữ nguyên như cũ của bạn
  return (
    <div className="h-[100dvh] bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden select-none">
      <Header />

      <div className="bg-[#0f172a] text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex justify-between items-center shadow-lg z-30 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>NHÂN VIÊN: {user.name}</span>
        </div>
        <button onClick={handleLogout} className="text-sky-400 font-black hover:text-white transition-colors border-l border-white/10 pl-3">ĐĂNG XUẤT</button>
      </div>

      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto overflow-hidden">

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

        {/* Phần còn lại của JSX giữ nguyên như code gốc của bạn */}
        {/* ... (từ {isTeamManagerOpen && ... đến hết return) */}
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
              userRole={user.role}
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
                teams={teams}
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
  <div className="fixed bottom-28 right-4 sm:right-6 z-50 animate-fadeIn">
    <button
      onClick={handleSaveData}
      disabled={isSubmitting}
      className={`
        flex items-center justify-center gap-3
        bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700
        text-white font-bold text-xl uppercase tracking-wider
        px-8 py-5 rounded-3xl
        shadow-2xl shadow-blue-900/50
        hover:shadow-2xl hover:shadow-blue-700/70 hover:scale-105
        active:scale-95 active:shadow-inner
        transition-all duration-200
        border-2 border-white/30
        disabled:opacity-70 disabled:cursor-not-allowed
        min-w-[220px]  // Đảm bảo nút không quá hẹp
      `}
    >
      {isSubmitting ? (
        <div className="flex items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span>ĐANG LƯU...</span>
        </div>
      ) : (
        <>
          <span>HOÀN TẤT LƯU</span>
          <Send className="w-7 h-7" />
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

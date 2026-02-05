import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ContainerInput from './components/ContainerInput';
import TeamSelector from './components/TeamSelector';
import CameraCapture from './components/CameraCapture';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';
import { TabView, Team, AppSettings } from './types';
import { REPAIR_TEAMS } from './constants';
import { Check, AlertTriangle, Send, Loader2 } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const isContainerValid = /^[A-Z]{4}\d{7}$/.test(containerNum);
  const isFormComplete = isContainerValid && selectedTeamId !== '' && images.length > 0;

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

  const handleSaveData = async () => {
    if (!isFormComplete) return;
    if (!settings.googleScriptUrl) {
        setToast({ message: 'Thiếu URL cấu hình!', type: 'error' });
        setActiveTab('settings');
        return;
    }
    setIsSubmitting(true);
    const payload = {
        timestamp: new Date().toISOString(),
        containerNumber: containerNum,
        team: teams.find(t => t.id === selectedTeamId)?.name || 'Unknown',
        images: images,
    };

    try {
        await fetch(settings.googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        setToast({ message: 'Lưu thành công!', type: 'success' });
        setContainerNum('');
        setSelectedTeamId('');
        setImages([]);
        setActiveStep(1);
    } catch (error) {
        setToast({ message: 'Lỗi gửi dữ liệu!', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    // Main Container: 100dvh for full mobile viewport without scroll
    <div className="h-[100dvh] bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto">
        
        {/* Toast */}
        {toast && (
            <div className="absolute top-4 left-4 right-4 z-[100] animate-fadeIn">
                <div className={`px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 text-white font-bold text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{toast.message}</span>
                </div>
            </div>
        )}

        {activeTab === 'capture' ? (
          <div className="flex-1 flex flex-col px-4 py-2 space-y-3 min-h-0">
            {/* Steps Container */}
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
                    onAddImage={(img) => setImages(prev => [...prev, img])}
                    onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))}
                    isActive={activeStep === 3}
                    onFocus={() => setActiveStep(3)}
                />
            </div>

            {/* Sticky Action Button inside Main */}
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
        ) : (
          <div className="flex-1 overflow-y-auto">
             <Settings settings={settings} onSave={handleSaveSettings} />
          </div>
        )}
      </main>

      <BottomNav currentTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

export default App;
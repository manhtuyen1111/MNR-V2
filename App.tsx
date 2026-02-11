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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAddImage = (imgData: string) => {
    setImages(prev => [...prev, imgData]);
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
        startIdx: startIdx,
        editor: user?.username || 'unknown'
      };

      const response = await fetch(settings.googleScriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return response.ok;

    } catch (e) {
      console.error("Sync error", e);
      return false;
    }
  };

  const handleSaveData = async () => {
    if (!isFormComplete) return;
    
    setIsSubmitting(true);

    const systemTeamNames: Record<string, string> = {
      't1': 'TỔ 1',
      't2': 'TỔ 2',
      't3': 'TỔ 3',
      't4': 'TỔ 4'
    };

    const teamName =
      systemTeamNames[selectedTeamId] ||
      teams.find(t => t.id === selectedTeamId)?.name ||
      'Unknown';

    const newRecord: RepairRecord = {
      id: Date.now().toString(),
      containerNumber: containerNum,
      teamId: selectedTeamId,
      teamName,
      images,
      timestamp: Date.now(),
      status: 'pending',
      uploadedCount: 0
    };

    await dbService.saveRecord(newRecord);
    setRecords(prev => [newRecord, ...prev]);

    setContainerNum('');
    setImages([]);
    setActiveStep(1);
    setSelectedTeamId(user?.assignedTeamId || '');

    setIsSubmitting(false);

    if (!settings.googleScriptUrl) {
      setToast({ message: 'Đã lưu offline', type: 'warning' });
      return;
    }

    setToast({ message: 'Đang gửi ngầm...', type: 'info' });

    const success = await syncRecordToSheet(newRecord);

    const updated: RepairRecord = {
      ...newRecord,
      status: success ? 'synced' as const : 'error' as const,
      uploadedCount: success ? newRecord.images.length : 0
    };

    await dbService.saveRecord(updated);
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleRetry = async (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record || !settings.googleScriptUrl) return;

    const startIdx = record.uploadedCount || 0;
    const imagesToSync = record.images.slice(startIdx);

    if (imagesToSync.length === 0) return;

    setRecords(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: 'pending' as const } : r
      )
    );

    const success = await syncRecordToSheet(record, imagesToSync, startIdx);

    const updated: RepairRecord = {
      ...record,
      status: success ? 'synced' as const : 'error' as const,
      uploadedCount: success ? record.images.length : record.uploadedCount
    };

    await dbService.saveRecord(updated);
    setRecords(prev => prev.map(r => r.id === id ? updated : r));
  };

  if (!user) return <Login onLogin={(u) => setUser(u)} />;

  return (
    <>
      {/* Giữ nguyên toàn bộ JSX gốc của bạn ở đây */}
    </>
  );
};

export default App;

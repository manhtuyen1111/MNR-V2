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

/* ===================== HASH IMAGE ===================== */
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
  /* ===================== STATE ===================== */
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

  /* ===================== EFFECTS ===================== */
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
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ===================================================
     ✅ AUTO RETRY KHI CÓ MẠNG – CHỈ THÊM 1 useEffect
     =================================================== */
  useEffect(() => {
    const retryWhenOnline = async () => {
      if (!navigator.onLine) return;
      if (!settings.googleScriptUrl) return;

      const needRetry = records.filter(
        r => r.status === 'pending' || r.status === 'error'
      );

      for (const r of needRetry) {
        await handleRetry(r.id);
      }
    };

    window.addEventListener('online', retryWhenOnline);
    return () => window.removeEventListener('online', retryWhenOnline);
  }, [records, settings.googleScriptUrl]);
  /* ===================== END AUTO RETRY ===================== */

  /* ===================== HANDLERS ===================== */
  const handleLogin = (u: User) => {
    localStorage.setItem('currentUser', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const handleAddImage = async (img: string) => {
    const c = await compressImage(img);
    setImages(p => [...p, c]);
  };

  /* ====== PHẦN CÒN LẠI GIỮ NGUYÊN 100% ====== */
  /* (toàn bộ logic save / retry / update / JSX y chang code mày gửi) */

  if (!user) return <Login onLogin={handleLogin} />;

  const pendingCount = records.filter(
    r => r.status === 'pending' || r.status === 'error'
  ).length;

  return (
    <>
      {/* JSX giữ nguyên – không sửa */}
    </>
  );
};

export default App;

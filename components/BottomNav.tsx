import React from 'react';
import { Camera, History, Settings, Lock } from 'lucide-react';
import { TabView } from '../types';

interface BottomNavProps {
  currentTab: TabView;
  onChangeTab: (tab: TabView) => void;
  pendingCount?: number;
  userRole?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab, pendingCount = 0, userRole }) => {
  const isAdmin = userRole === 'admin';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-slate-700 pb-safe z-50 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center gap-2">
          
          {/* Nghiệm thu */}
          <button 
            onClick={() => onChangeTab('capture')}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 relative
              ${currentTab === 'capture' 
                ? 'bg-emerald-800 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105' 
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
          >
            <div className={`transition-transform duration-300 ${currentTab === 'capture' ? 'scale-110' : ''}`}>
              <Camera className={`w-7 h-7 mb-1 ${currentTab === 'capture' ? 'stroke-[3]' : 'stroke-[2]'}`} />
            </div>
            <span className={`text-xs font-black uppercase tracking-tighter ${currentTab === 'capture' ? 'text-white' : 'text-slate-400'}`}>
              NGHIỆM THU
            </span>
            {currentTab === 'capture' && (
              <div className="absolute -bottom-1 w-10 h-1 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            )}
          </button>

          {/* Lịch sử */}
          <button 
            onClick={() => onChangeTab('history')}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 relative
              ${currentTab === 'history' 
                ? 'bg-emerald-800 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105' 
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
          >
            <div className="relative">
              <History className={`w-7 h-7 mb-1 ${currentTab === 'history' ? 'stroke-[3]' : 'stroke-[2]'}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[11px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-slate-950 shadow-lg animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className={`text-xs font-black uppercase tracking-tighter ${currentTab === 'history' ? 'text-white' : 'text-slate-400'}`}>
              LỊCH SỬ
            </span>
            {currentTab === 'history' && (
              <div className="absolute -bottom-1 w-10 h-1 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            )}
          </button>

          {/* Cấu hình */}
          <button 
            onClick={() => onChangeTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 relative
              ${currentTab === 'settings' 
                ? 'bg-emerald-800 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105' 
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
          >
            <div className="relative">
              <Settings className={`w-7 h-7 mb-1 ${currentTab === 'settings' ? 'stroke-[3]' : 'stroke-[2]'}`} />
              {!isAdmin && (
                <div className="absolute -top-1 -right-2 bg-black/60 rounded-full p-0.5 border border-white/20">
                  <Lock className="w-3 h-3 text-slate-300" />
                </div>
              )}
            </div>
            <span className={`text-xs font-black uppercase tracking-tighter ${currentTab === 'settings' ? 'text-white' : 'text-slate-400'}`}>
              CẤU HÌNH
            </span>
            {currentTab === 'settings' && (
              <div className="absolute -bottom-1 w-10 h-1 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default BottomNav;

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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center gap-2">
          
          {/* Nghiệm thu */}
          <button 
            onClick={() => onChangeTab('capture')}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 relative
              ${currentTab === 'capture' 
                ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-2xl shadow-sky-500/40 scale-105' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:shadow-md hover:scale-102'
              } border border-slate-200`}
          >
            <div className={`transition-transform duration-300 ${currentTab === 'capture' ? 'scale-110' : ''}`}>
              <Camera className={`w-7 h-7 mb-1 ${currentTab === 'capture' ? 'stroke-[3]' : 'stroke-[2]'}`} />
            </div>
            <span className={`text-xs font-black uppercase tracking-tighter ${currentTab === 'capture' ? 'text-white' : 'text-slate-600'}`}>
              NGHIỆM THU
            </span>
            {currentTab === 'capture' && (
              <div className="absolute -bottom-1 w-10 h-1 bg-sky-300 rounded-full shadow-[0_0_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none opacity-50" />
          </button>

          {/* Lịch sử */}
          <button 
            onClick={() => onChangeTab('history')}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 relative
              ${currentTab === 'history' 
                ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-2xl shadow-sky-500/40 scale-105' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:shadow-md hover:scale-102'
              } border border-slate-200`}
          >
            <div className="relative">
              <History className={`w-7 h-7 mb-1 ${currentTab === 'history' ? 'stroke-[3]' : 'stroke-[2]'}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[11px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-md animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className={`text-xs font-black uppercase tracking-tighter ${currentTab === 'history' ? 'text-white' : 'text-slate-600'}`}>
              LỊCH SỬ
            </span>
            {currentTab === 'history' && (
              <div className="absolute -bottom-1 w-10 h-1 bg-sky-300 rounded-full shadow-[0_0_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none opacity-50" />
          </button>

          {/* Cấu hình - Màu đỏ kiểu cảnh báo, đậm, dễ đọc */}
          <button 
            onClick={() => onChangeTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 relative
              ${currentTab === 'settings' 
                ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-2xl shadow-sky-500/40 scale-105' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:shadow-md hover:scale-102'
              } border border-slate-200`}
          >
            <div className="relative">
              <Settings 
                className={`w-7 h-7 mb-1 transition-colors duration-300
                  ${currentTab === 'settings' 
                    ? 'stroke-red-600 stroke-[3]' 
                    : 'stroke-slate-500 stroke-[2]'}`
                } 
              />
              {!isAdmin && (
                <div className="absolute -top-1 -right-2 bg-white/80 rounded-full p-0.5 border border-slate-300 shadow-sm">
                  <Lock className="w-3 h-3 text-slate-500" />
                </div>
              )}
            </div>
            <span 
              className={`text-xs font-black uppercase tracking-tighter transition-colors duration-300
                ${currentTab === 'settings' 
                  ? 'text-red-700' 
                  : 'text-slate-600'
                }`}
            >
        
            </span>
            {currentTab === 'settings' && (
              <div className="absolute -bottom-1 w-10 h-1 bg-sky-300 rounded-full shadow-[0_0_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none opacity-50" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default BottomNav;

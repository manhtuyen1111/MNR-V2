
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
    <div className="fixed bottom-0 left-0 right-0 bg-[#020617] border-t-2 border-white/10 pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
       <div className="max-w-md mx-auto px-4 py-3">
         <div className="flex justify-between items-center gap-3">
            
            {/* Nghiệm thu (Capture) */}
            <button 
                onClick={() => onChangeTab('capture')}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.25rem] transition-all duration-200 relative
                    ${currentTab === 'capture' 
                        ? 'bg-sky-500 text-black shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-105 z-10' 
                        : 'bg-slate-900 text-slate-500 border border-white/5 shadow-inner'
                    }`}
            >
                <div className={`transition-transform duration-300 ${currentTab === 'capture' ? 'scale-110' : ''}`}>
                    <Camera className={`w-7 h-7 mb-1 ${currentTab === 'capture' ? 'stroke-[3]' : 'stroke-[2]'}`} />
                </div>
                <span className={`text-[12px] font-black uppercase tracking-tighter ${currentTab === 'capture' ? 'text-black' : 'text-slate-500'}`}>
                    Nghiệm thu
                </span>
                {currentTab === 'capture' && (
                    <div className="absolute -bottom-1 w-8 h-1 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
                )}
            </button>

            {/* Lịch sử (History) */}
            <button 
                onClick={() => onChangeTab('history')}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.25rem] transition-all duration-200 relative
                    ${currentTab === 'history' 
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-10' 
                        : 'bg-slate-900 text-slate-500 border border-white/5 shadow-inner'
                    }`}
            >
                <div className="relative">
                    <History className={`w-7 h-7 mb-1 ${currentTab === 'history' ? 'stroke-[3]' : 'stroke-[2]'}`} />
                    {pendingCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[11px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-[#020617] shadow-lg animate-pulse">
                            {pendingCount}
                        </span>
                    )}
                </div>
                <span className={`text-[12px] font-black uppercase tracking-tighter ${currentTab === 'history' ? 'text-black' : 'text-slate-500'}`}>
                    Lịch sử
                </span>
                {currentTab === 'history' && (
                    <div className="absolute -bottom-1 w-8 h-1 bg-sky-500 rounded-full shadow-[0_0_10px_#0ea5e9]"></div>
                )}
            </button>

            {/* Cấu hình (Settings) */}
            <button 
                onClick={() => onChangeTab('settings')}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.25rem] transition-all duration-200 relative
                    ${currentTab === 'settings' 
                        ? 'bg-slate-200 text-black shadow-[0_0_20px_rgba(226,232,240,0.3)] scale-105 z-10' 
                        : 'bg-slate-900 text-slate-500 border border-white/5 shadow-inner'
                    }`}
            >
                <div className="relative">
                    <Settings className={`w-7 h-7 mb-1 ${currentTab === 'settings' ? 'stroke-[3]' : 'stroke-[2]'}`} />
                    {!isAdmin && (
                        <div className="absolute -top-1 -right-2 bg-black/60 rounded-full p-0.5 border border-white/20">
                            <Lock className="w-3 h-3 text-slate-400" />
                        </div>
                    )}
                </div>
                <span className={`text-[12px] font-black uppercase tracking-tighter ${currentTab === 'settings' ? 'text-black' : 'text-slate-500'}`}>
                    Cấu hình
                </span>
                {currentTab === 'settings' && (
                    <div className="absolute -bottom-1 w-8 h-1 bg-slate-400 rounded-full shadow-[0_0_10px_#94a3b8]"></div>
                )}
            </button>

         </div>
       </div>
    </div>
  );
};

export default BottomNav;

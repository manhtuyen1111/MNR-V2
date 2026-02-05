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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-slate-100 pb-safe z-50">
       <div className="max-w-md mx-auto px-6 py-2">
         <div className="bg-slate-50 rounded-full p-1.5 flex justify-between items-center relative shadow-inner">
            
            {/* Camera Tab */}
            <button 
                onClick={() => onChangeTab('capture')}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 ${currentTab === 'capture' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Nghiệm thu</span>
            </button>

            {/* History Tab */}
            <button 
                onClick={() => onChangeTab('history')}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 relative ${currentTab === 'history' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className="relative">
                    <History className="w-5 h-5 mb-0.5" />
                    {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border-2 border-white">
                            {pendingCount}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-bold">Lịch sử</span>
            </button>

            {/* Settings Tab */}
            <button 
                onClick={() => onChangeTab('settings')}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 relative ${currentTab === 'settings' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className="relative">
                    {isAdmin ? <Settings className="w-5 h-5 mb-0.5" /> : <Settings className="w-5 h-5 mb-0.5 opacity-50" />}
                    {!isAdmin && (
                        <div className="absolute -top-1 -right-2 bg-slate-200 rounded-full p-0.5 border border-white">
                            <Lock className="w-2.5 h-2.5 text-slate-500" />
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-bold">Cấu hình</span>
            </button>

         </div>
       </div>
    </div>
  );
};

export default BottomNav;
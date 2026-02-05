import React from 'react';
import { Camera, UserCircle, Settings } from 'lucide-react';
import { TabView } from '../types';

interface BottomNavProps {
  currentTab: TabView;
  onChangeTab: (tab: TabView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 pb-safe z-50">
       <div className="max-w-md mx-auto px-6 py-2">
         <div className="bg-gray-50 rounded-full p-1.5 flex justify-between items-center relative">
            
            {/* Camera Tab */}
            <button 
                onClick={() => onChangeTab('capture')}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 ${currentTab === 'capture' ? 'bg-white shadow-sm text-sky-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Nghiệm thu</span>
            </button>

            {/* Settings Tab */}
            <button 
                onClick={() => onChangeTab('settings')}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 ${currentTab === 'settings' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Settings className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Cấu hình</span>
            </button>

         </div>
       </div>
    </div>
  );
};

export default BottomNav;
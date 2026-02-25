import React from 'react';
import { Camera } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm shrink-0 z-50 h-14 flex items-center">
      <div className="w-full max-w-md mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-sky-800 p-1.5 rounded-lg shadow-sm">
             <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-black text-slate-800 tracking-tight leading-none">MATRAN MNR TEAM</h1>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">by [MT]</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
           {/* Enterprise branding element */}
          <div className="relative h-8 w-8 flex items-center justify-center">
  
  {/* Halo glow */}
  <div className="absolute inset-0 rounded-full bg-yellow-300 blur-md opacity-60 animate-pulse"></div>
  
  {/* Main circle */}
  <div className="relative h-8 w-8 bg-white rounded-full flex items-center justify-center border border-yellow-300 shadow-md">
    <span className="text-sm">👑</span>
  </div>

</div>
        </div>
      </div>
    </header>
  );
};

export default Header;

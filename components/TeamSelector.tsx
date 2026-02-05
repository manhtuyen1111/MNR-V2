import React from 'react';
import { Team } from '../types';
import { ChevronDown, Users, Check, Settings2 } from 'lucide-react';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onSelect: (id: string) => void;
  onManageTeams: () => void;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onFocus: () => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  teams, selectedTeamId, onSelect, onManageTeams, isActive, isCompleted, isDisabled, onFocus 
}) => {
  
  return (
    <div 
      onClick={!isDisabled ? onFocus : undefined}
      className={`
        transition-all duration-500 ease-out rounded-xl p-4 border-2 bg-white relative
        ${isActive 
          ? 'scale-105 shadow-2xl z-20 border-sky-600 ring-4 ring-sky-100 translate-y-[-5px]' 
          : isDisabled
            ? 'opacity-40 grayscale scale-95 border-slate-200 pointer-events-none'
            : 'border-green-500 shadow-sm opacity-90 scale-100' // Completed
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
         <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${isActive ? 'bg-sky-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-500'}`}>2</span>
            <label className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-sky-700' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
            CHỌN TỔ SỬA CHỮA
            </label>
         </div>
         
         {/* Edit Button - Only visible when active */}
         {isActive && (
             <button 
                onClick={(e) => { e.stopPropagation(); onManageTeams(); }}
                className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 border border-sky-200 shadow-sm flex items-center space-x-1"
             >
                <Settings2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">QUẢN LÝ</span>
             </button>
         )}
         {isCompleted && !isActive && <Check className="w-6 h-6 text-green-500" />}
      </div>

      <div className="relative">
          <select
            value={selectedTeamId}
            onFocus={onFocus}
            disabled={isDisabled}
            onChange={(e) => onSelect(e.target.value)}
            className={`w-full appearance-none border-2 text-slate-900 text-lg font-bold py-4 pl-12 pr-10 rounded-xl focus:outline-none focus:border-sky-600 transition-colors cursor-pointer disabled:bg-slate-100
                ${selectedTeamId 
                    ? 'bg-sky-50 border-sky-200 text-sky-900' 
                    : 'bg-slate-50 border-slate-300'}
            `}
          >
            <option value="" disabled>-- Chạm để chọn --</option>
            {teams.map((team) => (
                <option key={team.id} value={team.id}>
                    {team.name}
                </option>
            ))}
          </select>
          
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${selectedTeamId ? 'text-sky-600' : 'text-slate-500'}`}>
            <Users className="w-6 h-6" />
          </div>
          
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${selectedTeamId ? 'text-sky-600' : 'text-slate-500'}`}>
            <ChevronDown className="w-6 h-6" />
          </div>
      </div>
    </div>
  );
};

export default TeamSelector;
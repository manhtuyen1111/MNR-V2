import React from 'react';
import { Team } from '../types';
import { Users, Check, Settings2, Plus } from 'lucide-react';

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

  const handleSelect = (id: string) => {
      // Haptic feedback for better UX
      if (navigator.vibrate) {
          navigator.vibrate(50); 
      }
      onSelect(id);
  };
  
  return (
    <div 
      onClick={!isDisabled ? onFocus : undefined}
      className={`
        transition-all duration-300 ease-in-out rounded-xl p-4 border-2 bg-white relative flex flex-col
        ${isActive 
          ? 'border-sky-600 shadow-xl z-20 ring-2 ring-sky-100 transform scale-[1.02]' 
          : isDisabled
            ? 'opacity-60 grayscale border-slate-200 bg-slate-50 pointer-events-none'
            : 'border-green-600 shadow-sm opacity-100' // Completed
        }
      `}
    >
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center space-x-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black transition-colors ${isActive ? 'bg-sky-700 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-500'}`}>2</span>
            <label className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-sky-800' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
            CHỌN TỔ SỬA CHỮA
            </label>
         </div>
         
         {/* Edit Button - Only visible when active */}
         {isActive && (
             <button 
                onClick={(e) => { e.stopPropagation(); onManageTeams(); }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-sky-100 hover:text-sky-700 border border-slate-200 shadow-sm active:scale-95"
             >
                <Settings2 className="w-5 h-5" />
             </button>
         )}
         {isCompleted && !isActive && <Check className="w-7 h-7 text-green-600 stroke-[3]" />}
      </div>

      {/* BUTTON GRID - Replacing Select for better outdoor UX */}
      <div className="grid grid-cols-2 gap-3">
          {teams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              // Extract base color name to create dynamic darker shades for active state
              // This is a simple approximation. For robust design, use predefined lookup.
              const activeClass = isSelected 
                ? 'ring-4 ring-offset-1 border-transparent scale-[1.02] shadow-md z-10 font-black' 
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300';
              
              // Custom logic to handle the "color" prop which is a string of classes
              const bgClass = isSelected ? team.color : '';

              return (
                  <button
                    key={team.id}
                    onClick={(e) => { e.stopPropagation(); handleSelect(team.id); }}
                    disabled={isDisabled}
                    className={`
                        relative h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-200
                        ${activeClass} ${bgClass}
                    `}
                  >
                      {isSelected && (
                          <div className="absolute top-1 right-1">
                              <Check className="w-4 h-4" />
                          </div>
                      )}
                      <span className={`text-lg ${isSelected ? 'font-black' : 'font-bold'}`}>{team.name}</span>
                  </button>
              );
          })}
          
          {/* Add Button if in active mode */}
          {isActive && (
              <button
                onClick={(e) => { e.stopPropagation(); onManageTeams(); }}
                className="h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:border-sky-400 hover:bg-sky-50 transition-colors"
              >
                  <div className="flex flex-col items-center">
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase">Thêm</span>
                  </div>
              </button>
          )}
      </div>

      {/* Helper text if nothing selected */}
      {!selectedTeamId && isActive && (
          <div className="mt-3 text-center animate-pulse">
              <span className="text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                  👆 Chạm để chọn tổ
              </span>
          </div>
      )}
    </div>
  );
};

export default TeamSelector;
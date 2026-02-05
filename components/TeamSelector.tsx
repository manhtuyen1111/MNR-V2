import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Check, Settings2, Plus, ChevronDown, ChevronUp, Users } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close if disabled
  useEffect(() => {
    if (isDisabled) setIsOpen(false);
  }, [isDisabled]);

  // Open automatically when becoming active if no selection yet
  useEffect(() => {
      if (isActive && !selectedTeamId && !isDisabled) {
          setIsOpen(true);
      }
  }, [isActive, selectedTeamId, isDisabled]);

  const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDisabled) return;
      onFocus();
      setIsOpen(!isOpen);
  };

  const handleSelect = (id: string) => {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
      
      onSelect(id);
      setIsOpen(false);
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div 
      className={`
        transition-all duration-300 ease-in-out rounded-xl p-4 border-2 bg-white relative flex flex-col
        ${isActive 
          ? 'border-sky-600 shadow-xl z-20 ring-2 ring-sky-100' 
          : isDisabled
            ? 'opacity-60 grayscale border-slate-200 bg-slate-50 pointer-events-none'
            : 'border-green-600 shadow-sm opacity-100' // Completed
        }
      `}
    >
      <div className="flex items-center justify-between mb-3" onClick={!isDisabled ? handleToggle : undefined}>
         <div className="flex items-center space-x-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black transition-colors ${isActive ? 'bg-sky-700 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-500'}`}>2</span>
            <label className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-sky-800' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
            CHỌN TỔ SỬA CHỮA
            </label>
         </div>
         
         <div className="flex items-center space-x-2">
            {/* Edit Button - Only visible when active/open */}
            {isActive && isOpen && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onManageTeams(); }}
                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-sky-100 hover:text-sky-700 border border-slate-200 shadow-sm"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            )}
            {isCompleted && !isActive && <Check className="w-7 h-7 text-green-600 stroke-[3]" />}
         </div>
      </div>

      {/* DROPDOWN TRIGGER (The "Selected" View) */}
      <button
        onClick={handleToggle}
        disabled={isDisabled}
        className={`
            w-full min-h-[64px] rounded-xl border-2 flex items-center px-4 justify-between transition-all duration-200
            ${isDisabled ? 'bg-slate-100 border-slate-200' : 'bg-white hover:border-sky-400'}
            ${selectedTeam ? selectedTeam.color + ' border-transparent' : 'border-slate-300 text-slate-500'}
            ${isActive && !selectedTeam ? 'animate-pulse border-sky-400 bg-sky-50' : ''}
        `}
      >
          {selectedTeam ? (
              <div className="flex items-center space-x-3 w-full">
                  <div className="bg-white/30 p-2 rounded-lg backdrop-blur-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-black tracking-tight">{selectedTeam.name}</span>
              </div>
          ) : (
              <span className="text-lg font-bold text-slate-400">
                  {isDisabled ? '...' : 'Chạm để chọn tổ'}
              </span>
          )}

          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              {isOpen ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
          </div>
      </button>

      {/* DROPDOWN CONTENT (The List) */}
      {isOpen && !isDisabled && (
          <div className="mt-2 space-y-2 animate-fadeIn origin-top">
              {teams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                      <button
                        key={team.id}
                        onClick={(e) => { e.stopPropagation(); handleSelect(team.id); }}
                        className={`
                            w-full p-4 rounded-xl border-2 flex items-center transition-all active:scale-[0.98]
                            ${isSelected 
                                ? `ring-2 ring-offset-1 border-transparent font-black shadow-md z-10 ${team.color}` 
                                : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
                            }
                        `}
                      >
                          <span className="text-base flex-1 text-left">{team.name}</span>
                          {isSelected && <Check className="w-5 h-5" />}
                      </button>
                  );
              })}
              
              <button
                onClick={(e) => { e.stopPropagation(); onManageTeams(); }}
                className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 font-bold text-sm hover:text-sky-600 hover:border-sky-400 hover:bg-sky-50 transition-colors flex items-center justify-center space-x-2"
              >
                  <Plus className="w-4 h-4" />
                  <span>THÊM TỔ KHÁC</span>
              </button>
          </div>
      )}
    </div>
  );
};

export default TeamSelector;
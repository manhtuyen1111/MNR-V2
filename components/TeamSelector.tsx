import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Check, Settings2, Plus, ChevronDown, ChevronUp, Users, Lock } from 'lucide-react';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onSelect: (id: string) => void;
  onManageTeams: () => void;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onFocus: () => void;
  assignedTeamId?: string; // New prop for RBAC
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  teams, selectedTeamId, onSelect, onManageTeams, isActive, isCompleted, isDisabled, onFocus, assignedTeamId 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close if disabled
  useEffect(() => {
    if (isDisabled) setIsOpen(false);
  }, [isDisabled]);

  // Handle Assigned Team Logic
  useEffect(() => {
      if (assignedTeamId && selectedTeamId !== assignedTeamId) {
          onSelect(assignedTeamId);
      }
  }, [assignedTeamId, onSelect]);

  // Open automatically when becoming active if no selection yet AND not locked
  useEffect(() => {
      if (isActive && !selectedTeamId && !isDisabled && !assignedTeamId) {
          setIsOpen(true);
      }
  }, [isActive, selectedTeamId, isDisabled, assignedTeamId]);

  const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDisabled || assignedTeamId) return; // Disable toggle if locked
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
        transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] rounded-2xl p-5 border relative flex flex-col bg-white
        ${isActive 
          ? 'border-sky-600 shadow-[0_10px_40px_-15px_rgba(2,132,199,0.3)] z-20 ring-4 ring-sky-50 transform scale-[1.03]' 
          : isDisabled
            ? 'opacity-60 grayscale border-slate-200 bg-slate-50 pointer-events-none'
            : 'border-green-500 shadow-sm opacity-100' // Completed
        }
      `}
    >
      <div className="flex items-center justify-between mb-4" onClick={!isDisabled && !assignedTeamId ? handleToggle : undefined}>
         <div className="flex items-center space-x-2">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-sm transition-colors ${isActive ? 'bg-sky-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <label className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-sky-800' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
            CHỌN TỔ SỬA CHỮA
            </label>
         </div>
         
         <div className="flex items-center space-x-2">
            {/* Lock Icon for assigned users */}
            {assignedTeamId && (
                <div className="flex items-center text-slate-400 bg-slate-100 px-2 py-1 rounded text-xs font-bold">
                    <Lock className="w-3 h-3 mr-1" />
                    <span>Đã khóa</span>
                </div>
            )}

            {/* Edit Button - Only visible when active/open and NOT locked */}
            {isActive && isOpen && !assignedTeamId && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onManageTeams(); }}
                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-sky-100 hover:text-sky-700 border border-slate-200 shadow-sm"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            )}
            {isCompleted && !isActive && <Check className="w-8 h-8 text-green-600 stroke-[3]" />}
         </div>
      </div>

      {/* DROPDOWN TRIGGER (The "Selected" View) */}
      <button
        onClick={handleToggle}
        disabled={isDisabled || !!assignedTeamId}
        className={`
            w-full min-h-[72px] rounded-xl border-2 flex items-center px-4 justify-between transition-all duration-200
            ${isDisabled ? 'bg-slate-100 border-slate-200' : 'bg-white hover:border-sky-400'}
            ${selectedTeam ? selectedTeam.color + ' border-transparent shadow-md' : 'border-slate-300 text-slate-500 border-dashed'}
            ${isActive && !selectedTeam ? 'animate-pulse border-sky-400 bg-sky-50' : ''}
        `}
      >
          {selectedTeam ? (
              <div className="flex items-center space-x-4 w-full">
                  <div className="bg-white/40 p-2.5 rounded-lg backdrop-blur-sm shadow-sm border border-white/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-start">
                     <span className="text-xs font-bold opacity-70 uppercase">Đơn vị thi công</span>
                     <span className="text-xl font-black tracking-tight leading-none mt-0.5">{selectedTeam.name}</span>
                  </div>
              </div>
          ) : (
              <span className="text-lg font-bold text-slate-400 flex items-center">
                  {isDisabled ? '...' : 'Chạm để chọn tổ'}
              </span>
          )}

          {!assignedTeamId && (
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                {isOpen ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
            </div>
          )}
      </button>

      {/* DROPDOWN CONTENT (The List) */}
      {isOpen && !isDisabled && !assignedTeamId && (
          <div className="mt-3 space-y-2 animate-fadeIn origin-top">
              {teams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                      <button
                        key={team.id}
                        onClick={(e) => { e.stopPropagation(); handleSelect(team.id); }}
                        className={`
                            w-full p-4 rounded-xl border-2 flex items-center transition-all active:scale-[0.98]
                            ${isSelected 
                                ? `ring-2 ring-offset-2 border-transparent font-black shadow-lg z-10 ${team.color}` 
                                : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }
                        `}
                      >
                          <span className="text-base flex-1 text-left">{team.name}</span>
                          {isSelected && <div className="bg-white/20 p-1 rounded-full"><Check className="w-5 h-5" /></div>}
                      </button>
                  );
              })}
              
              <button
                onClick={(e) => { e.stopPropagation(); onManageTeams(); }}
                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 font-bold text-sm hover:text-sky-600 hover:border-sky-400 hover:bg-sky-50 transition-colors flex items-center justify-center space-x-2"
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
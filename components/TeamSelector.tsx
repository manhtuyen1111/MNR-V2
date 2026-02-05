import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Check, Settings2, Plus, Users, Lock, X } from 'lucide-react';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onSelect: (id: string) => void;
  onManageTeams: () => void;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onFocus: () => void;
  assignedTeamId?: string;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  teams, selectedTeamId, onSelect, onManageTeams, isActive, isCompleted, isDisabled, onFocus, assignedTeamId 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isDisabled) setIsOpen(false);
  }, [isDisabled]);

  useEffect(() => {
    if (assignedTeamId && selectedTeamId !== assignedTeamId) {
      onSelect(assignedTeamId);
    }
  }, [assignedTeamId, onSelect, selectedTeamId]);

  useEffect(() => {
    if (isActive && !selectedTeamId && !isDisabled && !assignedTeamId) {
      setIsOpen(true);
    }
  }, [isActive, selectedTeamId, isDisabled, assignedTeamId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled || assignedTeamId) return;
    onFocus();
    setIsOpen(true);
  };

  const handleSelect = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    onSelect(id);
    setIsOpen(false);
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <>
      <div 
        onClick={!isDisabled && !assignedTeamId ? handleToggle : undefined}
        className={`
          transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] rounded-2xl p-5 border relative flex flex-col bg-white
          ${isActive 
            ? 'border-sky-600 shadow-[0_10px_40px_-15px_rgba(2,132,199,0.3)] z-20 ring-4 ring-sky-50 transform scale-[1.03]' 
            : isDisabled
              ? 'opacity-60 grayscale border-slate-200 bg-slate-50 pointer-events-none'
              : 'border-green-500 shadow-sm opacity-100'
          }
        `}
      >
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-sm transition-colors ${isActive ? 'bg-sky-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
              <label className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-sky-800' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
              CHỌN TỔ SỬA CHỮA
              </label>
           </div>
           
           <div className="flex items-center space-x-2">
              {assignedTeamId && (
                  <div className="flex items-center text-slate-400 bg-slate-100 px-2 py-1 rounded text-xs font-bold">
                      <Lock className="w-3 h-3 mr-1" />
                      <span>Cố định</span>
                  </div>
              )}
              {isCompleted && !isActive && <Check className="w-8 h-8 text-green-600 stroke-[3]" />}
           </div>
        </div>

        <button
          disabled={isDisabled || !!assignedTeamId}
          className={`
              w-full min-h-[72px] rounded-xl border-2 flex items-center px-4 justify-between transition-all duration-200
              ${isDisabled ? 'bg-slate-100 border-slate-200' : 'bg-white'}
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
                       <span className="text-xs font-bold opacity-70 uppercase text-left">Đơn vị thi công</span>
                       <span className="text-xl font-black tracking-tight leading-none mt-0.5">{selectedTeam.name}</span>
                    </div>
                </div>
            ) : (
                <span className="text-lg font-bold text-slate-400 flex items-center">
                    {isDisabled ? '...' : 'Chạm để chọn tổ'}
                </span>
            )}
        </button>
      </div>

      {/* TEAM SELECTION MODAL - 2x2 Grid Centered */}
      {isOpen && !isDisabled && !assignedTeamId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800 tracking-tight flex items-center">
                <Users className="w-5 h-5 mr-2 text-sky-600" />
                CHỌN TỔ ĐỘI
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-200 rounded-full text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {teams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <button
                      key={team.id}
                      onClick={() => handleSelect(team.id)}
                      className={`
                        aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95
                        ${isSelected 
                          ? `border-sky-600 shadow-lg scale-[1.02] font-black ${team.color}` 
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-white hover:border-sky-200'
                        }
                      `}
                    >
                      <span className="text-lg uppercase font-black">{team.name}</span>
                      {isSelected && <Check className="w-5 h-5 mt-1" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => { onManageTeams(); setIsOpen(false); }}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold text-sm hover:bg-sky-50 hover:border-sky-300 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>THÊM / CHỈNH SỬA TỔ</span>
                <Settings2 className="w-4 h-4 ml-1 opacity-50" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamSelector;
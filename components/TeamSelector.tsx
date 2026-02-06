
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
  userRole?: string; // Thêm prop để check quyền
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  teams, selectedTeamId, onSelect, onManageTeams, isActive, isCompleted, isDisabled, onFocus, assignedTeamId, userRole 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-select and lock team if assigned to user
  useEffect(() => {
    if (assignedTeamId && selectedTeamId !== assignedTeamId) {
      onSelect(assignedTeamId);
    }
  }, [assignedTeamId, onSelect, selectedTeamId]);

  useEffect(() => {
    if (isDisabled) setIsOpen(false);
  }, [isDisabled]);

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

  /**
   * FIX: Ưu tiên sử dụng mapping ID từ tài khoản người dùng để hiển thị tên.
   * Điều này đảm bảo khi đăng nhập bằng qc02 (t2), hệ thống luôn hiện "TỔ 2" 
   * kể cả khi danh sách teams trong localStorage bị thay đổi hoặc trống.
   */
  const getSelectedTeam = () => {
    const currentId = assignedTeamId || selectedTeamId;
    if (!currentId) return null;

    // Mapping chuẩn cho các ID hệ thống
    const systemTeamNames: Record<string, string> = {
        't1': 'TỔ 1',
        't2': 'TỔ 2',
        't3': 'TỔ 3',
        't4': 'TỔ 4'
    };

    // 1. Nếu là ID hệ thống (t1, t2...), trả về object chuẩn ngay lập tức
    if (systemTeamNames[currentId]) {
        return {
            id: currentId,
            name: systemTeamNames[currentId],
            color: currentId === 't1' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                   currentId === 't2' ? 'bg-green-100 text-green-700 border-green-200' :
                   currentId === 't3' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                   'bg-purple-100 text-purple-700 border-purple-200'
        };
    }

    // 2. Nếu không phải ID hệ thống, tìm trong danh sách tùy chỉnh
    return teams.find(t => t.id === currentId) || null;
  };

  const selectedTeam = getSelectedTeam();

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
                  <div className="flex items-center text-sky-600 bg-sky-50 px-2 py-1 rounded-lg text-[10px] font-black border border-sky-100 uppercase tracking-tighter shadow-sm">
                      <Lock className="w-3 h-3 mr-1" />
                      <span>Cố định tổ</span>
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
              ${selectedTeam ? selectedTeam.color + ' border-transparent shadow-md ring-2 ring-white/50' : 'border-slate-300 text-slate-500 border-dashed'}
              ${isActive && !selectedTeam ? 'animate-pulse border-sky-400 bg-sky-50' : ''}
              ${assignedTeamId ? 'cursor-default' : 'cursor-pointer'}
          `}
        >
            {selectedTeam ? (
                <div className="flex items-center space-x-4 w-full">
                    <div className="bg-white/50 p-2.5 rounded-lg backdrop-blur-sm shadow-sm border border-white/30">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start">
                       <span className="text-[10px] font-black opacity-80 uppercase text-left tracking-tighter">Đơn vị thi công</span>
                       <span className="text-2xl font-black tracking-tighter leading-none mt-0.5">{selectedTeam.name}</span>
                    </div>
                </div>
            ) : (
                <span className="text-lg font-bold text-slate-400 flex items-center">
                    {isDisabled ? '...' : 'Chạm để chọn tổ'}
                </span>
            )}
        </button>
      </div>

      {/* TEAM SELECTION MODAL */}
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

              {/* CHỈ HIỂN THỊ NÚT NÀY NẾU LÀ ADMIN */}
              {userRole === 'admin' && (
                <button
                    onClick={() => { onManageTeams(); setIsOpen(false); }}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold text-sm hover:bg-sky-50 hover:border-sky-300 transition-colors flex items-center justify-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>THÊM / CHỈNH SỬA TỔ</span>
                    <Settings2 className="w-4 h-4 ml-1 opacity-50" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamSelector;

import React, { useState } from 'react';
import { Team } from '../types';
import { Users, Plus, Check } from 'lucide-react';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onSelect: (id: string) => void;
  onAddTeam: (name: string) => void;
  isActive: boolean;
  onFocus: () => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  teams, selectedTeamId, onSelect, onAddTeam, isActive, onFocus 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      onAddTeam(newTeamName.trim());
      setNewTeamName('');
      setIsAdding(false);
    }
  };

  return (
    <div 
      onClick={onFocus}
      className={`
        transition-all duration-300 ease-out rounded-2xl p-3 border-2
        ${isActive 
          ? 'bg-white border-sky-600 shadow-[0_10px_40px_-10px_rgba(14,165,233,0.3)] scale-[1.02] z-20 translate-y-[-4px]' 
          : 'bg-white border-slate-200 shadow-sm scale-100 opacity-90'
        }
      `}
    >
      <div className="flex items-center space-x-2 mb-2">
         <div className={`p-1 rounded-md ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            <span className="text-[10px] font-bold px-1">02</span>
         </div>
        <label className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-sky-700' : 'text-slate-500'}`}>
          Tổ Sửa Chữa
        </label>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {teams.map((team) => {
          const isSelected = selectedTeamId === team.id;
          return (
            <button
              key={team.id}
              onClick={(e) => { e.stopPropagation(); onSelect(team.id); }}
              className={`
                snap-start flex-shrink-0 w-28 h-20 p-2 rounded-xl border-2 text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden
                ${isSelected 
                  ? `border-sky-600 bg-sky-50 shadow-md` 
                  : 'border-slate-100 bg-slate-50 text-slate-500'
                }
              `}
            >
              <div className="flex justify-between items-start z-10">
                 <div className={`w-2 h-2 rounded-full ${team.color.split(' ')[0]}`}></div>
                 {isSelected && <Check className="w-4 h-4 text-sky-600" />}
              </div>
              <span className={`text-xs font-bold leading-tight z-10 line-clamp-2 ${isSelected ? 'text-sky-900' : 'text-slate-600'}`}>
                {team.name}
              </span>
              
              {/* Decorative background icon */}
              <Users className={`absolute -bottom-2 -right-2 w-10 h-10 opacity-5 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
            </button>
          );
        })}

        {/* Add Team Button */}
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="snap-start flex-shrink-0 w-28 h-20 p-2 rounded-xl border-2 border-dashed border-sky-300 bg-white flex flex-col justify-center">
             <input 
                autoFocus
                type="text" 
                placeholder="Tên..." 
                className="w-full text-xs bg-transparent border-b border-sky-300 focus:outline-none focus:border-sky-600 mb-1 font-bold text-slate-700"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onBlur={() => !newTeamName && setIsAdding(false)}
             />
             <button type="submit" className="text-[10px] bg-sky-600 text-white py-1 rounded w-full">Lưu</button>
          </form>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
            className="snap-start flex-shrink-0 w-28 h-20 flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase">Thêm tổ</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamSelector;
import React, { useState } from 'react';
import { Team } from '../types';
import { X, Plus, Trash2, Users } from 'lucide-react';

interface TeamManagerProps {
  teams: Team[];
  onUpdateTeams: (newTeams: Team[]) => void;
  onClose: () => void;
}

const COLORS = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-green-100 text-green-700 border-green-200',
    'bg-orange-100 text-orange-700 border-orange-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-teal-100 text-teal-700 border-teal-200',
];

const TeamManager: React.FC<TeamManagerProps> = ({ teams, onUpdateTeams, onClose }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleAddTeam = () => {
      if (!newTeamName.trim()) return;
      const newTeam: Team = {
          id: `custom_${Date.now()}`,
          name: newTeamName,
          color: selectedColor,
          isCustom: true
      };
      onUpdateTeams([...teams, newTeam]);
      setNewTeamName('');
  };

  const handleDeleteTeam = (id: string) => {
      if (window.confirm('Bạn có chắc muốn xóa tổ này không?')) {
          onUpdateTeams(teams.filter(t => t.id !== id));
      }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
       <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                  <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
                      <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-800">Quản lý Tổ/Đội</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X className="w-5 h-5" />
              </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                      <div className="flex items-center space-x-3">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${team.color}`}>
                                <span className="text-xs font-bold">{team.name.charAt(0)}</span>
                           </div>
                           <span className="font-bold text-slate-700">{team.name}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              ))}
          </div>

          {/* Add New Form */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 pb-safe">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Thêm tổ mới</h3>
              <div className="space-y-3">
                  <input 
                      type="text" 
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Nhập tên tổ..."
                      className="w-full p-3 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none font-bold text-slate-700"
                  />
                  
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                      {COLORS.map((col, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedColor(col)}
                            className={`w-8 h-8 rounded-full border-2 shrink-0 ${col.split(' ')[0]} ${selectedColor === col ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                          />
                      ))}
                  </div>

                  <button 
                      onClick={handleAddTeam}
                      disabled={!newTeamName.trim()}
                      className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center space-x-2 disabled:opacity-50 disabled:shadow-none"
                  >
                      <Plus className="w-5 h-5" />
                      <span>Thêm Tổ</span>
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default TeamManager;
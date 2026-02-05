
import React, { useState, useEffect } from 'react';
import { Team, User } from '../types';
import { X, Plus, Trash2, Users, Pencil, Save, ShieldCheck, UserPlus } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [username, setUsername] = useState('');
  
  // State quản lý custom users từ LocalStorage
  const [customUsers, setCustomUsers] = useState<Record<string, User>>(() => {
    const saved = localStorage.getItem('customUsers');
    return saved ? JSON.parse(saved) : {};
  });

  const handleStartEdit = (team: Team) => {
      setEditingId(team.id);
      setTeamName(team.name);
      setSelectedColor(team.color);
      
      // Tìm tài khoản liên kết với tổ này
      const linkedUser = Object.values(customUsers).find(u => u.assignedTeamId === team.id);
      setUsername(linkedUser ? linkedUser.username : '');
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setTeamName('');
      setSelectedColor(COLORS[0]);
      setUsername('');
  };

  const handleSaveTeam = () => {
      if (!teamName.trim()) return;

      let newTeams = [...teams];
      let teamId = editingId;

      if (editingId) {
          // Update existing team
          newTeams = teams.map(t => 
              t.id === editingId 
              ? { ...t, name: teamName, color: selectedColor } 
              : t
          );
      } else {
          // Add new team
          teamId = `custom_${Date.now()}`;
          const newTeam: Team = {
              id: teamId,
              name: teamName,
              color: selectedColor,
              isCustom: true
          };
          newTeams = [...teams, newTeam];
      }
      
      onUpdateTeams(newTeams);

      // Xử lý tạo/cập nhật tài khoản nếu có nhập username
      if (username.trim() && teamId) {
          const lowerUsername = username.trim().toLowerCase();
          const newCustomUsers = { ...customUsers };
          
          // Xóa tài khoản cũ nếu đổi username cho cùng 1 tổ
          const oldEntry = Object.entries(newCustomUsers).find(([_, u]) => u.assignedTeamId === teamId);
          if (oldEntry && oldEntry[0] !== lowerUsername) {
              delete newCustomUsers[oldEntry[0]];
          }

          newCustomUsers[lowerUsername] = {
              username: lowerUsername,
              name: `QC ${teamName}`,
              role: 'worker',
              assignedTeamId: teamId
          };
          
          setCustomUsers(newCustomUsers);
          localStorage.setItem('customUsers', JSON.stringify(newCustomUsers));
      }
      
      handleCancelEdit();
  };

  const handleDeleteTeam = (id: string) => {
      if (window.confirm('Xóa tổ này sẽ xóa cả tài khoản đăng nhập liên kết. Tiếp tục?')) {
          onUpdateTeams(teams.filter(t => t.id !== id));
          
          // Xóa user liên kết
          const newCustomUsers = { ...customUsers };
          const entryToDelete = Object.entries(newCustomUsers).find(([_, u]) => u.assignedTeamId === id);
          if (entryToDelete) {
              delete newCustomUsers[entryToDelete[0]];
              setCustomUsers(newCustomUsers);
              localStorage.setItem('customUsers', JSON.stringify(newCustomUsers));
          }

          if (editingId === id) handleCancelEdit();
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
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Quản lý Tổ & Tài khoản</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X className="w-5 h-5" />
              </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {teams.map((team) => {
                  const linkedUser = Object.values(customUsers).find(u => u.assignedTeamId === team.id);
                  return (
                    <div 
                        key={team.id} 
                        onClick={() => handleStartEdit(team)}
                        className={`flex items-center justify-between p-4 border rounded-2xl shadow-sm transition-all cursor-pointer ${editingId === team.id ? 'bg-sky-50 border-sky-400 ring-4 ring-sky-100' : 'bg-white border-slate-100'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-sm ${team.color}`}>
                                <span className="text-lg font-black">{team.name.charAt(0)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{team.name}</span>
                                {linkedUser && (
                                    <div className="flex items-center text-[10px] text-sky-600 font-bold mt-1 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                        <span>User: {linkedUser.username}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button className="p-2 text-slate-400">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                  );
              })}
          </div>

          {/* Add/Edit Form */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-10 rounded-t-3xl">
              <div className="flex justify-between items-center mb-4 px-1">
                   <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       {editingId ? 'Chỉnh sửa tổ đội' : 'Thêm tổ đội & tài khoản'}
                   </h3>
                   {editingId && (
                       <button onClick={handleCancelEdit} className="text-[10px] font-black text-slate-500 bg-slate-200 px-3 py-1 rounded-full uppercase">
                           Hủy
                       </button>
                   )}
              </div>
              
              <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tên Tổ Sửa Chữa</label>
                    <input 
                        type="text" 
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Ví dụ: TỔ 5, TỔ PHỤ TRỢ..."
                        className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-sky-500 focus:outline-none font-black text-slate-800 placeholder-slate-300 transition-all bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center">
                        <UserPlus className="w-3 h-3 mr-1.5" />
                        Tên đăng nhập (Tự động khóa vào tổ này)
                    </label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ví dụ: qc05"
                        className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-sky-500 focus:outline-none font-bold text-sky-700 placeholder-slate-300 transition-all bg-white font-mono"
                    />
                    <p className="text-[9px] text-slate-400 italic px-1 mt-1">* Mật khẩu mặc định trùng với tên đăng nhập</p>
                  </div>
                  
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                      {COLORS.map((col, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedColor(col)}
                            className={`w-10 h-10 rounded-xl border-4 shrink-0 transition-transform active:scale-90 ${col.split(' ')[0]} ${selectedColor === col ? 'border-sky-500 scale-110 shadow-lg' : 'border-white shadow-sm'}`}
                          />
                      ))}
                  </div>

                  <button 
                      onClick={handleSaveTeam}
                      disabled={!teamName.trim()}
                      className={`w-full text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:shadow-none
                        ${editingId ? 'bg-orange-500 shadow-orange-900/20' : 'bg-sky-600 shadow-sky-900/20'}
                      `}
                  >
                      {editingId ? <Save className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                      <span className="uppercase tracking-widest text-sm">{editingId ? 'Cập Nhật Tổ Đội' : 'Lưu Tổ & Tạo Tài Khoản'}</span>
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default TeamManager;

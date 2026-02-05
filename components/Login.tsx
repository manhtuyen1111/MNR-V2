import React, { useState } from 'react';
import { User } from '../types';
import { USERS } from '../constants';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, Loader2, Container } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
        const user = USERS[username.toLowerCase()];
        
        // Simple check: password matches username for this demo as requested
        if (user && password === username) {
            onLogin(user);
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng');
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-100">
        {/* Professional Dark Blue Background Split */}
        <div className="absolute top-0 left-0 w-full h-[50%] bg-[#0f172a] z-0"></div>
        
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10 overflow-hidden flex flex-col">
            
            {/* Header Section */}
            <div className="bg-[#0f172a] p-8 pb-10 text-center relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-45 border-4 border-slate-100">
                    <div className="transform -rotate-45">
                        <Container className="w-10 h-10 text-[#0f172a]" />
                    </div>
                </div>
                
                <h1 className="text-2xl font-black text-white tracking-tight mt-2">MATRAN MNR</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Hệ thống nghiệm thu</p>
            </div>

            {/* Form Section */}
            <div className="px-8 pt-14 pb-8">
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tài khoản</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#0f172a] transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] transition-all font-medium"
                                placeholder="Nhập tên đăng nhập"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#0f172a] transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pl-10 pr-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] transition-all font-medium"
                                placeholder="Nhập mật khẩu"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 transform active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>ĐĂNG NHẬP</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-slate-100 pt-6">
                    <p className="text-[10px] text-slate-400 font-bold">
                        BẢN QUYỀN © 2024 MATRAN MNR
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
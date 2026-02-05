
import React, { useState } from 'react';
import { User } from '../types';
import { USERS } from '../constants';
import { User as UserIcon, Lock, ArrowRight, Loader2, Container, ShieldCheck } from 'lucide-react';

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

    setTimeout(() => {
        const lowerUsername = username.toLowerCase();
        
        // 1. Lấy tài khoản mặc định
        const defaultUsers = USERS;
        
        // 2. Lấy tài khoản tùy chỉnh từ LocalStorage
        const customUsersRaw = localStorage.getItem('customUsers');
        const customUsers = customUsersRaw ? JSON.parse(customUsersRaw) : {};
        
        // Gộp tất cả tài khoản
        const allUsers = { ...defaultUsers, ...customUsers };
        
        const user = allUsers[lowerUsername];
        
        // Kiểm tra mật khẩu (trong app này mật khẩu mặc định = username)
        if (user && password === username) {
            onLogin(user);
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng');
            setLoading(false);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative">
        {/* Extreme Contrast Glow for visibility */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600/10 rounded-full blur-[100px]"></div>
        
        <div className="w-full max-w-sm z-10">
            {/* Header Area */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-600 rounded-3xl shadow-[0_0_40px_rgba(2,132,199,0.3)] mb-6">
                    <Container className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">
                    MATRAN <span className="text-sky-400">MNR</span>
                </h1>
                <p className="text-sky-500/60 text-xs font-black uppercase tracking-[0.5em] mt-3">Outdoor Ready System</p>
            </div>

            {/* Login Box */}
            <div className="bg-slate-900/80 border-2 border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserIcon className="h-6 w-6 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black border-2 border-slate-800 text-white text-lg rounded-2xl py-4.5 pl-14 pr-4 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-bold"
                                placeholder="Tên đăng nhập"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-6 w-6 text-slate-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border-2 border-slate-800 text-white text-lg rounded-2xl py-4.5 pl-14 pr-4 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-bold"
                                placeholder="Mật khẩu"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-950/50 text-red-400 text-xs font-black p-4 rounded-xl border border-red-900/50 flex items-center animate-fadeIn">
                            <ShieldCheck className="w-5 h-5 mr-3 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-500 hover:bg-sky-400 text-black font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)] transform active:scale-95 transition-all flex items-center justify-center space-x-3"
                    >
                        {loading ? (
                            <Loader2 className="w-7 h-7 animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-[0.2em] text-lg">VÀO HỆ THỐNG</span>
                                <ArrowRight className="w-6 h-6" />
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            <div className="mt-16 text-center">
                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em]">
                    v2.5.3 • Matran MNR Solution
                </p>
            </div>
        </div>
    </div>
  );
};

export default Login;

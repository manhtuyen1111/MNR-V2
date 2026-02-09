
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

    // Giữ nguyên logic xác thực cũ
    setTimeout(() => {
        const user = USERS[username.toLowerCase()];
        if (user && (password === username || password === '123')) {
            onLogin(user);
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng');
            setLoading(false);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
        {/* Background Elements - High Contrast Deep Navy */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0f172a] to-[#020617] pointer-events-none"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[50%] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-sm z-10 animate-fadeIn">
            {/* Logo Area - High Visibility */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.15)] mb-6 transform hover:scale-105 transition-transform duration-500">
                    <Container className="w-12 h-12 text-[#020617]" />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
                    MATRAN <span className="text-sky-400">MNR</span>
                </h1>
                <div className="flex items-center justify-center space-x-3 mt-4">
                    <div className="h-[2px] w-6 bg-sky-500"></div>
                    <p className="text-white text-[11px] font-black uppercase tracking-[0.4em]">QC Inspection System</p>
                    <div className="h-[2px] w-6 bg-sky-500"></div>
                </div>
            </div>

            {/* Login Box - Sharp & Clean for Outdoors */}
            <div className="bg-slate-900/80 backdrop-blur-md border-2 border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-sky-400 uppercase tracking-[0.2em] ml-2">Tài khoản</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black border-2 border-slate-700 text-white text-lg rounded-2xl py-4.5 pl-14 pr-4 placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all font-bold"
                                placeholder="Tên đăng nhập"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-sky-400 uppercase tracking-[0.2em] ml-2">Mật khẩu</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border-2 border-slate-700 text-white text-lg rounded-2xl py-4.5 pl-14 pr-4 placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all font-bold"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500 text-white text-[12px] font-black p-4 rounded-2xl border-2 border-red-400 flex items-center animate-fadeIn shadow-lg">
                            <ShieldCheck className="w-5 h-5 mr-3 shrink-0" />
                            <span className="leading-tight uppercase">{error}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-sky-400 hover:bg-white text-black font-black py-5 rounded-2xl shadow-xl shadow-sky-900/20 transform active:scale-95 transition-all flex items-center justify-center space-x-3 group relative overflow-hidden"
                        >
                            {loading ? (
                                <Loader2 className="w-7 h-7 animate-spin" />
                            ) : (
                                <>
                                    <span className="uppercase tracking-[0.2em] text-base font-black">Bắt đầu làm việc</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="mt-12 text-center">
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
                        Version 2.5.2 • 2024
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;

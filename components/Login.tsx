
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
        const user = USERS[username.toLowerCase()];
        if (user && password === username) {
            onLogin(user);
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng');
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f172a] relative overflow-hidden">
        {/* Subtle Accent Lights for Professional Look */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[40%] bg-sky-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
        
        <div className="w-full max-w-sm z-10">
            {/* Minimal Brand Area */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-[1.25rem] shadow-2xl shadow-sky-900/50 mb-6 ring-4 ring-white/5">
                    <Container className="w-9 h-9 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter">
                    MATRAN <span className="text-sky-400">MNR</span>
                </h1>
                <div className="flex items-center justify-center space-x-3 mt-2">
                    <div className="h-px w-6 bg-slate-700"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Inspection System</p>
                    <div className="h-px w-6 bg-slate-700"></div>
                </div>
            </div>

            {/* Form Card - Dark Mode for Anti-Glare */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/5">
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-semibold"
                                placeholder="Tên đăng nhập"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-semibold"
                                placeholder="Mật khẩu"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 text-[11px] font-bold px-4 py-3 rounded-xl flex items-center animate-fadeIn border border-red-500/20">
                            <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-500 hover:bg-sky-400 text-[#0f172a] font-black py-4 rounded-2xl shadow-xl shadow-sky-500/20 transform active:scale-[0.97] transition-all flex items-center justify-center space-x-2 mt-2"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-widest text-sm">Đăng nhập</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            {/* Version Info - Minimal */}
            <div className="mt-16 text-center">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">
                    v2.5.0 • Digital Solution by Matran
                </p>
            </div>
        </div>
    </div>
  );
};

export default Login;

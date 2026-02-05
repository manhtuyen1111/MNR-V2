
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50"></div>
        
        <div className="w-full max-w-sm z-10">
            {/* Brand Logo & Title Area - Clean & High up */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200 mb-4">
                    <Container className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    MATRAN <span className="text-sky-600">MNR</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">NGHIỆM THU SỬA CHỮA</p>
            </div>

            {/* Simple Card Layout */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-white">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-slate-300 group-focus-within:text-sky-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-4 pl-12 pr-4 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 focus:border-sky-500 focus:bg-white transition-all font-semibold"
                                placeholder="Tên đăng nhập"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-sky-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl py-4 pl-12 pr-4 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 focus:border-sky-500 focus:bg-white transition-all font-semibold"
                                placeholder="Mật khẩu"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-[11px] font-bold px-4 py-3 rounded-xl flex items-center animate-fadeIn border border-red-100">
                            <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-sky-200 transform active:scale-[0.97] transition-all flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span>ĐĂNG NHẬP</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            {/* Footer - Minimal */}
            <div className="mt-12 text-center">
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                    Version 2.5.0 • MATRAN Solution
                </p>
            </div>
        </div>
    </div>
  );
};

export default Login;

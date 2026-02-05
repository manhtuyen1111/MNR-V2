import React, { useState } from 'react';
import { User } from '../types';
import { USERS } from '../constants';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 animate-fadeIn">
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center mb-4 rotate-3 transform hover:rotate-6 transition-transform">
                    <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">MATRAN MNR</h1>
                <p className="text-sky-200 text-sm font-medium">Hệ thống nghiệm thu sửa chữa</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-sky-200 uppercase ml-1">Tài khoản</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-sky-200/50 group-focus-within:text-sky-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="Nhập tên đăng nhập"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-sky-200 uppercase ml-1">Mật khẩu</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-sky-200/50 group-focus-within:text-sky-400 transition-colors" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="Nhập mật khẩu"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-900/40 transform active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-4"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <span>Đăng nhập</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
            
            <div className="mt-8 text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Phiên bản 1.2.0</p>
            </div>
        </div>
    </div>
  );
};

export default Login;
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
      if (user && (password === username || password === '123')) {
        onLogin(user);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E6F4FA] via-white to-[#D9F0F9] pointer-events-none"></div>
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-[#42B0D5]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main content container */}
      <div className="w-full max-w-md z-10 flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
        {/* Logo & Title */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#00233D] rounded-full shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
            <Container className="w-10 h-10 text-[#42B0D5]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#00233D] tracking-tight uppercase">
            MATRAN <span className="text-[#42B0D5]">MNR</span>
          </h1>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="h-1 w-8 sm:w-10 bg-[#42B0D5] rounded"></div>
            <p className="text-[#00233D] text-xs sm:text-sm font-bold uppercase tracking-wider">
              QC Inspection System
            </p>
            <div className="h-1 w-8 sm:w-10 bg-[#42B0D5] rounded"></div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#42B0D5]/10">
          <form onSubmit={handleLogin} className="space-y-6 sm:space-y-7">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#00233D] uppercase tracking-wider ml-1">
                Tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-[#42B0D5]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-[#00233D] text-base sm:text-lg rounded-2xl py-4 pl-12 pr-4 placeholder-gray-400 focus:outline-none focus:border-[#42B0D5] focus:ring-4 focus:ring-[#42B0D5]/20 transition-all font-medium"
                  placeholder="Tên đăng nhập"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#00233D] uppercase tracking-wider ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#42B0D5]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-[#00233D] text-base sm:text-lg rounded-2xl py-4 pl-12 pr-4 placeholder-gray-400 focus:outline-none focus:border-[#42B0D5] focus:ring-4 focus:ring-[#42B0D5]/20 transition-all font-medium"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-800 text-sm font-medium p-4 rounded-2xl border border-red-200 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-3 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#42B0D5] hover:bg-[#2e9bc0] text-white font-bold py-4 sm:py-5 rounded-2xl shadow-lg shadow-[#42B0D5]/30 transform active:scale-95 transition-all flex items-center justify-center space-x-3 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-wider text-base">Đăng nhập</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Version footer */}
        <div className="mt-8 sm:mt-10 text-center">
          <div className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#42B0D5]/10 border border-[#42B0D5]/20">
            <p className="text-xs text-[#00233D] font-medium">
              Version 2.5.2 • 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

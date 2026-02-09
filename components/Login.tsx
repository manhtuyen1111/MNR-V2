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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
      {/* Background Elements - Sáng sủa, chuyên nghiệp */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-cyan-50 pointer-events-none"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/30 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-cyan-100/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fadeIn">
        {/* Logo Area */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-700 rounded-2xl shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <Container className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            MATRAN <span className="text-teal-700">MNR</span>
          </h1>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="h-1 w-8 bg-teal-600 rounded"></div>
            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">
              QC Inspection System
            </p>
            <div className="h-1 w-8 bg-teal-600 rounded"></div>
          </div>
        </div>

        {/* Login Box - Sạch sẽ, chuyên nghiệp */}
        <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-2xl shadow-teal-100/40">
          <form onSubmit={handleLogin} className="space-y-7">
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-700 uppercase tracking-wide ml-1">
                Tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-teal-600" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-2xl py-4 pl-12 pr-4 placeholder-gray-500 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-200 transition-all font-medium"
                  placeholder="Tên đăng nhập"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-700 uppercase tracking-wide ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-teal-600" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-2xl py-4 pl-12 pr-4 placeholder-gray-500 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-200 transition-all font-medium"
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
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-5 rounded-2xl shadow-lg shadow-teal-300/30 transform active:scale-95 transition-all flex items-center justify-center space-x-3 group"
              >
                {loading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-wide text-base">Đăng nhập</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-block px-5 py-2 rounded-full bg-teal-50 border border-teal-100">
            <p className="text-xs text-teal-800 font-medium">
              Version 2.5.2 • 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

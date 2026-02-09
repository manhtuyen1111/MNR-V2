import React, { useState } from 'react';
import { User } from '../types';
import { USERS } from '../constants';
import {
  User as UserIcon,
  Lock,
  ArrowRight,
  Loader2,
  Container,
  ShieldCheck
} from 'lucide-react';

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

      // Không tồn tại user
      if (!user) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setLoading(false);
        return;
      }

      // Worker: pass cố định = 123
      if (user.role === 'worker') {
        if (password !== '123') {
          setError('Tên đăng nhập hoặc mật khẩu không đúng');
          setLoading(false);
          return;
        }

        onLogin(user);
        return;
      }

      // Admin / QC: check password thật
      if (user.password !== password) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setLoading(false);
        return;
      }

      onLogin(user);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0f172a] to-[#020617] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[50%] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm z-10 animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.15)] mb-6">
            <Container className="w-12 h-12 text-[#020617]" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
            MATRAN <span className="text-sky-400">MNR</span>
          </h1>
          <div className="flex items-center justify-center space-x-3 mt-4">
            <div className="h-[2px] w-6 bg-sky-500" />
            <p className="text-white text-[11px] font-black uppercase tracking-[0.4em]">
              QC Inspection System
            </p>
            <div className="h-[2px] w-6 bg-sky-500" />
          </div>
        </div>

        {/* Login box */}
        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-sky-400 uppercase tracking-[0.2em] ml-2">
                Tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black border-2 border-slate-700 text-white text-lg rounded-2xl py-4.5 pl-14 pr-4 font-bold"
                  placeholder="Tên đăng nhập"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-sky-400 uppercase tracking-[0.2em] ml-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border-2 border-slate-700 text-white text-lg rounded-2xl py-4.5 pl-14 pr-4 font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500 text-white text-[12px] font-black p-4 rounded-2xl border-2 border-red-400 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-3" />
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-400 hover:bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center space-x-3"
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em]">
                    Bắt đầu làm việc
                  </span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

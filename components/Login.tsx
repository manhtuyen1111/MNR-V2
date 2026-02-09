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

      // Sai tài khoản hoặc mật khẩu
      if (!user || user.password !== password) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setLoading(false);
        return;
      }

      // OK
      onLogin(user);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0f172a] to-[#020617]" />
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[50%] bg-sky-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] mb-6">
            <Container className="w-12 h-12 text-[#020617]" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase">
            MATRAN <span className="text-sky-400">MNR</span>
          </h1>
        </div>

        {/* Login box */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                className="w-full bg-black border border-slate-700 text-white rounded-2xl py-4 pl-12"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full bg-black border border-slate-700 text-white rounded-2xl py-4 pl-12"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500 text-white text-sm font-bold p-3 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-400 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-5 h-5" />
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

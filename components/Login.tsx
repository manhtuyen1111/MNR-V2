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

      // không tồn tại user
      if (!user) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setLoading(false);
        return;
      }

      // worker không được login
      if (user.role === 'worker') {
        setError('Tài khoản này không được phép đăng nhập');
        setLoading(false);
        return;
      }

      // admin / qc → check password
      if (user.password !== password) {
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
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0f172a] to-[#020617] pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[50%] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-sm z-10 animate-fadeIn">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.15)] mb-6">
            <Container className="w-12 h-12 text-[#020617]" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
            MATRAN <span className="text-sky-400">MNR</span>
          </h1>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                className="w-full bg-black border-2 border-slate-700 text-white rounded-2xl py-4 pl-6"
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full bg-black border-2 border-slate-700 text-white rounded-2xl py-4 pl-6"
              />
            </div>

            {error && (
              <div className="bg-red-500 text-white text-sm font-bold p-4 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-400 text-black font-black py-4 rounded-2xl"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

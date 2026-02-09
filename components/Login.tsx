import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { USERS } from '../constants';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Container,
  ShieldCheck,
} from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = USERS[username.toLowerCase().trim()];
      if (user && (password === username || password === '123')) {
        onLogin(user);
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#FAFDFC] relative overflow-hidden">
      {/* Background tinh tế */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5FCFA] to-white pointer-events-none" />
      <div className="absolute top-[-25%] right-[-20%] w-[70%] h-[70%] bg-[#004D40]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
        {/* Branding */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#004D40] rounded-xl shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <Container className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#001F17] tracking-tight uppercase">
            MATRAN <span className="text-[#004D40]">MNR</span>
          </h1>
          <p className="text-[#455A64] text-sm sm:text-base font-semibold uppercase tracking-wider mt-4">
            Container Inspection & Repair Platform
          </p>
        </div>

        {/* Form card */}
        <div className="w-full bg-white border border-[#CFD8DC] rounded-3xl p-8 sm:p-10 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#455A64] uppercase tracking-wider ml-1">
                Username / Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-[#004D40]" />
                </div>
                <input
                  ref={usernameRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-[#CFD8DC] text-[#001F17] text-base sm:text-lg rounded-2xl py-4 pl-12 pr-4 placeholder-[#90A4AE] focus:outline-none focus:border-[#004D40] focus:ring-4 focus:ring-[#004D40]/15 transition-all font-medium"
                  placeholder="Enter username or employee ID"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#455A64] uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#004D40]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#CFD8DC] text-[#001F17] text-base sm:text-lg rounded-2xl py-4 pl-12 pr-12 placeholder-[#90A4AE] focus:outline-none focus:border-[#004D40] focus:ring-4 focus:ring-[#004D40]/15 transition-all font-medium"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#90A4AE] hover:text-[#004D40] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-800 text-sm font-medium p-4 rounded-2xl border border-red-200 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-3 shrink-0 text-red-700" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#004D40] hover:bg-[#00332B] text-white font-bold py-4 sm:py-5 rounded-2xl shadow-lg shadow-[#004D40]/20 transform active:scale-95 transition-all flex items-center justify-center space-x-3 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-wider text-base">Sign In</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-block px-5 py-2 rounded-full bg-[#004D40]/5 border border-[#004D40]/10">
            <p className="text-xs text-[#455A64] font-medium">
              Container Inspection & Repair Platform • v2.5.2 • 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

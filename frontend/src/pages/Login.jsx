import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLocalError('Username dan password harus diisi.');
      return;
    }

    setLocalError('');
    setSubmitting(true);

    try {
      await login(username, password);
    } catch (err) {
      setSubmitting(false);
    }
  };

  // Quick select helper for testing
  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setLocalError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-secondaryNavy-dark via-secondaryNavy to-slate-900 px-4 relative overflow-hidden">
      
      {/* Dynamic background lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accentGold/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-accentGold to-amber-400 items-center justify-center font-black text-secondaryNavy-dark text-3xl shadow-xl shadow-amber-500/10 mb-3 transform hover:scale-105 transition duration-300">
            RW
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wider leading-none">RECLAWATCH</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Sistem Informasi Pemantauan Progres Reklamasi</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-6">Masuk ke Akun Anda</h2>

          {(error || localError) && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-3 text-red-200 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/40 hover:bg-slate-950/60 focus:bg-slate-950/80 border border-slate-800 focus:border-accentGold/60 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all duration-200"
                  placeholder="Masukkan username Anda"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/40 hover:bg-slate-950/60 focus:bg-slate-950/80 border border-slate-800 focus:border-accentGold/60 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all duration-200"
                  placeholder="Masukkan password Anda"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-accentGold to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-700 disabled:to-slate-800 text-secondaryNavy-dark font-bold text-sm tracking-wider rounded-xl transition duration-200 shadow-lg shadow-amber-500/10 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-secondaryNavy-dark border-t-transparent animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <span>MASUK SEKARANG</span>
              )}
            </button>
          </form>

          {/* Quick Login Helper Panel */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
              Login Cepat (Uji Coba)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="py-2 px-1 bg-slate-950/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg text-center transition"
              >
                <div className="font-bold text-[10px] text-accentGold uppercase">Admin</div>
                <div className="mt-0.5 text-[9px] text-slate-500">admin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('surveyor', 'surveyor123')}
                className="py-2 px-1 bg-slate-950/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg text-center transition"
              >
                <div className="font-bold text-[10px] text-sky-400 uppercase">Surveyor</div>
                <div className="mt-0.5 text-[9px] text-slate-500">surveyor123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('auditor', 'auditor123')}
                className="py-2 px-1 bg-slate-950/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg text-center transition"
              >
                <div className="font-bold text-[10px] text-emerald-400 uppercase">Auditor</div>
                <div className="mt-0.5 text-[9px] text-slate-500">auditor123</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, ShieldAlert, Camera, ArrowRight, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';

export default function LoginPage({ onSwitchToRegister }) {
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('budi.santoso@example.com');
  const [password, setPassword] = useState('12345678');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, password);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Brand Showcase */}
        <div className="lg:col-span-7 space-y-6 text-slate-100 pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" />
            Aplikasi Resmi Pelaporan Masyarakat
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Lapor<span className="text-sky-400">Jalan</span>
            </h1>
          </div>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Laporkan jalan rusak, berlubang, atau ambles di sekitar Anda secara langsung. Dilengkapi titik lokasi GPS presisi, foto bukti, dan pelacakan status penanganan real-time oleh Dinas Terkait.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">GPS Presisi</h4>
                <p className="text-xs text-slate-400 mt-0.5">Deteksi koordinat lokasi otomatis di peta</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Foto Bukti</h4>
                <p className="text-xs text-slate-400 mt-0.5">Unggah foto langsung untuk verifikasi cepat</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Tracking Status</h4>
                <p className="text-xs text-slate-400 mt-0.5">Pantau progres penanganan hingga selesai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800/80 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Masuk Akun</h2>
              <p className="text-slate-400 text-sm mt-1">Silakan masuk untuk mulai membuat pelaporan jalan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Pelapor</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500" />
                  Ingat Saya
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-sky-400 hover:underline">Lupa password?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Masuk Akun
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-medium absolute">Atau Akses Cepat</span>
            </div>

            {/* Quick Demo Login Button */}
            <button
              onClick={quickDemoLogin}
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all group"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              Masuk Cepat sebagai Demo User (Budi Santoso)
            </button>

            <p className="text-center text-xs text-slate-500">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-sky-400 font-semibold hover:underline bg-transparent border-0 p-0 inline"
              >
                Daftar Warga Baru
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

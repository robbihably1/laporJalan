import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, ArrowRight, CheckCircle2, Sparkles, AlertTriangle, Camera } from 'lucide-react';
import Logo from './Logo';

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      setIsLoading(false);
      if (res && res.success === false) {
        setErrorMessage(res.message || 'Gagal masuk akun. Periksa kembali email & password.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Gagal masuk akun');
    }
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

          <Logo size="lg" />

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
          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800/80 space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Masuk Akun</h2>
              <p className="text-slate-400 text-xs mt-1">Silakan masuk untuk mulai menggunakan portal pelaporan</p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-3 animate-shake">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  {errorMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Akun</label>
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

            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-slate-800 w-full"></div>
            </div>

            <p className="text-center text-xs text-slate-400 pt-1">
              Belum punya akun warga?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-sky-400 font-semibold hover:underline bg-transparent border-0 p-0 inline"
              >
                Daftar Warga Baru Sekarang
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

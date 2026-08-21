import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, Camera, ArrowRight, CheckCircle2, 
  UserCheck, Sparkles, UserPlus, FileText, Lock, Mail, Phone, Building2 
} from 'lucide-react';

export default function RegisterPage({ onSwitchToLogin, onRegistrationSubmitted }) {
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Jakarta Selatan');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !nik) {
      setErrorMsg('Harap lengkapi semua kolom yang wajib diisi!');
      return;
    }
    if (nik.length < 16) {
      setErrorMsg('NIK harus berjumlah 16 digit!');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await register({
        name,
        nik,
        email,
        phone: phone || '0812-0000-0000',
        city,
        password
      });

      setIsLoading(false);

      if (res && res.success === false) {
        setErrorMsg(res.message || 'Gagal mendaftar akun baru');
        return;
      }

      // Pass email & token to parent component to render Email Verification Page
      if (onRegistrationSubmitted) {
        onRegistrationSubmitted({
          email: res?.email || email,
          token: res?.token || 'vtoken_sample'
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mendaftar akun baru');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Brand Showcase */}
        <div className="lg:col-span-6 space-y-6 text-slate-100 pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" />
            Pendaftaran Akun Warga Terverifikasi
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
            Daftarkan akun warga Anda untuk menyampaikan laporan jalan rusak secara resmi, mengunggah bukti foto presisi, dan memantau status tindak lanjut oleh Dinas Terkait secara real-time.
          </p>

          {/* Verification Badges */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-xl glass-card border border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Identitas Terverifikasi</h4>
                <p className="text-xs text-slate-400">Pencatatan NIK untuk kepastian penanganan laporan valid</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl glass-card border border-slate-800">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Verifikasi Email Keaktifan Akun</h4>
                <p className="text-xs text-slate-400">Default akun berstatus Nonaktif hingga email diverifikasi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form Card */}
        <div className="lg:col-span-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800/80 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                <UserPlus className="w-4 h-4" /> Formulir Registrasi
              </div>
              <h2 className="text-2xl font-bold text-white">Daftar Akun Baru</h2>
              <p className="text-slate-400 text-xs mt-1">Lengkapi data Anda di bawah ini untuk membuat akun pelapor</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Nama Lengkap *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Rudi Hermawan"
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl glass-input text-xs placeholder-slate-500"
                  />
                </div>
              </div>

              {/* NIK & Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">NIK (16 Digit) *</label>
                  <input
                    type="text"
                    maxLength={16}
                    required
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="3171012345670001"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">No. Telepon / WA</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email & Kota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Email Pelapor *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rudi@example.com"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Kata Sandi *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs placeholder-slate-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Daftar Akun Baru Sekarang
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-medium absolute">Sudah Punya Akun?</span>
            </div>

            {/* Switch to Login Button */}
            <button
              onClick={onSwitchToLogin}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              Masuk Akun Sekarang
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function EmailVerificationPage({ email, token, onVerificationSuccess, onBackToLogin }) {
  const [activationMessage, setActivationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-check in background if the email has been activated via link in email inbox
  const checkStatus = async () => {
    try {
      const res = await authApi.checkVerificationStatus(email, token);
      if (res && res.verified) {
        setIsSuccess(true);
        setActivationMessage('Akun Anda telah terverifikasi & Aktif! Mengalihkan ke Halaman Login...');
        setTimeout(() => {
          if (onVerificationSuccess) onVerificationSuccess();
        }, 1500);
      }
    } catch (err) {
      console.warn("Check verification status error:", err.message);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [email, token]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 text-center space-y-6">
          
          {/* Animated Email Envelope Icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/30 animate-pulse">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Heading & Information */}
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              Status Akun: Nonaktif (Menunggu Aktivasi Email)
            </span>
            <h2 className="text-2xl font-black text-white">Cek Email Anda Untuk Aktivasi</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Tautan aktivasi akun telah dikirimkan ke alamat email berikut:
            </p>
            <div className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-mono text-xs font-bold truncate shadow-inner">
              {email || 'user@example.com'}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pt-1">
              Silakan buka kotak masuk email Anda dan klik tautan aktivasi yang tersedia. Bila email belum terlihat di Inbox utama, periksa juga folder <strong>Spam/Junk</strong>.
            </p>
          </div>

          {/* Activation Success / Alert Banner */}
          {activationMessage && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 animate-bounce ${
              isSuccess ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{activationMessage}</span>
            </div>
          )}

          {/* Back to Login button */}
          <div className="pt-4 border-t border-slate-900">
            <button
              onClick={onBackToLogin}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Kembali ke Halaman Login</span>
              <ArrowRight className="w-4 h-4 text-sky-400" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

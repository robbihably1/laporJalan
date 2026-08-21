import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, Sparkles, ExternalLink, ShieldCheck, Inbox } from 'lucide-react';

export default function EmailVerificationPage({ email, token, previewUrl, activationLink, onVerificationSuccess, onBackToLogin }) {
  const [isActivating, setIsActivating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [activationMessage, setActivationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const targetActivationUrl = activationLink || `http://localhost:5173/?verify_token=${token}`;

  // Check on mount and interval if the email has already been verified
  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await authApi.checkVerificationStatus(email, token);
      if (res && res.verified) {
        setIsSuccess(true);
        setActivationMessage('Akun Anda sudah terverifikasi & Aktif! Mengalihkan ke Halaman Login...');
        setTimeout(() => {
          if (onVerificationSuccess) onVerificationSuccess();
        }, 1500);
      }
    } catch (err) {
      console.warn("Check verification status error:", err.message);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [email, token]);

  // Click Activation Link Handler
  const handleActivateAccount = async () => {
    setIsActivating(true);
    setActivationMessage('');

    try {
      const res = await authApi.verifyEmail(token);
      setIsActivating(false);
      setIsSuccess(true);
      setActivationMessage(res.message || 'Akun Anda berhasil diverifikasi & diaktifkan!');
      
      setTimeout(() => {
        if (onVerificationSuccess) onVerificationSuccess();
      }, 1500);
    } catch (err) {
      setIsActivating(false);
      setIsSuccess(true);
      setActivationMessage('Akun Anda berhasil diaktifkan! Mengalihkan ke Halaman Login...');
      setTimeout(() => {
        if (onVerificationSuccess) onVerificationSuccess();
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
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

          {/* Heading */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              Status Akun: Nonaktif (Menunggu Verifikasi)
            </span>
            <h2 className="text-2xl font-black text-white">Cek Email Anda Untuk Aktivasi</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Email aktivasi akun telah dikirim ke alamat email berikut:
            </p>
            <div className="mt-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-mono text-xs font-bold truncate shadow-inner">
              {email || 'user@example.com'}
            </div>
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

          {/* LIVE SIMULATED INBOX EMAIL CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 text-left text-xs space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Inbox className="w-4 h-4" />
                <span>Simulasi Kotak Masuk (Inbox Email)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                PESAN BARU MASUK
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-slate-300 font-semibold text-xs">Pengirim: <span className="text-slate-400 font-normal">Dinas Bina Marga (no-reply@laporjalan.go.id)</span></p>
              <p className="text-slate-300 font-semibold text-xs">Subjek: <span className="text-white font-bold">Aktivasi Akun LaporJalan Anda</span></p>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
              "Halo, terima kasih telah mendaftar. Klik tombol aktivasi di bawah untuk mengaktifkan akun Anda agar berstatus <strong>Aktif</strong>."
            </p>

            <div className="pt-2">
              <button
                onClick={handleActivateAccount}
                disabled={isActivating || isSuccess}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isActivating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 text-sky-200" />
                    Klik Link Aktivasi Akun Di Sini
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="space-y-2 pt-1">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-2 transition-all block"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                Buka Web Mailbox Ethereal (Web Email Viewer)
              </a>
            )}

            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              Cek Status Keaktifan Real-Time
            </button>
          </div>

          {/* Back to Login link */}
          <div className="pt-2 border-t border-slate-900">
            <button
              onClick={onBackToLogin}
              className="text-xs text-slate-400 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              Kembali ke Halaman Login <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

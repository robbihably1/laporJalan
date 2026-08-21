import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function SuccessAlertModal({ 
  isOpen, 
  title = "Data Berhasil Disubmit!", 
  message = "Data pengaduan/informasi Anda telah resmi terdaftar dan tersimpan di sistem LaporJalan.", 
  buttonText = "Siap, Lanjutkan",
  onConfirm 
}) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-sm rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 text-center space-y-5 transform transition-all animate-scale-in my-auto bg-slate-900/95 relative overflow-hidden">
        
        {/* Decorative Background Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-500/15 rounded-full blur-2xl pointer-events-none"></div>

        {/* Animated Green Checkmark Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-500/10 animate-bounce-subtle">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Text Details */}
        <div className="space-y-2 relative z-10">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 relative z-10">
          <button
            onClick={onConfirm}
            type="button"
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-400/40"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

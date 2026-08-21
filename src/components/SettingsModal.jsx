import React from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  X, Settings, Moon, Sun, Check, Sparkles, Shield, Palette 
} from 'lucide-react';

export default function SettingsModal({ onClose }) {
  const { theme, setTheme } = useTheme();

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl flex flex-col relative text-slate-100 my-auto">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pengaturan Aplikasi</h3>
              <p className="text-[11px] text-slate-400">Sesuaikan tampilan & tema aplikasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Palette className="w-4 h-4" /> Tema Tampilan (Theme Switcher)
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih mode tema tampilan sesuai kenyamanan Anda. Tema terang mengusung warna putih bersih dengan <strong>Aksen Hijau Khas Bogor</strong>.
            </p>

            {/* Theme Options */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              
              {/* Option 1: Dark Mode */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all text-center group ${
                  theme === 'dark'
                    ? 'border-sky-500 bg-sky-500/15 text-white ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold block">Mode Gelap (Dark)</h4>
                  <span className="text-[10px] opacity-75">Tampilan Default Dark</span>
                </div>
                {theme === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </span>
                )}
              </button>

              {/* Option 2: Light Mode (Khas Bogor Green) */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all text-center group ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold block">Mode Terang (Light)</h4>
                  <span className="text-[10px] text-emerald-400 font-semibold">Putih + Hijau Khas Bogor</span>
                </div>
                {theme === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </span>
                )}
              </button>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Selesai</span>
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

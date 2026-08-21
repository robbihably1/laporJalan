import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from './UserProfileModal';
import { 
  MapPin, PlusCircle, History, Map as MapIcon, LogOut, 
  Users, Shield, User, ChevronDown, Settings 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-card border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab(isAdmin ? 'history' : 'add')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform ${
              isAdmin ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/20' : 'bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-sky-500/20'
            }`}>
              {isAdmin ? <Shield className="w-5 h-5 text-white" /> : <MapPin className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white tracking-tight">
                  Lapor<span className="text-sky-400">Jalan</span>
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                {isAdmin ? 'Sistem Informasi Bina Marga' : 'Portal Pelaporan Warga'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            
            {!isAdmin && (
              <button
                onClick={() => setActiveTab('add')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'add'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Tambah Laporan
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              {isAdmin ? 'Semua Laporan Warga' : 'Histori Pelaporan'}
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Peta Sebaran
            </button>

            {/* Special Menu for ADMIN: Kelola Users */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                Kelola Users
              </button>
            )}
          </nav>

          {/* User / Admin Profile Dropdown Menu */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              
              {/* Profile Button Trigger */}
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                  alt={user.name}
                  className={`w-9 h-9 rounded-full object-cover ring-2 transition-transform group-hover:scale-105 ${
                    isAdmin ? 'ring-indigo-500/60' : 'ring-sky-500/40'
                  }`}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-100 line-clamp-1">{user.name}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {isAdmin ? 'Administrator' : (user.city || 'Warga Terdaftar')}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
              </button>

              {/* Interactive Profile Dropdown Card */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl p-2 z-50 animate-fade-in space-y-1 text-xs">
                  
                  {/* User Profile Summary Header */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/60 mb-1">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {isAdmin ? 'Administrator' : 'Akun Warga'}
                    </span>
                  </div>

                  {/* Option 1: Profil Saya */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sky-500/10 text-slate-300 hover:text-sky-300 font-semibold transition-colors text-left group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-sky-500/20 text-slate-400 group-hover:text-sky-400">
                      <User className="w-4 h-4" />
                    </div>
                    <span>Profil Saya</span>
                  </button>

                  {/* Option 2: Keluar Akun */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 font-semibold transition-colors text-left group border-t border-slate-900 pt-2"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-rose-500/20 text-slate-400 group-hover:text-rose-400">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span>Keluar Akun</span>
                  </button>

                </div>
              )}

            </div>
          )}

        </div>
      </header>

      {/* User Profile Edit Modal */}
      {isProfileModalOpen && (
        <UserProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
    </>
  );
}

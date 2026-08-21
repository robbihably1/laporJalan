import React from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Map as MapIcon, Users, FileSpreadsheet } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 px-3 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold transition-all ${
            activeTab === 'history' || activeTab === 'add' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'history' || activeTab === 'add' ? 'bg-sky-500/20' : ''}`}>
            <History className="w-5 h-5" />
          </div>
          {isAdmin ? 'Laporan' : 'Pelaporan'}
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold transition-all ${
            activeTab === 'map' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'map' ? 'bg-sky-500/20' : ''}`}>
            <MapIcon className="w-5 h-5" />
          </div>
          Peta
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === 'users' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'users' ? 'bg-indigo-500/20' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            Users
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === 'summary' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'summary' ? 'bg-indigo-500/20' : ''}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            Rekap
          </button>
        )}
      </div>
    </div>
  );
}

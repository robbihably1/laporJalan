import React, { useState } from 'react';
import { useReports } from '../context/ReportContext';
import { useAuth } from '../context/AuthContext';
import ReportDetailModal from './ReportDetailModal';
import { 
  History, Search, Filter, MapPin, Calendar, Eye, 
  CheckCircle2, Clock, AlertCircle, PlusCircle, User, Globe, XCircle, ChevronDown 
} from 'lucide-react';

export default function HistoryList({ onAddNewReport }) {
  const { reports } = useReports();
  const { user } = useAuth();
  
  const [scopeFilter, setScopeFilter] = useState('mine'); // 'mine' (Laporan Saya) | 'all' (Semua Laporan Publik)
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReport, setActiveReport] = useState(null);
  const [visibleCount, setVisibleCount] = useState(30);

  // Filtering reports by session user scope, status, and search
  const filteredReports = (reports || []).filter((rep) => {
    const isMine = scopeFilter === 'all' || 
      (rep.userId && user?.id && rep.userId === user.id) ||
      (rep.userName && user?.name && rep.userName.toLowerCase() === user.name.toLowerCase());

    const matchesStatus = selectedStatus === 'Semua' || rep.status === selectedStatus;
    const matchesSearch = !searchQuery ||
      (rep.title && rep.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rep.locationName && rep.locationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rep.id && rep.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rep.category && rep.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return isMine && matchesStatus && matchesSearch;
  });

  // Base list according to scope
  const scopedReports = (reports || []).filter(rep => {
    if (scopeFilter === 'all') return true;
    return (rep.userId && user?.id && rep.userId === user.id) ||
           (rep.userName && user?.name && rep.userName.toLowerCase() === user.name.toLowerCase());
  });

  // Count stats based on current scope
  const totalCount = scopedReports.length;
  const pendingCount = scopedReports.filter(r => r.status === 'Menunggu').length;
  const inProgressCount = scopedReports.filter(r => r.status === 'Diproses').length;
  const completedCount = scopedReports.filter(r => r.status === 'Selesai').length;
  const rejectedCount = scopedReports.filter(r => r.status === 'Ditolak').length;

  const displayedReports = filteredReports.slice(0, visibleCount);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai</span>;
      case 'Diproses':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Diproses</span>;
      case 'Ditolak':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Menunggu</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" /> Menu Pelaporan Saya
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Histori Pelaporan Jalan
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Terhubung dengan sesi akun <strong className="text-slate-200">{user?.name || 'Pelapor'}</strong> ({user?.email})
          </p>
        </div>

        {user?.role !== 'admin' && (
          <button
            onClick={onAddNewReport}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Laporan Baru
          </button>
        )}
      </div>

      {/* Scope Filter Tabs (Laporan Saya vs Semua Laporan Publik) */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-80">
          <button
            onClick={() => { setScopeFilter('mine'); setVisibleCount(30); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              scopeFilter === 'mine'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Laporan Saya
          </button>
          <button
            onClick={() => { setScopeFilter('all'); setVisibleCount(30); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              scopeFilter === 'all'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Semua Laporan Publik
          </button>
        </div>

        <span className="hidden sm:block text-xs text-slate-400 font-medium pr-3">
          {scopeFilter === 'mine' ? `Menampilkan ${totalCount} laporan akun Anda` : `Menampilkan seluruh laporan publik (${totalCount})`}
        </span>
      </div>

      {/* Summary Stat Cards (5 Grid Columns including Ditolak) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Laporan</span>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-xs text-amber-300 font-medium">Menunggu</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
          <span className="text-xs text-sky-300 font-medium">Diproses</span>
          <p className="text-2xl font-black text-sky-400 mt-1">{inProgressCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-xs text-emerald-300 font-medium">Selesai</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 col-span-2 sm:col-span-1">
          <span className="text-xs text-rose-300 font-medium">Ditolak</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(30); }}
            placeholder="Cari ID, jalan, atau keterangan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        {/* Status Filter Tabs (Semua, Menunggu, Diproses, Selesai, Ditolak) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['Semua', 'Menunggu', 'Diproses', 'Selesai', 'Ditolak'].map((st) => (
            <button
              key={st}
              onClick={() => { setSelectedStatus(st); setVisibleCount(30); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? st === 'Ditolak' 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                    : 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* Report Cards Grid */}
      {filteredReports.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Tidak Ada Laporan Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {scopeFilter === 'mine' 
              ? 'Anda belum memiliki riwayat laporan untuk filter ini.'
              : 'Tidak ada data laporan publik yang sesuai dengan filter atau pencarian Anda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setActiveReport(report)}
                className="glass-card glass-card-hover rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={report.photoUrl}
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-sky-400 border border-slate-800">
                      {report.id}
                    </div>
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        {report.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(report.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-sky-400 transition-colors">
                      {report.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{report.locationName}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                  <span>Lihat Detail Tracking</span>
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button if filtered items exceed visibleCount */}
          {visibleCount < filteredReports.length && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount(prev => prev + 30)}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-sky-300 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <span>Tampilkan Lebih Banyak Laporan ({filteredReports.length - visibleCount} tersisa)</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail Report */}
      {activeReport && (
        <ReportDetailModal
          report={activeReport}
          onClose={() => setActiveReport(null)}
        />
      )}

    </div>
  );
}

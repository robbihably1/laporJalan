import React, { useState } from 'react';
import { useReports } from '../context/ReportContext';
import { useAuth } from '../context/AuthContext';
import ReportDetailModal from './ReportDetailModal';
import { 
  History, Search, Filter, PlusCircle, CheckCircle2, 
  Clock, XCircle, AlertCircle, Eye, User, Globe, ChevronDown, Shield 
} from 'lucide-react';

export default function HistoryList({ onAddNewReport }) {
  const { reports } = useReports();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeReport, setActiveReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [scopeFilter, setScopeFilter] = useState('mine'); // 'mine' | 'all'
  const [visibleCount, setVisibleCount] = useState(30);

  // Filter reports based on searchQuery, selectedStatus, selectedCategory, and scopeFilter
  const filteredReports = reports.filter((rep) => {
    // 1. Scope Filter (Only for regular users)
    if (!isAdmin && scopeFilter === 'mine') {
      const isMine = (rep.userId && user?.id && rep.userId === user.id) ||
                     (rep.userName && user?.name && rep.userName.toLowerCase() === user.name.toLowerCase());
      if (!isMine) return false;
    }

    // 2. Status Filter
    if (selectedStatus !== 'Semua' && rep.status !== selectedStatus) {
      return false;
    }

    // 3. Category Filter
    if (selectedCategory !== 'Semua' && rep.category !== selectedCategory) {
      return false;
    }

    // 4. Search Term Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = 
        rep.title.toLowerCase().includes(q) ||
        rep.locationName.toLowerCase().includes(q) ||
        rep.id.toLowerCase().includes(q) ||
        (rep.userName && rep.userName.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  // Calculate scope count
  const scopedReports = reports.filter((rep) => {
    if (isAdmin) return true;
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
            {isAdmin ? <Shield className="w-4 h-4 text-indigo-400" /> : <History className="w-4 h-4" />}
            {isAdmin ? 'Menu Administrator - Semua Laporan Warga' : 'Menu Pelaporan'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {isAdmin ? 'Semua Pengaduan Laporan Warga' : 'Daftar Pelaporan Jalan'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {isAdmin ? `Menampilkan seluruh ${totalCount} laporan warga masyarakat` : `Terhubung dengan akun ${user?.name || 'Pelapor'} (${user?.email})`}
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={onAddNewReport}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Laporan Baru
          </button>
        )}
      </div>

      {/* Scope Filter Tabs (Only shown for regular Users, HIDDEN FOR ADMIN to directly display all citizen reports) */}
      {!isAdmin && (
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
      )}

      {/* Summary Stat Cards (5 Grid Columns including Ditolak) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Laporan</span>
          <p className="text-2xl font-black text-slate-100 mt-1">{totalCount}</p>
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

        {/* Filter Selects */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-1/2 sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setVisibleCount(30); }}
              className="w-full sm:w-40 px-3 py-2 rounded-xl glass-input text-xs"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Diproses">Diproses</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="w-1/2 sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setVisibleCount(30); }}
              className="w-full sm:w-44 px-3 py-2 rounded-xl glass-input text-xs"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Jalan Berlubang">Jalan Berlubang</option>
              <option value="Jalan Ambles">Jalan Ambles</option>
              <option value="Retak & Penerangan">Retak & Penerangan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

      </div>

      {/* Reports Card Grid */}
      {filteredReports.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Belum Ada Data Laporan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedStatus !== 'Semua' || selectedCategory !== 'Semua'
              ? 'Tidak ada laporan yang sesuai dengan filter pencarian Anda. Coba reset filter.'
              : 'Belum ada laporan kerusakan jalan yang tercatat.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedReports.map((report) => (
            <div 
              key={report.id}
              className="glass-card rounded-2xl border border-slate-800 overflow-hidden glass-card-hover flex flex-col justify-between"
            >
              {/* Image Banner */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden group">
                <img 
                  src={report.image || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop'} 
                  alt={report.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono text-sky-400 font-bold">{report.id}</span>
                    {getStatusBadge(report.status)}
                  </div>

                  <h4 className="text-base font-bold text-slate-100 line-clamp-1">{report.title}</h4>
                  <p className="text-slate-400 text-xs line-clamp-2 mt-1">{report.locationName}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Kategori:</span>
                    <span className="text-slate-200 font-semibold">{report.category}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Pelapor:</span>
                    <span className="text-slate-300 font-semibold">{report.userName || 'Masyarakat'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>{new Date(report.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                </div>

                {/* Footer Action */}
                <button
                  onClick={() => setActiveReport(report)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-sky-400 hover:text-sky-300 font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <Eye className="w-4 h-4" />
                  Lihat Detail Laporan
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination Load More Button */}
      {visibleCount < filteredReports.length && (
        <div className="p-4 text-center">
          <button
            onClick={() => setVisibleCount(prev => prev + 30)}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <span>Tampilkan Lebih Banyak Laporan ({filteredReports.length - visibleCount} tersisa)</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {activeReport && (
        <ReportDetailModal 
          report={activeReport} 
          onClose={() => setActiveReport(null)} 
        />
      )}

    </div>
  );
}

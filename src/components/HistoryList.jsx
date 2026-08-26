import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReports } from '../context/ReportContext';
import { useAuth } from '../context/AuthContext';
import ReportDetailModal from './ReportDetailModal';
import { 
  History, Search, Filter, PlusCircle, CheckCircle2, 
  Clock, XCircle, AlertCircle, Eye, User, Globe, ChevronDown, Shield,
  LayoutGrid, List, ExternalLink, Maximize2, Image as ImageIcon, X,
  Calendar, RotateCcw, RefreshCw
} from 'lucide-react';

export default function HistoryList({ onAddNewReport }) {
  const { reports, fetchReports, isLoading, showToast } = useReports();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeReport, setActiveReport] = useState(null);
  const [previewPhotoReport, setPreviewPhotoReport] = useState(null);

  // Lock body scroll when attachment preview modal is active
  useEffect(() => {
    if (previewPhotoReport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [previewPhotoReport]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scopeFilter, setScopeFilter] = useState('mine'); // 'mine' | 'all'
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'
  const [visibleCount, setVisibleCount] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (fetchReports) {
        await fetchReports();
      }
      if (showToast) {
        showToast('Data laporan berhasil diperbarui!', 'success');
      }
    } catch (err) {
      console.warn("Refresh notice:", err.message);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filter reports based on searchQuery, selectedStatus, selectedCategory, date range, and scopeFilter
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

    // 5. Date Range Filter
    if (rep.createdAt) {
      const repDate = new Date(rep.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (repDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (repDate > end) return false;
      }
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
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full xl:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(30); }}
            placeholder="Cari ID, jalan, atau keterangan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        {/* Filter Selects & Date Range & View Mode Toggle */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full xl:w-auto">
          
          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-sky-400 ml-1 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setVisibleCount(30); }}
              className="px-2 py-1 rounded-lg glass-input text-xs w-full sm:w-32"
              title="Tanggal Mulai Pelaporan"
            />
            <span className="text-slate-500 text-xs font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setVisibleCount(30); }}
              className="px-2 py-1 rounded-lg glass-input text-xs w-full sm:w-32"
              title="Tanggal Akhir Pelaporan"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setVisibleCount(30); }}
                className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition-all flex-shrink-0"
                title="Reset Filter Tanggal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setVisibleCount(30); }}
              className="w-full sm:w-36 px-3 py-2 rounded-xl glass-input text-xs"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Diproses">Diproses</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setVisibleCount(30); }}
              className="w-full sm:w-40 px-3 py-2 rounded-xl glass-input text-xs"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Jalan Berlubang">Jalan Berlubang</option>
              <option value="Jalan Ambles">Jalan Ambles</option>
              <option value="Retak & Penerangan">Retak & Penerangan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* View Mode Toggle: Card vs List & Refresh Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Card vs List Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="Tampilan Mode Grid Card"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'card'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Tampilan Mode List Tabel"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Refresh Data Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              title="Refresh Data Laporan"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

      </div>

      {/* Reports Display (Card Grid vs Table List) */}
      {filteredReports.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Belum Ada Data Laporan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedStatus !== 'Semua' || selectedCategory !== 'Semua' || startDate || endDate
              ? 'Tidak ada laporan yang sesuai dengan filter pencarian Anda. Coba reset filter.'
              : 'Belum ada laporan kerusakan jalan yang tercatat.'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedReports.map((report) => (
            <div 
              key={report.id}
              className="glass-card rounded-2xl border border-slate-800 overflow-hidden glass-card-hover flex flex-col justify-between"
            >
              {/* Image Banner */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden group">
                <img 
                  src={report.photoUrl || report.image || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop'} 
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
      ) : (
        /* TABLE LIST VIEW */
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. / ID Laporan</th>
                  <th className="py-3.5 px-4">Foto Lampiran</th>
                  <th className="py-3.5 px-4">Judul & Lokasi Kerusakan</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Pelapor</th>
                  <th className="py-3.5 px-4">Tanggal Pelaporan</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {displayedReports.map((report) => (
                  <tr 
                    key={report.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* ID Laporan with Link to Detail Modal */}
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveReport(report)}
                        className="text-sky-400 hover:text-sky-300 font-bold hover:underline flex items-center gap-1.5 transition-colors group-hover:scale-105 transform origin-left"
                        title="Klik nomor laporan ini untuk melihat detail lengkap"
                      >
                        <span>{report.id}</span>
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                      </button>
                    </td>

                    {/* Foto Bukti - Klik langsung membuka lightbox detail lampiran foto saja */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div 
                        onClick={() => setPreviewPhotoReport(report)}
                        className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all flex-shrink-0 relative group/img shadow-sm"
                        title="Klik untuk melihat detail lampiran foto ukuran penuh"
                      >
                        <img
                          src={report.photoUrl || report.image || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop'}
                          alt={report.title}
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </td>

                    {/* Judul & Lokasi */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <button
                        type="button"
                        onClick={() => setActiveReport(report)}
                        className="text-left font-bold text-slate-100 hover:text-sky-400 transition-colors line-clamp-1 block"
                      >
                        {report.title}
                      </button>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {report.locationName}
                      </p>
                    </td>

                    {/* Kategori */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-100 dark:text-slate-100">
                      {report.category}
                    </td>

                    {/* Pelapor */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-semibold">
                      {report.userName || 'Masyarakat'}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400">
                      <div>{new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-slate-500">{new Date(report.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Full Report Detail Modal */}
      {activeReport && (
        <ReportDetailModal 
          report={activeReport} 
          onClose={() => setActiveReport(null)} 
        />
      )}

      {/* Standalone Attachment Lightbox Modal rendered at document.body with z-[99999] */}
      {previewPhotoReport && createPortal(
        <div 
          onClick={() => setPreviewPhotoReport(null)}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-3 sm:p-6 bg-slate-950/98 backdrop-blur-2xl animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center my-auto"
          >
            
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between gap-2 mb-3 px-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 truncate">
                <ImageIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="truncate">Lampiran Foto - {previewPhotoReport.id}</span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={previewPhotoReport.photoUrl || previewPhotoReport.image}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-md transition-all active:scale-95 flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buka Tab Baru</span>
                </a>

                {/* Clean Slate Close Button matching User View */}
                <button
                  onClick={() => setPreviewPhotoReport(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 flex items-center justify-center border border-slate-700/60"
                  title="Tutup Preview Foto"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Viewer Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/90 shadow-2xl flex items-center justify-center p-2 max-h-[82vh] w-full">
              <img
                src={previewPhotoReport.photoUrl || previewPhotoReport.image}
                alt={previewPhotoReport.title}
                className="max-h-[78vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-lg"
              />
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { useReports } from '../context/ReportContext';
import { useAuth } from '../context/AuthContext';
import ReportDetailModal from './ReportDetailModal';
import { 
  FileSpreadsheet, Printer, Filter, Search, Calendar, 
  CheckCircle2, Clock, XCircle, AlertCircle, Eye, 
  RotateCcw, Shield, PieChart, Download 
} from 'lucide-react';

export default function AdminReportSummary() {
  const { reports } = useReports();
  const { user } = useAuth();

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSeverity, setSelectedSeverity] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeReport, setActiveReport] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Filter Logic
  const filteredReports = reports.filter((rep) => {
    // 1. Status Filter
    const matchesStatus = selectedStatus === 'Semua' || rep.status === selectedStatus;

    // 2. Category Filter
    const matchesCategory = selectedCategory === 'Semua' || rep.category === selectedCategory;

    // 3. Severity Filter
    const matchesSeverity = selectedSeverity === 'Semua' || rep.severity === selectedSeverity;

    // 4. Date Range Filter
    let matchesDate = true;
    if (rep.createdAt) {
      const repDate = new Date(rep.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (repDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (repDate > end) matchesDate = false;
      }
    }

    // 5. Search Term Filter
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      rep.title.toLowerCase().includes(q) ||
      rep.locationName.toLowerCase().includes(q) ||
      rep.id.toLowerCase().includes(q) ||
      (rep.userName && rep.userName.toLowerCase().includes(q));

    return matchesStatus && matchesCategory && matchesSeverity && matchesDate && matchesSearch;
  });

  // Calculate Stat Summaries
  const totalCount = filteredReports.length;
  const pendingCount = filteredReports.filter(r => r.status === 'Menunggu').length;
  const inProgressCount = filteredReports.filter(r => r.status === 'Diproses').length;
  const completedCount = filteredReports.filter(r => r.status === 'Selesai').length;
  const rejectedCount = filteredReports.filter(r => r.status === 'Ditolak').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Reset Filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStatus('Semua');
    setSelectedCategory('Semua');
    setSelectedSeverity('Semua');
    setSearchQuery('');
  };

  // EXPORT TO EXCEL (.xlsx) FUNCTION
  const exportToExcel = () => {
    if (filteredReports.length === 0) {
      alert('Tidak ada data laporan yang sesuai filter untuk diekspor!');
      return;
    }

    const excelData = filteredReports.map((r, index) => ({
      'No': index + 1,
      'ID Laporan': r.id,
      'Tanggal Laporan': new Date(r.createdAt).toLocaleDateString('id-ID'),
      'Nama Pelapor': r.userName || 'Masyarakat',
      'No. Telepon / WA': r.userPhone || '-',
      'Kategori Kerusakan': r.category,
      'Tingkat Urgensi': r.severity || 'Sedang',
      'Lokasi Jalan': r.locationName || '-',
      'Status Penanganan': r.status,
      'Keterangan Pelapor': r.description || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 20 }, // ID Laporan
      { wch: 16 }, // Tanggal
      { wch: 22 }, // Nama Pelapor
      { wch: 16 }, // No HP
      { wch: 22 }, // Kategori
      { wch: 14 }, // Urgensi
      { wch: 38 }, // Lokasi
      { wch: 16 }, // Status
      { wch: 45 }  // Keterangan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Laporan');

    const fileName = `Rekap_LaporJalan_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // BACKEND PDF GENERATION & SILENT DOWNLOAD (Mengirim Parameter Filter ke Backend)
  const exportToPDF = async () => {
    if (filteredReports.length === 0) {
      alert('Tidak ada data laporan yang sesuai filter untuk diekspor ke PDF!');
      return;
    }

    setIsExportingPDF(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (selectedStatus && selectedStatus !== 'Semua') params.append('status', selectedStatus);
      if (selectedCategory && selectedCategory !== 'Semua') params.append('category', selectedCategory);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const pdfUrl = `http://localhost:5000/api/reports/export/pdf?${params.toString()}`;

      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Server PDF status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Rekap_LaporJalan_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error('Error downloading PDF from backend:', err);
      alert('Gagal mendownload PDF dari server: ' + err.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

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
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" /> Administrator Dashboard - Rekapitulasi & Ekspor Laporan
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Rekapitulasi & Laporan Pengaduan
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Filter data laporan, pratinjau rekapitulasi, serta langsung download file Excel (.xlsx) dan PDF (Landscape).
            </p>
          </div>
        </div>
      </div>

      {/* FILTER FORM CARD (Tampilan Awal Filter) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Formulir Penyaringan Data Rekapitulasi
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-slate-100 flex items-center gap-1 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Rentang Tanggal Mulai */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Mulai (Dari):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Rentang Tanggal Selesai */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Selesai (Sampai):</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Status Penanganan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Penanganan:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu Verifikasi</option>
              <option value="Diproses">Dalam Pengerjaan (Diproses)</option>
              <option value="Selesai">Selesai Dibereskan</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          {/* Kategori Kerusakan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategori Kerusakan:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Jalan Berlubang">Jalan Berlubang</option>
              <option value="Jalan Ambles">Jalan Ambles</option>
              <option value="Retak & Penerangan">Retak & Penerangan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

        </div>

        {/* Second Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tingkat Urgensi:</label>
            <div className="flex items-center gap-2">
              {['Semua', 'Ringan', 'Sedang', 'Parah'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedSeverity === sev
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pencarian Kata Kunci:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, jalan, nama pelapor..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS (Preview, Export Excel .xlsx, Direct Download PDF) */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          
          <button
            onClick={() => setIsPreviewActive(prev => !prev)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
              isPreviewActive
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            {isPreviewActive ? 'Pratinjau Tabel Aktif' : 'Tampilkan Pratinjau Rekap'}
          </button>

          <div className="flex items-center gap-3">
            {/* Export Excel (.xlsx) Button */}
            <button
              onClick={exportToExcel}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span className="text-white font-bold">Export to Excel (.xlsx)</span>
            </button>

            {/* Direct Download PDF Button */}
            <button
              onClick={exportToPDF}
              disabled={isExportingPDF}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white font-bold">Mengunduh PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span className="text-white font-bold">Export to PDF (Download Langsung)</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* SUMMARY STAT CARDS BASED ON FILTER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Hasil Filtered Data</span>
          <p className="text-2xl font-black text-slate-100 mt-1">{totalCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-xs text-amber-300 font-medium">Menunggu Verifikasi</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
          <span className="text-xs text-sky-300 font-medium">Dalam Pengerjaan</span>
          <p className="text-2xl font-black text-sky-400 mt-1">{inProgressCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-xs text-emerald-300 font-medium">Selesai</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 col-span-2 sm:col-span-1">
          <span className="text-xs text-indigo-300 font-medium">Tingkat Penanganan</span>
          <p className="text-2xl font-black text-indigo-400 mt-1">{completionRate}%</p>
        </div>
      </div>

      {/* LIVE PREVIEW RECAP TABLE */}
      {isPreviewActive && (
        <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl space-y-2">
          
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-100">Pratinjau Tabel Rekapitulasi Laporan</h3>
            </div>
            <span className="text-xs text-slate-400">
              Menampilkan {filteredReports.length} laporan sesuai kriteria filter
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID & Tanggal</th>
                  <th className="px-5 py-3.5">Pelapor</th>
                  <th className="px-5 py-3.5">Kategori & Urgensi</th>
                  <th className="px-5 py-3.5">Lokasi Kerusakan</th>
                  <th className="px-5 py-3.5">Status Penanganan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Tidak ada data laporan yang sesuai dengan penyaringan filter di atas.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* ID & Tanggal */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-sky-400 block text-xs">{r.id}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </td>

                      {/* Pelapor */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-100">{r.userName || 'Masyarakat'}</p>
                        <p className="text-[11px] text-slate-400">{r.userPhone || '-'}</p>
                      </td>

                      {/* Kategori & Urgensi */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-200">{r.category}</p>
                        <span className={`inline-block text-[10px] font-bold mt-0.5 px-2 py-0.5 rounded ${
                          r.severity === 'Parah' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {r.severity || 'Sedang'}
                        </span>
                      </td>

                      {/* Lokasi */}
                      <td className="px-5 py-4 max-w-xs truncate text-slate-300">
                        {r.locationName}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        {getStatusBadge(r.status)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setActiveReport(r)}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold border border-sky-500/20 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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

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

  // DIRECT SILENT PDF DOWNLOAD FUNCTION (Tanpa Pop-up Halaman Baru)
  const exportToPDF = async () => {
    if (filteredReports.length === 0) {
      alert('Tidak ada data laporan yang sesuai filter untuk diekspor ke PDF!');
      return;
    }

    setIsExportingPDF(true);

    try {
      // Off-screen element container
      const container = document.createElement('div');
      container.style.padding = '12px';
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = "'Segoe UI', Arial, sans-serif";

      container.innerHTML = `
        <style>
          * { box-sizing: border-box; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5px; color: #0f172a; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #334155; padding: 6px 8px; text-align: left; vertical-align: middle; }
          th { background-color: #e2e8f0; color: #0f172a; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; white-space: nowrap; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .nowrap { white-space: nowrap; }
          .center { text-align: center; }
          .font-bold { font-weight: bold; }
        </style>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 25px;">No</th>
              <th class="nowrap" style="width: 125px;">ID Laporan</th>
              <th class="nowrap" style="width: 75px;">Tanggal</th>
              <th style="width: 110px;">Pelapor</th>
              <th class="nowrap" style="width: 100px;">No HP</th>
              <th style="width: 110px;">Kategori</th>
              <th class="nowrap center" style="width: 65px;">Urgensi</th>
              <th>Lokasi Jalan</th>
              <th class="nowrap center" style="width: 80px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReports.map((r, i) => `
              <tr>
                <td class="center font-bold">${i + 1}</td>
                <td class="nowrap"><strong>${r.id}</strong></td>
                <td class="nowrap">${new Date(r.createdAt).toLocaleDateString('id-ID')}</td>
                <td>${r.userName || 'Masyarakat'}</td>
                <td class="nowrap">${r.userPhone || '-'}</td>
                <td>${r.category}</td>
                <td class="nowrap center">${r.severity || 'Sedang'}</td>
                <td>${r.locationName}</td>
                <td class="nowrap center"><strong>${r.status}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const fileName = `Rekap_LaporJalan_${new Date().toISOString().slice(0,10)}.pdf`;

      const options = {
        margin: 6,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      await html2pdf().set(options).from(container).save();
    } catch (err) {
      console.error('Error generating PDF download:', err);
      alert('Gagal mendownload PDF: ' + err.message);
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
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
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
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
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel (.xlsx)
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
                  Mengunduh PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export to PDF (Download Langsung)
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
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
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
              <h3 className="text-sm font-bold text-white">Pratinjau Tabel Rekapitulasi Laporan</h3>
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

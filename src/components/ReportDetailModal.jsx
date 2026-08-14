import React, { useEffect } from 'react';
import { X, MapPin, Calendar, Clock, User, Phone, CheckCircle, AlertCircle, FileText, ExternalLink } from 'lucide-react';

export default function ReportDetailModal({ report, onClose }) {
  // Lock background body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!report) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ Selesai Penanganan</span>;
      case 'Diproses':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">⏳ Dalam Proses Perbaikan</span>;
      case 'Ditolak':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">✕ Laporan Ditolak</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⏱ Menunggu Verifikasi</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pt-20 pb-6 px-3 sm:px-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="glass-card w-full max-w-3xl max-h-[calc(100vh-6.5rem)] rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl flex flex-col relative text-slate-100 my-auto">
        
        {/* Header Bar - Sticky & Fixed at Modal Top */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0 sticky top-0 z-20">
          <div>
            <span className="text-xs font-mono text-sky-400 font-bold">{report.id}</span>
            <h3 className="text-lg font-bold text-white mt-0.5">{report.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Status & Severity Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Status Penanganan</span>
              {getStatusBadge(report.status)}
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Tingkat Urgensi</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                report.severity === 'Parah' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {report.severity || 'Sedang'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Kategori</span>
              <span className="text-xs font-semibold text-sky-400">{report.category}</span>
            </div>
          </div>

          {/* Photo Attachment */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Foto Bukti Terlampir</h4>
            <div className="rounded-xl overflow-hidden border border-slate-800 max-h-80 bg-slate-900">
              <img
                src={report.photoUrl}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Location Info & Coordinates */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lokasi & Koordinat GPS</h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-start gap-2 text-sm text-slate-200">
                <MapPin className="w-4 h-4 text-sky-400 mt-1 flex-shrink-0" />
                <span>{report.locationName}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800 font-mono">
                <span>Lat: {report.latitude} | Lng: {report.longitude}</span>
                <a
                  href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 font-sans"
                >
                  Buka di Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keterangan / Uraian Pelapor</h4>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 leading-relaxed">
              {report.description || "Tidak ada keterangan tambahan."}
            </div>
          </div>

          {/* Timeline Progres Penanganan */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeline Progres Penanganan</h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              {report.timeline && report.timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 border border-sky-500/40">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-100">{step.status}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(step.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reporter Metadata */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span>Pelapor: <strong className="text-slate-200">{report.userName}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Tanggal: {new Date(report.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Tutup Detail
          </button>
        </div>

      </div>
    </div>
  );
}

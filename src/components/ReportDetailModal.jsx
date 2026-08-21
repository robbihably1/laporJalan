import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  X, MapPin, Calendar, Clock, User, Phone, CheckCircle, 
  AlertCircle, FileText, ExternalLink, Image as ImageIcon, 
  Maximize2, Eye, Download 
} from 'lucide-react';

const damageMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ReportDetailModal({ report, onClose }) {
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);

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

  const modalContent = (
    <>
      {/* MAIN DETAIL MODAL (Portaled to document.body, z-[9999] completely covers Header Navbar & BottomNav) */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="glass-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl flex flex-col relative text-slate-100 my-auto">
          
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

            {/* Photo Attachment Card */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Foto Bukti Terlampir</h4>
              
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all group">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 relative group-hover:scale-105 transition-transform">
                    <img
                      src={report.photoUrl}
                      alt={report.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white/80" />
                    </div>
                  </div>
                  <div className="truncate">
                    <h5 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                      Foto Bukti Kerusakan Jalan
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik untuk melihat lampiran foto ukuran penuh (Portrait/Landscape)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFullImageOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex-shrink-0"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Lihat Lampiran</span> Foto
                </button>
              </div>
            </div>

            {/* Location Info & Interactive Embedded Map */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lokasi & Peta Koordinat GPS</h4>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-start gap-2 text-sm text-slate-200">
                  <MapPin className="w-4 h-4 text-sky-400 mt-1 flex-shrink-0" />
                  <span className="font-semibold">{report.locationName}</span>
                </div>

                {/* Embedded Mini Leaflet Map */}
                <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner relative">
                  <MapContainer
                    center={[report.latitude, report.longitude]}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="w-full h-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[report.latitude, report.longitude]} icon={damageMarkerIcon}>
                      <Popup>
                        <div className="p-1 text-xs">
                          <strong className="text-white block mb-0.5">{report.title}</strong>
                          <span className="text-slate-300">{report.locationName}</span>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800 font-mono">
                  <span>Lat: {report.latitude} | Lng: {report.longitude}</span>
                  <a
                    href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline flex items-center gap-1 font-sans font-semibold"
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

      {/* FULL-SIZE IMAGE LIGHTBOX MODAL (z-[10000] to completely overlay full screen above everything) */}
      {isFullImageOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center justify-center">
            
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between mb-3 px-2 text-white">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Lampiran Foto Ukuran Asli - {report.id}</span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={report.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
                </a>

                <button
                  onClick={() => setIsFullImageOpen(false)}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors shadow-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Image Viewer Container (Uncropped Original Aspect Ratio) */}
            <div className="rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/90 shadow-2xl flex items-center justify-center p-2 max-h-[82vh] w-full">
              <img
                src={report.photoUrl}
                alt={report.title}
                className="max-h-[78vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-lg"
              />
            </div>

          </div>
        </div>
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}

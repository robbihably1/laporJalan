import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useReports } from '../context/ReportContext';
import ReportDetailModal from './ReportDetailModal';
import { Map as MapIcon, MapPin, Eye, Filter } from 'lucide-react';
import L from 'leaflet';

// Markers with status colors
const createCustomIcon = (status) => {
  let colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
  if (status === 'Diproses') {
    colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png';
  } else if (status === 'Selesai') {
    colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
  } else if (status === 'Ditolak') {
    colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png';
  }

  return new L.Icon({
    iconUrl: colorUrl,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export default function MapView() {
  const { reports } = useReports();
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Filter and validate valid numeric coordinates
  const validFilteredReports = (reports || []).filter(r => {
    const matchesStatus = filterStatus === 'Semua' || r.status === filterStatus;
    const isValidCoord = r && !isNaN(parseFloat(r.latitude)) && !isNaN(parseFloat(r.longitude));
    return matchesStatus && isValidCoord;
  });

  // Cap visible map markers to 250 for optimal map performance
  const displayMarkers = validFilteredReports.slice(0, 250);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <MapIcon className="w-4 h-4" /> Peta Sebaran Publik
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Peta Titik Jalan Rusak
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Visualisasi lokasi titik laporan masyarakat ({displayMarkers.length} dari {validFilteredReports.length} laporan ditampilkan pada peta).
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          {['Semua', 'Menunggu', 'Diproses', 'Selesai', 'Ditolak'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <div className="glass-card rounded-2xl border border-slate-800 p-2 overflow-hidden h-[600px] relative shadow-2xl">
        <MapContainer
          center={[-6.2000, 106.8166]}
          zoom={11}
          scrollWheelZoom={true}
          className="w-full h-full rounded-xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {displayMarkers.map((report) => (
            <Marker
              key={report.id}
              position={[parseFloat(report.latitude), parseFloat(report.longitude)]}
              icon={createCustomIcon(report.status)}
            >
              <Popup>
                <div className="p-1 space-y-2 max-w-xs">
                  <img
                    src={report.photoUrl}
                    alt={report.title}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-sky-400 block">{report.id}</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{report.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{report.locationName}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      report.status === 'Selesai' ? 'bg-emerald-500/20 text-emerald-300' :
                      report.status === 'Diproses' ? 'bg-sky-500/20 text-sky-300' :
                      report.status === 'Ditolak' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {report.status}
                    </span>
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-xs text-sky-400 font-bold hover:underline flex items-center gap-1"
                    >
                      Detail <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute top-5 right-5 z-[1000] glass-card p-3 rounded-xl border border-slate-700/80 text-xs space-y-1.5 shadow-lg backdrop-blur-md">
          <div className="font-bold text-slate-200 mb-1 text-[11px] uppercase tracking-wider">Keterangan Pin Peta</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Menunggu Verifikasi
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span> Dalam Pengerjaan
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> Selesai Dibereskan
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-slate-500"></span> Ditolak
          </div>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

    </div>
  );
}

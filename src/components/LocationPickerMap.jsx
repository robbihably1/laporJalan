import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Lock, AlertCircle } from 'lucide-react';

// Fix standard Leaflet default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Red Pin Marker for Road Damage
const damageMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to re-center map when lat/lng state changes
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPickerMap({ lat, lng, readOnly = true }) {
  const hasCoordinates = lat !== null && lat !== undefined && lng !== null && lng !== undefined;
  const defaultCenter = hasCoordinates ? [lat, lng] : [-6.2088, 106.8219];

  return (
    <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-700/70 shadow-inner bg-slate-950">
      <MapContainer 
        center={defaultCenter} 
        zoom={hasCoordinates ? 16 : 12} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCoordinates && (
          <>
            <Marker position={[lat, lng]} icon={damageMarkerIcon} />
            <MapRecenter lat={lat} lng={lng} />
          </>
        )}
      </MapContainer>
      
      {/* Overlay Status Badge */}
      {hasCoordinates ? (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] bg-slate-950/90 text-emerald-400 text-xs px-3.5 py-2 rounded-xl border border-emerald-500/30 shadow-lg backdrop-blur-md flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">
            Lokasi Terkunci Otomatis oleh GPS ({Number(lat).toFixed(5)}, {Number(lng).toFixed(5)})
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 z-[1000] bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center animate-pulse">
            <Navigation className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Menunggu Pemindaian Sinyal GPS
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Demi akurasi dan validitas data, penentuan titik manual dinonaktifkan. Silakan tekan tombol <strong>"Pindai Lokasi GPS Presisi"</strong> di atas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useReports } from '../context/ReportContext';
import { useAuth } from '../context/AuthContext';
import LocationPickerMap from './LocationPickerMap';
import { 
  Camera, MapPin, AlertTriangle, FileText, Send, Image as ImageIcon, 
  Trash2, Navigation, Check, HelpCircle, Sparkles
} from 'lucide-react';

const SAMPLE_PHOTOS = [
  { label: 'Lubang Jalan Parah', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop' },
  { label: 'Jalan Ambles/Erosi', url: 'https://images.unsplash.com/photo-1584463699966-1c88019b8849?q=80&w=800&auto=format&fit=crop' },
  { label: 'Retak Asfalt', url: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=800&auto=format&fit=crop' }
];

export default function AddReportForm({ onSuccess }) {
  const { addReport } = useReports();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Jalan Berlubang');
  const [severity, setSeverity] = useState('Parah');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Jl. Jendral Sudirman KM 5');
  const [latitude, setLatitude] = useState(-6.2088);
  const [longitude, setLongitude] = useState(106.8219);
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_PHOTOS[0].url);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // GPS Auto Detect Handler
  const handleGetGpsLocation = () => {
    setIsGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationName(`Lokasi GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
          setIsGettingGps(false);
        },
        (error) => {
          console.warn("GPS error:", error);
          // Fallback to random offset near center for demo
          setLatitude(-6.2088 + (Math.random() - 0.5) * 0.01);
          setLongitude(106.8219 + (Math.random() - 0.5) * 0.01);
          setIsGettingGps(false);
        },
        { timeout: 8000 }
      );
    } else {
      setIsGettingGps(false);
    }
  };

  const handleMapLocationSelect = (lat, lng) => {
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!photoUrl) {
      alert("Harap sertakan foto bukti jalan rusak!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      addReport({
        title: title || `Laporan ${category}`,
        category,
        severity,
        description,
        locationName,
        latitude,
        longitude,
        photoUrl,
        userName: user?.name || 'Pelapor Anonim',
        userPhone: user?.phone || '0812-0000-0000'
      });
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
    }, 700);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-sky-500/20 relative overflow-hidden bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <AlertTriangle className="w-40 h-40 text-sky-400" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Menu Utama - Pelaporan Baru
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Formulir Pelaporan Jalan Rusak
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Kirimkan informasi kerusakan jalan di sekitar Anda. Pastikan untuk melampirkan **foto bukti** dan **koordinat lokasi** agar tim teknis dapat melakukan penanganan tepat sasaran.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BAGIAN 1: ATTACHMENT FOTO JALAN RUSAK */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">1. Lampiran Foto Bukti</h3>
                <p className="text-xs text-slate-400">Unggah foto atau ambil gambar jalan rusak yang dilaporkan</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Wajib *
            </span>
          </div>

          {/* Photo Dropzone / Preview */}
          {photoUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
              <img
                src={photoUrl}
                alt="Preview Jalan Rusak"
                className="w-full h-64 sm:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
                  <Camera className="w-4 h-4" />
                  Ganti Foto
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Foto
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 flex items-center gap-1.5 border border-slate-800">
                <Check className="w-4 h-4" /> Foto Terlampir
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-700 hover:border-sky-500/80 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/80 group">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Klik untuk Unggah Foto Bukti</p>
              <p className="text-xs text-slate-400 mt-1">Format JPG, PNG (Maks 10MB)</p>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}

          {/* Quick Sample Photo Picker for Easy Test Drive */}
          <div className="pt-2">
            <span className="text-xs text-slate-400 font-medium block mb-2">Atau pilih sampel foto uji coba cepat:</span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_PHOTOS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoUrl(sample.url)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                    photoUrl === sample.url
                      ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <img src={sample.url} alt={sample.label} className="w-8 h-8 rounded object-cover" />
                  <span className="truncate">{sample.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BAGIAN 2: KOORDINAT LOKASI & PETA INTERAKTIF */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">2. Koordinat & Lokasi</h3>
                <p className="text-xs text-slate-400">Tentukan posisi titik kerusakan di peta atau gunakan GPS</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetGpsLocation}
              disabled={isGettingGps}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-semibold border border-slate-700 transition-all active:scale-95 shadow-md"
            >
              <Navigation className={`w-4 h-4 ${isGettingGps ? 'animate-spin' : ''}`} />
              {isGettingGps ? 'Mendeteksi GPS...' : 'Deteksi Lokasi GPS Saya'}
            </button>
          </div>

          {/* Interactive Leaflet Map Component */}
          <LocationPickerMap
            lat={latitude}
            lng={longitude}
            onLocationSelect={handleMapLocationSelect}
          />

          {/* Lat/Lng Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude (Garis Lintang)</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude (Garis Bujur)</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Jalan / Patokan Lokasi</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Contoh: Jl. Sudirman KM 5 depan Gedung Merdeka"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>
        </div>

        {/* BAGIAN 3: KETERANGAN & KATEGORI */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3. Detail & Keterangan Kerusakan</h3>
              <p className="text-xs text-slate-400">Informasi kategori dan uraian rinci kerusakan</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Ringkas Laporan</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Lubang Jalan Berbahaya Dekat Lampu Merah"
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Jalan Rusak</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-slate-900"
              >
                <option value="Jalan Berlubang">Jalan Berlubang</option>
                <option value="Jalan Ambles">Jalan Ambles / Melesak</option>
                <option value="Retak Bulus / Keriting">Retak Bulus / Asfalt Rusak</option>
                <option value="Drainase Tersekat">Saluran Drainase Rusak/Meluap</option>
                <option value="Penerangan Jalan (PJU)">Lampu Penerangan Jalan Redup/Mati</option>
                <option value="Trotoar Rusak">Trotoar & Fasilitas Pejalan Kaki</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Urgensi Kerusakan</label>
              <div className="grid grid-cols-3 gap-2">
                {['Ringan', 'Sedang', 'Parah'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      severity === lvl
                        ? lvl === 'Parah'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                          : lvl === 'Sedang'
                          ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan Detail (Deskripsi)</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ukuran lubang, potensi bahaya bagi pengendara, waktu kejadian, atau detail tambahan lainnya..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-500/25 flex items-center justify-center gap-3 transition-all active:scale-[0.99] border border-sky-400/30"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Kirim Laporan Jalan Rusak SEKARANG
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

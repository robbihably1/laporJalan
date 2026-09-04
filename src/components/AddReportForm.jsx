import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReports } from '../context/ReportContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { uploadApi } from '../services/api';
import LocationPickerMap from './LocationPickerMap';
import SuccessAlertModal from './SuccessAlertModal';
import { 
  Camera, MapPin, AlertTriangle, FileText, Send, 
  Trash2, Navigation, Check, Sparkles, Loader2, ArrowLeft,
  Lock, CheckCircle2, X, RefreshCw, ShieldCheck
} from 'lucide-react';

export default function AddReportForm({ onSuccess, onBack }) {
  const { addReport } = useReports();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Jalan Berlubang');
  const [severity, setSeverity] = useState('Parah');
  const [description, setDescription] = useState('');
  
  // Mandatory Location (GPS Only - No Manual Pin)
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [hasGpsScanned, setHasGpsScanned] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  // Mandatory Photo (Camera Only - No Sample Photos)
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Live Camera Viewfinder Modal State
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (belakang) or 'user' (depan)
  const videoRef = useRef(null);

  // Form Submitting & Success Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // ----------------------------------------------------
  // CAMERA STREAM MANAGEMENT
  // ----------------------------------------------------
  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsCapturing(false);

    // Stop previous stream if running
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Fitur kamera browser tidak didukung pada browser ini.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access error:", err);
      let message = 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.';
      if (err.name === 'NotAllowedError') {
        message = 'Izin kamera ditolak. Silakan berikan izin akses kamera di pengaturan browser Anda.';
      } else if (err.name === 'NotFoundError') {
        message = 'Perangkat kamera tidak ditemukan pada komputer/HP Anda.';
      }
      setCameraError(message);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowLiveCamera(false);
    setCameraError('');
  };

  useEffect(() => {
    if (showLiveCamera) {
      document.body.style.overflow = 'hidden';
      startCamera(facingMode);
    } else {
      document.body.style.overflow = '';
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      document.body.style.overflow = '';
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showLiveCamera, facingMode]);

  // Capture Photo Frame from Live Video
  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsCapturing(false);
          alert('Gagal mengambil gambar dari kamera.');
          return;
        }

        const file = new File([blob], `kamera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();

        setIsUploadingPhoto(true);
        try {
          const res = await uploadApi.uploadLampiran(file);
          if (res && res.url) {
            setPhotoUrl(res.url);
          }
        } catch (uploadErr) {
          console.error("Upload capture error:", uploadErr);
          alert("Gagal mengunggah foto kamera: " + uploadErr.message);
        } finally {
          setIsUploadingPhoto(false);
        }
      }, 'image/jpeg', 0.85);

    } catch (err) {
      setIsCapturing(false);
      console.error("Snap error:", err);
      alert("Terjadi kesalahan saat memproses foto.");
    }
  };

  // ----------------------------------------------------
  // GPS AUTO SCAN HANDLER (MANDATORY & PRECISE)
  // ----------------------------------------------------
  const handleScanGpsLocation = () => {
    setIsGettingGps(true);
    setGpsErrorMsg('');

    if (!('geolocation' in navigator)) {
      setIsGettingGps(false);
      setGpsErrorMsg('Perangkat atau browser Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : 10;

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(accuracy);
        setHasGpsScanned(true);
        setIsGettingGps(false);

        // Reverse Geocoding to identify Road/Area name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'id' } }
          );
          if (response.ok) {
            const data = await response.json();
            const road = data.address?.road || data.address?.pedestrian || data.address?.suburb || '';
            const city = data.address?.city || data.address?.town || data.address?.county || '';
            if (road || city) {
              setLocationName([road, city].filter(Boolean).join(', '));
            } else if (data.display_name) {
              setLocationName(data.display_name.split(',').slice(0, 3).join(','));
            } else {
              setLocationName(`Titik GPS (${lat}, ${lng})`);
            }
          } else {
            setLocationName(`Titik GPS (${lat}, ${lng})`);
          }
        } catch (geoErr) {
          setLocationName(`Titik GPS (${lat}, ${lng})`);
        }
      },
      (error) => {
        setIsGettingGps(false);
        console.warn("GPS error:", error);
        let msg = 'Gagal memindai koordinat GPS.';
        if (error.code === 1) {
          msg = 'Akses GPS ditolak. Silakan izinkan lokasi di browser perangkat Anda.';
        } else if (error.code === 2) {
          msg = 'Sinyal GPS tidak tersedia. Pastikan fitur Lokasi/GPS pada perangkat telah menyala.';
        } else if (error.code === 3) {
          msg = 'Waktu pencarian sinyal GPS habis (Timeout). Silakan coba lagi.';
        }
        setGpsErrorMsg(msg);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // ----------------------------------------------------
  // SUBMIT HANDLER
  // ----------------------------------------------------
  const isFormValidToSubmit = !!photoUrl && hasGpsScanned && latitude !== null && longitude !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photoUrl) {
      alert("⚠️ Foto bukti jalan rusak WAJIB diambil langsung dari kamera sebelum mengirimkan laporan!");
      return;
    }

    if (!hasGpsScanned || latitude === null || longitude === null) {
      alert("⚠️ Lokasi GPS WAJIB dipindai terlebih dahulu! Silakan klik tombol 'Pindai Lokasi GPS Presisi'.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addReport({
        title: title || `Laporan ${category}`,
        category,
        severity,
        description,
        locationName: locationName || `Koordinat GPS (${latitude}, ${longitude})`,
        latitude,
        longitude,
        photoUrl,
        userName: user?.name || 'Pelapor Terverifikasi',
        userPhone: user?.phone || '0812-0000-0000'
      });
      setIsSubmitting(false);
      setShowSuccessAlert(true);
    } catch (error) {
      setIsSubmitting(false);
      alert("Gagal mengirimkan laporan: " + error.message);
    }
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      
      {/* Top Back Action Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack || onSuccess}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all shadow-md active:scale-95 group"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Pelaporan</span>
        </button>

        {/* Security Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verifikasi Lapangan Ketat</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-sky-500/20 relative overflow-hidden bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <AlertTriangle className="w-40 h-40 text-sky-400" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Pelaporan Baru - Verifikasi Lokasi & Fisik
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Formulir Pelaporan Jalan Rusak
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Demi keaslian data dan penanganan cepat oleh Dinas Terkait, bukti laporan <strong>wajib diambil langsung dari kamera</strong> dan titik lokasi <strong>wajib dideteksi melalui sinyal GPS aktif</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BAGIAN 1: ATTACHMENT FOTO DARI KAMERA LANGSUNG (WAJIB) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  1. Foto Bukti Kerusakan Fisik
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Wajib Kamera *
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Ambil foto langsung di lokasi menggunakan kamera perangkat Anda</p>
              </div>
            </div>

            {photoUrl && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Terlampir
              </span>
            )}
          </div>

          {/* Photo Preview or Action Button */}
          {isUploadingPhoto ? (
            <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col items-center justify-center text-sky-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Mengunggah & memproses foto kamera...</span>
            </div>
          ) : photoUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 group shadow-lg">
              <img
                src={photoUrl}
                alt="Foto Bukti Kerusakan"
                className="w-full h-64 sm:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setShowLiveCamera(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Buka Kamera Langsung
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Foto
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-950/90 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Foto Kamera Siap Diverifikasi
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-900/40 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              
              <div className="max-w-sm space-y-1">
                <h4 className="text-sm font-bold text-white">Ambil Foto Langsung di Tempat</h4>
                <p className="text-xs text-slate-400">
                  Penggunaan gambar contoh dinonaktifkan demi keamanan. Silakan buka kamera untuk mengambil foto bukti:
                </p>
              </div>

              {/* Single Prominent Live Camera Button */}
              <div className="flex items-center justify-center w-full max-w-sm pt-1">
                <button
                  type="button"
                  onClick={() => setShowLiveCamera(true)}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-sky-500/25 active:scale-95 transition-all cursor-pointer border border-sky-400/30"
                >
                  <Camera className="w-5 h-5" />
                  Buka Kamera Langsung
                </button>
              </div>

              <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Laporan tidak dapat dikirim tanpa melampirkan foto kamera asli.
              </div>
            </div>
          )}
        </div>

        {/* BAGIAN 2: KOORDINAT LOKASI & PEMINDAIAN GPS (WAJIB - PIN MANUAL DINONAKTIFKAN) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  2. Lokasi & Koordinat Presisi
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Wajib Scan GPS *
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Penentuan pin manual dinonaktifkan. Anda harus memindai sinyal GPS perangkat</p>
              </div>
            </div>

            {/* GPS SCAN BUTTON */}
            <button
              type="button"
              onClick={handleScanGpsLocation}
              disabled={isGettingGps}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg cursor-pointer ${
                hasGpsScanned
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
              }`}
            >
              <Navigation className={`w-4 h-4 ${isGettingGps ? 'animate-spin' : ''}`} />
              {isGettingGps
                ? 'Mendeteksi Sinyal GPS...'
                : hasGpsScanned
                ? 'Pindai Ulang Lokasi GPS'
                : 'Pindai Lokasi GPS Presisi'}
            </button>
          </div>

          {/* GPS Error Alert */}
          {gpsErrorMsg && (
            <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-shake ${
              isLight
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
              <div className="leading-relaxed">{gpsErrorMsg}</div>
            </div>
          )}

          {/* GPS Success Verified Badge */}
          {hasGpsScanned && latitude !== null && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between flex-wrap gap-2 ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span>
                  Sinyal GPS Terverifikasi: <strong>Lat: {latitude}, Lng: {longitude}</strong>
                </span>
              </div>
              {gpsAccuracy && (
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                  isLight ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  Akurasi: ±{gpsAccuracy} meter
                </span>
              )}
            </div>
          )}

          {/* Interactive Leaflet Map Component (Strictly Read-Only / GPS Locked) */}
          <LocationPickerMap
            lat={latitude}
            lng={longitude}
            readOnly={true}
          />

          {/* Locked Read-Only Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Latitude (Garis Lintang)</span>
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3" /> Terkunci GPS
                </span>
              </label>
              <input
                type="text"
                readOnly
                value={latitude !== null ? latitude : 'Belum dipindai (Tekan tombol Scan GPS)'}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono bg-slate-900/90 text-slate-300 cursor-not-allowed border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Longitude (Garis Bujur)</span>
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3" /> Terkunci GPS
                </span>
              </label>
              <input
                type="text"
                readOnly
                value={longitude !== null ? longitude : 'Belum dipindai (Tekan tombol Scan GPS)'}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono bg-slate-900/90 text-slate-300 cursor-not-allowed border-slate-800"
              />
            </div>
          </div>

          {/* Location Name / Street details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Jalan / Patokan Lokasi Khusus
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Otomatis terisi setelah scan GPS, atau lengkapi dengan patokan sekitar..."
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>
        </div>

        {/* BAGIAN 3: KETERANGAN & KATEGORI KERUSAKAN */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3. Detail & Keterangan Kerusakan</h3>
              <p className="text-xs text-slate-400">Kategori dan penjelasan tingkat keparahan jalan</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Ringkas Laporan</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Lubang Menganga Berbahaya Dekat Jembatan"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Urgensi</label>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan Tambahan (Deskripsi)</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ukuran lubang, kedalaman, potensi membahayakan pengendara roda dua, dsb..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        {/* SECURITY GATE CHECKLIST BEFORE SUBMIT */}
        <div className={`p-4 rounded-2xl border transition-colors space-y-2.5 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-slate-900/80 border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-slate-800' : 'text-slate-200'
            }`}>
              <ShieldCheck className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-sky-400'}`} />
              Syarat Validasi Laporan
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              isFormValidToSubmit
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isLight
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {isFormValidToSubmit ? '✓ Syarat Terpenuhi' : '⏳ Belum Lengkap'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* 1. Camera Photo Check */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              photoUrl
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : isLight
                  ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                  : 'bg-slate-950/80 border-amber-500/30 text-slate-200'
            }`}>
              {photoUrl ? (
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              ) : (
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              )}
              <div className="leading-snug">
                <span className={`block font-bold ${
                  photoUrl
                    ? isLight ? 'text-emerald-900' : 'text-emerald-200'
                    : isLight ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  1. Foto Bukti Kamera
                </span>
                <span className={`text-[11px] ${
                  photoUrl
                    ? isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-300 font-medium'
                    : isLight ? 'text-amber-800 font-semibold' : 'text-amber-400 font-semibold'
                }`}>
                  {photoUrl ? 'Sudah diambil dari kamera' : 'Wajib diambil dari kamera'}
                </span>
              </div>
            </div>

            {/* 2. GPS Location Check */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              hasGpsScanned
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : isLight
                  ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                  : 'bg-slate-950/80 border-amber-500/30 text-slate-200'
            }`}>
              {hasGpsScanned ? (
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              ) : (
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              )}
              <div className="leading-snug">
                <span className={`block font-bold ${
                  hasGpsScanned
                    ? isLight ? 'text-emerald-900' : 'text-emerald-200'
                    : isLight ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  2. Sinyal GPS Terpindai
                </span>
                <span className={`text-[11px] ${
                  hasGpsScanned
                    ? isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-300 font-medium'
                    : isLight ? 'text-amber-800 font-semibold' : 'text-amber-400 font-semibold'
                }`}>
                  {hasGpsScanned ? `Terverifikasi (±${gpsAccuracy || 5}m)` : 'Wajib klik Scan GPS'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={!isFormValidToSubmit || isSubmitting || isUploadingPhoto}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base shadow-xl flex items-center justify-center gap-3 transition-all border ${
              isFormValidToSubmit && !isSubmitting
                ? 'bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 active:scale-[0.99] border-sky-400/30 cursor-pointer'
                : isLight
                  ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-slate-800 text-slate-500 border-slate-700/60 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {isFormValidToSubmit
                  ? 'Kirim Laporan Jalan Rusak Sekarang'
                  : 'Lengkapi Foto Kamera & Pindai GPS untuk Mengirim'}
              </>
            )}
          </button>
        </div>

      </form>

      {/* LIVE WEBCAM / CAMERA VIEWFINDER MODAL VIA CREATEPORTAL */}
      {showLiveCamera && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] modal-backdrop-overlay bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative my-auto">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2 text-white text-sm font-bold">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Kamera Langsung - Foto Bukti Fisik</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-rose-400 space-y-3">
                  <AlertTriangle className="w-10 h-10 mx-auto text-rose-500" />
                  <p className="text-xs font-semibold leading-relaxed max-w-sm">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Camera Target Crosshairs */}
                  <div className="absolute inset-8 border border-white/25 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-12 h-12 border-t-2 border-l-2 border-sky-400 absolute top-0 left-0 rounded-tl-xl"></div>
                    <div className="w-12 h-12 border-t-2 border-r-2 border-sky-400 absolute top-0 right-0 rounded-tr-xl"></div>
                    <div className="w-12 h-12 border-b-2 border-l-2 border-sky-400 absolute bottom-0 left-0 rounded-bl-xl"></div>
                    <div className="w-12 h-12 border-b-2 border-r-2 border-sky-400 absolute bottom-0 right-0 rounded-br-xl"></div>
                    <span className="text-[11px] text-white/70 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                      Arahkan kamera ke titik kerusakan jalan
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-around gap-4">
              {/* Switch Facing Mode */}
              <button
                type="button"
                onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Beralih Kamera Depan/Belakang"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Ganti Kamera</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={isCapturing || !!cameraError}
                className="w-16 h-16 rounded-full border-4 border-white bg-sky-500 hover:bg-sky-400 active:scale-90 transition-all shadow-xl flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Jepret Foto Sekarang"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-900" />
                </div>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODERN GREEN CHECKMARK SUCCESS MODAL */}
      <SuccessAlertModal
        isOpen={showSuccessAlert}
        title="Laporan Berhasil Disubmit!"
        message="Laporan jalan rusak Anda telah resmi terdaftar dengan foto kamera asli dan koordinat GPS terverifikasi."
        buttonText="Lihat Daftar Pelaporan"
        onConfirm={handleAlertConfirm}
      />
    </div>
  );
}

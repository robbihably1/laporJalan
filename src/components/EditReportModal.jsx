import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReports } from '../context/ReportContext';
import { useTheme } from '../context/ThemeContext';
import { uploadApi } from '../services/api';
import SuccessAlertModal from './SuccessAlertModal';
import { 
  X, Camera, MapPin, FileText, Save, Loader2, 
  Trash2, Navigation, Check, Edit3, Lock, CheckCircle2,
  AlertTriangle, RefreshCw
} from 'lucide-react';

export default function EditReportModal({ report, onClose, onUpdated }) {
  const { updateReportDetails } = useReports();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [title, setTitle] = useState(report?.title || '');
  const [category, setCategory] = useState(report?.category || 'Jalan Berlubang');
  const [severity, setSeverity] = useState(report?.severity || 'Parah');
  const [description, setDescription] = useState(report?.description || '');
  const [locationName, setLocationName] = useState(report?.locationName || '');
  const latitude = report?.latitude || -6.5950;
  const longitude = report?.longitude || 106.8050;
  const [photoUrl, setPhotoUrl] = useState(report?.photoUrl || '');
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live Camera Viewfinder Modal State
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (belakang) or 'user' (depan)
  const videoRef = useRef(null);

  if (!report) return null;

  // ----------------------------------------------------
  // CAMERA STREAM MANAGEMENT
  // ----------------------------------------------------
  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsCapturing(false);

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
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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

        const file = new File([blob], `kamera_edit_${Date.now()}.jpg`, { type: 'image/jpeg' });
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
      }, 'image/jpeg', 0.90);

    } catch (err) {
      setIsCapturing(false);
      console.error("Snap error:", err);
      alert("Terjadi kesalahan saat memproses foto.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoUrl) {
      setErrorMsg("Harap sertakan foto bukti jalan rusak!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const updatedObj = await updateReportDetails(report.id, {
        title,
        category,
        severity,
        description,
        locationName,
        latitude,
        longitude,
        photoUrl
      });

      setIsSubmitting(false);
      setShowSuccessAlert(true);
      if (onUpdated) onUpdated(updatedObj);
    } catch (error) {
      setIsSubmitting(false);
      setErrorMsg(error.message || 'Gagal memperbarui laporan');
    }
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    if (onClose) onClose();
  };

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="glass-card w-full max-w-2xl max-h-[92vh] rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl flex flex-col relative text-slate-100 my-auto">
          
          {/* Header */}
          <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <Edit3 className="w-5 h-5" />
              </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit & Update Laporan #{report.id}</h3>
              <p className="text-[11px] text-amber-400 font-semibold">Perubahan diizinkan karena status masih "Menunggu Verifikasi"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {errorMsg && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Judul Laporan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Judul Ringkas Laporan *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-medium"
            />
          </div>

          {/* Kategori & Urgensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Kategori *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Tingkat Urgensi *</label>
              <div className="grid grid-cols-3 gap-2">
                {['Ringan', 'Sedang', 'Parah'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      severity === lvl
                        ? lvl === 'Parah'
                          ? 'bg-rose-500 text-white border-rose-400'
                          : lvl === 'Sedang'
                          ? 'bg-amber-500 text-white border-amber-400'
                          : 'bg-sky-500 text-white border-sky-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Foto Bukti Kerusakan Fisik (Wajib Kamera Langsung) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Foto Bukti Kerusakan Fisik</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                Wajib Kamera *
              </span>
            </label>

            {isUploadingPhoto ? (
              <div className="h-56 sm:h-72 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col items-center justify-center text-sky-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-semibold">Mengunggah & memproses foto kamera...</span>
              </div>
            ) : photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 group h-72 sm:h-80 md:h-96 shadow-md">
                <img src={photoUrl} alt="Preview Bukti" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => setShowLiveCamera(true)}
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4" /> Buka Kamera Langsung
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Foto
                  </button>
                </div>
                <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Foto Kamera Terverifikasi
                </div>
              </div>
            ) : (
              <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3 ${
                isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-700 bg-slate-900/40'
              }`}>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Foto Bukti Wajib Diambil dari Kamera</p>
                  <p className="text-[11px] text-slate-400">Penggunaan gambar contoh dinonaktifkan demi keamanan data</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiveCamera(true)}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  Buka Kamera Langsung
                </button>
              </div>
            )}
          </div>

          {/* KOORDINAT READ-ONLY (TIDAK BISA DIUBAH, HANYA MENAMPILKAN) & NAMA JALAN */}
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Informasi Lokasi & Koordinat
              </span>
              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Koordinat Terkunci
              </span>
            </div>

            {/* Lat & Lng Read-Only Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Latitude (Terkunci)</label>
                <input
                  type="text"
                  readOnly
                  value={latitude}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Longitude (Terkunci)</label>
                <input
                  type="text"
                  readOnly
                  value={longitude}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Jalan / Patokan Lokasi *</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Keterangan Detail *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto || !photoUrl}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan Laporan
                </>
              )}
            </button>
          </div>

        </form>

        {/* Success Modal Alert Popup */}
        <SuccessAlertModal
          isOpen={showSuccessAlert}
          title="Laporan Berhasil Diperbarui!"
          message="Rincian pengaduan laporan Anda telah resmi disubmit dan diperbarui di sistem."
          buttonText="Selesai"
          onConfirm={handleAlertConfirm}
        />

      </div>
      </div>

      {/* LIVE WEBCAM / CAMERA VIEWFINDER MODAL FOR EDIT */}
      {showLiveCamera && (
        <div className="fixed inset-0 z-[99999] modal-backdrop-overlay bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md sm:max-w-xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative my-auto">
            
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 flex-shrink-0">
              <div className="flex items-center gap-2 text-white text-sm font-bold">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Kamera Langsung - Foto Bukti Fisik</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewfinder - Tall Portrait 3:4 on Mobile / 4:3 on Desktop */}
            <div className="relative w-full aspect-[3/4] max-h-[62vh] sm:aspect-[4/3] sm:max-h-[460px] bg-black flex items-center justify-center overflow-hidden">
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
                  <div className="absolute inset-4 sm:inset-6 border border-white/25 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-sky-400 absolute top-0 left-0 rounded-tl-xl"></div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-sky-400 absolute top-0 right-0 rounded-tr-xl"></div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-sky-400 absolute bottom-0 left-0 rounded-bl-xl"></div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-sky-400 absolute bottom-0 right-0 rounded-br-xl"></div>
                    <span className="text-[11px] text-white/80 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10 shadow-lg text-center mx-4">
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
        </div>
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}

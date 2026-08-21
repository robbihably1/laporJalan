import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useReports } from '../context/ReportContext';
import { uploadApi } from '../services/api';
import SuccessAlertModal from './SuccessAlertModal';
import { 
  X, Camera, MapPin, FileText, Save, Loader2, Image as ImageIcon, 
  Trash2, Navigation, Check, Edit3, Lock 
} from 'lucide-react';

const SAMPLE_PHOTOS = [
  { label: 'Lubang Jalan Parah', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop' },
  { label: 'Jalan Ambles/Erosi', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop' },
  { label: 'Retak Asfalt', url: 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=800&auto=format&fit=crop' }
];

export default function EditReportModal({ report, onClose, onUpdated }) {
  const { updateReportDetails } = useReports();

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

  if (!report) return null;

  // File Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const res = await uploadApi.uploadPhoto(file);
      if (res && res.url) {
        setPhotoUrl(res.url);
      }
    } catch (err) {
      console.warn("Photo upload fallback:", err.message);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
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
      await updateReportDetails(report.id, {
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
    } catch (error) {
      setIsSubmitting(false);
      setErrorMsg(error.message || 'Gagal memperbarui laporan');
    }
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    if (onUpdated) onUpdated();
    if (onClose) onClose();
  };

  const modalContent = (
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              ⚠️ {errorMsg}
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

          {/* Foto Bukti */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Foto Bukti Kerusakan</label>
            {isUploadingPhoto ? (
              <div className="h-40 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col items-center justify-center text-sky-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-semibold">Mengunggah foto...</span>
              </div>
            ) : photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group h-44">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Ganti Foto
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border border-dashed border-slate-700 p-4 rounded-xl flex items-center justify-center cursor-pointer bg-slate-900/40 hover:bg-slate-900">
                <span className="text-xs text-slate-300">Klik untuk unggah foto baru</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
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
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all active:scale-95"
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
  );

  return createPortal(modalContent, document.body);
}

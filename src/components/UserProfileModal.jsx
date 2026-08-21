import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { uploadApi, regionsApi } from '../services/api';
import SuccessAlertModal from './SuccessAlertModal';
import { 
  X, User, Mail, Phone, MapPin, Camera, Save, 
  CheckCircle2, Shield, Loader2, Sparkles 
} from 'lucide-react';

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
];

export default function UserProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [nik, setNik] = useState(user?.nik || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Regional Cascading Dropdowns
  const [province, setProvince] = useState(user?.province || 'Jawa Barat');
  const [city, setCity] = useState(user?.city || 'Kota Bogor');
  const [district, setDistrict] = useState(user?.district || '');
  const [village, setVillage] = useState(user?.village || '');

  const [districtsList, setDistrictsList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);

  const [avatar, setAvatar] = useState(user?.avatar || SAMPLE_AVATARS[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Fetch districts on city change
  useEffect(() => {
    if (city) {
      setProvince('Jawa Barat');
      regionsApi.getDistricts(city).then(res => {
        if (res && res.data) {
          setDistrictsList(res.data);
          if (res.data.length > 0 && !res.data.some(d => d.name === district)) {
            setDistrict(res.data[0].name);
          }
        }
      }).catch(err => {
        console.warn("Fetch districts error:", err.message);
      });
    }
  }, [city]);

  // Fetch villages on district change
  useEffect(() => {
    if (district) {
      regionsApi.getVillages(district).then(res => {
        if (res && res.data) {
          setVillagesList(res.data);
          if (res.data.length > 0 && !res.data.some(v => v.name === village)) {
            setVillage(res.data[0].name);
          }
        }
      }).catch(err => {
        console.warn("Fetch villages error:", err.message);
      });
    }
  }, [district]);

  if (!user) return null;

  // Handle Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadApi.uploadPhoto(file);
      if (res && res.url) {
        setAvatar(res.url);
      }
    } catch (err) {
      console.warn("Avatar upload warning, fallback to local data:", err.message);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Profile Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      const res = await updateProfile({
        id: user.id,
        name,
        nik,
        phone,
        province,
        city,
        district,
        village,
        avatar
      });

      setIsSaving(false);
      setMsg({ type: 'success', text: res?.message || 'Profil berhasil diperbarui!' });

      // Trigger Modern Green Checkmark Success Alert
      setShowSuccessAlert(true);
    } catch (error) {
      setIsSaving(false);
      setMsg({ type: 'error', text: error.message || 'Gagal memperbarui profil.' });
    }
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    if (onClose) onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl flex flex-col relative text-slate-100 my-auto">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Profil & Pengaturan Akun</h3>
              <p className="text-[11px] text-slate-400">Perbarui informasi data diri & domisili wilayah Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {msg && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              msg.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="relative group flex-shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-20 h-20 rounded-full object-cover border-2 border-sky-500/50 shadow-lg"
              />
              <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white cursor-pointer shadow-md transition-transform group-hover:scale-110">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-semibold text-slate-300 block">Pilih / Unggah Foto Profil</span>
              <p className="text-[11px] text-slate-400">Klik ikon kamera untuk unggah foto baru atau pilih avatar sampel di bawah:</p>
              
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                {SAMPLE_AVATARS.map((sampleUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(sampleUrl)}
                    className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${
                      avatar === sampleUrl ? 'border-sky-400 ring-2 ring-sky-400/40 scale-110' : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={sampleUrl} alt="Avatar Sample" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">NIK (16 Digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">No. Telepon / WA</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            {/* Regional Cascading Dropdowns */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Domisili Wilayah</span>
                <span className="text-[10px] text-slate-400">Jawa Barat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kota / Kabupaten</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  >
                    <option value="Kota Bogor">Kota Bogor</option>
                    <option value="Kabupaten Bogor">Kabupaten Bogor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Provinsi</label>
                  <input
                    type="text"
                    readOnly
                    value={province}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kecamatan</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  >
                    {districtsList.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kelurahan / Desa</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  >
                    {villagesList.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Email (Terdaftar)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Footer Submit Action */}
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
              disabled={isSaving || isUploading}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>

        </form>

        {/* MODERN GREEN CHECKMARK SUCCESS MODAL */}
        <SuccessAlertModal
          isOpen={showSuccessAlert}
          title="Profil Berhasil Disubmit!"
          message="Perubahan data diri dan lokasi domisili wilayah Anda telah berhasil disubmit dan diperbarui di sistem."
          buttonText="Selesai"
          onConfirm={handleAlertConfirm}
        />

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

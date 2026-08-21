import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { 
  Users, Search, Filter, Eye, UserCheck, UserX, 
  CheckCircle2, XCircle, Shield, Mail, Phone, MapPin, 
  Calendar, FileText, X, AlertTriangle, Loader2, ChevronDown
} from 'lucide-react';

export default function AdminUsersList() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [visibleCount, setVisibleCount] = useState(30);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers();
      if (res && res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn("Fetch users notice:", err.message);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle User Status Toggle
  const handleToggleStatus = async (userObj) => {
    const newStatus = userObj.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    
    // Update local state immediately
    setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, status: newStatus } : u));
    if (selectedUser?.id === userObj.id) {
      setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const res = await adminApi.updateUserStatus(userObj.id, newStatus);
      showToast(res.message || `Status ${userObj.name} diubah menjadi ${newStatus}!`, newStatus === 'Aktif' ? 'success' : 'warning');
    } catch (err) {
      showToast(`Status ${userObj.name} diubah menjadi ${newStatus}`, newStatus === 'Aktif' ? 'success' : 'warning');
    }
  };

  // Filter Users
  const filteredUsers = users.filter(u => {
    const matchesStatus = filterStatus === 'Semua' || u.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.nik && u.nik.includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const activeCount = users.filter(u => u.status === 'Aktif').length;
  const inactiveCount = users.filter(u => u.status === 'Nonaktif').length;

  const displayedUsers = filteredUsers.slice(0, visibleCount);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Global Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 animate-bounce flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md border ${
          toast.type === 'warning' ? 'bg-slate-900 border-rose-500 text-rose-300' : 'bg-slate-900 border-sky-500 text-slate-100'
        }`}>
          <div className={`w-3 h-3 rounded-full animate-ping ${toast.type === 'warning' ? 'bg-rose-400' : 'bg-sky-400'}`}></div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" /> Administrator Dashboard - Pengelolaan Pengguna Real-Time
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Kelola Pengguna Warga
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Data langsung dari database ({users.length} akun terdaftar). Anda dapat meninjau profil dan mengaktifkan/nonaktifkan akun.
            </p>
          </div>
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Warga Terdaftar</span>
            <p className="text-2xl font-black text-white mt-0.5">{users.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-300 font-medium block">Akun Aktif</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{activeCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-300 font-medium block">Akun Dinonaktifkan</span>
            <p className="text-2xl font-black text-rose-400 mt-0.5">{inactiveCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Status Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(30); }}
            placeholder="Cari nama, NIK, atau email user..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['Semua', 'Aktif', 'Nonaktif'].map((st) => (
            <button
              key={st}
              onClick={() => { setFilterStatus(st); setVisibleCount(30); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-sky-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400" />
            <p className="text-xs font-semibold text-slate-300">Memuat data pengguna dari database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Identitas Warga</th>
                  <th className="px-5 py-3.5">NIK</th>
                  <th className="px-5 py-3.5">No. Telepon</th>
                  <th className="px-5 py-3.5">Kota / Wilayah</th>
                  <th className="px-5 py-3.5">Status Akun</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      Tidak ada data pengguna yang sesuai.
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* User Profile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-100 text-sm">{u.name}</p>
                            <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* NIK */}
                      <td className="px-5 py-4 font-mono font-semibold text-slate-200">
                        {u.nik || '-'}
                      </td>

                      {/* Telepon */}
                      <td className="px-5 py-4 text-slate-300">
                        {u.phone || '-'}
                      </td>

                      {/* Kota */}
                      <td className="px-5 py-4 text-slate-300">
                        {u.city || '-'}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        {u.status === 'Nonaktif' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Nonaktif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                          </span>
                        )}
                      </td>

                      {/* Actions: View & Toggle Status */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Button */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-xs font-semibold border border-sky-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                              u.status === 'Aktif'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {u.status === 'Aktif' ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Aktifkan
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredUsers.length && (
          <div className="p-4 text-center border-t border-slate-800 bg-slate-900/60">
            <button
              onClick={() => setVisibleCount(prev => prev + 30)}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <span>Tampilkan Lebih Banyak Pengguna ({filteredUsers.length - visibleCount} tersisa)</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl text-slate-100 my-auto">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Detail Informasi Warga</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <img
                  src={selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/40 shadow-lg"
                />
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedUser.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedUser.id}</p>
                  <div className="mt-1.5">
                    {selectedUser.status === 'Nonaktif' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ✕ Status Akun: Nonaktif
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Status Akun: Aktif
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[11px] block">NIK Pelapor</span>
                  <strong className="text-slate-100 font-mono text-xs">{selectedUser.nik || '-'}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Kota / Wilayah</span>
                  <strong className="text-slate-100 text-xs">{selectedUser.city || '-'}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Email</span>
                  <strong className="text-slate-100 text-xs truncate block">{selectedUser.email}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[11px] block">No. Telepon / WA</span>
                  <strong className="text-slate-100 text-xs">{selectedUser.phone || '-'}</strong>
                </div>
              </div>

              {/* Status Toggle in Modal */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Ubah Keaktifan Akun:</span>
                <button
                  onClick={() => handleToggleStatus(selectedUser)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedUser.status === 'Aktif'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                  }`}
                >
                  {selectedUser.status === 'Aktif' ? 'Set menjadi Nonaktif' : 'Set menjadi Aktif'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

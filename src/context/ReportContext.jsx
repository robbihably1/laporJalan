import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_REPORTS } from '../data/initialReports';

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('laporjalan_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_REPORTS;
      }
    }
    return INITIAL_REPORTS;
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('laporjalan_reports', JSON.stringify(reports));
  }, [reports]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addReport = (reportData) => {
    const newId = `REP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(reports.length + 1).padStart(3, '0')}`;
    
    const newReport = {
      id: newId,
      title: reportData.title || `Laporan ${reportData.category}`,
      category: reportData.category,
      severity: reportData.severity || 'Sedang',
      description: reportData.description,
      locationName: reportData.locationName || 'Lokasi Terdeteksi GPS',
      latitude: parseFloat(reportData.latitude),
      longitude: parseFloat(reportData.longitude),
      photoUrl: reportData.photoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop',
      status: 'Menunggu',
      createdAt: new Date().toISOString(),
      userName: reportData.userName || 'Budi Santoso',
      userPhone: reportData.userPhone || '0812-3456-7890',
      timeline: [
        {
          status: 'Menunggu',
          note: 'Laporan baru saja terkirim ke sistem Dinas Bina Marga.',
          timestamp: new Date().toISOString()
        }
      ]
    };

    setReports(prev => [newReport, ...prev]);
    showToast(`Laporan #${newId} berhasil dikirim!`, 'success');
    return newReport;
  };

  return (
    <ReportContext.Provider value={{ reports, addReport, showToast, toast }}>
      {children}
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce flex items-center gap-3 bg-slate-900 border border-sky-500 text-slate-100 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping"></div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </ReportContext.Provider>
  );
};

export const useReports = () => useContext(ReportContext);

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_REPORTS } from '../data/initialReports';
import { reportsApi } from '../services/api';

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to sanitize photo URLs
  const cleanPhotoUrl = (url) => {
    if (!url) return '';
    if (typeof url === 'string') {
      return url.replace(/^https?:\/\/localhost:\d+/i, '');
    }
    return url;
  };

  // Fetch reports from Backend API
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await reportsApi.getAll();
      if (response && response.data && Array.isArray(response.data)) {
        const sanitized = response.data.map(r => ({
          ...r,
          photoUrl: cleanPhotoUrl(r.photoUrl)
        }));
        setReports(sanitized);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn("API fetch notice:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Safe localStorage cache with try/catch to avoid QuotaExceededError when storing large datasets
  useEffect(() => {
    try {
      if (reports && reports.length > 0) {
        localStorage.setItem('laporjalan_reports', JSON.stringify(reports.slice(0, 50)));
      }
    } catch (e) {
      console.warn("LocalStorage Quota Exceeded (normal for large dataset):", e.message);
    }
  }, [reports]);

  // Add Report Handler (Backend Integrated)
  const addReport = async (reportData) => {
    try {
      const apiResponse = await reportsApi.create(reportData);
      if (apiResponse && apiResponse.data) {
        const newReport = apiResponse.data;
        setReports(prev => [newReport, ...prev]);
        showToast(apiResponse.message || `Laporan #${newReport.id} berhasil dikirim!`, 'success');
        return newReport;
      }
    } catch (err) {
      console.warn("Backend add report warning, saving locally:", err.message);
    }

    // Local Fallback creation if backend server is offline
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

  // Update Report Details Handler (Backend Integrated)
  const updateReportDetails = async (id, updatedData) => {
    try {
      const apiResponse = await reportsApi.updateDetails(id, updatedData);
      if (apiResponse && apiResponse.data) {
        const updatedReport = apiResponse.data;
        setReports(prev => prev.map(r => r.id === id ? { ...r, ...updatedReport } : r));
        showToast(apiResponse.message || `Laporan #${id} berhasil diperbarui!`, 'success');
        return updatedReport;
      }
    } catch (err) {
      console.warn("Backend update report warning, updating locally:", err.message);
    }

    // Local Fallback
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          ...updatedData,
          timeline: [
            ...(r.timeline || []),
            { status: 'Menunggu', note: 'Pengguna memperbarui rincian data laporan.', timestamp: new Date().toISOString() }
          ]
        };
      }
      return r;
    }));
    showToast(`Laporan #${id} berhasil diperbarui!`, 'success');
  };

  return (
    <ReportContext.Provider value={{ reports, addReport, updateReportDetails, showToast, toast, fetchReports, isLoading }}>
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

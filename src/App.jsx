import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReportProvider } from './context/ReportContext';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AddReportForm from './components/AddReportForm';
import HistoryList from './components/HistoryList';
import MapView from './components/MapView';

function MainAppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('add'); // 'add' (Add Laporan base menu), 'history', 'map'

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-10 selection:bg-sky-500 selection:text-white">
      {/* Top Navbar Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'add' && (
          <AddReportForm onSuccess={() => setActiveTab('history')} />
        )}
        {activeTab === 'history' && (
          <HistoryList onAddNewReport={() => setActiveTab('add')} />
        )}
        {activeTab === 'map' && (
          <MapView />
        )}
      </main>

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 LaporJalan - Sistem Informasi Pelaporan Jalan Rusak Masyarakat</span>
          <div className="flex items-center gap-4">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Privasi</a>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-300 font-semibold">Bina Marga PU</a>
            <a href="#contact" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Kontak Darurat</a>
          </div>
        </div>
      </footer>

      {/* Mobile Touch Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReportProvider>
        <MainAppContent />
      </ReportProvider>
    </AuthProvider>
  );
}

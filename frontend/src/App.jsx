import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SurveyorDashboard from './pages/SurveyorDashboard';
import AuditorDashboard from './pages/AuditorDashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 text-white">
        {/* Loading Spinner */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold tracking-wider text-slate-300">RECLAWATCH</h2>
        <p className="text-xs text-slate-500 mt-1">Memuat Sistem...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Role routing
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'surveyor':
      return <SurveyorDashboard />;
    case 'auditor':
      return <AuditorDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-primaryBg">
          <div className="p-8 max-w-md bg-white rounded-xl shadow-lg text-center">
            <h1 className="text-2xl font-bold text-accentRed mb-4">Akses Ditolak</h1>
            <p className="text-slate-600 mb-6">Role pengguna tidak valid atau tidak dikenali oleh sistem.</p>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
              className="px-4 py-2 bg-secondaryNavy text-white rounded-lg hover:bg-opacity-95 transition"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

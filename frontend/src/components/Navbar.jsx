import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, User } from 'lucide-react';

export default function Navbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-10">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="font-bold text-slate-800 text-lg leading-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <span className="font-semibold text-slate-800 text-sm">{user?.username}</span>
          <span className="text-[10px] text-slate-400 capitalize font-medium">{user?.role}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
          {user?.username?.substring(0, 1).toUpperCase()}
        </div>
        
        {/* Simple Logout button for Mobile Navbar */}
        <button
          onClick={logout}
          title="Keluar"
          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition sm:hidden"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

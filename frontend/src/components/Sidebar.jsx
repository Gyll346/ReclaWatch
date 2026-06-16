import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Map, Shield } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-secondaryNavy-dark text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-secondaryNavy gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-accentGold to-amber-400 flex items-center justify-center font-bold text-secondaryNavy-dark shadow-md text-lg">
          RW
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-sm leading-none">RECLAWATCH</h1>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">WebGIS Platform</span>
        </div>
      </div>

      {/* User Info Profile */}
      <div className="p-4 mx-3 my-4 bg-slate-900 bg-opacity-40 border border-slate-800 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold border-2 border-slate-600">
          {user?.username?.substring(0, 2).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-semibold text-white text-sm truncate leading-snug">{user?.username}</h4>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-accentGold border border-accentGold/20 mt-0.5 capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all-300 ${
                isActive
                  ? 'bg-accentGold text-secondaryNavy-dark shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-secondaryNavy-dark' : 'text-slate-400 group-hover:text-white'}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 bg-secondaryNavy-dark">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-red-950/20 hover:border-red-900/30 border border-transparent rounded-lg transition-all-300"
        >
          <LogOut className="w-5 h-5 text-slate-400 hover:text-white" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

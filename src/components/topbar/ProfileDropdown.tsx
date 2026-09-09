'use client';

import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function ProfileDropdown({
  isOpen,
  onToggle,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  dropdownRef,
}: ProfileDropdownProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
          AU
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-slate-800">Admin Utama</div>
          <div className="text-[10px] text-slate-400">Tata Usaha</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="font-bold text-sm text-slate-800">Admin Utama</div>
            <div className="text-xs text-slate-400 truncate">admin@smksalkaaffah.sch.id</div>
          </div>

          <div className="py-1 border-b border-slate-100">
            <button
              onClick={() => {
                onOpenProfile();
                onToggle();
              }}
              className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
            >
              <User className="w-4 h-4 text-slate-500" /> Profil Saya
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                onToggle();
              }}
              className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
            >
              <Settings className="w-4 h-4 text-slate-500" /> Pengaturan
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      )}
    </div>
  );
}
'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface EmployeeHeaderProps {
  onAddClick: () => void;
}

export default function EmployeeHeader({ onAddClick }: EmployeeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Pegawai & Guru</h1>
        <p className="text-slate-500 text-sm">
          Kelola informasi profil, PIN mesin fingerprint, dan atur jadwal mengajar khusus.
        </p>
      </div>
      <button
        onClick={onAddClick}
        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition"
      >
        <Plus className="w-4 h-4" /> Tambah Pegawai Baru
      </button>
    </div>
  );
}
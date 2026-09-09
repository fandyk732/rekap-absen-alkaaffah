'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface EmployeeSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EmployeeSearch({ value, onChange }: EmployeeSearchProps) {
  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <Search className="w-5 h-5 text-slate-400 ml-1" />
      <input
        type="text"
        placeholder="Cari berdasarkan Nama, PIN, atau Jabatan..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm outline-none text-slate-800 bg-transparent"
      />
    </div>
  );
}
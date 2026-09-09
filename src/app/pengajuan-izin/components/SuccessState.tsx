'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SuccessStateProps {
  onReset: () => void;
}

export default function SuccessState({ onReset }: SuccessStateProps) {
  return (
    <div className="text-center py-8 space-y-4">
      <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
      <h2 className="text-lg font-bold text-slate-800">
        Pengajuan Berhasil Ditambahkan!
      </h2>
      <p className="text-sm text-slate-500">
        Data izin Anda telah terkirim ke sistem. Silakan tunggu konfirmasi
        persetujuan dari Admin.
      </p>
      <button
        onClick={onReset}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
      >
        Buat Pengajuan Lain
      </button>
    </div>
  );
}
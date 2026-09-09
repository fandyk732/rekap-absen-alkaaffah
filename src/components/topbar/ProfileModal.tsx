'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-900 text-lg">Profil Utama Admin</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-slate-400 font-semibold">Nama Lengkap</label>
            <p className="font-bold text-slate-800">Admin Utama SMKS Al Kaaffah</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold">Email</label>
            <p className="font-bold text-slate-800">admin@smksalkaaffah.sch.id</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold">Jabatan / Akses</label>
            <p className="font-bold text-indigo-600">Tata Usaha (Super Admin)</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
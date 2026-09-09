'use client';

import React from 'react';

interface EmployeeModalProps {
  show: boolean;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EmployeeModal({
  show,
  editingId,
  formData,
  setFormData,
  onClose,
  onSubmit,
}: EmployeeModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">PIN Mesin Abensi *</label>
              <input
                type="text"
                required
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="Contoh: 2026122"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">NIP / NIK (Opsional)</label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="NIP Pegawai"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
              placeholder="Contoh: RAFIL"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Jabatan / Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none bg-white"
              >
                <option value="Guru">Guru</option>
                <option value="Tata Usaha">Tata Usaha</option>
                <option value="Staff IT">Staff IT</option>
                <option value="Kepala Sekolah">Kepala Sekolah</option>
                <option value="Keamanan">Keamanan</option>
                <option value="Kebersihan">Kebersihan</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none bg-white"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">No. WhatsApp / HP</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="08123456789"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Status Pegawai</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none bg-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shadow-sm"
            >
              {editingId ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
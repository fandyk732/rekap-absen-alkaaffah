'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Calendar, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PengaturanPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchHolidays = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/holidays');
      const json = await res.json();
      if (json.success) setHolidays(json.data);
    } catch (err) {
      toast.error('Gagal mengambil data hari libur');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description) return toast.error('Lengkapi tanggal dan keterangan!');

    setLoading(true);
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, description }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success('Hari libur berhasil ditambahkan!');
        setDate('');
        setDescription('');
        fetchHolidays();
      } else {
        toast.error(json.error || 'Gagal menambahkan hari libur');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus hari libur ini?')) return;

    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Hari libur berhasil dihapus');
        fetchHolidays();
      } else {
        toast.error(json.error || 'Gagal menghapus');
      }
    } catch (err) {
      toast.error('Gagal menghapus data');
    }
  };

  // Helper Format Tanggal Indonesia (contoh: 2026-08-17 -> 17 Agustus 2026)
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return dateStr;
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
          <p className="text-slate-500 text-sm">Kelola kalender libur nasional & libur sekolah.</p>
        </div>

        {/* Form Tambah Libur */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Tambah Hari Libur / Tanggal Merah
          </h2>
          <form onSubmit={handleAddHoliday} className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Keterangan (contoh: HUT RI / Libur Semester)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none flex-1"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tambah
            </button>
          </form>
        </div>

        {/* Tabel Daftar Libur */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b font-semibold text-slate-600">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Keterangan</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fetching ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Memuat data libur...
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
                    Belum ada hari libur yang diatur.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-medium text-slate-900">{formatDateIndo(h.date)}</td>
                    <td className="p-3.5 text-slate-600">{h.description}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition"
                        title="Hapus Libur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
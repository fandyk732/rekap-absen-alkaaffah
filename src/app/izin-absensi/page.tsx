'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Download, Plus, Search, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function IzinAbsensiPage() {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch data pengajuan izin
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/permissions');
      const json = await res.json();
      if (json.success) {
        setPermissions(json.data || []);
      } else {
        toast.error(json.error || 'Gagal memuat data pengajuan.');
      }
    } catch (err) {
      console.error('Gagal mengambil data izin:', err);
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Handler Approval / Rejection
  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/permissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          newStatus === 'APPROVED'
            ? 'Pengajuan berhasil disetujui & matriks diperbarui!'
            : 'Pengajuan telah ditolak.'
        );
        fetchPermissions(); // Refresh list agar UI & matriks sinkron
      } else {
        toast.error(json.error || 'Gagal memperbarui status pengajuan.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      toast.error('Gagal terhubung ke server.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter Data berdasarkan Search
  const filteredData = permissions.filter(
    (item) =>
      item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.pin?.toString().includes(search) ||
      item.type?.toLowerCase().includes(search.toLowerCase())
  );

  // Fungsi Ekspor ke Excel
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diunduh.');
      return;
    }

    const dataToExport = filteredData.map((item, index) => ({
      No: index + 1,
      'PIN Pegawai': item.pin,
      'Nama Pegawai': item.employeeName,
      'Tipe Izin': item.type,
      'Tanggal Mulai': item.startDate,
      'Tanggal Selesai': item.endDate,
      'Keterangan / Alasan': item.reason || '-',
      Status:
        item.status === 'APPROVED' || item.status === 'Approved'
          ? 'Disetujui'
          : item.status === 'REJECTED' || item.status === 'Rejected'
          ? 'Ditolak'
          : 'Pending',
      'Tanggal Pengajuan': item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('id-ID')
        : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Izin');

    const max_width = dataToExport.reduce((w, r) => Math.max(w, String(r['Nama Pegawai']).length), 10);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: max_width + 5 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 18 },
    ];

    XLSX.writeFile(workbook, `Laporan_Izin_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Laporan berhasil diunduh!');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengajuan Izin & Absensi</h1>
            <p className="text-slate-500 text-sm">Kelola surat izin, cuti, sakit, dan dinas luar pegawai.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Unduh Excel
            </button>

            <button
              onClick={() => toast.info('Fitur Tambah Form Izin sedang disiapkan.')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Buat Form Izin
            </button>
          </div>
        </div>

        {/* Input Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Cari pegawai / PIN / tipe izin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-slate-700"
          />
        </div>

        {/* Tabel Data Izin */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Pegawai</th>
                <th className="px-6 py-4">Tipe Izin</th>
                <th className="px-6 py-4">Rentang Tanggal</th>
                <th className="px-6 py-4">Keterangan / Alasan</th>
                <th className="px-6 py-4 text-center">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada pengajuan izin ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const statusUpper = String(item.status || '').toUpperCase();
                  const isPending = statusUpper === 'PENDING';
                  const isApproved = statusUpper === 'APPROVED' || statusUpper === 'DISETUJUI';
                  const isRejected = statusUpper === 'REJECTED' || statusUpper === 'DITOLAK';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.employeeName}</div>
                        <div className="text-xs text-slate-400 font-mono">PIN: {item.pin}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">
                        {item.startDate} <br />
                        <span className="text-slate-400">s/d</span> <br />
                        {item.endDate}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs max-w-xs">{item.reason || '-'}</td>
                      
                      {/* Kolom Akses Approval */}
                      <td className="px-6 py-4 text-center">
                        {updatingId === item.id ? (
                          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Proses...
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
                              title="Setujui Pengajuan"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
                              title="Tolak Pengajuan"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tolak
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Disetujui
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <X className="w-3 h-3 text-rose-600" />
                            Ditolak
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
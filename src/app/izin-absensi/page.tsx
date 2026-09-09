'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Download, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import PermissionTable from './components/PermissionTable';
import { exportPermissionsToExcel } from './utils/exportPermissionExcel';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function IzinAbsensiPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [permissions, setPermissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/permissions?month=${selectedMonth}&year=${selectedYear}`);
      const json = await response.json();
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
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus === 'APPROVED' ? 'Approved' : 'Rejected' }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          newStatus === 'APPROVED'
            ? 'Pengajuan berhasil disetujui & matriks diperbarui!'
            : 'Pengajuan telah ditolak.'
        );
        fetchPermissions();
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

  const filteredData = permissions.filter(
    (item) =>
      item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.pin?.toString().includes(search) ||
      item.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengajuan Izin & Absensi</h1>
            <p className="text-slate-500 text-sm">
              Kelola surat izin, cuti, sakit, dinas luar, dan izin pulang awal pegawai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                exportPermissionsToExcel({
                  filteredData,
                  monthName: monthNames[selectedMonth - 1],
                  selectedYear,
                })
              }
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Unduh Excel
            </button>

            <button
              onClick={() => toast.info('Gunakan portal izin mandiri pegawai untuk mengajukan izin.')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Buat Form Izin
            </button>
          </div>
        </div>

        {/* Search Bar */}
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

        {/* Tabel Data Izin Component */}
        <PermissionTable
          loading={loading}
          filteredData={filteredData}
          monthName={monthNames[selectedMonth - 1]}
          selectedYear={selectedYear}
          updatingId={updatingId}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </AppLayout>
  );
}
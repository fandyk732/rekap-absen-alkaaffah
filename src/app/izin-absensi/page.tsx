'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Download, Plus, Search, Check, X, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function IzinAbsensiPage() {
  // State Filter Bulan & Tahun
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [permissions, setPermissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper untuk format tampilan tanggal DD-MM-YYYY / YYYY-MM-DD / ISO
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';

    if (typeof dateStr === 'string' && (dateStr.includes('-') || dateStr.includes('/'))) {
      const separator = dateStr.includes('-') ? '-' : '/';
      const parts = dateStr.split(separator);

      if (parts.length === 3) {
        let day: number, month: number, year: number;

        if (parts[0].length === 4) {
          year = Number(parts[0]);
          month = Number(parts[1]);
          day = Number(parts[2]);
        } else {
          day = Number(parts[0]);
          month = Number(parts[1]);
          year = Number(parts[2]);
        }

        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1000) {
          const d = new Date(year, month - 1, day);
          return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        }
      }
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper memformat string jam (contoh: "09:00:00" atau "21:00" -> "09:00")
      const formatTimeString = (timeStr: string) => {
        if (!timeStr) return '-';
        
        // Jika formatnya HH:mm atau HH:mm:ss
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          const hours = parts[0].padStart(2, '0');
          const minutes = parts[1].padStart(2, '0');
          return `${hours}:${minutes}`;
        }
        
        return timeStr;
      };

  // Fetch data pengajuan izin
  const fetchPermissions = async () => {
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
  };

  useEffect(() => {
    fetchPermissions();
  }, [selectedMonth, selectedYear]);

  // Handler Approval / Rejection
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
      'Jam Pulang Awal': item.type === 'Pulang Awal' && item.earlyLeaveTime ? item.earlyLeaveTime : '-',
      'Tanggal Mulai': formatDateDisplay(item.startDate),
      'Tanggal Selesai': formatDateDisplay(item.endDate),
      'Keterangan / Alasan': item.reason || '-',
      Status:
        item.status === 'APPROVED' || item.status === 'Approved'
          ? 'Disetujui'
          : item.status === 'REJECTED' || item.status === 'Rejected'
          ? 'Ditolak'
          : 'Pending',
      'Tanggal Pengajuan': formatDateDisplay(item.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Izin');

    const max_width = dataToExport.reduce((w, r) => Math.max(w, String(r['Nama Pegawai']).length), 10);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: max_width + 5 },
      { wch: 15 },
      { wch: 16 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 18 },
    ];

    XLSX.writeFile(
      workbook,
      `Laporan_Izin_Absensi_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`
    );
    toast.success('Laporan berhasil diunduh!');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengajuan Izin & Absensi</h1>
            <p className="text-slate-500 text-sm">Kelola surat izin, cuti, sakit, dinas luar, dan izin pulang awal pegawai.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dropdown Filter Bulan */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            {/* Dropdown Filter Tahun */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={exportToExcel}
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
                <th className="px-6 py-4">Tanggal / Rentang</th>
                <th className="px-6 py-4">Keterangan / Alasan</th>
                <th className="px-6 py-4 text-center">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Memuat data bulan {monthNames[selectedMonth - 1]} {selectedYear}...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada pengajuan izin pada bulan {monthNames[selectedMonth - 1]} {selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const statusUpper = String(item.status || '').toUpperCase();
                  const isPending = statusUpper === 'PENDING';
                  const isApproved = statusUpper === 'APPROVED' || statusUpper === 'DISETUJUI';
                  const isRejected = statusUpper === 'REJECTED' || statusUpper === 'DITOLAK';

                  const formattedStartDate = formatDateDisplay(item.startDate);
                  const formattedEndDate = formatDateDisplay(item.endDate);
                  const isSingleDay = item.type === 'Pulang Awal' || item.type === 'Terlambat' || item.startDate === item.endDate;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* Pegawai */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.employeeName}</div>
                        <div className="text-xs text-slate-400 font-mono">PIN: {item.pin}</div>
                      </td>

                      {/* Tipe Izin + Badge Jam Pulang Awal */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              item.type === 'Pulang Awal'
                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                : item.type === 'Sakit'
                                ? 'bg-rose-100 text-rose-700'
                                : item.type === 'Terlambat'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {item.type}
                          </span>

                          {/* Info Khusus Jam Rencana Pulang Awal */}
                          {item.type === 'Pulang Awal' && item.earlyLeaveTime && (
                            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                              <Clock className="w-3 h-3 text-orange-600 shrink-0" />
                              <span>Jam {formatTimeString(item.earlyLeaveTime)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tanggal / Rentang Tanggal */}
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">
                        {isSingleDay ? (
                          <span className="font-bold text-slate-700">{formattedStartDate}</span>
                        ) : (
                          <>
                            {formattedStartDate} <br />
                            <span className="text-slate-400">s/d</span> <br />
                            {formattedEndDate}
                          </>
                        )}
                      </td>

                      {/* Alasan */}
                      <td className="px-6 py-4 text-slate-600 text-xs max-w-xs">{item.reason || '-'}</td>

                      {/* Status / Akses Approval */}
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
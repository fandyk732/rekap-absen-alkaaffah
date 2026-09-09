'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Calendar, Download, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import AttendanceMatrixTable from './components/AttendanceMatrixTable';
import { exportMatrixToExcel } from './utils/exportMatrixExcel';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MatriksKehadiranPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matriks?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        setMatrixData(json.data);
      } else {
        setMatrixData([]);
        toast.error(json.error || 'Gagal memuat matriks.');
      }
    } catch (err) {
      setMatrixData([]);
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const filteredData = Array.isArray(matrixData)
    ? matrixData.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(emp.pin || '').includes(searchQuery)
      )
    : [];

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor!');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Membangun file Excel...');

    try {
      await exportMatrixToExcel({
        filteredData,
        daysInMonth,
        selectedMonth,
        selectedYear,
        monthNames,
      });
      toast.success('File Excel berhasil diunduh!', { id: toastId });
    } catch (err) {
      console.error('Export Error:', err);
      toast.error('Gagal mengekspor data ke Excel.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Matriks Kehadiran Pegawai</h1>
            <p className="text-slate-500 text-sm">
              Rekapitulasi lengkap jam masuk, jam pulang, izin, sakit, dan alpha harian pegawai.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting || loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Mengekspor...' : 'Ekspor Excel'}
            </button>
            <button
              onClick={fetchMatrix}
              disabled={loading}
              className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar & Legenda */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none border-l pl-2 border-slate-300 cursor-pointer"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs pl-2 border-l border-slate-200">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> H (Hadir)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> T (Terlambat)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> PC (Pulang Cepat)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> I (Izin)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> S (Sakit)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> A (Alpha)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> - (Libur)</span>
            </div>
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {/* Tabel Matriks Component */}
        <AttendanceMatrixTable
          loading={loading}
          filteredData={filteredData}
          daysInMonth={daysInMonth}
        />
      </div>
    </AppLayout>
  );
}
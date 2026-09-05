'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Users,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Calendar,
  TrendingUp,
  FileCheck,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import ExportDashboardButtons from '@/components/ExportDashboardButtons';

interface DashboardStats {
  totalEmployees: number;
  totalHadir: number;
  totalTerlambat: number;
  totalIzin: number;
  totalAlpha: number;
  totalLogMasuk: number;
  totalSlotKapasitas: number;
  hadirPct: number;
  terlambatPct: number;
  izinSakitPct: number;
  alphaPct: number;
  pendingPermissionsCount: number;
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<{
    stats: DashboardStats;
    topLateEmployees: any[];
    topPermissionEmployees: any[];
  }>({
    stats: {
      totalEmployees: 0,
      totalHadir: 0,
      totalTerlambat: 0,
      totalIzin: 0,
      totalAlpha: 0,
      totalLogMasuk: 0,
      totalSlotKapasitas: 0,
      hadirPct: 0,
      terlambatPct: 0,
      izinSakitPct: 0,
      alphaPct: 0,
      pendingPermissionsCount: 0,
    },
    topLateEmployees: [],
    topPermissionEmployees: [],
  });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Gagal mengambil ringkasan dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedMonth, selectedYear]);

  const stats = data.stats;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header & Filter Bulan/Tahun */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Evaluasi Bulanan</h1>
            <p className="text-slate-500 text-sm">
              Ringkasan rekapitulasi performa presensi & izin pegawai untuk Kepala Sekolah.
            </p>
          </div>

          <div className="flex items-center gap-2">
            
            {/* TOMBOL EXPORT KITA PASANG DI SINI */}
          <ExportDashboardButtons
            monthName={monthNames[selectedMonth - 1]}
            year={selectedYear}
            stats={stats}
            topLate={data.topLateEmployees}
            topPermission={data.topPermissionEmployees}
          />
            
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-600 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-500 ml-1" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer border-l border-slate-200 pl-2"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Total Pegawai */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pegawai</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalEmployees}</h3>
              <span className="text-[11px] text-slate-500 mt-1 block">Status Aktif Terdaftar</span>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card Total Hadir Tepat Waktu */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hadir Tepat Waktu</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalHadir}</h3>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {stats.hadirPct}% dari kapasitas hari kerja
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card Frekuensi Terlambat */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frekuensi Terlambat</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.totalTerlambat}</h3>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                {stats.terlambatPct}% dari kapasitas hari kerja
              </span>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card Izin / Sakit */}
          <Link
            href="/izin-absensi"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-purple-300 transition-colors group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Izin / Sakit Disetujui</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">{stats.totalIzin}</h3>
              {stats.pendingPermissionsCount > 0 ? (
                <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                  {stats.pendingPermissionsCount} Izin Perlu Approval →
                </span>
              ) : (
                <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
                  Pengajuan Bulan Ini
                </span>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <FileCheck className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* Visual Progress Bar Chart (Opsi B - Capacity Based) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Rasio Kehadiran Bulan {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Log Masuk: <strong className="text-slate-800">{stats.totalLogMasuk}</strong> / Potensi: <strong className="text-slate-800">{stats.totalSlotKapasitas}</strong> Slot
            </span>
          </div>

          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
            <div style={{ width: `${stats.hadirPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Hadir: ${stats.hadirPct}%`} />
            <div style={{ width: `${stats.terlambatPct}%` }} className="bg-amber-500 h-full transition-all" title={`Terlambat: ${stats.terlambatPct}%`} />
            <div style={{ width: `${stats.izinSakitPct}%` }} className="bg-purple-500 h-full transition-all" title={`Izin/Sakit: ${stats.izinSakitPct}%`} />
            <div style={{ width: `${stats.alphaPct}%` }} className="bg-rose-500 h-full transition-all" title={`Alpha: ${stats.alphaPct}%`} />
          </div>

          <div className="flex flex-wrap items-center justify-around text-xs pt-1 gap-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Hadir ({stats.hadirPct}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Terlambat ({stats.terlambatPct}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span> Izin/Sakit ({stats.izinSakitPct}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> Alpha ({stats.alphaPct}%)
            </span>
          </div>
        </div>

        {/* Top Analysis Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Sering Terlambat */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Sering Terlambat Bulan Ini
              </h3>
              <span className="text-xs font-semibold text-slate-400">Top 5</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Memuat analisis...</div>
            ) : data.topLateEmployees.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Tidak ada catatan keterlambatan di bulan ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.topLateEmployees.map((emp, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{emp.name}</div>
                        <div className="text-xs text-slate-400 font-mono">PIN: {emp.pin}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">
                      {emp.count}x Telat
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 5 Sering Izin/Sakit & Alasan */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" /> Sering Izin / Sakit Bulan Ini
              </h3>
              <span className="text-xs font-semibold text-slate-400">Top 5</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Memuat analisis...</div>
            ) : data.topPermissionEmployees.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Belum ada pengajuan izin/sakit di bulan ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.topPermissionEmployees.map((emp, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{emp.name}</div>
                        <div className="text-xs text-slate-500 max-w-xs truncate">
                          Alasan: {emp.reasons?.length ? emp.reasons.join(', ') : '-'}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold rounded-lg text-xs">
                      {emp.count} Pengajuan
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Calendar, RefreshCw } from 'lucide-react';
import ExportDashboardButtons from '@/components/ExportDashboardButtons';

import MetricCardsGroup from './components/MetricCardsGroup';
import RankingWidgets from './components/RankingWidgets';
import AttendanceProgressBar from './components/AttendanceProgressBar';
import TopAnalysisCards from './components/TopAnalysisCards';

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

interface EmployeeRank {
  id: string | number;
  name: string;
  totalHadir?: number;
  totalTelat?: number;
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [diligent, setDiligent] = useState<EmployeeRank[]>([]);
  const [punctual, setPunctual] = useState<EmployeeRank[]>([]);
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

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        setDiligent(json.topDiligent || []);
        setPunctual(json.topPunctual || []);
      }
    } catch (err) {
      console.error('Gagal mengambil ringkasan dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

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
            <ExportDashboardButtons
              monthName={monthNames[selectedMonth - 1]}
              year={selectedYear}
              stats={stats}
              topLate={data.topLateEmployees}
              topPermission={data.topPermissionEmployees}
              topDiligent={diligent}
              topPunctual={punctual}
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

        {/* Dynamic Metric Cards Component */}
        <MetricCardsGroup stats={stats} />

        {/* Widget Ranking Component */}
        <RankingWidgets loading={loading} diligent={diligent} punctual={punctual} />

        {/* Visual Progress Bar Chart Component */}
        <AttendanceProgressBar
          monthName={monthNames[selectedMonth - 1]}
          year={selectedYear}
          totalLogMasuk={stats.totalLogMasuk}
          totalSlotKapasitas={stats.totalSlotKapasitas}
          hadirPct={stats.hadirPct}
          terlambatPct={stats.terlambatPct}
          izinSakitPct={stats.izinSakitPct}
          alphaPct={stats.alphaPct}
        />

        {/* Top Analysis Cards Component */}
        <TopAnalysisCards
          loading={loading}
          topLateEmployees={data.topLateEmployees}
          topPermissionEmployees={data.topPermissionEmployees}
        />
      </div>
    </AppLayout>
  );
}
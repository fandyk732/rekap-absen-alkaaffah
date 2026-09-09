'use client';

import React from 'react';
import Link from 'next/link';
import { Users, CheckCircle2, Clock, FileCheck } from 'lucide-react';

interface StatsProps {
  totalEmployees: number;
  totalHadir: number;
  totalTerlambat: number;
  totalIzin: number;
  hadirPct: number;
  terlambatPct: number;
  pendingPermissionsCount: number;
}

export default function MetricCardsGroup({ stats }: { stats: StatsProps }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Pegawai */}
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

      {/* Hadir Tepat Waktu */}
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

      {/* Frekuensi Terlambat */}
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

      {/* Izin / Sakit */}
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
  );
}
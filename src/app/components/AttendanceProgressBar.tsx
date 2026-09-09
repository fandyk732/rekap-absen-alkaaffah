'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ProgressProps {
  monthName: string;
  year: number;
  totalLogMasuk: number;
  totalSlotKapasitas: number;
  hadirPct: number;
  terlambatPct: number;
  izinSakitPct: number;
  alphaPct: number;
}

export default function AttendanceProgressBar({
  monthName,
  year,
  totalLogMasuk,
  totalSlotKapasitas,
  hadirPct,
  terlambatPct,
  izinSakitPct,
  alphaPct,
}: ProgressProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Rasio Kehadiran Bulan {monthName} {year}
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          Log Masuk: <strong className="text-slate-800">{totalLogMasuk}</strong> / Potensi: <strong className="text-slate-800">{totalSlotKapasitas}</strong> Slot
        </span>
      </div>

      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
        <div style={{ width: `${hadirPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Hadir: ${hadirPct}%`} />
        <div style={{ width: `${terlambatPct}%` }} className="bg-amber-500 h-full transition-all" title={`Terlambat: ${terlambatPct}%`} />
        <div style={{ width: `${izinSakitPct}%` }} className="bg-purple-500 h-full transition-all" title={`Izin/Sakit: ${izinSakitPct}%`} />
        <div style={{ width: `${alphaPct}%` }} className="bg-rose-500 h-full transition-all" title={`Alpha: ${alphaPct}%`} />
      </div>

      <div className="flex flex-wrap items-center justify-around text-xs pt-1 gap-2">
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Hadir ({hadirPct}%)
        </span>
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span> Terlambat ({terlambatPct}%)
        </span>
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span> Izin/Sakit ({izinSakitPct}%)
        </span>
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span> Alpha ({alphaPct}%)
        </span>
      </div>
    </div>
  );
}
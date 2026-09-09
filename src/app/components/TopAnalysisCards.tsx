'use client';

import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';

interface AnalysisProps {
  loading: boolean;
  topLateEmployees: any[];
  topPermissionEmployees: any[];
}

export default function TopAnalysisCards({
  loading,
  topLateEmployees,
  topPermissionEmployees,
}: AnalysisProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sering Terlambat */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Sering Terlambat Bulan Ini
          </h3>
          <span className="text-xs font-semibold text-slate-400">Top 5</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Memuat analisis...</div>
        ) : topLateEmployees.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Tidak ada catatan keterlambatan di bulan ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topLateEmployees.map((emp, idx) => (
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

      {/* Sering Izin / Sakit */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" /> Sering Izin / Sakit Bulan Ini
          </h3>
          <span className="text-xs font-semibold text-slate-400">Top 5</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Memuat analisis...</div>
        ) : topPermissionEmployees.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Belum ada pengajuan izin/sakit di bulan ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topPermissionEmployees.map((emp, idx) => (
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
  );
}
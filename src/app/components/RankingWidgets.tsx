'use client';

import React from 'react';
import { Award, Zap } from 'lucide-react';

interface EmployeeRank {
  id: string | number;
  name: string;
  totalHadir?: number;
  totalTelat?: number;
}

interface RankingProps {
  loading: boolean;
  diligent: EmployeeRank[];
  punctual: EmployeeRank[];
}

export default function RankingWidgets({ loading, diligent, punctual }: RankingProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top 5 Guru Paling Rajin */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Top 5 Guru Paling Rajin</h3>
            <p className="text-xs text-slate-500">Berdasarkan akumulasi kehadiran bulan ini</p>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />)
          ) : diligent.length > 0 ? (
            diligent.map((emp, idx) => (
              <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm text-slate-700">{emp.name}</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                  {emp.totalHadir ?? 0} Hari
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              Apresiasi tingkat kehadiran tinggi aktif bulan ini.
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Guru Paling Disiplin Waktu */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Top 5 Paling Disiplin Waktu</h3>
            <p className="text-xs text-slate-500">Guru dengan catatan keterlambatan terendah</p>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />)
          ) : punctual.length > 0 ? (
            punctual.map((emp, idx) => (
              <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm text-slate-700">{emp.name}</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                  {emp.totalTelat === 0 ? 'Tidak Pernah Telat' : `${emp.totalTelat}x Telat`}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              Pencatatan kedisiplinan jam masuk kerja.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
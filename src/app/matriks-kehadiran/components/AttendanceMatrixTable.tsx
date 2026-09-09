'use client';

import React from 'react';
import { RefreshCw, LogIn, LogOut } from 'lucide-react';

interface AttendanceMatrixTableProps {
  loading: boolean;
  filteredData: any[];
  daysInMonth: number;
}

export default function AttendanceMatrixTable({
  loading,
  filteredData,
  daysInMonth,
}: AttendanceMatrixTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 sticky left-0 bg-slate-50 border-r border-slate-200 z-10 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Pegawai
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <th key={d} className="py-2 px-1 text-center border-r border-slate-200 min-w-[58px]">
                  {d}
                </th>
              ))}
              <th className="py-3 px-1.5 text-center bg-emerald-50 text-emerald-800 border-l border-slate-200 w-10">H</th>
              <th className="py-3 px-1.5 text-center bg-amber-50 text-amber-800 border-l border-slate-200 w-10">T</th>
              <th className="py-3 px-1.5 text-center bg-blue-50 text-blue-800 border-l border-slate-200 w-10">I</th>
              <th className="py-3 px-1.5 text-center bg-purple-50 text-purple-800 border-l border-slate-200 w-10">S</th>
              <th className="py-3 px-1.5 text-center bg-rose-50 text-rose-800 border-l border-slate-200 w-10">A</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={daysInMonth + 6} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-500" />
                  Memuat Matriks Kehadiran...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 6} className="py-12 text-center text-slate-400">
                  Tidak ada data pegawai ditemukan.
                </td>
              </tr>
            ) : (
              filteredData.map((emp) => (
                <tr key={emp.id || emp.pin} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="font-semibold text-slate-900 truncate max-w-[170px]">{emp.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">PIN: {emp.pin} • {emp.role}</div>
                  </td>

                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const cellData = emp.dailyStatus?.[String(d)];

                    return (
                      <td key={d} className="py-1 px-0.5 text-center border-r border-slate-100 vertical-middle relative group">
                        {!cellData || cellData.status === 'Libur' ? (
                          <span title="Libur / Tidak ada log" className="text-[10px] text-slate-300 select-none">-</span>
                        ) : cellData.status === 'Alpha' ? (
                          <span title="Alpha (Tanpa Keterangan)" className="inline-flex items-center justify-center w-6 h-6 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                            A
                          </span>
                        ) : cellData.status === 'Izin' || cellData.status === 'Sakit' ? (
                          <span
                            title={cellData.status === 'Sakit' ? 'Sakit' : 'Izin'}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-[10px] ${
                              cellData.status === 'Sakit' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {cellData.status === 'Sakit' ? 'S' : 'I'}
                          </span>
                        ) : (
                          <div
                            className={`p-1 rounded flex flex-col items-center justify-center gap-0.5 border ${
                              cellData.status === 'Terlambat'
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            }`}
                          >
                            <div className="flex items-center gap-0.5 font-mono text-[9px] font-bold">
                              <LogIn className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              {cellData.checkIn || '-'}
                            </div>

                            <div
                              className={`flex items-center gap-0.5 font-mono text-[9px] ${
                                cellData.isEarlyLeave
                                  ? 'text-orange-600 font-extrabold'
                                  : cellData.noCheckout
                                  ? 'text-slate-400 font-normal'
                                  : 'text-slate-600 font-medium'
                              }`}
                            >
                              <LogOut className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              {cellData.checkOut && cellData.checkOut !== '-' ? cellData.checkOut : '?'}
                            </div>
                          </div>
                        )}

                        {/* Tooltip Hover Detail */}
                        {cellData && cellData.status !== 'Libur' && (
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-32 bg-slate-900 text-white text-[10px] rounded-md p-2 shadow-xl z-30 pointer-events-none text-left">
                            <p className="font-bold border-b border-slate-700 pb-0.5 mb-1 text-slate-300">
                              Tgl {d} - {cellData.status}
                            </p>
                            {cellData.checkIn && <p className="text-emerald-400">Masuk: {cellData.checkIn}</p>}
                            {cellData.checkOut && <p className="text-blue-300">Pulang: {cellData.checkOut}</p>}
                            {cellData.isEarlyLeave && <p className="text-orange-400 font-bold mt-0.5">⚠️ Pulang Cepat</p>}
                            {cellData.noCheckout && <p className="text-slate-400 mt-0.5">⚠️ Lupa Scan Pulang</p>}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-2 px-1 text-center font-bold text-emerald-700 bg-emerald-50/40 border-l border-slate-200">{emp.summary?.hadir || 0}</td>
                  <td className="py-2 px-1 text-center font-bold text-amber-700 bg-amber-50/40 border-l border-slate-200">{emp.summary?.terlambat || 0}</td>
                  <td className="py-2 px-1 text-center font-bold text-blue-700 bg-blue-50/40 border-l border-slate-200">{emp.summary?.izinSakit || 0}</td>
                  <td className="py-2 px-1 text-center font-bold text-purple-700 bg-purple-50/40 border-l border-slate-200">0</td>
                  <td className="py-2 px-1 text-center font-bold text-rose-700 bg-rose-50/40 border-l border-slate-200">{emp.summary?.alpha || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
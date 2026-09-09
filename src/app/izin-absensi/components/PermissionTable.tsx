'use client';

import React from 'react';
import { Check, X, RefreshCw, Clock } from 'lucide-react';
import { formatDateDisplay, formatTimeString } from '../utils/formatters';

interface PermissionTableProps {
  loading: boolean;
  filteredData: any[];
  monthName: string;
  selectedYear: number;
  updatingId: string | null;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

export default function PermissionTable({
  loading,
  filteredData,
  monthName,
  selectedYear,
  updatingId,
  onUpdateStatus,
}: PermissionTableProps) {
  return (
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
                Memuat data bulan {monthName} {selectedYear}...
              </td>
            </tr>
          ) : filteredData.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400">
                Tidak ada pengajuan izin pada bulan {monthName} {selectedYear}.
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
              const isSingleDay =
                item.type === 'Pulang Awal' ||
                item.type === 'Terlambat' ||
                item.startDate === item.endDate;

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
                          onClick={() => onUpdateStatus(item.id, 'APPROVED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
                          title="Setujui Pengajuan"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Setujui
                        </button>
                        <button
                          onClick={() => onUpdateStatus(item.id, 'REJECTED')}
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
  );
}
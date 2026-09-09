'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

interface LogPreviewTableProps {
  logs: any[];
  isSyncing: boolean;
  onSync: () => void;
}

export default function LogPreviewTable({ logs, isSyncing, onSync }: LogPreviewTableProps) {
  if (logs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hasil Parsing Log Fingerprint</h2>
          <p className="text-xs text-slate-500">
            Terdeteksi <span className="font-bold text-slate-800">{logs.length}</span> record log absensi dari mesin
          </p>
        </div>

        {/* Tombol Sinkronkan */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menyinkronkan...
            </>
          ) : (
            <>
              Simpan & Sinkronkan ke Matriks <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="py-3 px-4">PIN / ID</th>
              <th className="py-3 px-4">Nama Pegawai</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4 text-center">Scan Masuk</th>
              <th className="py-3 px-4 text-center">Scan Pulang</th>
              <th className="py-3 px-4">Status Parser</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log: any, idx: number) => (
              <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-slate-500">{log.pin || '-'}</td>
                <td className="py-3 px-4 font-medium text-slate-900">{log.name || 'Tidak Dikenal'}</td>
                <td className="py-3 px-4 text-slate-600 font-mono text-xs">{log.date}</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                  {log.checkIn || '--:--'}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                  {log.checkOut || '--:--'}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.flagColor === 'emerald'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.flagColor === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : log.flagColor === 'rose'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {log.flagColor === 'emerald' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {log.status || 'Di-parse'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
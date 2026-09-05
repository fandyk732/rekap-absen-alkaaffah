'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import FileUploadZone, { UploadedFile } from './components/FileUploadZone';
import { CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Play, Loader2 } from 'lucide-react';

export default function FingerprintImportPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const handleFilesReady = (files: UploadedFile[]) => {
    setSelectedFiles(files);
  };

  const handleStartParsing = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const targetFile = selectedFiles[0].rawFile;
      const formData = new FormData();
      formData.append('file', targetFile);

      const res = await fetch('/api/parse-fingerprint', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await res.text();
        throw new Error(`Server merespon non-JSON (${res.status}). Pastikan jalur API /api/parse-fingerprint sudah benar.`);
      }

      const result = await res.json();

      if (result.success) {
        setLogs(result.data);
        setHasFile(true);
      } else {
        alert('Gagal memproses file: ' + result.error);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handler Sinkronisasi ke Database / Matriks
  const handleSyncToMatrix = async () => {
    if (logs.length === 0) return;

    setIsSyncing(true);

    try {
      const res = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceLogs: logs }),
      });

      const result = await res.json();

      if (result.success) {
        alert(`Berhasil! ${result.syncedCount || logs.length} record telah disinkronkan.`);
        // Redirect otomatis ke halaman Matriks Kehadiran
        router.push('/matriks-kehadiran');
      } else {
        alert('Gagal sinkronisasi: ' + result.error);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan koneksi: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import & Parser Log Fingerprint</h1>
          <p className="text-slate-500 text-sm">
            Upload file eksport mesin finger (.pdf / .xlsx) untuk kalkulasi otomatis keterlambatan dan pencocokan data izin.
          </p>
        </div>

        {/* Upload Zone Container */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <FileUploadZone onFilesReady={handleFilesReady} />

          {selectedFiles.length > 0 && (
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={handleStartParsing}
                disabled={isUploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Memproses Parsing RAW File...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Proses & Parse File ({selectedFiles.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Preview Parsing Result Table */}
        {hasFile && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Hasil Parsing Log Fingerprint</h2>
                <p className="text-xs text-slate-500">Terdeteksi {logs.length} record log absensi dari mesin</p>
              </div>
              
              {/* Tombol Sinkronkan */}
              <button
                onClick={handleSyncToMatrix}
                disabled={isSyncing}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50"
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
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{log.pin}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{log.name}</td>
                      <td className="py-3 px-4 text-slate-600">{log.date}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800">{log.checkIn}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800">{log.checkOut}</td>
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
                          {log.flagColor === 'emerald' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {log.flagColor !== 'emerald' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
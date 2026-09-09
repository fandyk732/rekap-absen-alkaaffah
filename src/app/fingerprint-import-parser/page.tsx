'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import FileUploadZone, { UploadedFile } from './components/FileUploadZone';
import ImportHeader from './components/ImportHeader';
import LogPreviewTable from './components/LogPreviewTable';
import { RefreshCw, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function FingerprintImportPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const handleFilesReady = (files: UploadedFile[]) => {
    setSelectedFiles(files);
  };

  const handleStartParsing = async () => {
    if (selectedFiles.length === 0) {
      return toast.error('Pilih setidaknya satu file untuk diproses.');
    }

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
        throw new Error(`Respon server tidak valid (${res.status}).`);
      }

      const result = await res.json();

      if (result.success) {
        setLogs(result.data);
        toast.success(`Berhasil mengurai ${result.data.length} record absensi.`);
      } else {
        toast.error('Gagal memproses file: ' + (result.error || 'Format tidak dikenali'));
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

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
        toast.success(`Berhasil! ${result.syncedCount || logs.length} record telah disinkronkan.`);
        setLogs([]);
        router.push('/matriks-kehadiran');
      } else {
        toast.error('Gagal sinkronisasi: ' + (result.error || 'Kesalahan DB'));
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan koneksi: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <ImportHeader />

        {/* Upload Zone Container */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <FileUploadZone onFilesReady={handleFilesReady} />

          {selectedFiles.length > 0 && (
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={handleStartParsing}
                disabled={isUploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
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

        {/* Preview Parsing Result Table Component */}
        <LogPreviewTable
          logs={logs}
          isSyncing={isSyncing}
          onSync={handleSyncToMatrix}
        />
      </div>
    </AppLayout>
  );
}
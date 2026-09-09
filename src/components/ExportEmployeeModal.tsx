'use client';

import React, { useState } from 'react';
import { Download, Calendar, X, FileSpreadsheet } from 'lucide-react';

interface ExportEmployeeModalProps {
  pin: string;
  name: string;
}

export default function ExportEmployeeModal({ pin, name }: ExportEmployeeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isDownloading, setIsDownloading] = useState(false);

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  // Generasi Pilihan Tahun (2 Tahun Kebelakang & Tahun Depan)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const handleDownload = () => {
    setIsDownloading(true);
    const downloadUrl = `/api/attendance/export/employee?pin=${encodeURIComponent(pin)}&month=${month}&year=${year}`;

    // Buka link di window baru untuk memicu download
    window.open(downloadUrl, '_blank');

    setTimeout(() => {
      setIsDownloading(false);
      setIsOpen(false);
    }, 1000);
  };

  return (
    <>
      {/* Tombol Pemicu di Tabel/Kartu Pegawai */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
        title="Download Laporan Absensi"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        <span>Export Excel</span>
      </button>

      {/* Modal Filter Bulan & Tahun */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Download Laporan Individual</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-lg">
                <p className="text-xs text-emerald-900 font-medium">Pegawai:</p>
                <p className="text-sm font-bold text-emerald-950">{name}</p>
                <p className="text-xs text-emerald-700">PIN: {pin}</p>
              </div>

              {/* Form Filter */}
              <div className="grid grid-cols-2 gap-3">
                {/* Selector Bulan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Pilih Bulan
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector Tahun */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Pilih Tahun
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Mengunduh...' : 'Download Excel'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
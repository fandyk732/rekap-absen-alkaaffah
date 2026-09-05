'use client';

import React from 'react';
import { Download, FileText, Printer } from 'lucide-react';

interface ExportProps {
  monthName: string;
  year: number;
  stats: any;
  topLate: any[];
  topPermission: any[];
}

export default function ExportDashboardButtons({
  monthName,
  year,
  stats,
  topLate,
  topPermission,
}: ExportProps) {
  // 1. Export PDF (Menggunakan Print Native Browser)
  const handlePrintPDF = () => {
    window.print();
  };

  // 2. Export Word Document (.doc)
  const handleExportWord = () => {
    const headerHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>Laporan Evaluasi Presensi</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { color: #1e293b; text-align: center; }
      h2 { color: #334155; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px; margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
      th { background-color: #f1f5f9; }
      .badge { font-weight: bold; padding: 3px 8px; border-radius: 4px; }
      .late { background-color: #fef3c7; color: #92400e; }
      .perm { background-color: #f3e8ff; color: #6b21a8; }
    </style>
    </head><body>`;

    const contentHtml = `
      <h1>LAPORAN EVALUASI BULANAN PRESENSI PEGAWAI</h1>
      <p style="text-align: center;"><b>Periode:</b> ${monthName} ${year}</p>
      <hr />

      <h2>1. RINGKASAN PRESENSI</h2>
      <table>
        <tr><th>Metrik Presensi</th><th>Jumlah</th><th>Rasio Kapasitas</th></tr>
        <tr><td>Total Pegawai Terdaftar</td><td><b>${stats.totalEmployees}</b> Orang</td><td>100%</td></tr>
        <tr><td>Hadir Tepat Waktu</td><td><b>${stats.totalHadir}</b> Log</td><td>${stats.hadirPct}%</td></tr>
        <tr><td>Frekuensi Terlambat</td><td><b>${stats.totalTerlambat}</b> Log</td><td>${stats.terlambatPct}%</td></tr>
        <tr><td>Izin / Sakit Disetujui</td><td><b>${stats.totalIzin}</b> Hari</td><td>${stats.izinSakitPct}%</td></tr>
        <tr><td>Alpha / Tanpa Keterangan</td><td><b>${stats.totalAlpha}</b> Hari</td><td>${stats.alphaPct}%</td></tr>
        <tr><td><b>Total Log Presensi Masuk</b></td><td colspan="2"><b>${stats.totalLogMasuk} Log</b> (dari ${stats.totalSlotKapasitas} Potensi Slot)</td></tr>
      </table>

      <h2>2. TOP 5 PEGAWAI SERING TERLAMBAT</h2>
      <table>
        <tr><th>No</th><th>Nama Pegawai</th><th>PIN</th><th>Total Keterlambatan</th></tr>
        ${
          topLate.length > 0
            ? topLate
                .map(
                  (emp, i) =>
                    `<tr><td>${i + 1}</td><td>${emp.name}</td><td>${emp.pin}</td><td><span class="badge late">${emp.count}x Telat</span></td></tr>`
                )
                .join('')
            : '<tr><td colspan="4">Tidak ada catatan keterlambatan bulan ini.</td></tr>'
        }
      </table>

      <h2>3. TOP 5 PEGAWAI SERING IZIN / SAKIT</h2>
      <table>
        <tr><th>No</th><th>Nama Pegawai</th><th>Alasan Utama</th><th>Total Pengajuan</th></tr>
        ${
          topPermission.length > 0
            ? topPermission
                .map(
                  (emp, i) =>
                    `<tr><td>${i + 1}</td><td>${emp.name}</td><td>${emp.reasons?.join(', ') || '-'}</td><td><span class="badge perm">${emp.count} Pengajuan</span></td></tr>`
                )
                .join('')
            : '<tr><td colspan="4">Tidak ada pengajuan izin/sakit bulan ini.</td></tr>'
        }
      </table>
    `;

    const footerHtml = `</body></html>`;
    const fullSource = headerHtml + contentHtml + footerHtml;

    const blob = new Blob(['\ufeff' + fullSource], {
      type: 'application/msword',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Presensi_${monthName}_${year}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={handlePrintPDF}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-sm text-xs font-semibold"
        title="Download / Print PDF"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Cetak PDF</span>
      </button>

      <button
        onClick={handleExportWord}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-sm text-xs font-semibold"
        title="Download Laporan Word"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Export Word</span>
      </button>
    </div>
  );
}
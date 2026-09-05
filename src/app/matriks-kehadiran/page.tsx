'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Calendar, Download, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function MatriksKehadiranPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matriks?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        setMatrixData(json.data);
      } else {
        setMatrixData([]);
        toast.error(json.error || 'Gagal memuat matriks.');
      }
    } catch (err) {
      setMatrixData([]);
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [selectedMonth, selectedYear]);

  // Pengaman Array.isArray
  const filteredData = Array.isArray(matrixData)
    ? matrixData.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(emp.pin || '').includes(searchQuery)
      )
    : [];

  // FUNGSI EKSPOR EXCEL
  const exportToExcel = async () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor!');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Membangun file Excel...');

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Matriks Kehadiran');

      // 1. Judul Header Laporan
      worksheet.mergeCells(1, 1, 1, daysInMonth + 8);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.value = `MATRIKS KEHADIRAN PEGAWAI - ${monthNames[selectedMonth - 1].toUpperCase()} ${selectedYear}`;
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E293B' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.addRow([]); // Row kosong (Row 2)

      // 2. Header Tabel
      const headerRowValues: any[] = ['No', 'PIN', 'Nama Pegawai', 'Jabatan'];
      for (let day = 1; day <= daysInMonth; day++) {
        headerRowValues.push(day);
      }
      headerRowValues.push('H', 'T', 'I', 'S', 'A');

      const headerRow = worksheet.addRow(headerRowValues);
      headerRow.height = 24;

      // Styling Header Row
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        if (colNumber <= 4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // Slate-700
        } else if (colNumber <= 4 + daysInMonth) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } }; // Slate-600
        } else {
          // Total Kolom H, T, I, S, A
          const bgColors = ['FF059669', 'FFD97706', 'FF2563EB', 'FF9333EA', 'FFE11D48'];
          const idx = colNumber - (4 + daysInMonth) - 1;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColors[idx] || 'FF334155' } };
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });

      // 3. Menambahkan Data Pegawai
      filteredData.forEach((emp, index) => {
        let totalH = 0, totalT = 0, totalI = 0, totalS = 0, totalA = 0;

        const rowValues: any[] = [
          index + 1,
          emp.pin || '-',
          emp.name || '-',
          emp.role || 'Pegawai',
        ];

        for (let day = 1; day <= daysInMonth; day++) {
          const statusObj = emp.dailyStatus?.[String(day)];
          let code = '-';

          if (statusObj) {
            switch (statusObj.status) {
              case 'Hadir': code = 'H'; totalH++; break;
              case 'Terlambat': code = 'T'; totalT++; break;
              case 'Izin': code = 'I'; totalI++; break;
              case 'Sakit': code = 'S'; totalS++; break;
              case 'Alpha': code = 'A'; totalA++; break;
            }
          }
          rowValues.push(code);
        }

        rowValues.push(totalH, totalT, totalI, totalS, totalA);

        const dataRow = worksheet.addRow(rowValues);
        dataRow.height = 20;

        // Styling Data Cells
        dataRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 9 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };

          // Kolom Nama & Jabatan rata kiri
          if (colNumber === 3 || colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }

          // Warna Status Harian
          if (colNumber > 4 && colNumber <= 4 + daysInMonth) {
            const val = String(cell.value);
            if (val === 'H') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Light Green
              cell.font = { bold: true, color: { argb: 'FF065F46' } };
            } else if (val === 'T') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Light Yellow
              cell.font = { bold: true, color: { argb: 'FF92400E' } };
            } else if (val === 'I') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Light Blue
              cell.font = { bold: true, color: { argb: 'FF1E40AF' } };
            } else if (val === 'S') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } }; // Light Purple
              cell.font = { bold: true, color: { argb: 'FF6B21A8' } };
            } else if (val === 'A') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red
              cell.font = { bold: true, color: { argb: 'FF991B1B' } };
            } else {
              cell.font = { color: { argb: 'FF94A3B8' } };
            }
          }

          // Total Kolom Styling
          if (colNumber > 4 + daysInMonth) {
            cell.font = { bold: true };
          }

          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      });

      // 4. Pengaturan Lebar Kolom
      worksheet.getColumn(1).width = 5;   // No
      worksheet.getColumn(2).width = 12;  // PIN
      worksheet.getColumn(3).width = 25;  // Nama
      worksheet.getColumn(4).width = 18;  // Jabatan

      for (let i = 5; i <= 4 + daysInMonth; i++) {
        worksheet.getColumn(i).width = 4.5; // Tanggal
      }

      for (let i = 5 + daysInMonth; i <= 9 + daysInMonth; i++) {
        worksheet.getColumn(i).width = 6;   // Total H, T, I, S, A
      }

      // 5. Generate & Save File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Matriks_Kehadiran_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`);

      toast.success('File Excel berhasil diunduh!', { id: toastId });
    } catch (err: any) {
      console.error('Export Error:', err);
      toast.error('Gagal mengekspor data ke Excel.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Matriks Kehadiran Pegawai</h1>
            <p className="text-slate-500 text-sm">
              Rekapitulasi lengkap kehadiran, izin, sakit, dan alpha harian pegawai.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={isExporting || loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Mengekspor...' : 'Ekspor Excel'}
            </button>
            <button
              onClick={fetchMatrix}
              disabled={loading}
              className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar & Legenda */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none border-l pl-2 border-slate-300"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Legenda Indikator */}
            <div className="flex flex-wrap items-center gap-3 text-xs pl-2 border-l border-slate-200">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> H (Hadir)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> T (Terlambat)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> I (Izin)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> S (Sakit)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> A (Alpha)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> - (Libur)</span>
            </div>
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {/* Tabel Matriks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 sticky left-0 bg-slate-50 border-r border-slate-200 z-10 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Pegawai
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <th key={d} className="py-2 px-1 text-center border-r border-slate-200 min-w-[32px]">
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
                  filteredData.map((emp) => {
                    let totalH = 0, totalT = 0, totalI = 0, totalS = 0, totalA = 0;

                    return (
                      <tr key={emp.id || emp.pin} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="font-semibold text-slate-900 truncate max-w-[170px]">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">PIN: {emp.pin} • {emp.role}</div>
                        </td>

                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                          const cellData = emp.dailyStatus?.[String(d)];
                          let code = '-';
                          let color = 'bg-slate-50 text-slate-300';
                          let title = 'Libur / Tidak ada log';

                          if (cellData) {
                            switch (cellData.status) {
                              case 'Hadir':
                                code = 'H';
                                color = 'bg-emerald-100 text-emerald-800 font-bold';
                                title = `Hadir (${cellData.checkIn || 'Tepat Waktu'})`;
                                totalH++;
                                break;
                              case 'Terlambat':
                                code = 'T';
                                color = 'bg-amber-100 text-amber-800 font-bold';
                                title = `Terlambat (${cellData.checkIn || '-'})`;
                                totalT++;
                                break;
                              case 'Izin':
                                code = 'I';
                                color = 'bg-blue-100 text-blue-800 font-bold';
                                title = 'Izin Kerja';
                                totalI++;
                                break;
                              case 'Sakit':
                                code = 'S';
                                color = 'bg-purple-100 text-purple-800 font-bold';
                                title = 'Sakit';
                                totalS++;
                                break;
                              case 'Alpha':
                                code = 'A';
                                color = 'bg-rose-100 text-rose-800 font-bold';
                                title = 'Alpha (Tanpa Keterangan)';
                                totalA++;
                                break;
                            }
                          }

                          return (
                            <td key={d} className="py-1 px-0.5 text-center border-r border-slate-100">
                              <span 
                                title={title}
                                className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] cursor-default ${color}`}
                              >
                                {code}
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-2 px-1 text-center font-bold text-emerald-700 bg-emerald-50/40 border-l border-slate-200">{totalH}</td>
                        <td className="py-2 px-1 text-center font-bold text-amber-700 bg-amber-50/40 border-l border-slate-200">{totalT}</td>
                        <td className="py-2 px-1 text-center font-bold text-blue-700 bg-blue-50/40 border-l border-slate-200">{totalI}</td>
                        <td className="py-2 px-1 text-center font-bold text-purple-700 bg-purple-50/40 border-l border-slate-200">{totalS}</td>
                        <td className="py-2 px-1 text-center font-bold text-rose-700 bg-rose-50/40 border-l border-slate-200">{totalA}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
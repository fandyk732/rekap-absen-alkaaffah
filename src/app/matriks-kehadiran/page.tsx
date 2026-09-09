'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Calendar, Download, RefreshCw, Search, LogIn, LogOut } from 'lucide-react';
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

  // Menggunakan useCallback agar fungsi stabil & ramah re-render
  const fetchMatrix = useCallback(async () => {
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
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // Pengaman Array.isArray untuk Filter
  const filteredData = Array.isArray(matrixData)
    ? matrixData.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(emp.pin || '').includes(searchQuery)
      )
    : [];

  // FUNGSI EKSPOR EXCEL (SUDAH DIOPTIMASI)
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

      worksheet.addRow([]); // Row 2 kosong

      // 2. Header Tabel
      const headerRowValues: any[] = ['No', 'PIN', 'Nama Pegawai', 'Jabatan'];
      for (let day = 1; day <= daysInMonth; day++) {
        headerRowValues.push(day);
      }
      headerRowValues.push('H', 'T', 'I', 'S', 'A');

      const headerRow = worksheet.addRow(headerRowValues);
      headerRow.height = 26;

      headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        if (colNumber <= 4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        } else if (colNumber <= 4 + daysInMonth) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
        } else {
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
        const rowValues: any[] = [
          index + 1,
          emp.pin || '-',
          emp.name || '-',
          emp.role || 'Pegawai',
        ];

        for (let day = 1; day <= daysInMonth; day++) {
          const statusObj = emp.dailyStatus?.[String(day)];
          let cellText = '-';

          if (statusObj) {
            switch (statusObj.status) {
              case 'Hadir':
              case 'Terlambat': {
                const inTime = statusObj.checkIn || '-';
                const outTime = statusObj.checkOut || '?';
                cellText = `M: ${inTime}\nP: ${outTime}`;
                break;
              }
              case 'Izin':
                cellText = 'I';
                break;
              case 'Sakit':
                cellText = 'S';
                break;
              case 'Alpha':
                cellText = 'A';
                break;
            }
          }
          rowValues.push(cellText);
        }

        // Ambil akumulasi summary langsung dari kalkulasi akurat backend
        rowValues.push(
          emp.summary?.hadir || 0,
          emp.summary?.terlambat || 0,
          emp.summary?.izinSakit || 0,
          0, // S
          emp.summary?.alpha || 0
        );

        const dataRow = worksheet.addRow(rowValues);
        dataRow.height = 32;

        // Styling Data Cells
        dataRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 8 };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

          if (colNumber === 3 || colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }

          // Format Sel Harian (Tanggal)
          if (colNumber > 4 && colNumber <= 4 + daysInMonth) {
            const dayNum = colNumber - 4;
            const statusObj = emp.dailyStatus?.[String(dayNum)];

            if (statusObj) {
              if (statusObj.status === 'Hadir') {
                if (statusObj.isEarlyLeave) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
                  cell.font = { size: 8, bold: true, color: { argb: 'FFC2410C' } };
                } else {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
                  cell.font = { size: 8, color: { argb: 'FF065F46' } };
                }
              } else if (statusObj.status === 'Terlambat') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                cell.font = { size: 8, bold: true, color: { argb: 'FF92400E' } };
              } else if (statusObj.status === 'Izin') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
                cell.font = { size: 9, bold: true, color: { argb: 'FF1E40AF' } };
              } else if (statusObj.status === 'Sakit') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
                cell.font = { size: 9, bold: true, color: { argb: 'FF6B21A8' } };
              } else if (statusObj.status === 'Alpha') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                cell.font = { size: 9, bold: true, color: { argb: 'FF991B1B' } };
              }
            } else {
              cell.font = { size: 9, color: { argb: 'FF94A3B8' } };
            }
          }

          if (colNumber > 4 + daysInMonth) {
            cell.font = { size: 9, bold: true };
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
      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 12;
      worksheet.getColumn(3).width = 25;
      worksheet.getColumn(4).width = 18;

      for (let i = 5; i <= 4 + daysInMonth; i++) {
        worksheet.getColumn(i).width = 8.5;
      }

      for (let i = 5 + daysInMonth; i <= 9 + daysInMonth; i++) {
        worksheet.getColumn(i).width = 6;
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
              Rekapitulasi lengkap jam masuk, jam pulang, izin, sakit, dan alpha harian pegawai.
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
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none border-l pl-2 border-slate-300 cursor-pointer"
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
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> PC (Pulang Cepat)</span>
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
                  filteredData.map((emp) => {
                    return (
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
                                /* TAMPILAN BERTUMPUK: JAM MASUK & JAM PULANG */
                                <div
                                  className={`p-1 rounded flex flex-col items-center justify-center gap-0.5 border ${
                                    cellData.status === 'Terlambat'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {/* Jam Masuk */}
                                  <div className="flex items-center gap-0.5 font-mono text-[9px] font-bold">
                                    <LogIn className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                    {cellData.checkIn || '-'}
                                  </div>

                                  {/* Jam Pulang */}
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

                        {/* Mengambil summary persis dari kalkulasi API Backend */}
                        <td className="py-2 px-1 text-center font-bold text-emerald-700 bg-emerald-50/40 border-l border-slate-200">{emp.summary?.hadir || 0}</td>
                        <td className="py-2 px-1 text-center font-bold text-amber-700 bg-amber-50/40 border-l border-slate-200">{emp.summary?.terlambat || 0}</td>
                        <td className="py-2 px-1 text-center font-bold text-blue-700 bg-blue-50/40 border-l border-slate-200">{emp.summary?.izinSakit || 0}</td>
                        <td className="py-2 px-1 text-center font-bold text-purple-700 bg-purple-50/40 border-l border-slate-200">0</td>
                        <td className="py-2 px-1 text-center font-bold text-rose-700 bg-rose-50/40 border-l border-slate-200">{emp.summary?.alpha || 0}</td>
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
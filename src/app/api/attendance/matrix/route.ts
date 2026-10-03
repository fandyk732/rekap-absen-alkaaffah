import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

const db = prisma as any;

const timeToMinutes = (timeStr: string): number | null => {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return null;
  
  let str = timeStr.trim().toUpperCase().replace(/\./g, ':');

  if (str.includes('AM') || str.includes('PM')) {
    const isPM = str.includes('PM');
    const cleanTime = str.replace(/AM|PM/g, '').trim();
    const parts = cleanTime.split(':');
    
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1] || '0', 10);

    if (isNaN(h)) return null;
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;

    return h * 60 + (isNaN(m) ? 0 : m);
  }

  const parts = str.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }

  return null;
};

// Parser tanggal fleksibel (Akurat membaca DD-MM-YYYY dari DB Neon)
const parseFlexibleDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  if (str.includes('-') || str.includes('/')) {
    const sep = str.includes('-') ? '-' : '/';
    const parts = str.split(sep);
    if (parts.length === 3) {
      // Format DD-MM-YYYY atau DD/MM/YYYY (Contoh DB Neon: 15-09-2026)
      if (parts[0].length <= 2 && parts[2].length === 4) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
      // Format YYYY-MM-DD atau YYYY/MM/DD
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

// Helper kategori perizinan (Mencakup 'Sakit', 'sakit', 'S', 'SK')
function getPermissionCategory(typeStr: string | null | undefined): 'S' | 'C' | 'I' | 'T' {
  if (!typeStr) return 'I';
  const clean = typeStr.trim().toLowerCase();

  if (clean === 's' || clean === 'sk' || clean.includes('sakit') || clean.includes('sick')) return 'S';
  if (clean === 'c' || clean.includes('cuti') || clean.includes('leave')) return 'C';
  if (clean.includes('terlambat') || clean.includes('late')) return 'T';

  return 'I';
}

function isValidTime(val: string | null | undefined): boolean {
  if (!val) return false;
  const clean = val.trim();
  return clean !== '' && clean !== '--:--' && clean !== '-' && clean !== 'null' && clean !== '00:00:00';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1];

    // 1. Fetch Data Paralel
    const [globalSetting, employees, allLogs, permissions, holidays] = await Promise.all([
      db.setting.findFirst().catch(() => null),
      prisma.employee.findMany({
        where: { status: 'Aktif' },
        include: { schedules: true },
        orderBy: { name: 'asc' },
      }),
      prisma.attendanceLog.findMany().catch(() => []),
      prisma.permission.findMany({
        where: { status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] } },
      }).catch(() => []),
      prisma.holiday.findMany().catch(() => []),
    ]);

    // Parse Jam Kerja Global
    let defaultStartMin = 435; // 07:15
    if (globalSetting?.workStartTime) {
      const parsed = timeToMinutes(globalSetting.workStartTime);
      if (parsed !== null) defaultStartMin = parsed;
    }

    const formattedMonth = String(month).padStart(2, '0');
    const yearStr = String(year);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Matriks Kehadiran');
    worksheet.views = [{ showGridLines: true }];

    // Total Kolom Excel = 4 (No, PIN, Nama, Jabatan) + Jumlah Hari + 6 (H, T, A, I, S, C)
    const totalCols = 4 + daysInMonth + 6;

    // Header Judul Laporan
    worksheet.mergeCells(1, 1, 1, totalCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'SMKS AL KAAFFAH - LAPORAN MATRIKS KEHADIRAN PEGAWAI';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

    worksheet.mergeCells(2, 1, 2, totalCols);
    const subCell = worksheet.getCell(2, 1);
    subCell.value = `Periode: ${monthName} ${year} | Dicetak Pada: ${new Date().toLocaleDateString('id-ID')}`;
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };

    worksheet.addRow([]); // Spacing

    // Header Tabel
    const headerRowValues = ['No', 'PIN', 'Nama Pegawai', 'Jabatan / Role'];
    for (let i = 1; i <= daysInMonth; i++) {
      headerRowValues.push(String(i));
    }
    // Kolom Ringkasan Lengkap
    headerRowValues.push('H', 'T', 'A', 'I', 'S', 'C');

    const headerRow = worksheet.addRow(headerRowValues);
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // Body Matriks
    employees.forEach((emp, index) => {
      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalMangkir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalCuti = 0;

      const empPinStr = String(emp.pin).trim();

      // Filter Log Pegawai untuk Bulan Ini
      const empLogs = allLogs.filter((l: any) => {
        if (String(l.pin || '').trim() !== empPinStr) return false;
        const parsedD = parseFlexibleDate(l.date);
        return parsedD && parsedD.getMonth() + 1 === month && parsedD.getFullYear() === year;
      });

      // Filter Izin Pegawai
      const empPermissions = permissions.filter((p: any) => String(p.pin || '').trim() === empPinStr);

      // Schedule Map
      const scheduleMap: Record<number, { isWorking: boolean; startTime?: string }> = {};
      if (emp.schedules && Array.isArray(emp.schedules)) {
        emp.schedules.forEach((s: any) => {
          scheduleMap[s.dayOfWeek] = {
            isWorking: s.isWorking,
            startTime: s.startTime || null,
          };
        });
      }

      // Group Logs per Day
      const logsByDay: Record<string, any[]> = {};
      empLogs.forEach((log: any) => {
        const parsedD = parseFlexibleDate(log.date);
        if (parsedD) {
          const dayKey = String(parsedD.getDate());
          if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
          logsByDay[dayKey].push(log);
        }
      });

      // Group Permissions per Day (🔥 DIPERBAIKI: Reset Time Jam Ke 00:00:00)
      const permByDay: Record<string, any> = {};
      empPermissions.forEach((p: any) => {
        const startDate = parseFlexibleDate(p.startDate);
        const endDate = parseFlexibleDate(p.endDate || p.startDate);

        if (startDate && endDate) {
          const curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

          while (curr <= last) {
            if (curr.getMonth() + 1 === month && curr.getFullYear() === year) {
              const dayStrKey = String(curr.getDate());
              permByDay[dayStrKey] = p;
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
      });

      const rowValues: (string | number)[] = [index + 1, emp.pin, emp.name, emp.role || 'Pegawai'];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = String(day);
        const dayStr = String(day).padStart(2, '0');
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        const dateIsoFormat = `${yearStr}-${formattedMonth}-${dayStr}`;
        const dateLocalFormat = `${dayStr}-${formattedMonth}-${yearStr}`;
        const dateSingleDigit = `${day}-${month}-${year}`;

        const dayLogs = logsByDay[dayKey] || [];
        const approvedPermission = permByDay[dayKey];

        const isHolidaySetting = holidays.some((h) => {
          if (!h.date) return false;
          const cleanHDate = h.date.trim();
          return cleanHDate === dateIsoFormat || cleanHDate === dateLocalFormat || cleanHDate === dateSingleDigit;
        });

        const customSched = scheduleMap[dayOfWeek];
        const isScheduledOff = customSched ? !customSched.isWorking : false;
        const isWeekendOrHoliday = dayOfWeek === 0 || isHolidaySetting || isScheduledOff;

        let empLimitStartMin = defaultStartMin;
        if (customSched && customSched.startTime) {
          const pStart = timeToMinutes(customSched.startTime);
          if (pStart !== null) empLimitStartMin = pStart;
        }

        // Cari CheckIn Earliest
        let minInMinutes = 99999;
        let earliestCheckInLog: any = null;

        dayLogs.forEach((log) => {
          const inStr = (log.checkIn || '').toString().trim();
          if (isValidTime(inStr)) {
            const m = timeToMinutes(inStr);
            if (m !== null && m < minInMinutes) {
              minInMinutes = m;
              earliestCheckInLog = log;
            }
          }
        });

        // --- PENENTUAN STATUS DENGAN PRESISI ---
        if (approvedPermission) {
          const category = getPermissionCategory(approvedPermission.type);

          if (category === 'S') {
            totalSakit++;
            rowValues.push('S');
          } else if (category === 'C') {
            totalCuti++;
            rowValues.push('C');
          } else if (category === 'T') {
            totalTerlambat++;
            rowValues.push('T');
          } else {
            totalIzin++;
            rowValues.push('I');
          }
        } else if (earliestCheckInLog && minInMinutes !== 99999) {
          const isLate = minInMinutes > empLimitStartMin;
          if (isLate) {
            totalTerlambat++;
            rowValues.push('T');
          } else {
            totalHadir++;
            rowValues.push('H');
          }
        } else if (isWeekendOrHoliday) {
          rowValues.push('L');
        } else {
          totalMangkir++;
          rowValues.push('A');
        }
      }

      // Append Total Ringkasan (Hadir, Terlambat, Alpha, Izin, Sakit, Cuti)
      rowValues.push(totalHadir, totalTerlambat, totalMangkir, totalIzin, totalSakit, totalCuti);

      const dataRow = worksheet.addRow(rowValues);
      dataRow.height = 20;

      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9 };
        } else if (colNumber === 3) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true };
        } else if (colNumber > 4 && colNumber <= 4 + daysInMonth) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          const val = String(cell.value);

          if (val === 'H') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF065F46' } };
          } else if (val === 'T') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF92400E' } };
          } else if (val === 'A') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF9F1239' } };
          } else if (val === 'S') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF6B21A8' } };
          } else if (['I', 'C'].includes(val)) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E40AF' } };
          } else if (val === 'L') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            cell.font = { name: 'Arial', size: 9, color: { argb: 'FF94A3B8' } };
          }
        } else {
          // Kolom Summary Kanan
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    });

    // Lebar Kolom
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 12;
    worksheet.getColumn(3).width = 28;
    worksheet.getColumn(4).width = 14;

    for (let i = 5; i <= 4 + daysInMonth; i++) worksheet.getColumn(i).width = 4.5;
    for (let i = 5 + daysInMonth; i <= 10 + daysInMonth; i++) worksheet.getColumn(i).width = 5.5;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Matriks_Kehadiran_AlKaaffah_${monthName}_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('[EXPORT MATRIX ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

const db = prisma as any;

// Helper Parse Date yang Aman Timezone & Stripping Hours
function parseToLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  let y = 0, m = 0, d = 0;

  if (cleanStr.includes('-') || cleanStr.includes('/')) {
    const sep = cleanStr.includes('-') ? '-' : '/';
    const parts = cleanStr.split(sep);
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
    }
  }

  if (!y || isNaN(y)) return null;
  return new Date(y, m, d, 0, 0, 0, 0);
}

function isValidTime(val: string | null | undefined): boolean {
  if (!val) return false;
  const clean = val.trim();
  return clean !== '' && clean !== '--:--' && clean !== '-' && clean !== 'null';
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin')?.trim();
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN Pegawai wajib diisi.' }, { status: 400 });
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1];

    // Fetch Global Setting, Employee, Logs, Permissions, Holidays
    const [globalSetting, employee, allLogs, permissions, holidays] = await Promise.all([
      db.setting.findUnique({ where: { id: 'default' } }),
      prisma.employee.findUnique({
        where: { pin },
        include: { schedules: true },
      }),
      prisma.attendanceLog.findMany({ where: { pin } }),
      prisma.permission.findMany({
        where: {
          pin,
          status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] },
        },
      }),
      prisma.holiday.findMany(),
    ]);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Pegawai tidak ditemukan.' }, { status: 404 });
    }

    // Default Jam Kerja dari Global Setting
    const defaultGlobalWorkStart = globalSetting?.workStartTime || '07:15';

    const formattedMonth = String(month).padStart(2, '0');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Laporan_${employee.name.substring(0, 10)}`);
    worksheet.views = [{ showGridLines: true }];

    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'SMKS AL KAAFFAH - LAPORAN KEHADIRAN INDIVIDUAL';
    worksheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

    worksheet.getCell('A3').value = 'Nama Pegawai';
    worksheet.getCell('B3').value = `: ${employee.name}`;
    worksheet.getCell('A3').font = { name: 'Arial', bold: true };

    worksheet.getCell('A4').value = 'PIN / NIP';
    worksheet.getCell('B4').value = `: ${employee.pin}`;
    worksheet.getCell('A4').font = { name: 'Arial', bold: true };

    worksheet.getCell('A5').value = 'Jabatan / Role';
    worksheet.getCell('B5').value = `: ${employee.role || 'Pegawai'}`;
    worksheet.getCell('A5').font = { name: 'Arial', bold: true };

    worksheet.getCell('A6').value = 'Periode';
    worksheet.getCell('B6').value = `: ${monthName} ${year}`;
    worksheet.getCell('A6').font = { name: 'Arial', bold: true };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['Tanggal', 'Hari', 'Jam Masuk', 'Jam Keluar', 'Status', 'Keterangan']);
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Map Schedule Individual
    const scheduleMap: Record<number, { isWorking: boolean; startTime?: string; endTime?: string }> = {};
    if (employee.schedules && Array.isArray(employee.schedules)) {
      employee.schedules.forEach((s: any) => {
        scheduleMap[s.dayOfWeek] = {
          isWorking: s.isWorking,
          startTime: s.startTime || '07:15',
          endTime: s.endTime || '14:00',
        };
      });
    }

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    let countHadirTepat = 0;
    let countTerlambat = 0;
    let countIzin = 0;
    let countSakit = 0;
    let countCuti = 0;
    let countAlpha = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const currentDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);

      const dayOfWeek = currentDateObj.getDay();
      const dayName = dayNames[dayOfWeek];

      const dateIsoFormat = `${year}-${formattedMonth}-${dayStr}`;
      const dateLocalFormat = `${dayStr}-${formattedMonth}-${year}`;
      const dateSlashFormat = `${dayStr}/${formattedMonth}/${year}`;
      const dateSingleDigit = `${day}-${month}-${year}`;

      const record = allLogs.find((l) => {
        if (!l.date) return false;
        const cleanDate = l.date.trim();
        return (
          cleanDate === dateLocalFormat ||
          cleanDate === dateSingleDigit ||
          cleanDate === dateIsoFormat ||
          cleanDate === dateSlashFormat
        );
      });

      // Filter Izin/Sakit/Cuti
      const approvedPermission = permissions.find((p) => {
        const startDate = parseToLocalDate(p.startDate);
        const endDate = parseToLocalDate(p.endDate || p.startDate);
        if (!startDate) return false;
        const eDate = endDate || startDate;
        return currentDateObj >= startDate && currentDateObj <= eDate;
      });

      const holidaySetting = holidays.find((h) => {
        if (!h.date) return false;
        const cleanHDate = h.date.trim();
        return (
          cleanHDate === dateIsoFormat ||
          cleanHDate === dateLocalFormat ||
          cleanHDate === dateSlashFormat ||
          cleanHDate === dateSingleDigit
        );
      });

      const empSched = scheduleMap[dayOfWeek];
      const isScheduledOff = empSched ? !empSched.isWorking : dayOfWeek === 0;

      const targetStartTime = empSched?.startTime || defaultGlobalWorkStart;

      const hasScan = Boolean(record && isValidTime(record.checkIn));

      let checkIn = '-';
      let checkOut = '-';
      let status = 'Alpha';
      let ket = '-';

      if (approvedPermission) {
        const pType = (approvedPermission.type || 'Izin').trim();
        const lowerType = pType.toLowerCase();

        // A. Pengecekan Izin Terlambat
        if (lowerType.includes('terlambat') || lowerType.includes('late')) {
          countTerlambat++;
          status = 'Terlambat';
          ket = approvedPermission.reason || 'Izin Terlambat Disetujui';
          if (hasScan && record) {
            checkIn = isValidTime(record.checkIn) ? record.checkIn! : '-';
            checkOut = isValidTime(record.checkOut) ? record.checkOut! : '-';
          }
        } 
        // B. Pengecekan Sakit ('S', 'Sakit', 'SK', 'Izin Sakit')
        else if (lowerType === 's' || lowerType.includes('sakit') || lowerType.includes('sick') || lowerType === 'sk') {
          countSakit++;
          status = 'Sakit';
          ket = approvedPermission.reason || 'Sakit (Surat/Izin Disetujui)';
        } 
        // C. Pengecekan Cuti ('C', 'Cuti')
        else if (lowerType === 'c' || lowerType.includes('cuti') || lowerType.includes('leave')) {
          countCuti++;
          status = 'Cuti';
          ket = approvedPermission.reason || 'Cuti Disetujui';
        } 
        // D. Izin Murni
        else {
          countIzin++;
          status = 'Izin';
          ket = approvedPermission.reason || 'Izin Disetujui';
        }
      } else if (hasScan && record) {
        checkIn = isValidTime(record.checkIn) ? record.checkIn! : '-';
        checkOut = isValidTime(record.checkOut) ? record.checkOut! : '-';

        const scanInMinutes = timeToMinutes(checkIn);
        const targetMinutes = timeToMinutes(targetStartTime);
        const lateMinutes = scanInMinutes - targetMinutes;

        if (lateMinutes > 0) {
          countTerlambat++;
          status = 'Terlambat';
          ket = `Terlambat (${lateMinutes} mnt)`;
        } else {
          countHadirTepat++;
          status = 'Hadir';
          ket = 'Hadir Tepat Waktu';
        }
      } else if (holidaySetting) {
        status = 'Libur';
        ket = holidaySetting.description || 'Libur Nasional';
      } else if (isScheduledOff) {
        status = 'Libur';
        ket = 'Libur Akhir Pekan';
      } else {
        countAlpha++;
        status = 'Alpha';
        ket = 'Tidak Melakukan Scan';
      }

      const row = worksheet.addRow([
        `${dayStr}/${formattedMonth}/${year}`,
        dayName,
        checkIn,
        checkOut,
        status,
        ket,
      ]);

      row.height = 20;

      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: colNumber <= 4 ? 'center' : 'left', vertical: 'middle' };
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colNumber === 5) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true };

          if (status === 'Hadir') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          else if (status === 'Terlambat') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          else if (status === 'Alpha') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
          else if (['Izin', 'Sakit', 'Cuti'].includes(status)) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
          else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        }
      });
    }

    worksheet.addRow([]);
    const summaryHeader = worksheet.addRow(['RINGKASAN KEHADIRAN']);
    summaryHeader.getCell(1).font = { name: 'Arial', bold: true };

    const totalHadirKeseluruhan = countHadirTepat + countTerlambat;

    worksheet.addRow(['Hadir Tepat Waktu', countHadirTepat]);
    worksheet.addRow(['Terlambat', countTerlambat]);
    worksheet.addRow(['Total Kehadiran (Tepat + Terlambat)', totalHadirKeseluruhan]);
    worksheet.addRow(['Izin', countIzin]);
    worksheet.addRow(['Sakit', countSakit]);
    worksheet.addRow(['Cuti', countCuti]);
    worksheet.addRow(['Alpha / Tanpa Keterangan', countAlpha]);

    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 12;
    worksheet.getColumn(3).width = 14;
    worksheet.getColumn(4).width = 14;
    worksheet.getColumn(5).width = 16;
    worksheet.getColumn(6).width = 35;

    const buffer = await workbook.xlsx.writeBuffer();

    const sanitizedName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Laporan_Absensi_${sanitizedName}_${monthName}_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
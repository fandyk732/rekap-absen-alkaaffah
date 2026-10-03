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

const parseFlexibleDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  if (str.includes('-') || str.includes('/')) {
    const sep = str.includes('-') ? '-' : '/';
    const parts = str.split(sep);
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

function isValidTime(val: string | null | undefined): boolean {
  if (!val) return false;
  const clean = val.trim();
  return clean !== '' && clean !== '--:--' && clean !== '-' && clean !== 'null' && clean !== '00:00:00' && clean !== '00.00.00';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin')?.trim();
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN Pegawai wajib diisi.' }, { status: 400 });
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1];

    // Fetch Global Setting, Employee, Logs, Permissions, Holidays secara paralel
    const [globalSetting, employee, allLogs, permissions, holidays] = await Promise.all([
      db.setting.findFirst().catch(() => null),
      prisma.employee.findUnique({
        where: { pin },
        include: { schedules: true },
      }),
      prisma.attendanceLog.findMany({ where: { pin } }).catch(() => []),
      prisma.permission.findMany({
        where: {
          pin,
          status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] },
        },
      }).catch(() => []),
      prisma.holiday.findMany().catch(() => []),
    ]);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Pegawai tidak ditemukan.' }, { status: 404 });
    }

    // Default Jam Kerja dari Global Setting
    let defaultStartMin = 435; // 07:15
    let defaultEndMin = 840;   // 14:00

    if (globalSetting?.workStartTime) {
      const parsed = timeToMinutes(globalSetting.workStartTime);
      if (parsed !== null) defaultStartMin = parsed;
    }
    if (globalSetting?.workEndTime) {
      const parsed = timeToMinutes(globalSetting.workEndTime);
      if (parsed !== null) defaultEndMin = parsed;
    }

    const formattedMonth = String(month).padStart(2, '0');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Laporan_${employee.name.substring(0, 10)}`);
    worksheet.views = [{ showGridLines: true }];

    // --- HEADER DOKUMEN ---
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

    // --- TABEL HEADER ---
    const headerRow = worksheet.addRow(['Tanggal', 'Hari', 'Jam Masuk', 'Jam Keluar', 'Status', 'Keterangan']);
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Map Jadwal Individual
    const scheduleMap: Record<number, { isWorking: boolean; startTime?: string; endTime?: string }> = {};
    if (employee.schedules && Array.isArray(employee.schedules)) {
      employee.schedules.forEach((s: any) => {
        scheduleMap[s.dayOfWeek] = {
          isWorking: s.isWorking,
          startTime: s.startTime,
          endTime: s.endTime,
        };
      });
    }

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Map Log per Tanggal
    const logsByDay: Record<string, any[]> = {};
    allLogs.forEach((log: any) => {
      const parsedD = parseFlexibleDate(log.date);
      if (parsedD && parsedD.getMonth() + 1 === month && parsedD.getFullYear() === year) {
        const dayKey = String(parsedD.getDate());
        if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
        logsByDay[dayKey].push(log);
      }
    });

    // Map Perizinan per Tanggal
    const permByDay: Record<string, any> = {};
    permissions.forEach((p: any) => {
      const startDate = parseFlexibleDate(p.startDate);
      const endDate = parseFlexibleDate(p.endDate || p.startDate);

      if (startDate && endDate) {
        const curr = new Date(startDate);
        while (curr <= endDate) {
          if (curr.getMonth() + 1 === month && curr.getFullYear() === year) {
            const dayStrKey = String(curr.getDate());
            permByDay[dayStrKey] = p;
          }
          curr.setDate(curr.getDate() + 1);
        }
      }
    });

    let countHadirTepat = 0;
    let countTerlambat = 0;
    let countPulangCepat = 0;
    let countIzin = 0;
    let countSakit = 0;
    let countCuti = 0;
    let countAlpha = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = String(day);
      const dayStr = String(day).padStart(2, '0');
      const currentDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);

      const dayOfWeek = currentDateObj.getDay();
      const dayName = dayNames[dayOfWeek];

      const dateIsoFormat = `${year}-${formattedMonth}-${dayStr}`;
      const dateLocalFormat = `${dayStr}-${formattedMonth}-${year}`;
      const dateSlashFormat = `${dayStr}/${formattedMonth}/${year}`;
      const dateSingleDigit = `${day}-${month}-${year}`;

      const dayLogs = logsByDay[dayKey] || [];
      const approvedPermission = permByDay[dayKey];

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
      const isScheduledOff = empSched ? !empSched.isWorking : false;
      const isWeekendOrHoliday = dayOfWeek === 0 || holidaySetting || isScheduledOff;

      let empLimitStartMin = defaultStartMin;
      let empLimitEndMin = defaultEndMin;

      if (empSched) {
        if (empSched.startTime) {
          const pStart = timeToMinutes(empSched.startTime);
          if (pStart !== null) empLimitStartMin = pStart;
        }
        if (empSched.endTime) {
          const pEnd = timeToMinutes(empSched.endTime);
          if (pEnd !== null) empLimitEndMin = pEnd;
        }
      }

      // Cari CheckIn paling awal dan CheckOut paling akhir
      let earliestCheckInLog: any = null;
      let latestCheckOutLog: any = null;
      let minInMinutes = 99999;
      let maxOutMinutes = -1;

      dayLogs.forEach((log) => {
        const inStr = (log.checkIn || '').toString().trim();
        const outStr = (log.checkOut || '').toString().trim();

        if (isValidTime(inStr)) {
          const m = timeToMinutes(inStr);
          if (m !== null && m < minInMinutes) {
            minInMinutes = m;
            earliestCheckInLog = log;
          }
        }

        if (isValidTime(outStr)) {
          const m = timeToMinutes(outStr);
          if (m !== null && m > maxOutMinutes) {
            maxOutMinutes = m;
            latestCheckOutLog = log;
          }
        }
      });

      let checkIn = '-';
      let checkOut = '-';
      let status = 'Alpha';
      let ket = '-';

      const isPulangAwalPerm = approvedPermission && (approvedPermission.type || '').toLowerCase().includes('pulang');

      // 1. IZIN PULANG AWAL
      if (isPulangAwalPerm) {
        checkIn = earliestCheckInLog ? earliestCheckInLog.checkIn : '-';
        checkOut = approvedPermission.earlyLeaveTime || (latestCheckOutLog ? latestCheckOutLog.checkOut : '-');

        const checkInMin = timeToMinutes(checkIn) || empLimitStartMin;
        const isLate = checkInMin > empLimitStartMin;

        if (isLate) {
          countTerlambat++;
          status = 'Terlambat';
          ket = `Terlambat & Izin Pulang Awal (${approvedPermission.reason || 'Disetujui'})`;
        } else {
          countHadirTepat++;
          status = 'Hadir';
          ket = `Izin Pulang Awal (${approvedPermission.reason || 'Disetujui'})`;
        }
        countPulangCepat++;
      }
      // 2. IZIN FULL DAY / SAKIT / CUTI
      else if (approvedPermission) {
        const pType = (approvedPermission.type || 'Izin').trim().toLowerCase();

        if (pType.includes('sakit') || pType === 's' || pType === 'sk') {
          countSakit++;
          status = 'Sakit';
          ket = approvedPermission.reason || 'Sakit (Disetujui)';
        } else if (pType.includes('cuti') || pType === 'c') {
          countCuti++;
          status = 'Cuti';
          ket = approvedPermission.reason || 'Cuti (Disetujui)';
        } else {
          countIzin++;
          status = 'Izin';
          ket = approvedPermission.reason || 'Izin (Disetujui)';
        }
      }
      // 3. PRESENSI NORMAL
      else if (earliestCheckInLog && minInMinutes !== 99999) {
        checkIn = earliestCheckInLog.checkIn || '-';
        checkOut = latestCheckOutLog ? latestCheckOutLog.checkOut : '-';

        const isLate = minInMinutes > empLimitStartMin;
        const isEarlyLeave = maxOutMinutes !== -1 && maxOutMinutes < empLimitEndMin;

        if (isEarlyLeave) countPulangCepat++;

        if (isLate) {
          countTerlambat++;
          status = 'Terlambat';
          ket = `Terlambat (${minInMinutes - empLimitStartMin} mnt)${isEarlyLeave ? ' & Pulang Cepat' : ''}`;
        } else {
          countHadirTepat++;
          status = 'Hadir';
          ket = isEarlyLeave ? 'Hadir (Pulang Cepat)' : 'Hadir Tepat Waktu';
        }
      }
      // 4. LIBUR / WEEKEND
      else if (isWeekendOrHoliday) {
        status = 'Libur';
        ket = holidaySetting ? (holidaySetting.description || 'Libur Nasional') : 'Libur Akhir Pekan';
      }
      // 5. ALPHA
      else {
        countAlpha++;
        status = 'Alpha';
        ket = 'Tidak Melakukan Scan / Tanpa Keterangan';
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
          else if (status === 'Sakit') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
          else if (['Izin', 'Cuti'].includes(status)) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
          else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        }
      });
    }

    // --- RINGKASAN KEHADIRAN ---
    worksheet.addRow([]);
    const summaryHeader = worksheet.addRow(['RINGKASAN KEHADIRAN']);
    summaryHeader.getCell(1).font = { name: 'Arial', bold: true };

    const totalHadirKeseluruhan = countHadirTepat + countTerlambat;

    worksheet.addRow(['Hadir Tepat Waktu', countHadirTepat]);
    worksheet.addRow(['Terlambat', countTerlambat]);
    worksheet.addRow(['Pulang Cepat', countPulangCepat]);
    worksheet.addRow(['Total Kehadiran (Tepat + Terlambat)', totalHadirKeseluruhan]);
    worksheet.addRow(['Izin', countIzin]);
    worksheet.addRow(['Sakit', countSakit]);
    worksheet.addRow(['Cuti', countCuti]);
    worksheet.addRow(['Alpha / Tanpa Keterangan', countAlpha]);

    // Lebar Kolom
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 12;
    worksheet.getColumn(3).width = 14;
    worksheet.getColumn(4).width = 14;
    worksheet.getColumn(5).width = 16;
    worksheet.getColumn(6).width = 45;

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
    console.error('[EXCEL EXPORT ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
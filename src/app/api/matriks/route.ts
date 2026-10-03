import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      // Format DD-MM-YYYY atau DD/MM/YYYY (Misal: 22-09-2026)
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

// Helper kategori perizinan
function getPermissionCategory(typeStr: string | null | undefined): 'S' | 'C' | 'I' | 'PULANG_AWAL' {
  if (!typeStr) return 'I';
  const clean = typeStr.trim().toLowerCase();

  if (clean.includes('pulang')) return 'PULANG_AWAL';
  if (clean === 's' || clean === 'sk' || clean.includes('sakit') || clean.includes('sick')) return 'S';
  if (clean === 'c' || clean.includes('cuti') || clean.includes('leave')) return 'C';
  
  return 'I';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = Number(searchParams.get('month')) || now.getMonth() + 1;
    const year = Number(searchParams.get('year')) || now.getFullYear();

    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 1. FETCH DATA PARALEL (Hanya pegawai Aktif)
    const [settingRecord, employees, monthlyLogs, holidays, permissions] = await Promise.all([
      prisma.setting.findFirst().catch(() => null),
      prisma.employee.findMany({
        where: { status: 'Aktif' },
        include: { schedules: true },
        orderBy: { name: 'asc' },
      }),
      prisma.attendanceLog.findMany().catch(() => []),
      prisma.holiday.findMany().catch(() => []),
      prisma.permission.findMany({
        where: { status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] } },
      }).catch(() => []),
    ]);

    // Parse Setting Global
    let defaultStartMin = 435; // 07:15
    let defaultEndMin = 840;   // 14:00
    let limitTimeStr = '07:15';
    let endTimeStr = '14:00';

    if (settingRecord?.workStartTime) {
      limitTimeStr = settingRecord.workStartTime;
      const parsed = timeToMinutes(limitTimeStr);
      if (parsed !== null) defaultStartMin = parsed;
    }
    if (settingRecord?.workEndTime) {
      endTimeStr = settingRecord.workEndTime;
      const parsed = timeToMinutes(endTimeStr);
      if (parsed !== null) defaultEndMin = parsed;
    }

    let totalHadirGlobal = 0;
    let totalTerlambatGlobal = 0;
    let totalPulangCepatGlobal = 0;
    let totalIzinGlobal = 0;
    let totalSakitGlobal = 0;
    let totalCutiGlobal = 0;
    let totalAlphaGlobal = 0;

    // Filter log bulan & tahun berjalan
    const filteredMonthlyLogs = monthlyLogs.filter((log: any) => {
      const parsedD = parseFlexibleDate(log.date);
      if (!parsedD) return false;
      return parsedD.getMonth() + 1 === month && parsedD.getFullYear() === year;
    });

    // 2. OLAH MATRIKS PER PEGAWAI
    const matrixData = employees.map((emp: any) => {
      const empPinStr = String(emp.pin).trim();
      const empLogs = filteredMonthlyLogs.filter((l: any) => String(l.pin || '').trim() === empPinStr);
      const empPermissions = permissions.filter((p: any) => String(p.pin || '').trim() === empPinStr);

      const scheduleMap: Record<number, { isWorking: boolean; startTime: string | null; endTime: string | null }> = {};
      if (emp.schedules && Array.isArray(emp.schedules)) {
        emp.schedules.forEach((s: any) => {
          scheduleMap[s.dayOfWeek] = {
            isWorking: s.isWorking,
            startTime: s.startTime,
            endTime: s.endTime,
          };
        });
      }

      // Group log per tanggal
      const logsByDay: Record<string, any[]> = {};
      empLogs.forEach((log: any) => {
        const parsedD = parseFlexibleDate(log.date);
        if (parsedD) {
          const dayKey = String(parsedD.getDate());
          if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
          logsByDay[dayKey].push(log);
        }
      });

      // Map Izin per Hari
      const permByDay: Record<string, { type: string; earlyLeaveTime?: string }> = {};
      empPermissions.forEach((p: any) => {
        const startDate = parseFlexibleDate(p.startDate);
        const endDate = parseFlexibleDate(p.endDate || p.startDate);

        if (startDate && endDate) {
          const curr = new Date(startDate);
          while (curr <= endDate) {
            if (curr.getMonth() + 1 === month && curr.getFullYear() === year) {
              const dayStrKey = String(curr.getDate());
              permByDay[dayStrKey] = {
                type: p.type || 'Izin',
                earlyLeaveTime: p.earlyLeaveTime || null,
              };
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
      });

      const dailyStatus: Record<
        string,
        {
          status: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpha' | 'Libur';
          code?: string;
          checkIn?: string;
          checkOut?: string;
          isEarlyLeave?: boolean;
          noCheckout?: boolean;
        }
      > = {};

      let empHadirCount = 0;
      let empTerlambatCount = 0;
      let empPulangCepatCount = 0;
      let empIzinCount = 0;
      let empSakitCount = 0;
      let empCutiCount = 0;
      let empAlphaCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = String(day);
        const dayLogs = logsByDay[dayKey] || [];
        const dayStr = String(day).padStart(2, '0');

        const dateIsoFormat = `${yearStr}-${monthStr}-${dayStr}`;
        const dateLocalFormat = `${dayStr}-${monthStr}-${yearStr}`;
        const dateSingleDigit = `${day}-${month}-${year}`;

        const isHolidaySetting = holidays.some((h) => {
          if (!h.date) return false;
          const cleanHDate = h.date.trim();
          return cleanHDate === dateIsoFormat || cleanHDate === dateLocalFormat || cleanHDate === dateSingleDigit;
        });

        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        const customSched = scheduleMap[dayOfWeek];
        const isScheduledOff = customSched ? !customSched.isWorking : false;

        let empLimitStartMin = defaultStartMin;
        let empLimitEndMin = defaultEndMin;

        if (customSched) {
          if (customSched.startTime) {
            const pStart = timeToMinutes(customSched.startTime);
            if (pStart !== null) empLimitStartMin = pStart;
          }
          if (customSched.endTime) {
            const pEnd = timeToMinutes(customSched.endTime);
            if (pEnd !== null) empLimitEndMin = pEnd;
          }
        }

        const isWeekendOrHoliday = dateObj.getDay() === 0 || isHolidaySetting || isScheduledOff;

        // Cari CheckIn paling awal dan CheckOut paling akhir
        let earliestCheckInLog: any = null;
        let latestCheckOutLog: any = null;
        let minInMinutes = 99999;
        let maxOutMinutes = -1;

        dayLogs.forEach((log) => {
          const inStr = (log.checkIn || '').toString().trim();
          const outStr = (log.checkOut || '').toString().trim();

          if (inStr && inStr !== '-' && inStr !== '00:00:00' && inStr !== '00.00.00') {
            const m = timeToMinutes(inStr);
            if (m !== null && m < minInMinutes) {
              minInMinutes = m;
              earliestCheckInLog = log;
            }
          }

          if (outStr && outStr !== '-' && outStr !== '00:00:00' && outStr !== '00.00.00') {
            const m = timeToMinutes(outStr);
            if (m !== null && m > maxOutMinutes) {
              maxOutMinutes = m;
              latestCheckOutLog = log;
            }
          }
        });

        const activePerm = permByDay[dayKey];
        const permCategory = activePerm ? getPermissionCategory(activePerm.type) : null;

        // --- 1. IZIN PULANG AWAL ---
        if (permCategory === 'PULANG_AWAL') {
          const inTime = earliestCheckInLog ? earliestCheckInLog.checkIn : '07:15';
          const outTime = activePerm?.earlyLeaveTime || (latestCheckOutLog ? latestCheckOutLog.checkOut : '12:00');

          const checkInMin = timeToMinutes(inTime) || empLimitStartMin;
          const isLate = checkInMin > empLimitStartMin;
          const status = isLate ? 'Terlambat' : 'Hadir';

          dailyStatus[dayKey] = {
            status,
            code: isLate ? 'T' : 'H',
            checkIn: inTime,
            checkOut: outTime,
            isEarlyLeave: true,
            noCheckout: false,
          };

          empPulangCepatCount++;
          totalPulangCepatGlobal++;

          if (isLate) {
            empTerlambatCount++;
            totalTerlambatGlobal++;
          } else {
            empHadirCount++;
            totalHadirGlobal++;
          }
        }
        // --- 2. PERIZINAN FULL DAY (SAKIT / CUTI / IZIN) ---
        else if (activePerm) {
          if (permCategory === 'S') {
            dailyStatus[dayKey] = { status: 'Sakit', code: 'S' };
            empSakitCount++;
            totalSakitGlobal++;
          } else if (permCategory === 'C') {
            dailyStatus[dayKey] = { status: 'Cuti', code: 'C' };
            empCutiCount++;
            totalCutiGlobal++;
          } else {
            dailyStatus[dayKey] = { status: 'Izin', code: 'I' };
            empIzinCount++;
            totalIzinGlobal++;
          }
        }
        // --- 3. PRESENSI NORMAL ---
        else if (earliestCheckInLog && minInMinutes !== 99999) {
          const isLate = minInMinutes > empLimitStartMin;
          const status = isLate ? 'Terlambat' : 'Hadir';

          let isEarlyLeave = false;
          let noCheckout = false;

          if (maxOutMinutes !== -1) {
            if (maxOutMinutes < empLimitEndMin) {
              isEarlyLeave = true;
              empPulangCepatCount++;
              totalPulangCepatGlobal++;
            }
          } else {
            noCheckout = true;
          }

          dailyStatus[dayKey] = {
            status,
            code: isLate ? 'T' : 'H',
            checkIn: earliestCheckInLog.checkIn,
            checkOut: latestCheckOutLog ? latestCheckOutLog.checkOut : '-',
            isEarlyLeave,
            noCheckout,
          };

          if (isLate) {
            empTerlambatCount++;
            totalTerlambatGlobal++;
          } else {
            empHadirCount++;
            totalHadirGlobal++;
          }
        }
        // --- 4. HARI LIBUR / WEEKEND (Tanpa Scan) ---
        else if (isWeekendOrHoliday) {
          dailyStatus[dayKey] = { status: 'Libur', code: 'L' };
        }
        // --- 5. ALPHA ---
        else {
          dailyStatus[dayKey] = { status: 'Alpha', code: 'A' };
          empAlphaCount++;
          totalAlphaGlobal++;
        }
      }

      return {
        id: emp.id,
        pin: emp.pin,
        name: emp.name,
        role: emp.role || 'Pegawai',
        summary: {
          hadirTepat: empHadirCount,
          hadir: empHadirCount,
          terlambat: empTerlambatCount,
          pulangCepat: empPulangCepatCount,
          izin: empIzinCount,
          sakit: empSakitCount,
          cuti: empCutiCount,
          izinSakit: empIzinCount + empSakitCount + empCutiCount,
          mangkir: empAlphaCount,
          alpha: empAlphaCount,
        },
        dailyStatus,
        days: dailyStatus,
      };
    });

    // 3. RETURN DATA WITH DYNAMIC CACHE CONTROL
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

    return NextResponse.json(
      {
        success: true,
        limitTimeUsed: limitTimeStr,
        endTimeUsed: endTimeStr,
        summary: {
          totalEmployees: employees.length,
          totalHadir: totalHadirGlobal,
          totalTerlambat: totalTerlambatGlobal,
          totalPulangCepat: totalPulangCepatGlobal,
          totalIzin: totalIzinGlobal,
          totalSakit: totalSakitGlobal,
          totalCuti: totalCutiGlobal,
          totalIzinSakit: totalIzinGlobal + totalSakitGlobal + totalCutiGlobal,
          totalAlpha: totalAlphaGlobal,
        },
        data: matrixData,
      },
      {
        headers: {
          'Cache-Control': isCurrentMonth
            ? 'no-store, max-age=0'
            : 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error: any) {
    console.error('[MATRIKS ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
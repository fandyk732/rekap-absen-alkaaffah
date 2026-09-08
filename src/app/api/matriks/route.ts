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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
    const year = Number(searchParams.get('year')) || new Date().getFullYear();

    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 1. AMBIL SETTING GLOBAL (MASUK & PULANG)
    let defaultStartMin = 435; // 07:15
    let defaultEndMin = 840;   // 14:00
    let limitTimeStr = '07:15';
    let endTimeStr = '14:00';

    try {
      const settingRecord = (await prisma.setting.findFirst()) as any;
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
    } catch (e) {
      console.warn('[MATRIKS] Warning: Gagal membaca settings DB');
    }

    // 2. FETCH DATA
    const employees = await prisma.employee.findMany({
      include: { schedules: true },
      orderBy: { name: 'asc' },
    });
    const allLogs = await prisma.attendanceLog.findMany();
    const holidays = await prisma.holiday.findMany();

    let permissions: any[] = [];
    try {
      permissions = await prisma.permission.findMany({
        where: { status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] } },
      });
    } catch (e) {
      console.warn('[MATRIKS] Warning: Gagal membaca permission DB');
    }

    const monthlyLogs = allLogs.filter((a: any) => {
      if (!a.date) return false;
      const dStr = String(a.date);
      return dStr.includes(`${yearStr}-${monthStr}`) || dStr.includes(`-${monthStr}-${yearStr}`);
    });

    let totalHadirGlobal = 0;
    let totalTerlambatGlobal = 0;
    let totalPulangCepatGlobal = 0;
    let totalIzinSakitGlobal = 0;
    let totalAlphaGlobal = 0;

    // 3. OLAH MATRIKS PER PEGAWAI
    const matrixData = employees.map((emp: any) => {
      const empPinStr = String(emp.pin).trim();
      const empLogs = monthlyLogs.filter((l: any) => String(l.pin || '').trim() === empPinStr);
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

      const logsByDay: Record<string, any[]> = {};
      empLogs.forEach((log: any) => {
        const logDateStr = String(log.date).trim();
        let dayNumStr = '';
        if (logDateStr.includes('-') || logDateStr.includes('/')) {
          const sep = logDateStr.includes('-') ? '-' : '/';
          const parts = logDateStr.split(sep);
          dayNumStr = parts[0].length === 4 ? parts[2] : parts[0];
        }
        if (dayNumStr) {
          const dayKey = String(parseInt(dayNumStr, 10));
          if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
          logsByDay[dayKey].push(log);
        }
      });

      // Map Izin per Hari berdasarkan Tipe
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
          status: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha' | 'Libur';
          checkIn?: string;
          checkOut?: string;
          isEarlyLeave?: boolean;
          noCheckout?: boolean;
        }
      > = {};

      let empHadirCount = 0;
      let empTerlambatCount = 0;
      let empPulangCepatCount = 0;
      let empIzinSakitCount = 0;
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

        // Cari CheckIn paling awal dan CheckOut paling akhir dari Log Mesin Presensi
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
        const isPulangAwalPerm = activePerm && activePerm.type === 'Pulang Awal';

        // --- BILA ADA IZIN PULANG AWAL ---
        if (isPulangAwalPerm) {
          const inTime = earliestCheckInLog ? earliestCheckInLog.checkIn : '07:15';
          const outTime = activePerm.earlyLeaveTime || (latestCheckOutLog ? latestCheckOutLog.checkOut : '12:00');

          const checkInMin = timeToMinutes(inTime) || empLimitStartMin;
          const isLate = checkInMin > empLimitStartMin;
          const status = isLate ? 'Terlambat' : 'Hadir';

          dailyStatus[dayKey] = {
            status,
            checkIn: inTime,
            checkOut: outTime,
            isEarlyLeave: true, // Memicu warna Orange PC di Matriks
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
        // --- BILA ADA IZIN FULL DAY (Izin/Sakit/Cuti) ---
        else if (activePerm) {
          const permTypeLower = activePerm.type.toLowerCase();
          const finalStatus = permTypeLower.includes('sakit') ? 'Sakit' : 'Izin';

          dailyStatus[dayKey] = { status: finalStatus };
          empIzinSakitCount++;
          totalIzinSakitGlobal++;
        }
        // --- BILA LIBUR / WEEKEND ---
        else if (isWeekendOrHoliday) {
          dailyStatus[dayKey] = { status: 'Libur' };
        }
        // --- BILA PRESENSI NORMAL ---
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
        // --- ALPHA ---
        else {
          dailyStatus[dayKey] = { status: 'Alpha' };
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
          hadir: empHadirCount,
          terlambat: empTerlambatCount,
          pulangCepat: empPulangCepatCount,
          izinSakit: empIzinSakitCount,
          alpha: empAlphaCount,
        },
        dailyStatus,
      };
    });

    return NextResponse.json({
      success: true,
      limitTimeUsed: limitTimeStr,
      endTimeUsed: endTimeStr,
      summary: {
        totalEmployees: employees.length,
        totalHadir: totalHadirGlobal,
        totalTerlambat: totalTerlambatGlobal,
        totalPulangCepat: totalPulangCepatGlobal,
        totalIzinSakit: totalIzinSakitGlobal,
        totalAlpha: totalAlphaGlobal,
      },
      data: matrixData,
    });
  } catch (error: any) {
    console.error('[MATRIKS ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
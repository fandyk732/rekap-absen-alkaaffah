import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper parser jam fleksibel (11:15 AM, 11:15, 11.15)
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

// Helper parser tanggal fleksibel (DD-MM-YYYY, YYYY-MM-DD, ISO)
const parseFlexibleDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      // Jika format DD-MM-YYYY
      if (parts[0].length === 2 && parts[2].length === 4) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      // Jika format YYYY-MM-DD
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
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

    // 1. AMBIL SETTING JAM MASUK
    let limitMinutes = 435; // Default 07:15
    let limitTimeStr = '07:15';

    try {
      const settingRecord = await prisma.setting.findFirst();
      if (settingRecord?.workStartTime) {
        limitTimeStr = settingRecord.workStartTime;
        const parsed = timeToMinutes(limitTimeStr);
        if (parsed !== null) limitMinutes = parsed;
      }
    } catch (e) {
      console.warn('[MATRIKS] Warning: Gagal membaca settings DB');
    }

    // 2. AMBIL EMPLOYEES & ATTENDANCE LOGS
    const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
    const allLogs = await prisma.attendanceLog.findMany();

    // 3. AMBIL PERMISSIONS (Mendukung variasi penulisan Approved)
    let permissions: any[] = [];
    try {
      permissions = await prisma.permission.findMany({
        where: {
          status: {
            in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'],
          },
        },
      });
    } catch (e) {
      console.warn('[MATRIKS] Warning: Gagal membaca permission DB');
    }

    // Filter log absensi bulan ini
    const monthlyLogs = allLogs.filter((a: any) => {
      if (!a.date) return false;
      const dStr = String(a.date);
      return dStr.includes(`${yearStr}-${monthStr}`) || dStr.includes(`-${monthStr}-${yearStr}`);
    });

    // Variabel Penghitung Rekapitulasi Total Matriks
    let totalHadirGlobal = 0;
    let totalTerlambatGlobal = 0;
    let totalIzinSakitGlobal = 0;
    let totalAlphaGlobal = 0;

    // 4. SUSUN MATRIX DATA
    const matrixData = employees.map((emp: any) => {
      const empPinStr = String(emp.pin).trim();

      const empLogs = monthlyLogs.filter((l: any) => String(l.pin || '').trim() === empPinStr);

      const empPermissions = permissions.filter(
        (p: any) => String(p.pin || '').trim() === empPinStr
      );

      // Pemetaan Log Absensi Harian
      const logsByDay: Record<string, any[]> = {};
      empLogs.forEach((log: any) => {
        const logDateStr = String(log.date).trim();
        let dayNumStr = '';
        if (logDateStr.includes('-')) {
          const parts = logDateStr.split('-');
          dayNumStr = parts[0].length === 4 ? parts[2] : parts[0];
        }
        if (dayNumStr) {
          const dayKey = String(parseInt(dayNumStr, 10));
          if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
          logsByDay[dayKey].push(log);
        }
      });

      // Pemetaan Permission (Izin/Sakit) Harian
      const permByDay: Record<string, 'Izin' | 'Sakit'> = {};
      empPermissions.forEach((p: any) => {
        const startDate = parseFlexibleDate(p.startDate);
        const endDate = parseFlexibleDate(p.endDate || p.startDate);

        if (startDate && endDate) {
          const curr = new Date(startDate);
          while (curr <= endDate) {
            if (curr.getMonth() + 1 === month && curr.getFullYear() === year) {
              const type = String(p.type || '').toLowerCase();
              permByDay[String(curr.getDate())] = type.includes('sakit') ? 'Sakit' : 'Izin';
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
      });

      const dailyStatus: Record<
        string,
        { status: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha'; checkIn?: string }
      > = {};

      let empHadirCount = 0;
      let empTerlambatCount = 0;
      let empIzinSakitCount = 0;
      let empAlphaCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = String(day);
        const dayLogs = logsByDay[dayKey] || [];

        let earliestLog: any = null;
        let minMinutes = 99999;

        dayLogs.forEach((log) => {
          const checkInStr = (log.checkIn || '').toString().trim();
          if (checkInStr && checkInStr !== '-' && checkInStr !== '00.00.00' && checkInStr !== '00:00:00') {
            const minutes = timeToMinutes(checkInStr);
            if (minutes !== null && minutes < minMinutes) {
              minMinutes = minutes;
              earliestLog = log;
            }
          }
        });

        if (earliestLog && minMinutes !== 99999) {
          const isLate = minMinutes > limitMinutes;
          const status = isLate ? 'Terlambat' : 'Hadir';

          dailyStatus[dayKey] = {
            status,
            checkIn: earliestLog.checkIn,
          };

          if (isLate) {
            empTerlambatCount++;
            totalTerlambatGlobal++;
          } else {
            empHadirCount++;
            totalHadirGlobal++;
          }
        } else if (permByDay[dayKey]) {
          const permStatus = permByDay[dayKey];
          dailyStatus[dayKey] = { status: permStatus };
          empIzinSakitCount++;
          totalIzinSakitGlobal++;
        } else {
          const dateObj = new Date(year, month - 1, day);
          // UBAH DISINI: Jika Sabtu masuk kerja, ganti jadi (dateObj.getDay() === 0)
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
          if (!isWeekend) {
            dailyStatus[dayKey] = { status: 'Alpha' };
            empAlphaCount++;
            totalAlphaGlobal++;
          }
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
          izinSakit: empIzinSakitCount,
          alpha: empAlphaCount,
        },
        dailyStatus,
      };
    });

    const totalSlotKapasitas =
      totalHadirGlobal + totalTerlambatGlobal + totalIzinSakitGlobal + totalAlphaGlobal;

    return NextResponse.json({
      success: true,
      limitTimeUsed: limitTimeStr,
      summary: {
        totalEmployees: employees.length,
        totalHadir: totalHadirGlobal,
        totalTerlambat: totalTerlambatGlobal,
        totalIzinSakit: totalIzinSakitGlobal,
        totalAlpha: totalAlphaGlobal,
        totalSlotKapasitas,
      },
      data: matrixData,
    });
  } catch (error: any) {
    console.error('[MATRIKS ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
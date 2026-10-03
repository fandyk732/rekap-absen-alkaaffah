import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    const daysInMonth = new Date(year, month, 0).getDate();

    const [employees, allLogs, permissions, holidays] = await Promise.all([
      prisma.employee.findMany({
        where: { status: 'Aktif' },
        include: { schedules: true },
        orderBy: { name: 'asc' },
      }),
      prisma.attendanceLog.findMany(),
      prisma.permission.findMany({
        where: { status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] } },
      }),
      prisma.holiday.findMany(),
    ]);

    const formattedMonth = String(month).padStart(2, '0');

    const matrixData = employees.map((emp) => {
      const dailyStatus: Record<number, { status: string; code: string; color: string; checkIn?: string }> = {};
      let totalHadirTepat = 0;
      let totalTerlambat = 0;
      let totalMangkir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalCuti = 0;

      const scheduleMap: Record<number, { isWorking: boolean; startTime?: string }> = {};
      if (emp.schedules && Array.isArray(emp.schedules)) {
        emp.schedules.forEach((s: any) => {
          scheduleMap[s.dayOfWeek] = {
            isWorking: s.isWorking,
            startTime: s.startTime || '07:15',
          };
        });
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const currentDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);

        const dayOfWeek = currentDateObj.getDay();

        const dateIsoFormat = `${year}-${formattedMonth}-${dayStr}`;
        const dateLocalFormat = `${dayStr}-${formattedMonth}-${year}`;
        const dateSlashFormat = `${dayStr}/${formattedMonth}/${year}`;
        const dateSingleDigit = `${day}-${month}-${year}`;

        // Match Log
        const record = allLogs.find((l) => {
          if (String(l.pin).trim() !== String(emp.pin).trim() || !l.date) return false;
          const cleanDate = l.date.trim();
          return (
            cleanDate === dateLocalFormat ||
            cleanDate === dateSingleDigit ||
            cleanDate === dateIsoFormat ||
            cleanDate === dateSlashFormat
          );
        });

        // Match Permission (Aman Timezone)
        const approvedPermission = permissions.find((p) => {
          if (String(p.pin).trim() !== String(emp.pin).trim()) return false;
          const startDate = parseToLocalDate(p.startDate);
          const endDate = parseToLocalDate(p.endDate || p.startDate);
          if (!startDate) return false;
          const eDate = endDate || startDate;
          return currentDateObj >= startDate && currentDateObj <= eDate;
        });

        // Match Holiday
        const isHolidaySetting = holidays.some((h) => {
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
        const isWeekendOrHoliday = isHolidaySetting || isScheduledOff;

        if (approvedPermission) {
          const pType = (approvedPermission.type || 'Izin').trim();
          const lowerType = pType.toLowerCase();

          // A. Pengecekan Izin Terlambat
          if (lowerType.includes('terlambat') || lowerType.includes('late')) {
            totalTerlambat++;
            dailyStatus[day] = {
              status: 'Terlambat',
              code: 'T',
              color: 'bg-amber-100 text-amber-800 font-bold',
              checkIn: record?.checkIn || undefined,
            };
          }
          // B. Pengecekan Sakit ('S', 'Sakit', 'SK', 'Izin Sakit')
          else if (lowerType === 's' || lowerType.includes('sakit') || lowerType.includes('sick') || lowerType === 'sk') {
            totalSakit++;
            dailyStatus[day] = {
              status: pType || 'Sakit',
              code: 'S',
              color: 'bg-purple-100 text-purple-700 font-bold',
            };
          }
          // C. Pengecekan Cuti ('C', 'Cuti')
          else if (lowerType === 'c' || lowerType.includes('cuti') || lowerType.includes('leave')) {
            totalCuti++;
            dailyStatus[day] = {
              status: pType || 'Cuti',
              code: 'C',
              color: 'bg-indigo-100 text-indigo-700 font-bold',
            };
          }
          // D. Izin Lainnya
          else {
            totalIzin++;
            dailyStatus[day] = {
              status: pType || 'Izin',
              code: 'I',
              color: 'bg-blue-100 text-blue-700 font-bold',
            };
          }
        } else if (record && (isValidTime(record.checkIn) || record.status === 'Hadir' || record.status === 'Terlambat')) {
          const targetStartTime = empSched?.startTime || '07:15';
          const checkInTime = record.checkIn || '00:00';

          const scanInMinutes = timeToMinutes(checkInTime);
          const targetMinutes = timeToMinutes(targetStartTime);

          const isLate =
            (scanInMinutes > targetMinutes && isValidTime(record.checkIn)) ||
            record.flagColor === 'amber' ||
            record.status === 'Terlambat' ||
            (record.earlyLeaveReason && record.earlyLeaveReason.includes('Terlambat'));

          if (isLate) {
            totalTerlambat++;
            dailyStatus[day] = {
              status: 'Terlambat',
              code: 'T',
              color: 'bg-amber-100 text-amber-800 font-bold',
              checkIn: record.checkIn || undefined,
            };
          } else {
            totalHadirTepat++;
            dailyStatus[day] = {
              status: 'Hadir',
              code: 'H',
              color: 'bg-emerald-100 text-emerald-800 font-medium',
              checkIn: record.checkIn || undefined,
            };
          }
        } else if (isWeekendOrHoliday) {
          dailyStatus[day] = {
            status: isHolidaySetting ? 'Libur Nasional' : 'Libur Akhir Pekan',
            code: 'L',
            color: 'bg-slate-100 text-slate-400 font-medium',
          };
        } else {
          totalMangkir++;
          dailyStatus[day] = {
            status: 'Alpha',
            code: 'A',
            color: 'bg-rose-100 text-rose-700 font-bold',
          };
        }
      }

      return {
        pin: emp.pin,
        name: emp.name,
        role: emp.role,
        days: dailyStatus,
        summary: {
          hadirTepat: totalHadirTepat,
          terlambat: totalTerlambat,
          hadir: totalHadirTepat + totalTerlambat,
          mangkir: totalMangkir,
          izin: totalIzin,
          sakit: totalSakit,
          cuti: totalCuti,
          totalIzinSakitCuti: totalIzin + totalSakit + totalCuti,
        },
      };
    });

    return NextResponse.json({ success: true, month, year, daysInMonth, data: matrixData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
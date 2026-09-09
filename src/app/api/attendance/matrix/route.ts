import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const cleanStr = dateStr.trim();
  if (cleanStr.includes('-') || cleanStr.includes('/')) {
    const sep = cleanStr.includes('-') ? '-' : '/';
    const parts = cleanStr.split(sep);
    if (parts[0].length === 2 && parts[2].length === 4) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  return new Date(cleanStr);
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
      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalMangkir = 0;
      let totalIzin = 0;

      const scheduleMap: Record<number, boolean> = {};
      if (emp.schedules && Array.isArray(emp.schedules)) {
        emp.schedules.forEach((s: any) => {
          scheduleMap[s.dayOfWeek] = s.isWorking;
        });
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const targetDate = `${dayStr}-${formattedMonth}-${year}`;
        const currentDateObj = new Date(year, month - 1, day);
        currentDateObj.setHours(0, 0, 0, 0);

        const dayOfWeek = currentDateObj.getDay();

        const dateIsoFormat = `${year}-${formattedMonth}-${dayStr}`;
        const dateLocalFormat = `${dayStr}-${formattedMonth}-${year}`;
        const dateSingleDigit = `${day}-${month}-${year}`;

        // Match Log
        const record = allLogs.find(
          (l) =>
            String(l.pin).trim() === String(emp.pin).trim() &&
            (l.date === targetDate || l.date === dateSingleDigit || l.date === dateIsoFormat)
        );

        // Match Permission
        const approvedPermission = permissions.find((p) => {
          if (String(p.pin).trim() !== String(emp.pin).trim()) return false;
          const startDate = parseDateString(p.startDate);
          const endDate = parseDateString(p.endDate || p.startDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return currentDateObj >= startDate && currentDateObj <= endDate;
        });

        // Match Holiday
        const isHolidaySetting = holidays.some((h) => {
          if (!h.date) return false;
          const cleanHDate = h.date.trim();
          return cleanHDate === dateIsoFormat || cleanHDate === dateLocalFormat || cleanHDate === dateSingleDigit;
        });

        const customWorking = scheduleMap[dayOfWeek];
        const isScheduledOff = customWorking !== undefined ? !customWorking : dayOfWeek === 0; // Default Minggu libur
        const isWeekendOrHoliday = isHolidaySetting || isScheduledOff;

        if (approvedPermission) {
          totalIzin++;
          const pType = approvedPermission.type || 'Izin';
          const code = pType.includes('Sakit') ? 'S' : pType.includes('Cuti') ? 'C' : 'I';

          dailyStatus[day] = {
            status: `${pType}`,
            code,
            color: code === 'S' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-blue-100 text-blue-700 font-bold',
          };
        } else if (record) {
            if (record.flagColor === 'amber') {
              totalTerlambat++;
              dailyStatus[day] = { status: record.status || 'Terlambat', code: 'T', color: 'bg-amber-100 text-amber-800 font-bold', checkIn: record.checkIn || undefined };
            } else {
              totalHadir++;
              dailyStatus[day] = { status: 'Hadir', code: 'H', color: 'bg-emerald-100 text-emerald-800 font-medium', checkIn: record.checkIn || undefined };
            }
        } else if (isWeekendOrHoliday) {
          dailyStatus[day] = {
            status: isHolidaySetting ? 'Libur Nasional' : 'Libur Akhir Pekan',
            code: 'L',
            color: 'bg-slate-100 text-slate-400 font-medium',
          };
        } else {
          totalMangkir++;
          dailyStatus[day] = { status: 'Alpha', code: 'A', color: 'bg-rose-100 text-rose-700 font-bold' };
        }
      }

      return {
        pin: emp.pin,
        name: emp.name,
        role: emp.role,
        days: dailyStatus,
        summary: {
          hadir: totalHadir + totalTerlambat,
          terlambat: totalTerlambat,
          mangkir: totalMangkir,
          izin: totalIzin,
        },
      };
    });

    return NextResponse.json({ success: true, month, year, daysInMonth, data: matrixData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
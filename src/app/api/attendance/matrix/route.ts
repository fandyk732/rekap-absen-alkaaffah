import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const daysInMonth = new Date(year, month, 0).getDate();

    const [employees, allLogs, permissions] = await Promise.all([
      prisma.employee.findMany({ where: { status: 'Aktif' }, orderBy: { name: 'asc' } }),
      prisma.attendanceLog.findMany(),
      prisma.permission.findMany({ where: { status: 'Approved' } }),
    ]);

    const formattedMonth = String(month).padStart(2, '0');

    const matrixData = employees.map((emp) => {
      const dailyStatus: Record<number, { status: string; code: string; color: string; checkIn?: string }> = {};
      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalMangkir = 0;
      let totalIzin = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        // Pastikan format target date selalu DD-MM-YYYY (contoh: 01-08-2026)
        const targetDate = `${dayStr}-${formattedMonth}-${year}`;
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        // 🔍 MATCHING FIX: Pakai String() dan trim() untuk menghindari bug tipe data Number vs String
        const record = allLogs.find(
          (l) =>
            String(l.pin).trim() === String(emp.pin).trim() &&
            (l.date === targetDate || l.date === `${day}-${month}-${year}`)
        );

        const approvedPermission = permissions.find(
          (p) =>
            String(p.pin).trim() === String(emp.pin).trim() &&
            targetDate >= p.startDate &&
            targetDate <= p.endDate
        );

        if (approvedPermission) {
          totalIzin++;
          const codeMap: Record<string, string> = { Sakit: 'S', Cuti: 'C', Izin: 'I', 'Dinas Luar': 'DL' };
          dailyStatus[day] = {
            status: `Izin (${approvedPermission.type}: ${approvedPermission.reason})`,
            code: codeMap[approvedPermission.type] || 'I',
            color: 'bg-purple-100 text-purple-700 font-bold',
          };
        } else if (record) {
          if (record.flagColor === 'amber') {
            totalTerlambat++;
            dailyStatus[day] = { status: record.status, code: 'T', color: 'bg-amber-100 text-amber-800 font-bold', checkIn: record.checkIn };
          } else if (record.flagColor === 'emerald') {
            totalHadir++;
            dailyStatus[day] = { status: 'Hadir', code: 'H', color: 'bg-emerald-100 text-emerald-800 font-medium', checkIn: record.checkIn };
          } else if (record.flagColor === 'rose') {
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              dailyStatus[day] = { status: 'Libur Akhir Pekan', code: 'L', color: 'bg-slate-100 text-slate-400' };
            } else {
              totalMangkir++;
              dailyStatus[day] = { status: 'Tidak Scan', code: 'A', color: 'bg-rose-100 text-rose-700 font-bold' };
            }
          }
        } else {
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            dailyStatus[day] = { status: 'Libur Akhir Pekan', code: 'L', color: 'bg-slate-100 text-slate-400' };
          } else {
            dailyStatus[day] = { status: 'Belum/Tidak ada Data', code: '-', color: 'bg-slate-50 text-slate-300' };
          }
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
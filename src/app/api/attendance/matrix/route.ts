import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper untuk mengonversi string "DD-MM-YYYY" / "YYYY-MM-DD" menjadi Date Object yang valid
function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const cleanStr = dateStr.trim();
  
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    // Jika format DD-MM-YYYY (contoh: 11-08-2026)
    if (parts[0].length === 2 && parts[2].length === 4) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    // Jika format YYYY-MM-DD (contoh: 2026-08-11)
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  return new Date(cleanStr);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const daysInMonth = new Date(year, month, 0).getDate();

    const [employees, allLogs, permissions, holidays] = await Promise.all([
      prisma.employee.findMany({ where: { status: 'Aktif' }, orderBy: { name: 'asc' } }),
      prisma.attendanceLog.findMany(),
      prisma.permission.findMany({ where: { status: 'Approved' } }),
      prisma.holiday.findMany(),
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
        const targetDate = `${dayStr}-${formattedMonth}-${year}`; // Format DD-MM-YYYY
        
        const currentDateObj = new Date(year, month - 1, day);
        currentDateObj.setHours(0, 0, 0, 0);

        const dayOfWeek = currentDateObj.getDay();

        // 1. Variabel format string tanggal untuk komparasi ketat
        const dateIsoFormat = `${year}-${formattedMonth}-${dayStr}`; // "2026-08-17"
        const dateLocalFormat = `${dayStr}-${formattedMonth}-${year}`; // "17-08-2026"
        const dateSingleDigit = `${day}-${month}-${year}`; // "17-8-2026"

        // 2. Matching Log Fingerprint/Mesin
        const record = allLogs.find(
          (l) =>
            String(l.pin).trim() === String(emp.pin).trim() &&
            (l.date === targetDate || l.date === dateSingleDigit)
        );

        // 3. Matching Permohonan Izin / Sakit yang Approved
        const approvedPermission = permissions.find((p) => {
          const pinMatch = String(p.pin).trim() === String(emp.pin).trim();
          if (!pinMatch) return false;

          const startDate = parseDateString(p.startDate);
          const endDate = parseDateString(p.endDate);
          
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          return currentDateObj >= startDate && currentDateObj <= endDate;
        });
        
        // 4. Matching Hari Libur dari Setting Database
        const isHolidaySetting = holidays.some((h) => {
          if (!h.date) return false;
          const cleanHDate = h.date.trim();
          return (
            cleanHDate === dateIsoFormat || 
            cleanHDate === dateLocalFormat || 
            cleanHDate === dateSingleDigit
          );
        });

        // Pengecekan Utama Status Libur (Prioritas Tinggi)
        const isWeekendOrHoliday = dayOfWeek === 0 || dayOfWeek === 6 || isHolidaySetting;

        // 5. Penentuan Status Harian
        if (approvedPermission) {
          totalIzin++;
          const codeMap: Record<string, string> = { Sakit: 'S', Cuti: 'C', Izin: 'I', 'Dinas Luar': 'DL' };
          const pType = approvedPermission.type || 'Izin';
          const code = codeMap[pType] || 'I';

          dailyStatus[day] = {
            status: `${pType} (${approvedPermission.reason || 'Approved'})`,
            code: code,
            color: code === 'S' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-blue-100 text-blue-700 font-bold',
          };
        } else if (isWeekendOrHoliday) {
          // Jika Sabtu, Minggu, atau diset di Menu Pengaturan -> PASTI Libur 'L'
          dailyStatus[day] = { 
            status: isHolidaySetting ? 'Libur Nasional / Sekolah' : 'Libur Akhir Pekan', 
            code: 'L', 
            color: 'bg-slate-100 text-slate-400 font-medium' 
          };
        } else if (record) {
          if (record.flagColor === 'amber') {
            totalTerlambat++;
            dailyStatus[day] = { status: record.status || 'Terlambat', code: 'T', color: 'bg-amber-100 text-amber-800 font-bold', checkIn: record.checkIn };
          } else if (record.flagColor === 'emerald') {
            totalHadir++;
            dailyStatus[day] = { status: 'Hadir', code: 'H', color: 'bg-emerald-100 text-emerald-800 font-medium', checkIn: record.checkIn };
          } else {
            totalMangkir++;
            dailyStatus[day] = { status: 'Tidak Scan', code: 'A', color: 'bg-rose-100 text-rose-700 font-bold' };
          }
        } else {
          // Jika Hari Kerja biasa tapi TIDAK ADA RECORD SCAN -> Alpha (A)
          totalMangkir++;
          dailyStatus[day] = { status: 'Tidak Hadir / Alpha', code: 'A', color: 'bg-rose-100 text-rose-700 font-bold' };
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
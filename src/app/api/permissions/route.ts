import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper parse string tanggal "DD-MM-YYYY" atau ISO String menjadi "YYYY-MM-DD"
function formatToISODate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('-') || dateStr.includes('/')) {
    const separator = dateStr.includes('-') ? '-' : '/';
    const parts = dateStr.split(separator);
    if (parts.length === 3) {
      // Jika format DD-MM-YYYY
      if (parts[2].length === 4) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  return dateStr; // Jika sudah format YYYY-MM-DD
}

function parseCustomDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  if (typeof dateStr === 'string' && (dateStr.includes('-') || dateStr.includes('/'))) {
    const separator = dateStr.includes('-') ? '-' : '/';
    const parts = dateStr.split(separator);
    
    if (parts.length === 3) {
      const [p1, p2, p3] = parts.map(Number);
      // Asumsi DD-MM-YYYY jika p3 adalah tahun
      if (p3 > 1000) return new Date(p3, p2 - 1, p1);
      // Asumsi YYYY-MM-DD jika p1 adalah tahun
      if (p1 > 1000) return new Date(p1, p2 - 1, p3);
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// GET: Ambil pengajuan izin
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');
    const statusParam = searchParams.get('status');

    let whereCondition: any = {};

    if (statusParam) {
      whereCondition.status = statusParam;
    }

    const allPermissions = await prisma.permission.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });

    let filteredPermissions = allPermissions;

    if (monthStr && yearStr) {
      const month = Number(monthStr);
      const year = Number(yearStr);

      if (!isNaN(month) && !isNaN(year)) {
        filteredPermissions = allPermissions.filter((item: any) => {
          const rawDate = item.startDate || item.createdAt;
          const parsedDate = parseCustomDate(rawDate);
          if (!parsedDate) return false;

          return parsedDate.getMonth() + 1 === month && parsedDate.getFullYear() === year;
        });
      }
    }

    return NextResponse.json({ success: true, data: filteredPermissions });
  } catch (error: any) {
    console.error('[GET PERMISSIONS ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Tambah Pengajuan Baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, employeeName, type, reason, startDate, endDate, earlyLeaveTime } = body;

    if (!pin || !employeeName || !type || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Data pengajuan tidak lengkap.' }, { status: 400 });
    }

    const newPermission = await prisma.permission.create({
      data: {
        pin: String(pin).trim(),
        employeeName,
        type,
        reason: reason || '-',
        startDate: String(startDate),
        endDate: String(endDate),
        earlyLeaveTime: type === 'Pulang Awal' ? earlyLeaveTime : null, // Merekam jam pulang
        status: 'Pending',
      },
    });

    return NextResponse.json({ success: true, data: newPermission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Approve / Reject Pengajuan & Sinkronisasi ke AttendanceLog
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Status tidak valid.' }, { status: 400 });
    }

    // 1. Update status pengajuan izin
    const updated = await prisma.permission.update({
      where: { id },
      data: { status },
    });

    // 2. Jika disetujui (Approved) & tipenya 'Pulang Awal', update/insert ke AttendanceLog
    if (status === 'Approved' && updated.type === 'Pulang Awal') {
      const formattedDate = formatToISODate(updated.startDate);

      // Cari log presensi hari itu
      const existingLog = await prisma.attendanceLog.findFirst({
        where: {
          pin: updated.pin,
          date: formattedDate,
        },
      });

      if (existingLog) {
        // Jika pegawai sudah tap masuk, update jam pulang & flag pulang awal
        await prisma.attendanceLog.update({
          where: { id: existingLog.id },
          data: {
            checkOut: updated.earlyLeaveTime || existingLog.checkOut,
            isEarlyLeave: true,
            earlyLeaveReason: updated.reason,
          },
        });
      } else {
        // Jika belum ada log presensi hari itu
        await prisma.attendanceLog.create({
          data: {
            pin: updated.pin,
            name: updated.employeeName,
            date: formattedDate,
            checkIn: '-',
            checkOut: updated.earlyLeaveTime || '-',
            status: 'Hadir',
            isEarlyLeave: true,
            earlyLeaveReason: updated.reason,
            flagColor: 'orange',
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[PATCH PERMISSION ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
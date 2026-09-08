import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper untuk parse string tanggal fleksibel
function parseCustomDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  if (typeof dateStr === 'string' && (dateStr.includes('-') || dateStr.includes('/'))) {
    const separator = dateStr.includes('-') ? '-' : '/';
    const parts = dateStr.split(separator);

    if (parts.length === 3) {
      let day: number, month: number, year: number;

      if (parts[0].length === 4) {
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);
      }

      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1000) {
        return new Date(year, month - 1, day);
      }
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
    const year = Number(searchParams.get('year')) || new Date().getFullYear();

    // 1. Panggil API Matriks
    const baseUrl = req.nextUrl.origin;
    const matriksRes = await fetch(`${baseUrl}/api/matriks?month=${month}&year=${year}`, {
      cache: 'no-store',
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
    });

    const matriksJson = await matriksRes.json();

    if (!matriksJson.success) {
      console.warn('[DASHBOARD STATS] Gagal ambil data dari /api/matriks:', matriksJson.error);
    }

    const summary = matriksJson.summary || {};
    const matrixData: any[] = matriksJson.data || [];

    const totalHadir = summary.totalHadir || 0;
    const totalTerlambat = summary.totalTerlambat || 0;
    const totalIzinSakit = summary.totalIzinSakit || 0;
    const totalAlpha = summary.totalAlpha || 0;

    const totalLogMasuk = totalHadir + totalTerlambat;
    const totalSlotKapasitas =
      summary.totalSlotKapasitas || totalHadir + totalTerlambat + totalIzinSakit + totalAlpha;

    const divider = totalSlotKapasitas > 0 ? totalSlotKapasitas : 1;

    const hadirPct = Math.round((totalHadir / divider) * 100);
    const terlambatPct = Math.round((totalTerlambat / divider) * 100);
    const izinSakitPct = Math.round((totalIzinSakit / divider) * 100);
    const alphaPct = Math.round((totalAlpha / divider) * 100);

    // ==========================================
    // 2. OLAH TOP EMPLOYEES LANGSUNG DARI MATRIKS
    // ==========================================

    // A. Top 5 Guru Paling Rajin
    const topDiligent = [...matrixData]
      .map((emp) => ({
        id: emp.id || emp.pin,
        name: emp.name,
        totalHadir: emp.summary?.hadir || 0,
        totalTelat: emp.summary?.terlambat || 0,
      }))
      .sort((a, b) => b.totalHadir - a.totalHadir || a.totalTelat - b.totalTelat)
      .slice(0, 5);

    // B. Top 5 Paling Disiplin Waktu
    const topPunctual = [...matrixData]
      .filter((emp) => (emp.summary?.hadir || 0) > 0)
      .map((emp) => ({
        id: emp.id || emp.pin,
        name: emp.name,
        totalHadir: emp.summary?.hadir || 0,
        totalTelat: emp.summary?.terlambat || 0,
      }))
      .sort((a, b) => a.totalTelat - b.totalTelat || b.totalHadir - a.totalHadir)
      .slice(0, 5);

    // C. Rekap Top Terlambat
    const topLateEmployees = [...matrixData]
      .filter((emp) => (emp.summary?.terlambat || 0) > 0)
      .map((emp) => ({
        name: emp.name,
        pin: emp.pin,
        count: emp.summary.terlambat,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ==========================================
    // 3. REKAP TOP IZIN / SAKIT (FIXED QUERY & PARSING)
    // ==========================================
    let permissions: any[] = [];
    try {
      const allApprovedPermissions = await prisma.permission.findMany({
        where: {
          status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] },
        },
      });

      // Filter in-memory berdasarkan bulan & tahun agar presisi dengan tipe data string DB
      permissions = allApprovedPermissions.filter((item: any) => {
        const rawDate = item.startDate || item.createdAt;
        const parsedDate = parseCustomDate(rawDate);
        if (!parsedDate) return false;

        return parsedDate.getMonth() + 1 === month && parsedDate.getFullYear() === year;
      });
    } catch (e) {
      console.error('Error fetching permissions for stats:', e);
    }

    const permMap: Record<string, { name: string; pin: string; count: number; reasons: string[] }> = {};

    permissions.forEach((p: any) => {
      const pinKey = String(p.pin || 'UNKNOWN').trim();
      if (!permMap[pinKey]) {
        permMap[pinKey] = { name: p.employeeName || `PIN: ${pinKey}`, pin: pinKey, count: 0, reasons: [] };
      }
      permMap[pinKey].count++;
      if (p.reason && !permMap[pinKey].reasons.includes(p.reason)) {
        permMap[pinKey].reasons.push(p.reason);
      }
    });

    const topPermissionEmployees = Object.values(permMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalEmployees = summary.totalEmployees || (await prisma.employee.count());

    let pendingPermissionsCount = 0;
    try {
      pendingPermissionsCount = await prisma.permission.count({
        where: { status: { in: ['Pending', 'PENDING', 'pending'] } },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        totalHadir,
        totalTerlambat,
        totalIzin: totalIzinSakit,
        totalAlpha,
        totalLogMasuk,
        totalSlotKapasitas,
        hadirPct,
        terlambatPct,
        izinSakitPct,
        alphaPct,
        pendingPermissionsCount,
      },
      topDiligent,
      topPunctual,
      topLateEmployees,
      topPermissionEmployees,
    });
  } catch (error: any) {
    console.error('[DASHBOARD STATS ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
    const year = Number(searchParams.get('year')) || new Date().getFullYear();

    // 1. Panggil API Matriks
    const baseUrl = req.nextUrl.origin;
    const matriksRes = await fetch(`${baseUrl}/api/matriks?month=${month}&year=${year}`, {
      cache: 'no-store',
    });

    const matriksJson = await matriksRes.json();
    const summary = matriksJson.summary || {};
    const matrixData = matriksJson.data || [];

    const totalHadir = summary.totalHadir || 0;
    const totalTerlambat = summary.totalTerlambat || 0;
    const totalIzinSakit = summary.totalIzinSakit || 0;
    const totalAlpha = summary.totalAlpha || 0;

    const totalLogMasuk = totalHadir + totalTerlambat;
    const totalSlotKapasitas = summary.totalSlotKapasitas || (totalHadir + totalTerlambat + totalIzinSakit + totalAlpha);

    const divider = totalSlotKapasitas > 0 ? totalSlotKapasitas : 1;
    
    const hadirPct = Math.round((totalHadir / divider) * 100);
    const terlambatPct = Math.round((totalTerlambat / divider) * 100);
    const izinSakitPct = Math.round((totalIzinSakit / divider) * 100);
    const alphaPct = Math.round((totalAlpha / divider) * 100);

    // Rekap Top Terlambat
    const lateMap: Record<string, { name: string; pin: string; count: number }> = {};
    matrixData.forEach((emp: any) => {
      if (emp.summary?.terlambat > 0) {
        lateMap[emp.pin] = { name: emp.name, pin: emp.pin, count: emp.summary.terlambat };
      }
    });

    const topLateEmployees = Object.values(lateMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Rekap Top Izin / Sakit Beserta Alasan (Reasons)
    let permissions: any[] = [];
    try {
      permissions = await prisma.permission.findMany({
        where: {
          status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] },
        },
      });
    } catch (e) {}

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
      topLateEmployees,
      topPermissionEmployees,
    });
  } catch (error: any) {
    console.error('[DASHBOARD STATS ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
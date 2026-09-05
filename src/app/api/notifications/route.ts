import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Ambil Pengajuan Izin yang masih 'Pending'
    const pendingPermissions = await prisma.permission.findMany({
      where: { status: 'Pending' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 2. Format menjadi List Notifikasi
    const notifications = pendingPermissions.map((p: any) => ({
      id: p.id,
      title: `${p.employeeName} mengajukan ${p.type}`,
      time: p.startDate,
      type: 'permission',
      link: '/izin-absensi',
    }));

    return NextResponse.json({
      success: true,
      unreadCount: pendingPermissions.length,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
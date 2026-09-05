import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Ambil semua pengajuan izin
export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: permissions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Buat Pengajuan Izin Baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, employeeName, type, reason, startDate, endDate } = body;

    if (!pin || !employeeName || !type || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Data pengajuan tidak lengkap.' }, { status: 400 });
    }

    const newPermission = await prisma.permission.create({
      data: {
        pin,
        employeeName,
        type,
        reason,
        startDate,
        endDate,
        status: 'Pending',
      },
    });

    return NextResponse.json({ success: true, data: newPermission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update Status Persetujuan (Approve / Reject)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Status tidak valid.' }, { status: 400 });
    }

    const updated = await prisma.permission.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
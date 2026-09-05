import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status harus diisi' }, { status: 400 });
    }

    // Format status disesuaikan dengan Prisma Schema
    const statusUpper = status.toUpperCase();
    const formattedStatus = statusUpper === 'APPROVED' ? 'Approved' : statusUpper === 'REJECTED' ? 'Rejected' : 'Pending';

    const updated = await prisma.permission.update({
      where: { id },
      data: { status: formattedStatus },
    });

    return NextResponse.json({
      success: true,
      message: 'Status pengajuan berhasil diperbarui',
      data: updated,
    });
  } catch (error: any) {
    console.error('[PATCH PERMISSION ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
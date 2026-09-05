import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body; // Expected: 'APPROVED' atau 'REJECTED'

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Status tidak valid' }, { status: 400 });
    }

    const prismaAny = prisma as any;
    const permModel = prismaAny.permissionRequest || prismaAny.permission || prismaAny.izin;

    if (!permModel) {
      return NextResponse.json({ success: false, error: 'Model database izin tidak ditemukan' }, { status: 500 });
    }

    const updated = await permModel.update({
      where: { id: id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[APPROVAL ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
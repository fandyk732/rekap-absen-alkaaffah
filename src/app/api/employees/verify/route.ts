import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN wajib diisi.' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { pin: String(pin) },
      select: { pin: true, name: true, role: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'PIN Pegawai tidak ditemukan!' }, { status: 444 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
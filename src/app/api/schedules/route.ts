import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Ambil Jadwal Mengajar per Employee
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID diperlukan.' }, { status: 400 });
    }

    const schedules = await prisma.workSchedule.findMany({
      where: { employeeId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Simpan / Batch Update Jadwal Mengajar Pegawai (SUPER FAST WITH $TRANSACTION)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, schedules } = body;

    if (!employeeId || !Array.isArray(schedules)) {
      return NextResponse.json({ success: false, error: 'Data jadwal tidak valid.' }, { status: 400 });
    }

    // ✅ EKSEKUSI BATCH DALAM 1 TRANSAKSI TUNGGAL
    await prisma.$transaction(
      schedules.map((item: any) =>
        prisma.workSchedule.upsert({
          where: {
            employeeId_dayOfWeek: {
              employeeId,
              dayOfWeek: Number(item.dayOfWeek),
            },
          },
          update: {
            isWorking: Boolean(item.isWorking),
            startTime: item.startTime || '07:15',
            endTime: item.endTime || '14:00',
          },
          create: {
            employeeId,
            dayOfWeek: Number(item.dayOfWeek),
            isWorking: Boolean(item.isWorking),
            startTime: item.startTime || '07:15',
            endTime: item.endTime || '14:00',
          },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Jadwal berhasil diperbarui!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
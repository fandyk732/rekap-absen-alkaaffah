import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attendanceLogs } = body;

    if (!attendanceLogs || !Array.isArray(attendanceLogs) || attendanceLogs.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data log.' }, { status: 400 });
    }

    // Simpan otomatis ke SQLite
    for (const log of attendanceLogs) {
      // 1. Pastikan pegawai ada di DB
      await prisma.employee.upsert({
        where: { pin: log.pin },
        update: { name: log.name },
        create: { pin: log.pin, name: log.name, role: 'Pegawai' },
      });

      // 2. Simpan/Update Log Kehadiran
      const existingLog = await prisma.attendanceLog.findFirst({
        where: { pin: log.pin, date: log.date },
      });

      if (existingLog) {
        await prisma.attendanceLog.update({
          where: { id: existingLog.id },
          data: {
            checkIn: log.checkIn,
            checkOut: log.checkOut,
            status: log.status,
            flagColor: log.flagColor,
          },
        });
      } else {
        await prisma.attendanceLog.create({
          data: {
            pin: log.pin,
            name: log.name,
            date: log.date,
            checkIn: log.checkIn,
            checkOut: log.checkOut,
            status: log.status,
            flagColor: log.flagColor,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${attendanceLogs.length} data berhasil disimpan ke Database SQLite.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
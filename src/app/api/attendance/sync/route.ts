import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attendanceLogs } = body;

    if (!attendanceLogs || !Array.isArray(attendanceLogs) || attendanceLogs.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data log.' }, { status: 400 });
    }

    // 1. Ambil daftar PIN unik dari log yang di-upload
    const uniquePins = Array.from(new Set(attendanceLogs.map((l: any) => String(l.pin).trim())));

    // 2. Fetch pegawai & log yang sudah ada secara massal
    const [existingEmployees, existingLogs] = await Promise.all([
      prisma.employee.findMany({ where: { pin: { in: uniquePins } } }),
      prisma.attendanceLog.findMany({ where: { pin: { in: uniquePins } } }),
    ]);

    // Beri tipe <string, any> eksplisit pada Map agar tidak dibaca <string, never>
    const existingEmpMap = new Map<string, any>(existingEmployees.map((e) => [e.pin, e]));
    const existingLogMap = new Map<string, any>(existingLogs.map((l) => [`${l.pin}_${l.date}`, l]));

    const employeesToCreate: any[] = [];
    const logsToCreate: any[] = [];
    const logUpdates: any[] = [];

    // 3. Olah data di memory Vercel
    for (const log of attendanceLogs) {
      const pinStr = String(log.pin).trim();
      const logKey = `${pinStr}_${log.date}`;

      // Auto-register Pegawai jika belum ada
      if (!existingEmpMap.has(pinStr)) {
        employeesToCreate.push({
          pin: pinStr,
          name: log.name || `Pegawai ${pinStr}`,
          role: 'Pegawai',
          status: 'Aktif',
        });
        existingEmpMap.set(pinStr, true);
      }

      // Pisahkan Log Baru vs Log Update
      const existing = existingLogMap.get(logKey);
      if (existing) {
        logUpdates.push(
          prisma.attendanceLog.update({
            where: { id: existing.id },
            data: {
              checkIn: log.checkIn,
              checkOut: log.checkOut,
              status: log.status,
              flagColor: log.flagColor,
            },
          })
        );
      } else {
        logsToCreate.push({
          pin: pinStr,
          name: log.name,
          date: log.date,
          checkIn: log.checkIn,
          checkOut: log.checkOut,
          status: log.status,
          flagColor: log.flagColor,
        });
      }
    }

    // 4. Eksekusi Batch Save ke PostgreSQL dalam 1 Transaksi
    await prisma.$transaction(async (tx) => {
      if (employeesToCreate.length > 0) {
        await tx.employee.createMany({ data: employeesToCreate, skipDuplicates: true });
      }
      if (logsToCreate.length > 0) {
        await tx.attendanceLog.createMany({ data: logsToCreate, skipDuplicates: true });
      }
      if (logUpdates.length > 0) {
        await Promise.all(logUpdates);
      }
    });

    return NextResponse.json({
      success: true,
      message: `${attendanceLogs.length} data log berhasil disinkronkan ke Database Cloud.`,
    });
  } catch (error: any) {
    console.error('Error Sync Attendance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
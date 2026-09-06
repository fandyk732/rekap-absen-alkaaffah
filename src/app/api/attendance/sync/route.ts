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

    // 1. Kumpulkan semua PIN dan Date unik dari payload upload
    const uniquePins = Array.from(new Set(attendanceLogs.map((l: any) => String(l.pin).trim())));
    const uniqueDates = Array.from(new Set(attendanceLogs.map((l: any) => String(l.date).trim())));

    // 2. Fetch pegawai yang ada untuk auto-register yang belum terdaftar
    const existingEmployees = await prisma.employee.findMany({
      where: { pin: { in: uniquePins } },
      select: { pin: true },
    });
    const existingPinSet = new Set(existingEmployees.map((e) => e.pin));

    const employeesToCreate: any[] = [];
    const logsToCreate: any[] = [];

    // 3. Olah data di memori
    for (const log of attendanceLogs) {
      const pinStr = String(log.pin).trim();

      // Buat pegawai baru jika belum ada
      if (!existingPinSet.has(pinStr)) {
        employeesToCreate.push({
          pin: pinStr,
          name: log.name || `Pegawai ${pinStr}`,
          role: 'Pegawai',
          status: 'Aktif',
        });
        existingPinSet.add(pinStr); // Prevent duplikasi
      }

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

    // 4. BATCH TRANSACTION: Hanya butuh 3 Query ke PostgreSQL!
    await prisma.$transaction(
      async (tx) => {
        // A. Auto-register Pegawai Baru (1 Query)
        if (employeesToCreate.length > 0) {
          await tx.employee.createMany({
            data: employeesToCreate,
            skipDuplicates: true,
          });
        }

        // B. Hapus log lama yang bentrok tanggal & PIN-nya (1 Query)
        await tx.attendanceLog.deleteMany({
          where: {
            pin: { in: uniquePins },
            date: { in: uniqueDates },
          },
        });

        // C. Insert seluruh log baru secara bersamaan (1 Query)
        if (logsToCreate.length > 0) {
          await tx.attendanceLog.createMany({
            data: logsToCreate,
            skipDuplicates: true,
          });
        }
      },
      {
        timeout: 15000, // Timeout transaksi 15 detik (sangat cukup untuk 3 query)
      }
    );

    return NextResponse.json({
      success: true,
      message: `${attendanceLogs.length} data log berhasil disinkronkan ke Cloud Database.`,
    });
  } catch (error: any) {
    console.error('Error Sync Attendance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
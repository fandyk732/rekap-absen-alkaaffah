import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Endpoint bootstrap: bikin akun admin pertama kali.
// Ini SENGAJA nggak lewat pengecekan session (chicken-and-egg problem — belum ada
// akun buat login sebelum akun pertama dibuat), jadi diproteksi pakai SEED_SECRET
// dari env sebagai gantinya. Panggil sekali: /api/auth/seed?key=<SEED_SECRET>
export async function GET(req: NextRequest) {
  const seedSecret = process.env.SEED_SECRET;

  if (!seedSecret) {
    return NextResponse.json(
      { success: false, error: 'SEED_SECRET belum di-set di environment variable.' },
      { status: 500 }
    );
  }

  const providedKey = req.nextUrl.searchParams.get('key');
  if (providedKey !== seedSecret) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Akun admin sudah ada!' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Admin Utama',
        role: 'Admin',
      },
    });

    return NextResponse.json({
      success: true,
      message:
        'Admin default berhasil dibuat: admin / admin123 — SEGERA login dan ganti password-nya, lalu hapus/nonaktifkan endpoint ini kalau memang cuma dipakai sekali.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
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

    return NextResponse.json({ success: true, message: 'Admin default berhasil dibuat: admin / admin123' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
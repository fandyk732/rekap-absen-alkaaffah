import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan Password wajib diisi!' },
        { status: 400 }
      );
    }

    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Username atau Password salah!' },
        { status: 401 }
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Username atau Password salah!' },
        { status: 401 }
      );
    }

    // Buat response & pasang Cookie HTTP-Only
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil!',
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    });

    response.cookies.set({
      name: 'user_session',
      value: JSON.stringify({ id: user.id, name: user.name, role: user.role }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // Session 1 Hari
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
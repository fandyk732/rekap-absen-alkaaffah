import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSessionValue } from '@/lib/session';

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

    const sessionValue = await createSessionValue({
      id: user.id,
      name: user.name,
      role: user.role,
    });

    response.cookies.set({
      name: 'user_session',
      value: sessionValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // Session 1 Hari — samain sama SESSION_MAX_AGE_MS di lib/session.ts
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
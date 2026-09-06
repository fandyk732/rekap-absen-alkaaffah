import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil!',
  });

  // Hapus cookie user_session dengan mengeset maxAge ke 0
  response.cookies.set({
    name: 'user_session',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return response;
}
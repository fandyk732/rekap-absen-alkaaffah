import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const session = req.cookies.get('user_session')?.value;
  const { pathname } = req.nextUrl;

  // 1. Jika ini adalah request ke API, SELALU biarkan lewat tanpa redirect ke halaman /login
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Halaman publik biasa (Halaman Login & Form Izin Guru)
  const isPublicPage = pathname === '/login' || pathname.startsWith('/pengajuan-izin');

  // 3. Jika pengguna belum login dan buka halaman privat -> Lempar ke /login
  if (!session && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. Jika pengguna sudah login dan buka /login -> Lempar ke Dashboard Utama
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware untuk semua route KECUALI static assets bawaan Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
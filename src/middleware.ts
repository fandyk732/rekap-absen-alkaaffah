import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const session = req.cookies.get('user_session')?.value;
  const { pathname } = req.nextUrl;

  // 1. DAFTAR API PUBLIK (Hanya API ini yang boleh diakses tanpa login)
  const isPublicApi =
    pathname.startsWith('/api/auth') ||        // API Login & Logout
    pathname.startsWith('/api/izin-absensi') || // API Kirim Form Izin Guru
    pathname.startsWith('/api/employees');      // API Verifikasi PIN Guru

  // 2. DAFTAR HALAMAN PUBLIK
  const isPublicPage = pathname === '/login' || pathname.startsWith('/pengajuan-izin');

  // Jika mencoba akses API Privat tanpa session -> Tolak dengan JSON Unauthorized
  if (pathname.startsWith('/api') && !isPublicApi && !session) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' },
      { status: 401 }
    );
  }

  // Jika belum login dan coba akses Halaman Privat -> Redirect ke /login
  if (!session && !isPublicPage && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Jika sudah login dan buka /login -> Redirect ke Dashboard Utama
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
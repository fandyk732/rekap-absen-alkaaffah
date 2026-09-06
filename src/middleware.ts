import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const session = req.cookies.get('user_session')?.value;
  const { pathname } = req.nextUrl;

  // 1. Jika pengguna belum login dan mencoba mengakses halaman privat (dashboard, matriks, dll)
  if (!session && pathname !== '/login') {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika pengguna sudah login dan mencoba membuka halaman /login
  if (session && pathname === '/login') {
    const dashboardUrl = new URL('/', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Tentukan route mana saja yang diproteksi oleh middleware
export const config = {
  matcher: [
    /*
     * Proteksi semua halaman KECUALI:
     * - api routes (/api)
     * - static files (_next/static, _next/image, favicon.ico, public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
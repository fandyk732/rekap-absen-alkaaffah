import { NextRequest, NextResponse } from 'next/server';
import { verifySessionValue } from '@/lib/session';

// Halaman yang boleh diakses TANPA login.
const PUBLIC_PAGES = ['/login', '/pengajuan-izin'];

// File & Asset PWA yang WAJIB publik agar Chrome Android bisa mengunduh PWA
const PUBLIC_PWA_ASSETS = [
  '/manifest-izin.json',
  '/sw.js',
];

// Endpoint API yang boleh diakses TANPA login, plus method-nya masing-masing.
const PUBLIC_API: Array<{ path: string; methods: string[] }> = [
  { path: '/api/auth/login', methods: ['POST'] },
  { path: '/api/auth/seed', methods: ['GET', 'POST'] }, // diproteksi SEED_SECRET di dalam route-nya sendiri
  { path: '/api/employees', methods: ['GET'] }, // buat dropdown pilih nama di form izin publik
  { path: '/api/employees/verify', methods: ['POST'] }, // verifikasi PIN di form izin publik
  { path: '/api/permissions', methods: ['POST'] }, // submit pengajuan izin baru
];

function isPublicApi(pathname: string, method: string): boolean {
  return PUBLIC_API.some((rule) => rule.path === pathname && rule.methods.includes(method));
}

function isPublicPage(pathname: string): boolean {
  return (
    PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    PUBLIC_PWA_ASSETS.includes(pathname) ||
    pathname.startsWith('/icons/') // Mengizinkan folder ikon PWA (/icons/icon-192x192.png, dll)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieValue = req.cookies.get('user_session')?.value;
  const session = await verifySessionValue(cookieValue);

  // ---- Request API ----
  if (pathname.startsWith('/api')) {
    if (isPublicApi(pathname, req.method)) {
      return NextResponse.next();
    }
    if (!session) {
      // JSON, BUKAN redirect — supaya fetch() di frontend tetap dapet response
      // yang bisa di-.json() dengan benar (nggak error karena kebentur HTML halaman login).
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid atau sudah habis. Silakan login ulang.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // ---- Request Halaman & Public Static Assets (PWA) ----
  if (!session && !isPublicPage(pathname)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware untuk semua route KECUALI static assets bawaan Next.js.
     * /api SENGAJA tidak dikecualikan di sini — proteksinya diatur di dalam
     * fungsi middleware lewat PUBLIC_API di atas, bukan lewat matcher.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
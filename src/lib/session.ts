// src/lib/session.ts
//
// Session yang DITANDATANGANI (HMAC-SHA256), bukan sekadar JSON polos di cookie.
// Tujuannya: mencegah orang bikin cookie palsu (mis. lewat curl / devtools) buat
// nge-bypass login, karena server bisa verifikasi keaslian isi cookie-nya.
//
// Pakai Web Crypto API (crypto.subtle) supaya jalan di dua environment:
// - Middleware (Edge Runtime)
// - Route handler API (Node.js runtime)

export interface SessionPayload {
  id: string;
  name: string;
  role: string;
  exp: number; // unix ms, kadaluarsa session
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === 'production') {
    // Sengaja bikin request gagal daripada diam-diam pakai secret lemah di production.
    throw new Error(
      'SESSION_SECRET belum di-set (atau terlalu pendek) di environment variable. ' +
        'Set minimal 32 karakter random sebelum deploy ke production.'
    );
  }

  console.warn(
    '[session] SESSION_SECRET belum di-set, pakai secret dev sementara. ' +
      'JANGAN dipakai di production — set SESSION_SECRET di .env.'
  );
  return 'dev-only-insecure-secret-jangan-dipakai-di-production-!!';
}

function bufToBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const pad = (4 - (b64url.length % 4)) % 4;
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return bufToBase64Url(sig);
}

// Constant-time compare supaya nggak kebuka ke timing attack.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 1000; // 1 hari, samain sama cookie maxAge

/** Bikin string cookie yang sudah ditandatangani dari payload session. */
export async function createSessionValue(
  payload: Omit<SessionPayload, 'exp'>
): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_MAX_AGE_MS };
  const payloadB64 = bufToBase64Url(encoder.encode(JSON.stringify(full)));
  const sig = await hmacSign(payloadB64);
  return `${payloadB64}.${sig}`;
}

/**
 * Verifikasi cookie session. Return payload kalau valid & belum expired,
 * null kalau tidak ada / rusak / signature tidak cocok / sudah expired.
 */
export async function verifySessionValue(
  value: string | undefined | null
): Promise<SessionPayload | null> {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  try {
    const expectedSig = await hmacSign(payloadB64);
    if (!timingSafeEqual(sig, expectedSig)) return null;

    const json = decoder.decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(json) as SessionPayload;

    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    if (!payload.id || !payload.role) return null;

    return payload;
  } catch {
    return null;
  }
}

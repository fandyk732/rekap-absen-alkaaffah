import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: 'Form Izin & Cuti Guru — SMKS Al Kaaffah',
  description: 'Portal pengajuan izin dan cuti mandiri pegawai SMKS Al Kaaffah',
  manifest: '/manifest-izin.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Izin Guru Al Kaaffah',
  },
};

export default function PengajuanIzinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Script Paksa Registrasi Service Worker di Android Chrome */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(reg) { console.log('PWA SW Active:', reg.scope); },
                  function(err) { console.log('PWA SW Failed:', err); }
                );
              });
            }
          `,
        }}
      />
    </>
  );
}
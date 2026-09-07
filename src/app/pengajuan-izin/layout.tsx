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
  return <>{children}</>;
}
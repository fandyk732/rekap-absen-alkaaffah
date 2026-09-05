import React from 'react';
import MetricCard from '@/components/ui/MetricCard';
import { Users, CheckCircle2, Clock, FileWarning } from 'lucide-react';

export default function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        title="Total Pegawai Aktif"
        value="60"
        subtitle="Guru & Tenaga Kependidikan"
        icon={Users}
        iconBg="bg-accent"
        iconColor="text-secondary"
        trend={{ value: '+2', direction: 'up', label: 'vs bulan lalu' }}
        featured
      />
      <MetricCard
        title="Tingkat Kehadiran"
        value="91.7%"
        subtitle="Bulan September 2026"
        icon={CheckCircle2}
        iconBg="bg-green-100"
        iconColor="text-green-600"
        trend={{ value: '+1.2%', direction: 'up', label: 'vs Agustus 2026' }}
      />
      <MetricCard
        title="Tingkat Ketepatan Waktu"
        value="83.4%"
        subtitle="Dari total hadir"
        icon={Clock}
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        trend={{ value: '-0.8%', direction: 'down', label: 'vs minggu lalu' }}
      />
      <MetricCard
        title="Izin Menunggu"
        value="5"
        subtitle="Perlu persetujuan segera"
        icon={FileWarning}
        iconBg="bg-red-100"
        iconColor="text-red-600"
        trend={{ value: '+3', direction: 'down', label: 'sejak kemarin' }}
        alert
      />
    </div>
  );
}
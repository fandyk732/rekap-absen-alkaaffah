import React from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const activities = [
  {
    id: 'act-001',
    icon: Upload,
    iconBg: 'bg-accent',
    iconColor: 'text-secondary',
    text: 'Import fingerprint 01 Sep berhasil diproses',
    detail: '60 record — 3 flagged',
    time: '10 mnt lalu',
  },
  {
    id: 'act-002',
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    text: 'Izin Siti Rahmawati disetujui',
    detail: 'Sakit • 01–02 Sep 2026',
    time: '32 mnt lalu',
  },
  {
    id: 'act-003',
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    text: 'Budi Santoso — Alpha (tidak ada scan)',
    detail: '01 Sep 2026 — tanpa keterangan',
    time: '1 jam lalu',
  },
  {
    id: 'act-004',
    icon: Clock,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    text: 'Rudi Hermawan scan masuk terlambat',
    detail: '08:47 WIB — toleransi 15 mnt',
    time: '2 jam lalu',
  },
  {
    id: 'act-005',
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    text: 'Izin Ahmad Fauzi ditolak',
    detail: 'Dinas Luar — dokumen tidak lengkap',
    time: '3 jam lalu',
  },
  {
    id: 'act-006',
    icon: Upload,
    iconBg: 'bg-accent',
    iconColor: 'text-secondary',
    text: 'Import fingerprint 31 Agu berhasil',
    detail: '60 record — 1 flagged',
    time: 'Kemarin',
  },
];

export default function ActivityFeed() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {activities?.map((act) => {
        const Icon = act?.icon;
        return (
          <div
            key={act?.id}
            className="flex items-start gap-3 py-3 hover:bg-muted/50 transition-colors px-1 rounded-lg"
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${act?.iconBg}`}>
              <Icon size={14} className={act?.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-500 text-foreground truncate">{act?.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{act?.detail}</p>
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{act?.time}</span>
          </div>
        );
      })}
    </div>
  );
}
import React from 'react';
import Link from 'next/link';
import { Upload, FileCheck2, ArrowRight } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const actions = [
  {
    id: 'qa-fingerprint',
    href: '/fingerprint-import-parser',
    icon: Upload,
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    title: 'Upload Log Fingerprint',
    desc: 'Import & rekonsiliasi data absensi dari mesin fingerprint',
    badge: '2 file pending',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'qa-permits',
    href: '/permits',
    icon: FileCheck2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'Tinjau Izin Pending',
    desc: 'Ada 5 permohonan izin yang menunggu persetujuan Anda',
    badge: '5 pending',
    badgeColor: 'bg-red-100 text-red-700',
  },
];

export default function QuickActions() {
  return (
    <div className="flex flex-col gap-3">
      {actions?.map((action) => {
        const Icon = action?.icon;
        return (
          <Link
            key={action?.id}
            href={action?.href}
            className="group flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-card-hover hover:border-secondary/30 transition-all duration-200"
          >
            <div className={`p-3 rounded-lg flex-shrink-0 ${action?.iconBg}`}>
              <Icon size={20} className={action?.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-600 text-foreground">{action?.title}</p>
                <span className={`text-[10px] font-600 px-2 py-0.5 rounded-full ${action?.badgeColor}`}>
                  {action?.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action?.desc}</p>
            </div>
            <ArrowRight
              size={16}
              className="text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all duration-150 flex-shrink-0"
            />
          </Link>
        );
      })}
    </div>
  );
}
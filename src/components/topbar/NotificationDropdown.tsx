'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  notifData: { unreadCount: number; notifications: any[] };
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function NotificationDropdown({
  isOpen,
  onToggle,
  notifData,
  dropdownRef,
}: NotificationDropdownProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 relative transition-colors"
      >
        <Bell className="w-5 h-5" />
        {notifData.unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {notifData.unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-800">Notifikasi</span>
            <span className="text-[11px] text-indigo-600 font-medium cursor-pointer hover:underline flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Tandai Dibaca
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {notifData.notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada notifikasi baru.
              </div>
            ) : (
              notifData.notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || '#'}
                  onClick={onToggle}
                  className="p-3 block hover:bg-slate-50 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Tanggal: {n.time}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
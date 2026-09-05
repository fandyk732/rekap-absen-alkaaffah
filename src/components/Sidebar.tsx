'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  Fingerprint,
  CalendarDays,
  FileCheck2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupLabel: 'Utama',
    items: [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupLabel: 'Kehadiran',
    items: [
      {
        id: 'nav-fingerprint',
        label: 'Import Fingerprint',
        href: '/fingerprint-import-parser',
        icon: Fingerprint,
        badge: 2,
      },
      {
        id: 'nav-matrix',
        label: 'Matriks Kehadiran',
        href: '/matriks-kehadiran',
        icon: CalendarDays,
      },
      {
        id: 'nav-permits',
        label: 'Izin & Absensi',
        href: '/izin-absensi',
        icon: FileCheck2,
        badge: 5,
      },
    ],
  },
  {
    groupLabel: 'Manajemen',
    items: [
      {
        id: 'nav-employees',
        label: 'Data Pegawai',
        href: '/data-pegawai',
        icon: Users,
      },
    
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-primary flex flex-col z-30 sidebar-transition ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center h-16 border-b border-white/10 px-3 ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
      >
        <AppLogo size={32} className="flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-sm leading-tight truncate">
              Al Kaaffah
            </span>
            <span className="text-white/50 text-xs leading-tight truncate">
              SMKS
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={`group-${group.groupLabel}`} className="mb-2">
            {!collapsed && (
              <p className="px-4 py-1 text-[10px] font-700 uppercase tracking-widest text-white/30 mb-1">
                {group.groupLabel}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center mx-2 mb-0.5 rounded-lg transition-all duration-150 group relative
                    ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                    ${
                      active
                        ? 'bg-white/15 text-white' :'text-white/60 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-500 flex-1 truncate">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-700 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-700 rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {/* Tooltip for collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-foreground text-white text-xs font-500 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-modal">
                      {item.label}
                      {item.badge ? ` (${item.badge})` : ''}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Toggle button */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={onToggle}
          className={`flex items-center w-full rounded-lg py-2 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 ${
            collapsed ? 'justify-center' : 'gap-3 px-2'
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-sm font-500">Collapse Menu</span>
            </>
          )}
        </button>
      </div>

            <Link
        href="/izin-absensi"
        className="mx-3 my-2 p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl block hover:bg-purple-900/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-bold text-purple-200">Izin Perlu Approval</span>
        </div>
        <p className="text-[11px] text-purple-300 mt-1 group-hover:underline">
          Klik untuk memproses pengajuan →
        </p>
      </Link>

    </aside>
  );
}
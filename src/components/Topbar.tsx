'use client';

import React, { useState, useEffect, useRef } from 'react';
import NotificationDropdown from './topbar/NotificationDropdown';
import ProfileDropdown from './topbar/ProfileDropdown';
import ProfileModal from './topbar/ProfileModal';
import SettingsModal from './topbar/SettingsModal';

export default function Topbar() {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [notifData, setNotifData] = useState<{ unreadCount: number; notifications: any[] }>({
    unreadCount: 0,
    notifications: [],
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setNotifData(json);
      })
      .catch((err) => console.error('Fetch notif error:', err));
  }, []);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        const json = await res.json();
        if (json.success) window.location.href = '/login';
        else alert('Gagal melakukan logout.');
      } catch (err) {
        alert('Terjadi kesalahan saat logout.');
      }
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Title & Date */}
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">
              Software Rekap Kehadiran Karyawan
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">SMKS Al Kaaffah</p>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-slate-400">Hari ini</div>
            <div className="text-xs font-semibold text-slate-700">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <NotificationDropdown
            isOpen={showNotif}
            onToggle={() => {
              setShowNotif(!showNotif);
              setShowProfile(false);
            }}
            notifData={notifData}
            dropdownRef={notifRef}
          />

          <ProfileDropdown
            isOpen={showProfile}
            onToggle={() => {
              setShowProfile(!showProfile);
              setShowNotif(false);
            }}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onLogout={handleLogout}
            dropdownRef={profileRef}
          />
        </div>
      </header>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </>
  );
}
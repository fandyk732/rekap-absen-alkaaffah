'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, Settings, LogOut, CheckCheck, X } from 'lucide-react';
import Link from 'next/link';

export default function Topbar() {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({ workStartTime: '07:15', emailNotif: true });
  const [isSaving, setIsSaving] = useState(false);
  const [notifData, setNotifData] = useState<{ unreadCount: number; notifications: any[] }>({
    unreadCount: 0,
    notifications: [],
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch Notifikasi
  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) setNotifData(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  // Close dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      window.location.href = '/login';
    }
  };

  // 2. Fetch setting saat modal dibuka
  useEffect(() => {
    if (showSettingsModal) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setSettings({
              workStartTime: json.data.workStartTime || '07:15',
              emailNotif: json.data.emailNotif ?? true,
            });
          }
        });
    }
  }, [showSettingsModal]);

  // 3. Fungsi Simpan Setting
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        alert('Pengaturan berhasil disimpan!');
        setShowSettingsModal(false);
        window.location.reload(); // Reload agar dashboard menghitung ulang batas terlambat baru
      }
    } catch (err) {
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
  {/* Bagian Kiri: Judul Software & Hari/Tanggal */}
  <div className="flex items-center gap-6">
    {/* Label Software */}
    <div>
      <h1 className="text-sm font-bold text-slate-800 tracking-tight">
        Software Rekap Kehadiran Karyawan
      </h1>
      <p className="text-[10px] text-slate-400 font-medium">
        SMKS Al Kaaffah
      </p>
    </div>

    {/* Pembatas / Divider Vertical */}
    <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

    {/* Info Hari & Tanggal */}
    <div className="hidden sm:block">
      <div className="text-[10px] uppercase font-bold text-slate-400">Hari ini</div>
      <div className="text-xs font-semibold text-slate-700">
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* 1. Bell Notifikasi */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotif(!showNotif);
                setShowProfile(false);
              }}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifData.unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {notifData.unreadCount}
                </span>
              )}
            </button>

            {/* Popover Notifikasi */}
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Notifikasi</span>
                  <span className="text-[11px] text-indigo-600 font-medium cursor-pointer hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Tandai Dibaca
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {notifData.notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Tidak ada notifikasi baru.</div>
                  ) : (
                    notifData.notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => setShowNotif(false)}
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

          {/* 2. Profil Utama & Menu Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotif(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                AU
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800">Admin Utama</div>
                <div className="text-[10px] text-slate-400">Tata Usaha</div>
              </div>
            </button>

            {/* Menu Dropdown Profil */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-bold text-sm text-slate-800">Admin Utama</div>
                  <div className="text-xs text-slate-400 truncate">admin@smksalkaaffah.sch.id</div>
                </div>

                <div className="py-1 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowProfile(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                  >
                    <User className="w-4 h-4 text-slate-500" /> Profil Saya
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsModal(true);
                      setShowProfile(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-500" /> Pengaturan
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal Profil Saya */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Profil Utama Admin</h3>
              <button onClick={() => setShowProfileModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div><label className="text-xs text-slate-400 font-semibold">Nama Lengkap</label><p className="font-bold text-slate-800">Admin Utama SMKS Al Kaaffah</p></div>
              <div><label className="text-xs text-slate-400 font-semibold">Email</label><p className="font-bold text-slate-800">admin@smksalkaaffah.sch.id</p></div>
              <div><label className="text-xs text-slate-400 font-semibold">Jabatan / Akses</label><p className="font-bold text-indigo-600">Tata Usaha (Super Admin)</p></div>
            </div>
            <button onClick={() => setShowProfileModal(false)} className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-200">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Pengaturan */}
      {showSettingsModal && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="font-bold text-slate-900 text-lg">Pengaturan Sistem</h3>
        <button onClick={() => setShowSettingsModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
      </div>

      <div className="space-y-4 text-sm">
        {/* Toggle Email */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-slate-700 font-medium">Notifikasi Email Admin</span>
          <input
            type="checkbox"
            checked={settings.emailNotif}
            onChange={(e) => setSettings({ ...settings, emailNotif: e.target.checked })}
            className="accent-indigo-600 w-5 h-5 cursor-pointer"
          />
        </div>

        {/* Input Jam Keterlambatan */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <span className="text-slate-700 font-medium block">Batas Jam Keterlambatan</span>
            <span className="text-[11px] text-slate-400">Log masuk di atas jam ini dianggap telat</span>
          </div>
          <input
            type="time"
            value={settings.workStartTime}
            onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
      >
        {isSaving ? 'Memproses...' : 'Simpan Pengaturan'}
      </button>
    </div>
  </div>
)}
    </>
  );
}
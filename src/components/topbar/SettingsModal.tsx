'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState({
    workStartTime: '07:15',
    workEndTime: '15:30', // Default Jam Pulang
    emailNotif: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setSettings({
              workStartTime: json.data.workStartTime || '07:15',
              workEndTime: json.data.workEndTime || '15:30',
              emailNotif: json.data.emailNotif ?? true,
            });
          }
        })
        .catch((err) => console.error('Gagal memuat pengaturan:', err));
    }
  }, [isOpen]);

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
        alert('Pengaturan jam kerja berhasil disimpan!');
        onClose();
        window.location.reload(); // Refresh untuk menerapkan logika matriks
      } else {
        alert(json.error || 'Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Pengaturan Sistem</h3>
            <p className="text-[11px] text-slate-400">Atur batasan jam kerja & matriks kehadiran</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Email Notif */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-700 font-medium">Notifikasi Email Admin</span>
            <input
              type="checkbox"
              checked={settings.emailNotif}
              onChange={(e) => setSettings({ ...settings, emailNotif: e.target.checked })}
              className="accent-indigo-600 w-5 h-5 cursor-pointer rounded"
            />
          </div>

          {/* Jam Masuk */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="text-slate-700 font-medium block">Batas Jam Masuk</span>
              <span className="text-[11px] text-slate-400">Log masuk di atas jam ini dianggap Telat</span>
            </div>
            <input
              type="time"
              value={settings.workStartTime}
              onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Jam Pulang (Fitur Baru) */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="text-slate-700 font-medium block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                Batas Jam Pulang Standard
              </span>
              <span className="text-[11px] text-slate-400">Log pulang di bawah jam ini dianggap Pulang Awal</span>
            </div>
            <input
              type="time"
              value={settings.workEndTime}
              onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSaving ? 'Memproses...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}
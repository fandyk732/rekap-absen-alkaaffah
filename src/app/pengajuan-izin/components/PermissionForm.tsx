'use client';

import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionFormProps {
  employee: any;
  onResetEmployee: () => void;
  onSuccess: () => void;
}

export default function PermissionForm({
  employee,
  onResetEmployee,
  onSuccess,
}: PermissionFormProps) {
  const [type, setType] = useState('Izin');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [earlyLeaveTime, setEarlyLeaveTime] = useState('12:00');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setSubmitting(true);
    try {
      const formatToDDMMYYYY = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
      };

      const payload = {
        pin: employee.pin,
        employeeName: employee.name,
        type,
        reason,
        startDate: formatToDDMMYYYY(startDate),
        endDate: formatToDDMMYYYY(
          type === 'Pulang Awal' || type === 'Terlambat' ? startDate : endDate
        ),
        earlyLeaveTime: type === 'Pulang Awal' ? earlyLeaveTime : null,
      };

      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Pengajuan izin berhasil terkirim!');
        onSuccess();
      } else {
        toast.error(json.error || 'Gagal mengirim pengajuan.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
            Pemohon
          </div>
          <div className="font-bold text-slate-800 text-sm">{employee.name}</div>
          <div className="text-[10px] text-slate-500 font-mono">PIN: {employee.pin}</div>
        </div>
        <button
          type="button"
          onClick={onResetEmployee}
          className="text-xs text-indigo-600 underline font-medium"
        >
          Ganti
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Jenis Ketidakhadiran
        </label>
        <select
          value={type}
          onChange={(e) => {
            const selected = e.target.value;
            setType(selected);
            if ((selected === 'Terlambat' || selected === 'Pulang Awal') && startDate) {
              setEndDate(startDate);
            }
          }}
          className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="Izin">Izin (Full Day)</option>
          <option value="Pulang Awal">Izin Pulang Awal</option>
          <option value="Terlambat">Terlambat Masuk Kerja</option>
          <option value="Sakit">Sakit</option>
          <option value="Cuti">Cuti</option>
          <option value="Dinas Luar">Dinas Luar</option>
        </select>
      </div>

      {type === 'Pulang Awal' && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-orange-800 text-xs font-semibold">
            <Clock className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Jam Rencana Pulang (Format 24 Jam)</span>
          </div>
          <input
            type="time"
            value={earlyLeaveTime}
            onChange={(e) => setEarlyLeaveTime(e.target.value)}
            required
            step="60"
            className="w-full text-sm font-mono font-bold bg-white border border-orange-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}

      <div className={type === 'Pulang Awal' || type === 'Terlambat' ? 'block' : 'grid grid-cols-2 gap-3'}>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {type === 'Pulang Awal' || type === 'Terlambat' ? 'Tanggal' : 'Mulai Tanggal'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (type === 'Terlambat' || type === 'Pulang Awal') {
                setEndDate(e.target.value);
              }
            }}
            required
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {type !== 'Pulang Awal' && type !== 'Terlambat' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Alasan / Keterangan
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            type === 'Pulang Awal'
              ? 'Contoh: Mengantar anak berobat / Ada keperluan keluarga mendadak...'
              : 'Contoh: Menghadiri acara keluarga / Sakit demam...'
          }
          required
          className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {submitting ? 'Mengirim...' : 'Kirim Pengajuan Izin'}
      </button>
    </form>
  );
}
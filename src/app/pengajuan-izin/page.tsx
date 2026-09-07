'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, Search, Calendar, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function FormIzinMandiriPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Form State
  const [type, setType] = useState('Izin');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('SW registered:', reg))
      .catch((err) => console.error('SW registration failed:', err));
  }
  }, []);
  
  // Ambil daftar pegawai untuk fitur pencarian nama
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const json = await res.json();
        if (json.success) {
          setEmployees(json.data);
        }
      } catch (err) {
        console.error('Gagal memuat daftar pegawai:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Filter pegawai berdasarkan nama yang diketik
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Verifikasi via PIN manual
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return toast.error('Masukkan PIN Anda');

    setVerifying(true);
    try {
      const res = await fetch('/api/employees/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();

      if (json.success) {
        setEmployee(json.data);
        toast.success(`Selamat datang, ${json.data.name}`);
      } else {
        toast.error(json.error || 'PIN tidak ditemukan.');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setVerifying(false);
    }
  };

  // Submit Form Pengajuan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setSubmitting(true);
    try {
      const formatToDDMMYYYY = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
      };

      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: employee.pin,
          employeeName: employee.name,
          type,
          reason,
          startDate: formatToDDMMYYYY(startDate),
          endDate: formatToDDMMYYYY(endDate),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsSuccess(true);
        toast.success('Pengajuan izin berhasil terkirim!');
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header Form */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-90" />
          <h1 className="text-xl font-bold">Portal Form Izin & Cuti Guru</h1>
          <p className="text-xs text-indigo-100 mt-1">SMKS Al Kaaffah Malang</p>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-bold text-slate-800">Pengajuan Berhasil Ditambahkan!</h2>
              <p className="text-sm text-slate-500">
                Data izin Anda telah terkirim ke sistem. Silakan tunggu konfirmasi persetujuan dari Admin.
              </p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmployee(null);
                  setPin('');
                  setReason('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Buat Pengajuan Lain
              </button>
            </div>
          ) : !employee ? (
            /* Step 1: Cari Nama ATAU Ketik PIN */
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Cari & Pilih Nama Guru / Pegawai
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ketik nama Anda di sini..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-9 pr-3 text-sm bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Dropdown Auto-complete */}
                {showDropdown && searchQuery.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.pin}
                          type="button"
                          onClick={() => {
                            setEmployee(emp);
                            setShowDropdown(false);
                            setSearchQuery('');
                            toast.success(`Dipilih: ${emp.name}`);
                          }}
                          className="w-full text-left p-3 hover:bg-indigo-50 transition-colors flex items-center justify-between"
                        >
                          <span className="font-semibold text-sm text-slate-800">{emp.name}</span>
                          <span className="text-xs text-slate-400 font-mono">PIN: {emp.pin}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400 text-center">Nama tidak ditemukan</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-semibold">Atau</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Form Input PIN Manual */}
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Masukkan PIN Manual (Jika Ingat)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1029"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center text-base font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying || !pin}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Memeriksa...' : 'Lanjutkan via PIN'}
                </button>
              </form>
            </div>
          ) : (
            /* Step 2: Form Isian Izin */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">Pemohon</div>
                  <div className="font-bold text-slate-800 text-sm">{employee.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">PIN: {employee.pin}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmployee(null)}
                  className="text-xs text-indigo-600 underline font-medium"
                >
                  Ganti
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Ketidakhadiran</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mulai Tanggal</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan / Keterangan</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Menghadiri acara keluarga / Sakit demam..."
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
          )}
        </div>
      </div>
    </div>
  );
}
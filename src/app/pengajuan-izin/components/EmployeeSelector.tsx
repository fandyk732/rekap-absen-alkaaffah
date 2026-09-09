'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeSelectorProps {
  employees: any[];
  onSelectEmployee: (employee: any) => void;
}

export default function EmployeeSelector({
  employees,
  onSelectEmployee,
}: EmployeeSelectorProps) {
  const [pin, setPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        onSelectEmployee(json.data);
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

  return (
    <div className="space-y-4">
      {/* 1. Search Nama */}
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
                    onSelectEmployee(emp);
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
              <div className="p-3 text-xs text-slate-400 text-center">
                Nama tidak ditemukan
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-semibold">
          Atau
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* 2. Input PIN Manual */}
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
  );
}
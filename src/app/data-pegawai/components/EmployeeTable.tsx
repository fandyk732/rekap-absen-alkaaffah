'use client';

import React from 'react';
import { Edit2, Trash2, UserCheck, UserX, Phone, Calendar } from 'lucide-react';
import ExportEmployeeModal from '@/components/ExportEmployeeModal';

interface EmployeeTableProps {
  employees: any[];
  loading: boolean;
  onOpenSchedule: (emp: any) => void;
  onEdit: (emp: any) => void;
  onDelete: (id: string, name: string) => void;
}

export default function EmployeeTable({
  employees,
  loading,
  onOpenSchedule,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="py-3.5 px-4">Pegawai</th>
            <th className="py-3.5 px-4">PIN / NIP</th>
            <th className="py-3.5 px-4">Jabatan / Role</th>
            <th className="py-3.5 px-4">L/P</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-center">Aksi & Jadwal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Memuat data pegawai...
              </td>
            </tr>
          ) : employees.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Tidak ada data pegawai yang ditemukan.
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{emp.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {emp.phone || '-'}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-mono text-xs font-semibold">
                    PIN: {emp.pin}
                  </div>
                  {emp.nip && emp.nip !== '-' && (
                    <div className="text-xs text-slate-400 mt-1 font-mono">NIP: {emp.nip}</div>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                    {emp.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-600">{emp.gender}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      emp.status === 'Aktif'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {emp.status === 'Aktif' ? (
                      <UserCheck className="w-3.5 h-3.5" />
                    ) : (
                      <UserX className="w-3.5 h-3.5" />
                    )}
                    {emp.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onOpenSchedule(emp)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition"
                      title="Atur Jam / Hari Mengajar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Jadwal
                    </button>
                    <button
                      onClick={() => onEdit(emp)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Pegawai"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(emp.id, emp.name)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Pegawai"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                     <td className="px-4 py-3 flex items-center gap-2">
                    {/* Tombol Export Excel Individual */}
                    <ExportEmployeeModal pin={emp.pin} name={emp.name} />
                    </td>    

                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
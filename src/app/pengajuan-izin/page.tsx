'use client';

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

import EmployeeSelector from './components/EmployeeSelector';
import PermissionForm from './components/PermissionForm';
import SuccessState from './components/SuccessState';

export default function FormIzinMandiriPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch daftar pegawai
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

  const handleResetAll = () => {
    setIsSuccess(false);
    setEmployee(null);
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
            <SuccessState onReset={handleResetAll} />
          ) : !employee ? (
            <EmployeeSelector
              employees={employees}
              onSelectEmployee={(selected) => setEmployee(selected)}
            />
          ) : (
            <PermissionForm
              employee={employee}
              onResetEmployee={() => setEmployee(null)}
              onSuccess={() => setIsSuccess(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
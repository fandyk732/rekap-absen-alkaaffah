'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

import EmployeeHeader from './components/EmployeeHeader';
import EmployeeSearch from './components/EmployeeSearch';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import ScheduleModal from './components/ScheduleModal';

const DAYS = [
  { id: 1, label: 'Senin' },
  { id: 2, label: 'Selasa' },
  { id: 3, label: 'Rabu' },
  { id: 4, label: 'Kamis' },
  { id: 5, label: 'Jumat' },
  { id: 6, label: 'Sabtu' },
  { id: 0, label: 'Minggu' },
];

export default function DataPegawaiPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // State Modal Employee
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    pin: '',
    name: '',
    nip: '',
    role: 'Guru',
    gender: 'L',
    phone: '',
    status: 'Aktif',
  });

  // State Modal Schedule
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data pegawai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ pin: '', name: '', nip: '', role: 'Guru', gender: 'L', phone: '', status: 'Aktif' });
    setShowModal(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingId(emp.id);
    setFormData({
      pin: emp.pin,
      name: emp.name,
      nip: emp.nip || '',
      role: emp.role || 'Guru',
      gender: emp.gender || 'L',
      phone: emp.phone || '',
      status: emp.status || 'Aktif',
    });
    setShowModal(true);
  };

  const handleOpenSchedule = async (emp: any) => {
    setSelectedEmp(emp);
    setShowScheduleModal(true);

    try {
      const res = await fetch(`/api/schedules?employeeId=${emp.id}`);
      const json = await res.json();

      const initialScheds = DAYS.map((day) => {
        const found = json.data?.find((s: any) => s.dayOfWeek === day.id);
        return {
          dayOfWeek: day.id,
          dayName: day.label,
          isWorking: found ? found.isWorking : day.id !== 0,
          startTime: found?.startTime || '07:15',
          endTime: found?.endTime || '14:00',
        };
      });

      setSchedules(initialScheds);
    } catch (err) {
      toast.error('Gagal mengambil jadwal pegawai.');
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedEmp) return;
    setSavingSchedule(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          schedules,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Jadwal mengajar ${selectedEmp.name} berhasil disimpan!`);
        setShowScheduleModal(false);
      } else {
        toast.error(json.error || 'Gagal menyimpan jadwal.');
      }
    } catch (e) {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan data ${name}?`)) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Data ${name} berhasil dinonaktifkan.`);
        fetchEmployees();
      }
    } catch (err) {
      toast.error('Gagal menghapus data pegawai');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch('/api/employees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingId ? 'Data pegawai diperbarui.' : 'Pegawai baru ditambahkan.');
        setShowModal(false);
        fetchEmployees();
      }
    } catch (err) {
      toast.error('Gagal menyimpan data pegawai');
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.pin.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <EmployeeHeader onAddClick={handleOpenAdd} />

        <EmployeeSearch value={search} onChange={setSearch} />

        <EmployeeTable
          employees={filteredEmployees}
          loading={loading}
          onOpenSchedule={handleOpenSchedule}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />

        {/* Modals */}
        <ScheduleModal
          show={showScheduleModal}
          selectedEmp={selectedEmp}
          schedules={schedules}
          setSchedules={setSchedules}
          savingSchedule={savingSchedule}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveSchedule}
        />

        <EmployeeModal
          show={showModal}
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      </div>
    </AppLayout>
  );
}
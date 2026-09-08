'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Phone, Calendar, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State Modal Jadwal Mengajar Khusus
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [formData, setFormData] = useState({
    pin: '',
    name: '',
    nip: '',
    role: 'Guru',
    gender: 'L',
    phone: '',
    status: 'Aktif',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch (err) {
      console.error(err);
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

  // Open Modal Jadwal Mengajar Khusus
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
          endTime: found?.endTime || '14:00', // Default jam pulang 14:00
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
    if (!confirm(`Apakah Anda yakin ingin menghapus data ${name}?`)) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchEmployees();
    } catch (err) {
      alert('Gagal menghapus data pegawai');
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
        setShowModal(false);
        fetchEmployees();
      }
    } catch (err) {
      alert('Gagal menyimpan data pegawai');
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
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Data Pegawai & Guru</h1>
            <p className="text-slate-500 text-sm">
              Kelola informasi profil, PIN mesin fingerprint, dan atur jadwal mengajar khusus.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Tambah Pegawai Baru
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <Search className="w-5 h-5 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama, PIN, atau Jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-slate-800 bg-transparent"
          />
        </div>

        {/* Table List */}
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
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data pegawai yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
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
                          onClick={() => handleOpenSchedule(emp)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition"
                          title="Atur Jam / Hari Mengajar"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Jadwal
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Pegawai"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Pegawai"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL SETTING JADWAL MENGAJAR KHUSUS */}
          {showScheduleModal && selectedEmp && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Jadwal Jam Mengajar / Kerja</h2>
                    <p className="text-xs text-slate-500">{selectedEmp.name} (PIN: {selectedEmp.pin})</p>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {schedules.map((s, idx) => (
                    <div key={s.dayOfWeek} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={s.isWorking}
                          onChange={(e) => {
                            const updated = [...schedules];
                            updated[idx].isWorking = e.target.checked;
                            setSchedules(updated);
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={`text-sm font-semibold ${s.isWorking ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                          {s.dayName}
                        </span>
                      </div>

                      {s.isWorking ? (
                        <div className="flex items-center gap-2">
                          {/* Jam Masuk */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] text-slate-400">Masuk:</span>
                            <input
                              type="text"
                              value={s.startTime}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx].startTime = e.target.value;
                                setSchedules(updated);
                              }}
                              placeholder="07:15"
                              className="w-12 text-xs font-mono font-bold text-center border-b border-slate-300 focus:outline-none focus:border-indigo-600"
                            />
                          </div>

                          {/* Jam Pulang */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3 text-rose-600" />
                            <span className="text-[10px] text-slate-400">Pulang:</span>
                            <input
                              type="text"
                              value={s.endTime}
                              onChange={(e) => {
                                const updated = [...schedules];
                                updated[idx].endTime = e.target.value;
                                setSchedules(updated);
                              }}
                              placeholder="14:00"
                              className="w-12 text-xs font-mono font-bold text-center border-b border-slate-300 focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 font-medium px-2 py-1 bg-rose-50 rounded-md">
                          Libur Mengajar
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
                  >
                    {savingSchedule && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Simpan Jadwal
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Modal Form Add/Edit Pegawai (Tetap Ada) */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">PIN Mesin Abensi *</label>
                    <input
                      type="text"
                      required
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
                      placeholder="Contoh: 2026122"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">NIP / NIK (Opsional)</label>
                    <input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
                      placeholder="NIP Pegawai"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="Contoh: RAFIL"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Jabatan / Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                    >
                      <option value="Guru">Guru</option>
                      <option value="Tata Usaha">Tata Usaha</option>
                      <option value="Staff IT">Staff IT</option>
                      <option value="Kepala Sekolah">Kepala Sekolah</option>
                      <option value="Keamanan">Keamanan</option>
                      <option value="Kebersihan">Kebersihan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                    >
                      <option value="L">Laki-Laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">No. WhatsApp / HP</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none"
                      placeholder="08123456789"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Status Pegawai</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Non-Aktif">Non-Aktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shadow-sm"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
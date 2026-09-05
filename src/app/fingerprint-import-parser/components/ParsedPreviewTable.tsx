'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

type RecordFilter = 'all' | 'valid' | 'missing-out' | 'flagged';

interface LogRecord {
  id: string;
  empId: string;
  name: string;
  machineId: string;
  scanIn: string;
  scanOut: string | null;
  machineStatus: 'OK' | 'TIMEOUT' | 'MISMATCH' | 'NO_OUT';
  systemStatus: 'Terverifikasi' | 'Scan Keluar Hilang' | 'Mismatch ID' | 'Pending';
}

const mockRecords: LogRecord[] = [
  { id: 'log-001', empId: 'GTK-001', name: 'Drs. Ahmad Fauzi, M.Pd.', machineId: 'FP-01', scanIn: '07:12:34', scanOut: '14:58:22', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-002', empId: 'GTK-002', name: 'Ibu Siti Rahmawati, S.Pd.', machineId: 'FP-01', scanIn: '07:03:11', scanOut: '15:01:44', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-003', empId: 'GTK-003', name: 'Bapak Rudi Hermawan, S.T.', machineId: 'FP-02', scanIn: '08:47:05', scanOut: null, machineStatus: 'NO_OUT', systemStatus: 'Scan Keluar Hilang' },
  { id: 'log-004', empId: 'GTK-004', name: 'Ibu Nurul Hidayah, S.E.', machineId: 'FP-01', scanIn: '07:08:52', scanOut: '15:00:10', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-005', empId: 'GTK-005', name: 'Bapak Budi Santoso, S.Kom.', machineId: 'FP-03', scanIn: '07:55:30', scanOut: null, machineStatus: 'TIMEOUT', systemStatus: 'Scan Keluar Hilang' },
  { id: 'log-006', empId: 'GTK-006', name: 'Ibu Dewi Kurniawati, M.Pd.', machineId: 'FP-02', scanIn: '07:15:20', scanOut: '14:55:00', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-007', empId: 'GTK-099', name: 'UNKNOWN USER', machineId: 'FP-03', scanIn: '07:30:00', scanOut: '15:00:00', machineStatus: 'MISMATCH', systemStatus: 'Mismatch ID' },
  { id: 'log-008', empId: 'GTK-007', name: 'Bapak Agus Setiawan, S.Pd.', machineId: 'FP-01', scanIn: '07:05:44', scanOut: '14:59:31', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-009', empId: 'GTK-008', name: 'Ibu Rina Marlina, S.Pd.I.', machineId: 'FP-02', scanIn: '07:11:08', scanOut: '15:02:00', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-010', empId: 'GTK-009', name: 'Bapak Wahyu Prasetyo, S.T.', machineId: 'FP-01', scanIn: '07:09:00', scanOut: null, machineStatus: 'NO_OUT', systemStatus: 'Scan Keluar Hilang' },
  { id: 'log-011', empId: 'GTK-010', name: 'Ibu Fitri Handayani, A.Md.', machineId: 'FP-03', scanIn: '07:07:22', scanOut: '14:57:18', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-012', empId: 'GTK-011', name: 'Bapak Hendra Gunawan, S.Pd.', machineId: 'FP-01', scanIn: '07:14:55', scanOut: '15:03:40', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
  { id: 'log-013', empId: 'GTK-098', name: 'DATA DUPLIKAT', machineId: 'FP-02', scanIn: '07:12:34', scanOut: '14:58:22', machineStatus: 'MISMATCH', systemStatus: 'Mismatch ID' },
  { id: 'log-014', empId: 'GTK-012', name: 'Ibu Yanti Kusumawati, S.Pd.', machineId: 'FP-01', scanIn: '07:02:10', scanOut: '14:56:05', machineStatus: 'OK', systemStatus: 'Terverifikasi' },
];

const filterTabs: { key: RecordFilter; label: string; count?: number }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'valid', label: 'Valid' },
  { key: 'missing-out', label: 'Scan Keluar Hilang' },
  { key: 'flagged', label: 'Mismatch/Flagged' },
];

const systemStatusConfig = {
  'Terverifikasi': { icon: CheckCircle2, className: 'text-green-600', bg: 'bg-green-50 text-green-700 border border-green-200' },
  'Scan Keluar Hilang': { icon: Clock, className: 'text-orange-500', bg: 'bg-orange-50 text-orange-700 border border-orange-200' },
  'Mismatch ID': { icon: AlertTriangle, className: 'text-red-500', bg: 'bg-red-50 text-red-700 border border-red-200' },
  'Pending': { icon: XCircle, className: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground border border-border' },
};

const machineStatusConfig = {
  'OK': 'bg-green-50 text-green-700 border border-green-200',
  'TIMEOUT': 'bg-orange-50 text-orange-700 border border-orange-200',
  'MISMATCH': 'bg-red-50 text-red-700 border border-red-200',
  'NO_OUT': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
};

export default function ParsedPreviewTable() {
  const [activeFilter, setActiveFilter] = useState<RecordFilter>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const filtered = mockRecords.filter((r) => {
    if (activeFilter === 'valid') return r.systemStatus === 'Terverifikasi';
    if (activeFilter === 'missing-out') return r.systemStatus === 'Scan Keluar Hilang';
    if (activeFilter === 'flagged') return r.systemStatus === 'Mismatch ID';
    return true;
  });

  const counts = {
    all: mockRecords.length,
    valid: mockRecords.filter((r) => r.systemStatus === 'Terverifikasi').length,
    'missing-out': mockRecords.filter((r) => r.systemStatus === 'Scan Keluar Hilang').length,
    flagged: mockRecords.filter((r) => r.systemStatus === 'Mismatch ID').length,
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (selectedRows.size === filtered.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filtered.map((r) => r.id)));
    }
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {filterTabs.map((tab) => (
          <button
            key={`filter-tab-${tab.key}`}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-600 transition-all duration-150 scale-click
              ${activeFilter === tab.key
                ? 'bg-secondary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-border hover:text-foreground'
              }
            `}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-700 ${
                activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-border text-muted-foreground'
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
        <div className="ml-auto text-xs text-muted-foreground">
          {selectedRows.size > 0 && (
            <span className="font-600 text-secondary">{selectedRows.size} baris dipilih</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin rounded-xl border border-border">
        <table className="w-full text-sm" style={{ minWidth: '900px' }}>
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded border-border accent-secondary cursor-pointer"
                />
              </th>
              {['ID Pegawai', 'Nama Pegawai', 'Mesin', 'Scan Masuk', 'Scan Keluar', 'Status Mesin', 'Status Sistem'].map((col) => (
                <th
                  key={`th-${col.replace(/\s/g, '-')}`}
                  className="px-4 py-3 text-left text-xs font-600 text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => {
              const sysConf = systemStatusConfig[record.systemStatus];
              const SysIcon = sysConf.icon;
              const isSelected = selectedRows.has(record.id);
              const isFlagged = record.systemStatus !== 'Terverifikasi';

              return (
                <tr
                  key={record.id}
                  onClick={() => toggleRow(record.id)}
                  className={`border-b border-border last:border-0 cursor-pointer transition-colors
                    ${isSelected ? 'bg-accent/60' : isFlagged ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-muted/50'}
                  `}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(record.id)}
                      className="rounded border-border accent-secondary cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-tabular font-600 text-secondary text-xs">
                    {record.empId}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-500 ${record.name.includes('UNKNOWN') || record.name.includes('DUPLIKAT') ? 'text-red-600 font-600' : 'text-foreground'}`}>
                      {record.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-500">
                    {record.machineId}
                  </td>
                  <td className="px-4 py-3 font-tabular text-sm font-600 text-foreground">
                    {record.scanIn}
                  </td>
                  <td className="px-4 py-3 font-tabular text-sm font-600">
                    {record.scanOut ? (
                      <span className="text-foreground">{record.scanOut}</span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1 text-xs">
                        <XCircle size={12} />
                        Tidak ada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-700 px-2 py-1 rounded-md ${machineStatusConfig[record.machineStatus]}`}>
                      {record.machineStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-700 px-2 py-1 rounded-md ${sysConf.bg}`}>
                      <SysIcon size={11} />
                      {record.systemStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Menampilkan {filtered.length} dari {mockRecords.length} record</span>
        <div className="flex items-center gap-4">
          <span className="text-green-600 font-600">{counts.valid} valid</span>
          <span className="text-orange-500 font-600">{counts['missing-out']} scan keluar hilang</span>
          <span className="text-red-500 font-600">{counts.flagged} flagged</span>
        </div>
      </div>
    </div>
  );
}
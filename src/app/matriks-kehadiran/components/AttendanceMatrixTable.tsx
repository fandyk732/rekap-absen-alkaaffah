'use client';

import React, { useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';

type StatusCode = 'H' | 'T' | 'S' | 'I' | 'DL' | 'A' | '-';

interface EmployeeRow {
  id: string;
  name: string;
  dept: string;
  nip: string;
  records: Record<number, StatusCode>;
}

const generateRecords = (pattern: StatusCode[]): Record<number, StatusCode> => {
  const result: Record<number, StatusCode> = {};
  for (let d = 1; d <= 30; d++) {
    const isWeekend = false;
    if (isWeekend) {
      result[d] = '-';
    } else {
      result[d] = pattern[(d - 1) % pattern.length];
    }
  }
  return result;
};

const employees: EmployeeRow[] = [
  {
    id: 'emp-001',
    name: 'Drs. Ahmad Fauzi, M.Pd.',
    dept: 'Guru Produktif',
    nip: '197603142005011003',
    records: {
      1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: '-', 8: 'H', 9: 'T', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'I', 18: 'I', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-002',
    name: 'Ibu Siti Rahmawati, S.Pd.',
    dept: 'Guru Normatif/Adaptif',
    nip: '198205212009012004',
    records: {
      1: 'S', 2: 'S', 3: 'H', 4: 'H', 5: 'H', 6: 'T', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'T', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'T', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-003',
    name: 'Bapak Rudi Hermawan, S.T.',
    dept: 'Guru Produktif',
    nip: '198711302012011005',
    records: {
      1: 'A', 2: 'H', 3: 'H', 4: 'H', 5: 'T', 6: 'H', 7: '-', 8: 'H', 9: 'H', 10: 'T',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'A', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'T', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-004',
    name: 'Ibu Nurul Hidayah, S.E.',
    dept: 'Staf Administrasi',
    nip: '199001152015032001',
    records: {
      1: 'H', 2: 'H', 3: 'DL', 4: 'DL', 5: 'H', 6: 'H', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-005',
    name: 'Bapak Budi Santoso, S.Kom.',
    dept: 'Guru Produktif',
    nip: '198403202010011007',
    records: {
      1: 'A', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'T', 7: '-', 8: 'A', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'T', 16: 'H', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'T',
    },
  },
  {
    id: 'emp-006',
    name: 'Ibu Dewi Kurniawati, M.Pd.',
    dept: 'Guru Normatif/Adaptif',
    nip: '197809122003122002',
    records: {
      1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'I', 6: 'H', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-007',
    name: 'Bapak Agus Setiawan, S.Pd.',
    dept: 'Guru Produktif',
    nip: '198612072011011009',
    records: {
      1: 'H', 2: 'T', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'T', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-008',
    name: 'Ibu Rina Marlina, S.Pd.I.',
    dept: 'Guru Normatif/Adaptif',
    nip: '198908182014032006',
    records: {
      1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'H', 19: 'S', 20: 'S',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-009',
    name: 'Bapak Wahyu Prasetyo, S.T.',
    dept: 'Tenaga Kependidikan',
    nip: '199205302018011002',
    records: {
      1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'T', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-010',
    name: 'Ibu Fitri Handayani, A.Md.',
    dept: 'Staf Administrasi',
    nip: '199403122019032003',
    records: {
      1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-011',
    name: 'Bapak Hendra Gunawan, S.Pd.',
    dept: 'Guru Produktif',
    nip: '198001052006011011',
    records: {
      1: 'H', 2: 'H', 3: 'H', 4: 'I', 5: 'I', 6: 'I', 7: '-', 8: 'H', 9: 'H', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'H', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
  {
    id: 'emp-012',
    name: 'Ibu Yanti Kusumawati, S.Pd.',
    dept: 'Guru Normatif/Adaptif',
    nip: '197512182001122004',
    records: {
      1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: '-', 8: 'DL', 9: 'DL', 10: 'H',
      11: 'H', 12: 'H', 13: '-', 14: '-', 15: 'H', 16: 'H', 17: 'H', 18: 'H', 19: 'H', 20: 'H',
      21: '-', 22: '-', 23: 'H', 24: 'H', 25: 'H', 26: 'T', 27: 'H', 28: '-', 29: '-', 30: 'H',
    },
  },
];

const WEEKEND_DAYS = [7, 14, 21, 28];

function computeSummary(records: Record<number, StatusCode>) {
  const counts = { H: 0, T: 0, S: 0, I: 0, DL: 0, A: 0 };
  Object.values(records).forEach((s) => {
    if (s in counts) counts[s as keyof typeof counts]++;
  });
  return counts;
}

interface Props {
  selectedMonth: number;
  selectedYear: number;
  selectedDept: string;
}

export default function AttendanceMatrixTable({ selectedDept }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const daysInMonth = 30;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filtered = selectedDept === 'Semua Departemen'
    ? employees
    : employees.filter((e) => e.dept === selectedDept);

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-xs border-collapse" style={{ minWidth: '1200px' }}>
        <thead>
          <tr className="bg-muted border-b border-border">
            <th className="sticky left-0 bg-muted text-left px-4 py-3 font-600 text-muted-foreground whitespace-nowrap min-w-[200px] z-10 border-r border-border">
              Nama Pegawai
            </th>
            <th className="px-2 py-3 font-600 text-muted-foreground whitespace-nowrap w-16 border-r border-border">
              NIP
            </th>
            {days.map((d) => (
              <th
                key={`col-day-${d}`}
                className={`matrix-cell text-center font-600 py-3 ${
                  WEEKEND_DAYS.includes(d)
                    ? 'weekend-col' :'text-muted-foreground'
                }`}
              >
                {d}
              </th>
            ))}
            <th className="px-2 py-3 font-600 text-muted-foreground text-center whitespace-nowrap border-l border-border status-h">
              H
            </th>
            <th className="px-2 py-3 font-600 text-center whitespace-nowrap status-t">T</th>
            <th className="px-2 py-3 font-600 text-center whitespace-nowrap status-s">S</th>
            <th className="px-2 py-3 font-600 text-center whitespace-nowrap status-i">I</th>
            <th className="px-2 py-3 font-600 text-center whitespace-nowrap status-dl">DL</th>
            <th className="px-2 py-3 font-600 text-center whitespace-nowrap status-a">A</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((emp) => {
            const summary = computeSummary(emp.records);
            const isHovered = hoveredRow === emp.id;
            return (
              <tr
                key={emp.id}
                onMouseEnter={() => setHoveredRow(emp.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`border-b border-border transition-colors ${
                  isHovered ? 'bg-accent/50' : 'hover:bg-muted/30'
                }`}
              >
                <td className="sticky left-0 bg-card px-4 py-2.5 border-r border-border z-10">
                  <div className="flex flex-col">
                    <span className="font-600 text-foreground truncate max-w-[180px]">{emp.name}</span>
                    <span className="text-muted-foreground text-[10px]">{emp.dept}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-muted-foreground font-tabular text-[10px] border-r border-border whitespace-nowrap">
                  {emp.nip.slice(0, 8)}...
                </td>
                {days.map((d) => {
                  const code = emp.records[d] ?? '-';
                  return (
                    <td
                      key={`cell-${emp.id}-${d}`}
                      className={`matrix-cell text-center p-0.5 ${
                        WEEKEND_DAYS.includes(d) ? 'weekend-col' : ''
                      }`}
                    >
                      {code !== '-' ? (
                        <StatusBadge code={code as 'H' | 'T' | 'S' | 'I' | 'DL' | 'A' | '-'} />
                      ) : (
                        <span className="text-muted-foreground/40 text-[10px]">—</span>
                      )}
                    </td>
                  );
                })}
                {/* Summary */}
                <td className="px-3 py-2.5 text-center font-700 font-tabular text-green-600 border-l border-border">{summary.H}</td>
                <td className="px-3 py-2.5 text-center font-700 font-tabular text-orange-600">{summary.T}</td>
                <td className="px-3 py-2.5 text-center font-700 font-tabular text-yellow-600">{summary.S}</td>
                <td className="px-3 py-2.5 text-center font-700 font-tabular text-blue-600">{summary.I}</td>
                <td className="px-3 py-2.5 text-center font-700 font-tabular text-purple-600">{summary.DL}</td>
                <td className="px-3 py-2.5 text-center font-700 font-tabular text-red-600">{summary.A}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
'use client';

import React from 'react';
import { Download, ChevronDown } from 'lucide-react';

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const departments = [
  'Semua Departemen',
  'Guru Produktif',
  'Guru Normatif/Adaptif',
  'Tenaga Kependidikan',
  'Staf Administrasi',
];

interface MatrixFiltersProps {
  selectedMonth: number;
  selectedYear: number;
  selectedDept: string;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  onDeptChange: (d: string) => void;
}

export default function MatrixFilters({
  selectedMonth,
  selectedYear,
  selectedDept,
  onMonthChange,
  onYearChange,
  onDeptChange,
}: MatrixFiltersProps) {
  const years = [2024, 2025, 2026];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Month */}
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="appearance-none pl-3 pr-8 py-2 text-sm font-500 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:border-secondary/50 transition-colors"
        >
          {months.map((m, i) => (
            <option key={`month-opt-${i + 1}`} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>

      {/* Year */}
      <div className="relative">
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="appearance-none pl-3 pr-8 py-2 text-sm font-500 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:border-secondary/50 transition-colors"
        >
          {years.map((y) => (
            <option key={`year-opt-${y}`} value={y}>
              {y}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>

      {/* Department */}
      <div className="relative">
        <select
          value={selectedDept}
          onChange={(e) => onDeptChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm font-500 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:border-secondary/50 transition-colors"
        >
          {departments.map((d) => (
            <option key={`dept-opt-${d.replace(/\s/g, '-')}`} value={d}>
              {d}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-600 text-secondary bg-accent border border-secondary/20 rounded-lg hover:bg-secondary hover:text-white transition-all duration-150 scale-click">
          <Download size={14} />
          Export Excel
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-600 text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-150 scale-click">
          <Download size={14} />
          Export PDF
        </button>
      </div>
    </div>
  );
}
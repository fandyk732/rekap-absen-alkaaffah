import React from 'react';

const legend = [
  { code: 'H', label: 'Hadir', className: 'status-h' },
  { code: 'T', label: 'Terlambat', className: 'status-t' },
  { code: 'S', label: 'Sakit', className: 'status-s' },
  { code: 'I', label: 'Izin', className: 'status-i' },
  { code: 'DL', label: 'Dinas Luar', className: 'status-dl' },
  { code: 'A', label: 'Alpha', className: 'status-a' },
];

export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {legend?.map((item) => (
        <div key={`legend-${item?.code}`} className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center justify-center text-[10px] font-700 w-6 h-5 rounded font-tabular ${item?.className}`}
          >
            {item?.code}
          </span>
          <span className="text-xs text-muted-foreground">{item?.label}</span>
        </div>
      ))}
    </div>
  );
}
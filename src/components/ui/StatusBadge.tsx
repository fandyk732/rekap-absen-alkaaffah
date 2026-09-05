import React from 'react';

type StatusCode = 'H' | 'T' | 'S' | 'I' | 'DL' | 'A' | '-';

interface StatusBadgeProps {
  code: StatusCode;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusCode, { label: string; className: string }> = {
  H: { label: 'H', className: 'status-h' },
  T: { label: 'T', className: 'status-t' },
  S: { label: 'S', className: 'status-s' },
  I: { label: 'I', className: 'status-i' },
  DL: { label: 'DL', className: 'status-dl' },
  A: { label: 'A', className: 'status-a' },
  '-': { label: '—', className: 'bg-muted text-muted-foreground border border-border' },
};

export default function StatusBadge({ code, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[code] ?? statusConfig['-'];
  const sizeClass = size === 'md' ?'text-xs font-700 px-2 py-0.5 rounded-md' :'text-[10px] font-700 w-7 h-6 flex items-center justify-center rounded';

  return (
    <span className={`inline-flex items-center justify-center font-tabular ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
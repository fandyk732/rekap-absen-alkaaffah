'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const distributionData = [
  { name: 'Hadir (H)', value: 50, color: '#16a34a' },
  { name: 'Terlambat (T)', value: 5, color: '#ea580c' },
  { name: 'Izin (I)', value: 2, color: '#2563eb' },
  { name: 'Sakit (S)', value: 1, color: '#ca8a04' },
  { name: 'Dinas (DL)', value: 1, color: '#7c3aed' },
  { name: 'Alpha (A)', value: 1, color: '#dc2626' },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number } }[] }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-xl shadow-modal p-3 text-xs">
        <p className="font-700 text-foreground">{d.name}</p>
        <p className="text-muted-foreground mt-1">
          <span className="font-600 text-foreground">{d.value}</span> pegawai
        </p>
      </div>
    );
  }
  return null;
};

export default function AttendanceDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={distributionData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={88}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {distributionData.map((entry) => (
            <Cell key={`dist-cell-${entry.name}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-sans)', paddingTop: '4px' }}
          formatter={(value) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
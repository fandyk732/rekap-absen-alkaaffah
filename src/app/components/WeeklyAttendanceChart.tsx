'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,  } from 'recharts';

const weeklyData = [
  { day: 'Sen 26', hadir: 52, terlambat: 4, izin: 2, alpha: 0 },
  { day: 'Sel 27', hadir: 55, terlambat: 2, izin: 1, alpha: 1 },
  { day: 'Rab 28', hadir: 48, terlambat: 6, izin: 3, alpha: 2 },
  { day: 'Kam 29', hadir: 53, terlambat: 3, izin: 2, alpha: 0 },
  { day: 'Jum 30', hadir: 44, terlambat: 5, izin: 4, alpha: 3 },
  { day: 'Sab 31', hadir: 38, terlambat: 3, izin: 6, alpha: 1 },
  { day: 'Sen 01', hadir: 50, terlambat: 5, izin: 2, alpha: 1 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-modal p-3 text-xs">
        <p className="font-700 text-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <div key={`tooltip-${p.name}`} className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-600 text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function WeeklyAttendanceChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={weeklyData} barCategoryGap="30%" barGap={2}>
        <defs>
          <linearGradient id="gradHadir" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={1} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="gradTerlambat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity={1} />
            <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="gradIzin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="gradAlpha" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={1} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-sans)', paddingTop: '8px' }}
        />
        <Bar dataKey="hadir" name="Hadir" fill="url(#gradHadir)" radius={[3, 3, 0, 0]} maxBarSize={14} />
        <Bar dataKey="terlambat" name="Terlambat" fill="url(#gradTerlambat)" radius={[3, 3, 0, 0]} maxBarSize={14} />
        <Bar dataKey="izin" name="Izin" fill="url(#gradIzin)" radius={[3, 3, 0, 0]} maxBarSize={14} />
        <Bar dataKey="alpha" name="Alpha" fill="url(#gradAlpha)" radius={[3, 3, 0, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
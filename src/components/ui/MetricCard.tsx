import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral'; label: string };
  alert?: boolean;
  featured?: boolean;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  alert,
  featured,
}: MetricCardProps) {
  return (
    <div
      className={`bg-card rounded-xl border shadow-card p-5 flex flex-col gap-3 scale-click hover:shadow-card-hover transition-all duration-200
        ${alert ? 'border-red-200 bg-red-50/30' : 'border-border'}
        ${featured ? 'ring-2 ring-secondary/20' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-600 uppercase tracking-wide ${alert ? 'text-red-500' : 'text-muted-foreground'}`}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className={`font-tabular font-700 leading-none ${featured ? 'text-4xl' : 'text-3xl'} ${alert ? 'text-red-600' : 'text-foreground'}`}>
          {value}
        </span>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-600 ${
            trend.direction === 'up' ? 'text-green-600' :
            trend.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
          }`}>
            {trend.direction === 'up' && <TrendingUp size={14} />}
            {trend.direction === 'down' && <TrendingDown size={14} />}
            {trend.direction === 'neutral' && <Minus size={14} />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      {trend && (
        <p className="text-[10px] text-muted-foreground">{trend.label}</p>
      )}
    </div>
  );
}
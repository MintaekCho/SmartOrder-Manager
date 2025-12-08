'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconBgColor = 'bg-[var(--color-primary-100)]',
  change,
  changeLabel = '전일 대비',
  subtitle,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-gray-600)] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[var(--color-gray-900)]">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && (
                <TrendingUp size={14} className="text-[var(--color-success)]" />
              )}
              {isNegative && (
                <TrendingDown size={14} className="text-[var(--color-danger)]" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive
                    ? 'text-[var(--color-success)]'
                    : isNegative
                    ? 'text-[var(--color-danger)]'
                    : 'text-[var(--color-gray-500)]'
                }`}
              >
                {isPositive && '+'}
                {change}%
              </span>
              <span className="text-xs text-[var(--color-gray-500)]">
                {changeLabel}
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-[var(--color-gray-500)] mt-2">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

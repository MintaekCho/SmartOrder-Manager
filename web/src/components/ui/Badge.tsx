'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'pending' | 'processing' | 'completed' | 'error' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export default function Badge({
  variant = 'default',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    processing: 'bg-[#E3F2FD] text-[#1565C0]',
    completed: 'bg-[#E8F5E9] text-[#2E7D32]',
    error: 'bg-[#FFEBEE] text-[#C62828]',
    default: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
  };

  const dotColors: Record<BadgeVariant, string> = {
    pending: 'bg-[#F5A623]',
    processing: 'bg-[#2196F3]',
    completed: 'bg-[#4CAF50]',
    error: 'bg-[#E74C3C]',
    default: 'bg-[var(--color-gray-500)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

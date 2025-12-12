'use client';

import { ReactNode } from 'react';

export type BadgeVariant = 'pending' | 'processing' | 'completed' | 'success' | 'error' | 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    processing: 'bg-[#E3F2FD] text-[#1565C0]',
    completed: 'bg-[#E8F5E9] text-[#2E7D32]',
    success: 'bg-[#E8F5E9] text-[#2E7D32]',
    error: 'bg-[#FFEBEE] text-[#C62828]',
    danger: 'bg-[#FFEBEE] text-[#C62828]',
    warning: 'bg-[#FFF3E0] text-[#E65100]',
    primary: 'bg-[#E3F2FD] text-[#1565C0]',
    secondary: 'bg-[var(--color-gray-200)] text-[var(--color-gray-700)]',
    info: 'bg-[#E1F5FE] text-[#01579B]',
    default: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
  };

  const dotColors: Record<BadgeVariant, string> = {
    pending: 'bg-[#F5A623]',
    processing: 'bg-[#2196F3]',
    completed: 'bg-[#4CAF50]',
    success: 'bg-[#4CAF50]',
    error: 'bg-[#E74C3C]',
    danger: 'bg-[#E74C3C]',
    warning: 'bg-[#F5A623]',
    primary: 'bg-[#2196F3]',
    secondary: 'bg-[var(--color-gray-500)]',
    info: 'bg-[#0288D1]',
    default: 'bg-[var(--color-gray-500)]',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

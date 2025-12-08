'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = true,
}: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-200)]">
          <div>
            {title && (
              <h3 className="font-semibold text-[var(--color-gray-900)]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--color-gray-500)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
    </div>
  );
}

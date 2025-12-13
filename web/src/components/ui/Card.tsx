'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  icon,
  actions,
  className = '',
  padding = true,
}: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-200)]">
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div>
              {title && (
                <h3 className="font-semibold text-[var(--color-gray-900)]">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-[var(--color-gray-500)] mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
    </div>
  );
}
